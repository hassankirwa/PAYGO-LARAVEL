<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Services\MqttService;
use Illuminate\Support\Facades\Log;

class ManualStopDeviceJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $deviceId;
    protected $reason;
    protected $meta;

    public function __construct($deviceId, $reason, $meta = [])
    {
        $this->deviceId = $deviceId;
        $this->reason = $reason;
        $this->meta = $meta;
    }

    public function handle(MqttService $mqttService)
    {
        $result = $mqttService->manualStop($this->deviceId, $this->reason);

        if ($result) {
            Log::info('Manual stop job completed successfully', [
                'device_id' => $this->deviceId,
                'reason' => $this->reason,
                'meta' => $this->meta
            ]);
        } else {
            Log::error('Manual stop job failed', [
                'device_id' => $this->deviceId,
                'reason' => $this->reason,
                'meta' => $this->meta
            ]);
        }
    }
}