<?php

namespace App\Jobs;

use App\Models\Appliance;
use App\Models\PaymentPlan;
use App\Models\Subscription;
use App\Services\MqttService;
use App\Services\SmsService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class StartDeviceJob implements ShouldQueue
{
    use Queueable;

    protected $deviceId;
    protected $subscriptionData;
    protected $paymentData;

    /**
     * Create a new job instance.
     */
    public function __construct($deviceId, $subscriptionData = [], $paymentData = [])
    {
        $this->deviceId = $deviceId;
        $this->subscriptionData = $subscriptionData;
        $this->paymentData = $paymentData;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info("🚀 Starting device activation job for: {$this->deviceId}");

            // 1. Start the device via MQTT
            $mqttService = new MqttService();
            $result = $mqttService->startDevice($this->deviceId, $this->subscriptionData);

            if (!$result) {
                Log::error("❌ Failed to start device via MQTT: {$this->deviceId}");
                return;
            }

            // 2. Create or update subscription record
            $subscription = $this->createOrUpdateSubscription();

            // 3. Update payment plan if exists
            $this->updatePaymentPlan();

            // 4. Send notification to customer
            $this->sendCustomerNotification($subscription);

            // 5. Schedule next stop job (when subscription expires)
            $this->scheduleStopJob($subscription);

            Log::info("✅ Device activation completed successfully for: {$this->deviceId}");

        } catch (\Exception $e) {
            Log::error("❌ StartDeviceJob failed for device: {$this->deviceId}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Re-throw to mark job as failed
            throw $e;
        }
    }

    /**
     * Create or update subscription record
     */
    private function createOrUpdateSubscription()
    {
        $appliance = Appliance::where('device_id', $this->deviceId)->first();
        
        if (!$appliance) {
            Log::error("❌ No appliance found for device_id: {$this->deviceId}");
            return null;
        }

        // Calculate subscription period based on payment plan
        $paymentPlan = $appliance->paymentPlans()->where('status', 'active')->first();
        $startDate = now();
        $endDate = $this->calculateSubscriptionEndDate($paymentPlan);

        // Create or update subscription
        $subscription = Subscription::updateOrCreate(
            [
                'appliance_id' => $appliance->id,
                'status' => 'active'
            ],
            [
                'client_id' => $appliance->client_id,
                'payment_plan_id' => $paymentPlan?->id,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => 'active',
                'device_id' => $this->deviceId,
                'activation_payment_id' => $this->paymentData['payment_id'] ?? null,
                'subscription_type' => $this->subscriptionData['type'] ?? 'paygo',
            ]
        );

        // CRITICAL FIX: Activate the device when subscription starts
        $appliance->update([
            'is_active' => true,
            'status' => 'active'
        ]);

        Log::info("📝 Subscription created/updated and device activated", [
            'subscription_id' => $subscription->id,
            'device_id' => $this->deviceId,
            'end_date' => $endDate->toISOString(),
            'appliance_activated' => true
        ]);

        return $subscription;
    }

    /**
     * Calculate subscription end date based on payment plan
     */
    private function calculateSubscriptionEndDate($paymentPlan)
    {
        if (!$paymentPlan) {
            // Default: 1 month for standalone payments
            return now()->addMonth();
        }

        // Calculate based on payment frequency
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
     * Update payment plan status and next payment date
     */
    private function updatePaymentPlan()
    {
        $appliance = Appliance::where('device_id', $this->deviceId)->first();
        
        if (!$appliance) {
            return;
        }

        $paymentPlan = $appliance->paymentPlans()->where('status', 'active')->first();
        
        if ($paymentPlan) {
            // Update next payment due date based on frequency
            $nextPaymentDate = $this->calculateNextPaymentDate($paymentPlan);
            
            $paymentPlan->update([
                'next_payment_due_date' => $nextPaymentDate,
                'status' => 'active'
            ]);

            Log::info("📅 Payment plan updated", [
                'payment_plan_id' => $paymentPlan->id,
                'next_payment_due' => $nextPaymentDate->toDateString()
            ]);
        }
    }

    /**
     * Calculate next payment due date
     */
    private function calculateNextPaymentDate($paymentPlan)
    {
        $baseDate = $paymentPlan->next_payment_due_date ?? now();

        switch ($paymentPlan->payment_frequency) {
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
     * Send activation notification to customer
     */
    private function sendCustomerNotification($subscription)
    {
        try {
            if (!$subscription || !$subscription->client) {
                return;
            }

            $client = $subscription->client;
            $appliance = $subscription->appliance;

            $message = "✅ Your {$appliance->product->name} has been activated! "
                . "Subscription valid until {$subscription->end_date->format('M j, Y')}. "
                . "Next payment due: " . ($subscription->paymentPlan && $subscription->paymentPlan->next_payment_due_date ? $subscription->paymentPlan->next_payment_due_date->format('M j, Y') : 'N/A') . ". "
                . "Thank you for choosing KOYO PayGo!";

            $smsService = new SmsService();
            $smsService->sendSms($client->phone, $message);

            Log::info("📱 Activation SMS sent", [
                'device_id' => $this->deviceId,
                'client_phone' => $client->phone
            ]);

        } catch (\Exception $e) {
            Log::error("❌ Failed to send activation SMS", [
                'error' => $e->getMessage(),
                'device_id' => $this->deviceId
            ]);
        }
    }

    /**
     * Schedule device stop job for when subscription expires
     */
    private function scheduleStopJob($subscription)
    {
        if (!$subscription || !$subscription->end_date) {
            return;
        }

        try {
            // Schedule stop job at subscription end date
            StopDeviceJob::dispatch(
                $this->deviceId,
                'subscription_expired',
                ['subscription_id' => $subscription->id]
            )->delay($subscription->end_date);

            Log::info("⏰ Stop job scheduled", [
                'device_id' => $this->deviceId,
                'stop_date' => $subscription->end_date->toISOString()
            ]);

        } catch (\Exception $e) {
            Log::error("❌ Failed to schedule stop job", [
                'error' => $e->getMessage(),
                'device_id' => $this->deviceId
            ]);
        }
    }
}
