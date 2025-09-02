<?php

namespace App\Services;

use App\Models\PaymentOrder;
use App\Models\PaymentPlan;
use App\Models\Client;
use App\Models\Product;
use App\Models\Appliance;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PayGoPlanActivationService
{
    /**
     * Activate PayGo plan after successful down payment
     */
    public function activatePlan(PaymentOrder $paymentOrder)
    {
        try {
            // Only activate for down payments
            if ($paymentOrder->payment_type !== 'down_payment') {
                Log::info('Payment is not a down payment, skipping plan activation:', [
                    'order_reference' => $paymentOrder->order_reference,
                    'payment_type' => $paymentOrder->payment_type
                ]);
                return ['success' => false, 'message' => 'Not a down payment'];
            }

            // Find or create client
            $client = $this->findOrCreateClient($paymentOrder);
            
            // Find product
            $product = Product::find($paymentOrder->product_id);
            if (!$product) {
                throw new \Exception("Product not found: {$paymentOrder->product_id}");
            }

            // Create appliance record (for device assignment later)
            $appliance = $this->createApplianceRecord($product, $client, $paymentOrder);

            // Calculate plan details
            $planDetails = $this->calculatePlanDetails($paymentOrder, $product);

            // Create payment plan
            $paymentPlan = PaymentPlan::create([
                'client_id' => $client->id,
                'appliance_id' => $appliance->id,
                'total_amount_ksh' => $planDetails['total_amount'],
                'down_payment_ksh' => $paymentOrder->paid_amount,
                'installment_amount_ksh' => $paymentOrder->installment_amount,
                'payment_frequency' => $this->mapPlanType($paymentOrder->plan_type),
                'total_installments' => $paymentOrder->total_installments,
                'installments_completed' => 0,
                'total_paid_ksh' => $paymentOrder->paid_amount, // Down payment already paid
                'remaining_balance_ksh' => $planDetails['remaining_balance'],
                'start_date' => now(),
                'expected_completion_date' => $planDetails['completion_date'],
                'next_payment_due_date' => $planDetails['next_payment_due'],
                'grace_period_days' => 3,
                'late_fee_percentage' => 5.0,
                'status' => 'active'
            ]);

            // Update payment order with plan reference
            $paymentOrder->update([
                'additional_data' => array_merge($paymentOrder->additional_data ?? [], [
                    'payment_plan_id' => $paymentPlan->id,
                    'client_id' => $client->id,
                    'appliance_id' => $appliance->id,
                    'plan_activated_at' => now()->toISOString()
                ])
            ]);

            Log::info('PayGo plan activated successfully:', [
                'plan_id' => $paymentPlan->id,
                'client_id' => $client->id,
                'order_reference' => $paymentOrder->order_reference,
                'next_payment_due' => $planDetails['next_payment_due']
            ]);

            return [
                'success' => true,
                'payment_plan' => $paymentPlan,
                'client' => $client,
                'appliance' => $appliance,
                'plan_details' => $planDetails
            ];

        } catch (\Exception $e) {
            Log::error('PayGo plan activation failed:', [
                'order_reference' => $paymentOrder->order_reference,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'error' => 'Plan activation failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Find or create client from payment order
     */
    private function findOrCreateClient(PaymentOrder $paymentOrder)
    {
        // Try to find existing client by phone or email
        $client = Client::where('phone', $paymentOrder->customer_phone)
                       ->orWhere('email', $paymentOrder->customer_email)
                       ->first();

        if (!$client) {
            // Create new client
            $client = Client::create([
                'first_name' => $this->extractFirstName($paymentOrder->customer_name),
                'last_name' => $this->extractLastName($paymentOrder->customer_name),
                'phone' => $paymentOrder->customer_phone,
                'email' => $paymentOrder->customer_email,
                'county' => $paymentOrder->delivery_county ?? 'Nairobi',
                'address' => $paymentOrder->delivery_address ?? '',
                'status' => 'active',
                'kyc_status' => 'pending', // Will be completed during delivery
                'registration_source' => 'checkout'
            ]);

            Log::info('New client created:', [
                'client_id' => $client->id,
                'name' => $paymentOrder->customer_name,
                'phone' => $paymentOrder->customer_phone
            ]);
        }

        return $client;
    }

    /**
     * Create appliance record for plan
     */
    private function createApplianceRecord(Product $product, Client $client, PaymentOrder $paymentOrder)
    {
        // Generate temporary device ID (will be updated during delivery)
        $deviceId = 'KYO-' . strtoupper(substr(md5($paymentOrder->order_reference), 0, 8));

        $appliance = Appliance::create([
            'product_id' => $product->id,
            'serial_number' => 'PENDING-' . $paymentOrder->order_reference,
            'device_id' => $deviceId,
            'model' => $product->name,
            'status' => 'pending_delivery',
            'installation_date' => null, // Will be set during delivery
            'location' => $paymentOrder->delivery_county ?? 'Nairobi',
            'client_id' => $client->id
        ]);

        Log::info('Appliance record created:', [
            'appliance_id' => $appliance->id,
            'device_id' => $deviceId,
            'order_reference' => $paymentOrder->order_reference
        ]);

        return $appliance;
    }

    /**
     * Calculate payment plan details
     */
    private function calculatePlanDetails(PaymentOrder $paymentOrder, Product $product)
    {
        $totalAmount = $paymentOrder->product_price;
        $downPayment = $paymentOrder->paid_amount;
        $remainingBalance = $totalAmount - $downPayment;
        
        // Calculate next payment due date based on plan type
        $frequency = $this->mapPlanType($paymentOrder->plan_type);
        $nextPaymentDue = $this->calculateNextPaymentDate($frequency);
        
        // Calculate completion date
        $completionDate = $this->calculateCompletionDate($frequency, $paymentOrder->total_installments);

        return [
            'total_amount' => $totalAmount,
            'remaining_balance' => $remainingBalance,
            'next_payment_due' => $nextPaymentDue,
            'completion_date' => $completionDate
        ];
    }

    /**
     * Map plan type to payment frequency
     */
    private function mapPlanType($planType)
    {
        $mapping = [
            'weekly' => 'weekly',
            'monthly' => 'monthly',
            'quarterly' => 'monthly' // Store as monthly, but with 3-month intervals
        ];

        return $mapping[$planType] ?? 'monthly';
    }

    /**
     * Calculate next payment due date
     */
    private function calculateNextPaymentDate($frequency)
    {
        switch ($frequency) {
            case 'weekly':
                return now()->addWeek();
            case 'monthly':
                return now()->addMonth();
            default:
                return now()->addMonth();
        }
    }

    /**
     * Calculate plan completion date
     */
    private function calculateCompletionDate($frequency, $totalInstallments)
    {
        switch ($frequency) {
            case 'weekly':
                return now()->addWeeks($totalInstallments);
            case 'monthly':
                return now()->addMonths($totalInstallments);
            default:
                return now()->addMonths($totalInstallments);
        }
    }

    /**
     * Extract first name from full name
     */
    private function extractFirstName($fullName)
    {
        $parts = explode(' ', trim($fullName));
        return $parts[0] ?? 'Customer';
    }

    /**
     * Extract last name from full name
     */
    private function extractLastName($fullName)
    {
        $parts = explode(' ', trim($fullName));
        if (count($parts) > 1) {
            array_shift($parts); // Remove first name
            return implode(' ', $parts);
        }
        return 'Customer';
    }

    /**
     * Generate plan activation data for SMS
     */
    public function generatePlanActivationData(PaymentPlan $paymentPlan, Product $product)
    {
        return [
            'product_name' => $product->name,
            'payment_frequency' => $paymentPlan->payment_frequency,
            'installment_amount' => $paymentPlan->installment_amount_ksh,
            'next_payment_due' => $paymentPlan->next_payment_due_date->format('d/m/Y'),
            'total_installments' => $paymentPlan->total_installments,
            'remaining_balance' => $paymentPlan->remaining_balance_ksh
        ];
    }
} 