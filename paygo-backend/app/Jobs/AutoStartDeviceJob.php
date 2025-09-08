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
use App\Models\Appliance;

class AutoStartDeviceJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $deviceId;
    protected $subscriptionData;

    public function __construct($deviceId, $subscriptionData)
    {
        $this->deviceId = $deviceId;
        $this->subscriptionData = $subscriptionData;
    }

    public function handle(MqttService $mqttService)
    {
        // Assume subscription is already created/updated in the calling service (e.g., payment handler)
        $result = $mqttService->autoStart($this->deviceId, $this->subscriptionData);

        if ($result) {
            Log::info('Auto start job completed successfully', [
                'device_id' => $this->deviceId,
                'subscription_data' => $this->subscriptionData
            ]);
        } else {
            Log::error('Auto start job failed', [
                'device_id' => $this->deviceId,
                'subscription_data' => $this->subscriptionData
            ]);
        }
    }
}