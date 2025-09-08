<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Services\MqttService;
use Illuminate\Support\Facades\Log;
use App\Models\Subscription;

class AutoStopDeviceJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $deviceId;
    protected $reason;

    public function __construct($deviceId, $reason = 'subscription_expired')
    {
        $this->deviceId = $deviceId;
        $this->reason = $reason;
    }

    public function handle(MqttService $mqttService)
    {
        $result = $mqttService->autoStop($this->deviceId, $this->reason);

        if ($result) {
            // Update subscription status if exists
            $appliance = \App\Models\Appliance::where('device_id', $this->deviceId)->first();
            if ($appliance) {
                $subscription = Subscription::where('appliance_id', $appliance->id)
                                            ->where('status', 'active')
                                            ->first();
                if ($subscription) {
                    $subscription->update(['status' => 'expired']);
                }
            }

            Log::info('Auto stop job completed successfully', [
                'device_id' => $this->deviceId,
                'reason' => $this->reason
            ]);
        } else {
            Log::error('Auto stop job failed', [
                'device_id' => $this->deviceId,
                'reason' => $this->reason
            ]);
        }
    }
}