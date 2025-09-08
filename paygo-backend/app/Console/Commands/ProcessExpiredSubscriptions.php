<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Subscription;
use App\Jobs\AutoStopDeviceJob;
use App\Models\Appliance;
use Illuminate\Support\Facades\Log;

class ProcessExpiredSubscriptions extends Command
{
    protected $signature = 'subscriptions:process-expired';
    protected $description = 'Process expired subscriptions and stop associated devices';

    public function handle()
    {
        $expiredSubscriptions = Subscription::where('status', 'active')
                                            ->where('end_date', '<', now())
                                            ->get();

        foreach ($expiredSubscriptions as $subscription) {
            $appliance = Appliance::find($subscription->appliance_id);
            if ($appliance) {
                AutoStopDeviceJob::dispatch($appliance->device_id);
                Log::info('Dispatched auto stop for expired subscription', [
                    'subscription_id' => $subscription->id,
                    'device_id' => $appliance->device_id
                ]);
            }
        }

        $this->info('Expired subscriptions processed successfully.');
    }
}