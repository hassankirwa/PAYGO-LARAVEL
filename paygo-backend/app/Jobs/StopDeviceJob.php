<?php

namespace App\Jobs;

use App\Models\Appliance;
use App\Models\Subscription;
use App\Services\MqttService;
use App\Services\SmsService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class StopDeviceJob implements ShouldQueue
{
    use Queueable;

    protected $deviceId;
    protected $reason;
    protected $additionalData;

    /**
     * Create a new job instance.
     */
    public function __construct($deviceId, $reason = 'subscription_expired', $additionalData = [])
    {
        $this->deviceId = $deviceId;
        $this->reason = $reason;
        $this->additionalData = $additionalData;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info("⏹️ Starting device suspension job", [
                'device_id' => $this->deviceId,
                'reason' => $this->reason
            ]);

            // 1. Check if device should actually be stopped
            if (!$this->shouldStopDevice()) {
                Log::info("✅ Device stop cancelled - payment received or subscription valid", [
                    'device_id' => $this->deviceId
                ]);
                return;
            }

            // 2. Stop the device via MQTT
            $mqttService = new MqttService();
            $result = $mqttService->stopDevice($this->deviceId, $this->reason);

            if (!$result) {
                Log::error("❌ Failed to stop device via MQTT: {$this->deviceId}");
                return;
            }

            // 3. Update subscription status
            $this->updateSubscriptionStatus();

            // 4. Update payment plan status if needed
            $this->updatePaymentPlanStatus();

            // 5. Send notification to customer
            $this->sendCustomerNotification();

            // 6. Schedule grace period or reminder (if applicable)
            $this->handleGracePeriod();

            Log::info("✅ Device suspension completed successfully for: {$this->deviceId}");

        } catch (\Exception $e) {
            Log::error("❌ StopDeviceJob failed for device: {$this->deviceId}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Re-throw to mark job as failed
            throw $e;
        }
    }

    /**
     * Check if device should actually be stopped (payment might have been received)
     */
    private function shouldStopDevice()
    {
        $appliance = Appliance::where('device_id', $this->deviceId)->first();
        
        if (!$appliance) {
            Log::warning("⚠️ No appliance found for device_id: {$this->deviceId}");
            return false;
        }

        // Check if there's an active subscription with valid end date
        $activeSubscription = Subscription::where('appliance_id', $appliance->id)
            ->where('status', 'active')
            ->where('end_date', '>', now())
            ->first();

        if ($activeSubscription) {
            Log::info("ℹ️ Active subscription found, device should not be stopped", [
                'device_id' => $this->deviceId,
                'subscription_end' => $activeSubscription->end_date
            ]);
            return false;
        }

        // Check payment plan status for overdue payments
        $paymentPlan = $appliance->paymentPlans()->where('status', 'active')->first();
        
        if ($paymentPlan && $this->reason === 'payment_overdue') {
            // Check if payment was made recently
            $recentPayment = $paymentPlan->payments()
                ->where('created_at', '>=', now()->subHours(1))
                ->where('status', 'completed')
                ->exists();

            if ($recentPayment) {
                Log::info("ℹ️ Recent payment found, device should not be stopped", [
                    'device_id' => $this->deviceId
                ]);
                return false;
            }
        }

        return true;
    }

    /**
     * Update subscription status to expired/suspended
     */
    private function updateSubscriptionStatus()
    {
        $appliance = Appliance::where('device_id', $this->deviceId)->first();
        
        if (!$appliance) {
            return;
        }

        // Update active subscriptions
        $updatedCount = Subscription::where('appliance_id', $appliance->id)
            ->where('status', 'active')
            ->update([
                'status' => $this->getSubscriptionStatus(),
                'suspended_at' => now(),
                'suspension_reason' => $this->reason,
            ]);

        // CRITICAL FIX: Deactivate the device when subscription stops/expires
        $appliance->update([
            'is_active' => false,
            'status' => $this->getApplianceStatus()
        ]);

        if ($updatedCount > 0) {
            Log::info("📝 Subscription status updated and device deactivated", [
                'device_id' => $this->deviceId,
                'subscription_status' => $this->getSubscriptionStatus(),
                'appliance_status' => $this->getApplianceStatus(),
                'reason' => $this->reason,
                'appliance_deactivated' => true
            ]);
        }
    }

    /**
     * Get appropriate subscription status based on reason
     */
    private function getSubscriptionStatus()
    {
        switch ($this->reason) {
            case 'subscription_expired':
                return 'expired';
            case 'payment_overdue':
                return 'suspended';
            case 'manual_stop':
                return 'suspended';
            case 'maintenance':
                return 'maintenance';
            default:
                return 'suspended';
        }
    }

    /**
     * Get appropriate appliance status based on reason
     */
    private function getApplianceStatus()
    {
        switch ($this->reason) {
            case 'subscription_expired':
                return 'suspended';
            case 'payment_overdue':
                return 'suspended';
            case 'manual_stop':
                return 'suspended';
            case 'maintenance':
                return 'maintenance';
            default:
                return 'suspended';
        }
    }

    /**
     * Update payment plan status if needed
     */
    private function updatePaymentPlanStatus()
    {
        $appliance = Appliance::where('device_id', $this->deviceId)->first();
        
        if (!$appliance) {
            return;
        }

        $paymentPlan = $appliance->paymentPlans()->where('status', 'active')->first();
        
        if ($paymentPlan && $this->reason === 'payment_overdue') {
            $paymentPlan->update(['status' => 'defaulted']);
            
            Log::info("📅 Payment plan marked as defaulted", [
                'payment_plan_id' => $paymentPlan->id,
                'device_id' => $this->deviceId
            ]);
        }
    }

    /**
     * Send suspension notification to customer
     */
    private function sendCustomerNotification()
    {
        try {
            $appliance = Appliance::where('device_id', $this->deviceId)->first();
            
            if (!$appliance || !$appliance->client) {
                return;
            }

            $client = $appliance->client;
            $message = $this->getSuspensionMessage($appliance);

            $smsService = new SmsService();
            $smsService->sendSms($client->phone, $message);

            Log::info("📱 Suspension SMS sent", [
                'device_id' => $this->deviceId,
                'client_phone' => $client->phone,
                'reason' => $this->reason
            ]);

        } catch (\Exception $e) {
            Log::error("❌ Failed to send suspension SMS", [
                'error' => $e->getMessage(),
                'device_id' => $this->deviceId
            ]);
        }
    }

    /**
     * Get suspension message based on reason
     */
    private function getSuspensionMessage($appliance)
    {
        $productName = $appliance->product->name ?? 'appliance';
        
        $messages = [
            'subscription_expired' => "⏰ Your {$productName} subscription has expired. Please make your next payment to reactivate. Contact us for assistance.",
            'payment_overdue' => "💰 Your {$productName} payment is overdue. Please pay immediately to avoid service interruption. Account: {$this->deviceId}",
            'manual_stop' => "🔧 Your {$productName} has been temporarily suspended by our team. Please contact customer service for assistance.",
            'maintenance' => "🛠️ Your {$productName} is temporarily offline for maintenance. Service will resume shortly.",
            'emergency' => "🚨 Your {$productName} has been stopped due to an emergency situation. Please contact support immediately.",
        ];

        return $messages[$this->reason] ?? "Your {$productName} service has been suspended. Please contact customer service.";
    }

    /**
     * Handle grace period for overdue payments
     */
    private function handleGracePeriod()
    {
        if ($this->reason !== 'payment_overdue') {
            return;
        }

        $appliance = Appliance::where('device_id', $this->deviceId)->first();
        
        if (!$appliance) {
            return;
        }

        $paymentPlan = $appliance->paymentPlans()->where('status', 'active')->first();
        
        if ($paymentPlan && $paymentPlan->grace_period_days > 0) {
            // Schedule a final reminder before marking as defaulted
            $gracePeriodEnd = now()->addDays($paymentPlan->grace_period_days);
            
            // You could schedule another job here for final collection attempt
            Log::info("⏰ Grace period active", [
                'device_id' => $this->deviceId,
                'grace_period_days' => $paymentPlan->grace_period_days,
                'grace_period_end' => $gracePeriodEnd
            ]);
        }
    }
}
