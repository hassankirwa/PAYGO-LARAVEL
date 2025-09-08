<?php

namespace App\Services;

use App\Models\Appliance;
use App\Models\Client;
use App\Models\Payment;
use App\Models\PaymentPlan;
use App\Models\Subscription;
use App\Jobs\AutoStartDeviceJob;
use App\Jobs\AutoStopDeviceJob;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class SubscriptionManagementService
{
    /**
     * Handle successful payment and start/extend subscription
     */
    public function handlePaymentSuccess($payment, $additionalData = [])
    {
        try {
            Log::info("🎯 Processing payment for subscription management", [
                'payment_id' => $payment->id,
                'amount' => $payment->amount,
                'type' => $payment->payment_type
            ]);

            DB::beginTransaction();

            // 1. Find or create client and appliance
            $client = $this->findOrCreateClient($payment);
            $appliance = $this->findOrCreateAppliance($payment, $client);

            // 2. Handle different payment types
            $subscription = null;
            switch ($payment->payment_type) {
                case 'down_payment':
                    $subscription = $this->handleDownPayment($payment, $client, $appliance);
                    break;
                    
                case 'installment':
                    $subscription = $this->handleInstallmentPayment($payment, $client, $appliance);
                    break;
                    
                case 'full_payment':
                    $subscription = $this->handleFullPayment($payment, $client, $appliance);
                    break;
                    
                default:
                    Log::warning("⚠️ Unknown payment type: {$payment->payment_type}");
                    return false;
            }

            if (!$subscription) {
                Log::error("❌ Failed to create/update subscription for payment: {$payment->id}");
                DB::rollBack();
                return false;
            }

            // 3. Dispatch auto start device job
            $this->dispatchAutoStartDeviceJob($appliance->device_id, $subscription, $payment);

            DB::commit();

            Log::info("✅ Subscription management completed successfully", [
                'payment_id' => $payment->id,
                'subscription_id' => $subscription->id,
                'device_id' => $appliance->device_id
            ]);

            return [
                'success' => true,
                'subscription' => $subscription,
                'appliance' => $appliance,
                'client' => $client,
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error("❌ Subscription management failed", [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return false;
        }
    }

    /**
     * Find or create client from payment data
     */
    private function findOrCreateClient($payment)
    {
        // Try to find existing client by phone or email
        $client = Client::where('phone', $payment->customer_phone)
                       ->orWhere('email', $payment->customer_email)
                       ->first();

        if (!$client) {
            // Create new client
            $client = Client::create([
                'name' => $payment->customer_name,
                'email' => $payment->customer_email,
                'phone' => $payment->customer_phone,
                'status' => 'active',
                'payment_status' => 'current',
                'registration_source' => 'payment_order',
                'kyc_status' => 'pending',
            ]);

            Log::info("👤 New client created from payment", [
                'client_id' => $client->id,
                'payment_id' => $payment->id
            ]);
        } else {
            Log::info("👤 Existing client found", [
                'client_id' => $client->id,
                'payment_id' => $payment->id
            ]);
        }

        return $client;
    }

    /**
     * Find or create appliance for the client
     */
    private function findOrCreateAppliance($payment, $client)
    {
        // Check if payment order has device info or generate one
        $deviceId = $this->generateDeviceId($client, $payment);

        // Try to find existing appliance
        $appliance = Appliance::where('device_id', $deviceId)
                             ->orWhere('client_id', $client->id)
                             ->where('product_id', $payment->product_id)
                             ->first();

        if (!$appliance) {
            // Create new appliance
            $appliance = Appliance::create([
                'client_id' => $client->id,
                'product_id' => $payment->product_id,
                'device_id' => $deviceId,
                'unit_id' => 'UN' . str_pad($client->id, 6, '0', STR_PAD_LEFT),
                'serial_number' => $this->generateSerialNumber(),
                'status' => 'pending_activation',
                'installation_location' => 'Customer Location',
                'is_active' => false,
            ]);

            Log::info("🏠 New appliance created", [
                'appliance_id' => $appliance->id,
                'device_id' => $deviceId,
                'client_id' => $client->id
            ]);
        } else {
            Log::info("🏠 Existing appliance found", [
                'appliance_id' => $appliance->id,
                'device_id' => $appliance->device_id
            ]);
        }

        return $appliance;
    }

    /**
     * Handle down payment - create payment plan and start subscription
     */
    private function handleDownPayment($payment, $client, $appliance)
    {
        // Create payment plan
        $paymentPlan = $this->createPaymentPlan($payment, $client, $appliance);

        // Create initial subscription
        $subscription = Subscription::create([
            'client_id' => $client->id,
            'appliance_id' => $appliance->id,
            'payment_plan_id' => $paymentPlan->id,
            'activation_payment_id' => $payment->id,
            'device_id' => $appliance->device_id,
            'subscription_type' => 'paygo',
            'status' => 'active',
            'start_date' => now(),
            'end_date' => $this->calculateSubscriptionEndDate($paymentPlan),
        ]);

        Log::info("💰 Down payment processed - subscription created", [
            'subscription_id' => $subscription->id,
            'payment_plan_id' => $paymentPlan->id
        ]);

        return $subscription;
    }

    /**
     * Handle installment payment - extend existing subscription
     */
    private function handleInstallmentPayment($payment, $client, $appliance)
    {
        // Find active payment plan
        $paymentPlan = $appliance->paymentPlans()
                                ->where('status', 'active')
                                ->first();

        if (!$paymentPlan) {
            Log::error("❌ No active payment plan found for installment");
            return null;
        }

        // Find or create subscription
        $subscription = Subscription::where('appliance_id', $appliance->id)
                                   ->where('payment_plan_id', $paymentPlan->id)
                                   ->first();

        if (!$subscription) {
            // Create new subscription for installment
            $subscription = Subscription::create([
                'client_id' => $client->id,
                'appliance_id' => $appliance->id,
                'payment_plan_id' => $paymentPlan->id,
                'activation_payment_id' => $payment->id,
                'device_id' => $appliance->device_id,
                'subscription_type' => 'paygo',
                'status' => 'active',
                'start_date' => now(),
                'end_date' => $this->calculateSubscriptionEndDate($paymentPlan),
            ]);
        } else {
            // Extend existing subscription
            $newEndDate = $this->calculateSubscriptionEndDate($paymentPlan);
            $subscription->update([
                'end_date' => $newEndDate,
                'status' => 'active', // Reactivate if suspended
                'reactivated_at' => now(),
            ]);
        }

        // Update payment plan
        $paymentPlan->increment('installments_completed');
        $paymentPlan->update([
            'total_paid_ksh' => $paymentPlan->total_paid_ksh + $payment->amount,
            'remaining_balance_ksh' => max(0, $paymentPlan->remaining_balance_ksh - $payment->amount),
            'next_payment_due_date' => $this->calculateNextPaymentDate($paymentPlan),
        ]);

        Log::info("📅 Installment payment processed - subscription extended", [
            'subscription_id' => $subscription->id,
            'new_end_date' => $subscription->end_date
        ]);

        return $subscription;
    }

    /**
     * Handle full payment - create long-term or permanent subscription
     */
    private function handleFullPayment($payment, $client, $appliance)
    {
        // Create subscription for full purchase (e.g., 2+ years or permanent)
        $subscription = Subscription::create([
            'client_id' => $client->id,
            'appliance_id' => $appliance->id,
            'activation_payment_id' => $payment->id,
            'device_id' => $appliance->device_id,
            'subscription_type' => 'full_purchase',
            'status' => 'active',
            'start_date' => now(),
            'end_date' => now()->addYears(5), // Long-term access
        ]);

        Log::info("💯 Full payment processed - long-term subscription created", [
            'subscription_id' => $subscription->id
        ]);

        return $subscription;
    }

    /**
     * Create payment plan for down payment
     */
    private function createPaymentPlan($payment, $client, $appliance)
    {
        // Extract plan details from payment order
        $totalAmount = $payment->product_price;
        $downPayment = $payment->paid_amount;
        $remainingBalance = $totalAmount - $downPayment;

        // Default plan settings if not specified in payment
        $frequency = $payment->plan_type ?? 'monthly';
        $installmentAmount = $payment->installment_amount ?? ($remainingBalance / 12);
        $totalInstallments = ceil($remainingBalance / $installmentAmount);

        return PaymentPlan::create([
            'client_id' => $client->id,
            'appliance_id' => $appliance->id,
            'total_amount_ksh' => $totalAmount,
            'down_payment_ksh' => $downPayment,
            'installment_amount_ksh' => $installmentAmount,
            'payment_frequency' => $frequency,
            'total_installments' => $totalInstallments,
            'installments_completed' => 0,
            'total_paid_ksh' => $downPayment,
            'remaining_balance_ksh' => $remainingBalance,
            'start_date' => now(),
            'expected_completion_date' => $this->calculateCompletionDate($frequency, $totalInstallments),
            'next_payment_due_date' => $this->calculateNextPaymentDate(null, $frequency),
            'status' => 'active',
        ]);
    }

    /**
     * Calculate subscription end date based on payment plan
     */
    private function calculateSubscriptionEndDate($paymentPlan)
    {
        if (!$paymentPlan) {
            return now()->addMonth(); // Default 1 month
        }

        switch ($paymentPlan->payment_frequency) {
            case 'weekly':
                return now()->addWeek();
            case 'bi_weekly':
                return now()->addWeeks(2);
            case 'monthly':
                return now()->addMonth();
            case 'quarterly':
                return now()->addMonths(3);
            default:
                return now()->addMonth();
        }
    }

    /**
     * Calculate next payment due date
     */
    private function calculateNextPaymentDate($paymentPlan = null, $frequency = 'monthly')
    {
        $freq = $paymentPlan ? $paymentPlan->payment_frequency : $frequency;
        $baseDate = now();

        switch ($freq) {
            case 'weekly':
                return $baseDate->addWeek();
            case 'bi_weekly':
                return $baseDate->addWeeks(2);
            case 'monthly':
                return $baseDate->addMonth();
            case 'quarterly':
                return $baseDate->addMonths(3);
            default:
                return $baseDate->addMonth();
        }
    }

    /**
     * Calculate payment plan completion date
     */
    private function calculateCompletionDate($frequency, $totalInstallments)
    {
        $baseDate = now();

        switch ($frequency) {
            case 'weekly':
                return $baseDate->addWeeks($totalInstallments);
            case 'bi_weekly':
                return $baseDate->addWeeks($totalInstallments * 2);
            case 'monthly':
                return $baseDate->addMonths($totalInstallments);
            case 'quarterly':
                return $baseDate->addMonths($totalInstallments * 3);
            default:
                return $baseDate->addMonths($totalInstallments);
        }
    }

    /**
     * Generate device ID for appliance
     */
    private function generateDeviceId($client, $payment)
    {
        // Format: KY + 6-digit number (based on client ID or payment order)
        $number = str_pad($client->id, 6, '0', STR_PAD_LEFT);
        return 'KY' . $number;
    }

    /**
     * Generate serial number for appliance
     */
    private function generateSerialNumber()
    {
        return 'SN' . date('Y') . str_pad(mt_rand(1, 999999), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Dispatch auto start device job
     */
    private function dispatchAutoStartDeviceJob($deviceId, $subscription, $payment)
    {
        $subscriptionData = [
            'subscription_id' => $subscription->id,
            'start_date' => $subscription->start_date->toISOString(),
            'end_date' => $subscription->end_date->toISOString(),
            'client_id' => $subscription->client_id,
            'type' => $subscription->subscription_type,
        ];

        $paymentData = [
            'payment_id' => $payment->id,
            'amount' => $payment->amount,
            'type' => $payment->payment_type,
        ];

        AutoStartDeviceJob::dispatch($deviceId, $subscriptionData, $paymentData)
                         ->delay(now()->addSeconds(10)); // Small delay to ensure transaction completion

        Log::info("🚀 Auto start device job dispatched", [
            'device_id' => $deviceId,
            'subscription_id' => $subscription->id
        ]);
    }

    /**
     * Handle subscription expiry
     */
    public function handleSubscriptionExpiry($deviceId, $reason = 'subscription_expired')
    {
        Log::info("⏰ Handling subscription expiry", [
            'device_id' => $deviceId,
            'reason' => $reason
        ]);

        // Dispatch auto stop device job
        AutoStopDeviceJob::dispatch($deviceId, $reason)
                        ->delay(now()->addMinutes(1)); // Small delay for logging

        return true;
    }

    /**
     * Check for expired subscriptions and handle them
     */
    public function processExpiredSubscriptions()
    {
        $expiredSubscriptions = Subscription::where('status', 'active')
                                          ->where('end_date', '<', now())
                                          ->get();

        foreach ($expiredSubscriptions as $subscription) {
            $this->handleSubscriptionExpiry($subscription->device_id, 'subscription_expired');
            
            // Mark subscription as expired
            $subscription->markExpired();
        }

        Log::info("🔄 Processed expired subscriptions", [
            'count' => $expiredSubscriptions->count()
        ]);

        return $expiredSubscriptions->count();
    }
}