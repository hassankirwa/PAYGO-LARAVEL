<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\SubscriptionManagementService;
use App\Models\Subscription;
use App\Models\PaymentPlan;
use App\Jobs\StopDeviceJob;
use Illuminate\Support\Facades\Log;

class ProcessExpiredSubscriptions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscriptions:process-expired 
                           {--dry-run : Show what would be processed without making changes}
                           {--force : Force processing even if devices are offline}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process expired subscriptions and stop devices automatically';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔄 Processing expired subscriptions...');
        
        $dryRun = $this->option('dry-run');
        $force = $this->option('force');
        
        if ($dryRun) {
            $this->warn('🔍 DRY RUN MODE - No changes will be made');
        }

        try {
            // 1. Process expired subscriptions
            $expiredCount = $this->processExpiredSubscriptions($dryRun);
            
            // 2. Process overdue payments
            $overdueCount = $this->processOverduePayments($dryRun);
            
            // 3. Process subscriptions expiring soon (warnings)
            $warningCount = $this->processExpiringSubscriptions($dryRun);

            // Summary
            $this->info('');
            $this->info('📊 Processing Summary:');
            $this->line("   • Expired subscriptions processed: {$expiredCount}");
            $this->line("   • Overdue payments processed: {$overdueCount}");
            $this->line("   • Expiring soon warnings sent: {$warningCount}");
            
            if ($dryRun) {
                $this->warn('');
                $this->warn('⚠️  This was a dry run. To apply changes, run without --dry-run');
            } else {
                $this->info('');
                $this->info('✅ Subscription processing completed successfully!');
            }

        } catch (\Exception $e) {
            $this->error('❌ Error processing subscriptions: ' . $e->getMessage());
            Log::error('ProcessExpiredSubscriptions failed:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }

    /**
     * Process subscriptions that have already expired
     */
    private function processExpiredSubscriptions($dryRun = false)
    {
        $this->line('');
        $this->line('🕐 Processing expired subscriptions...');

        $expiredSubscriptions = Subscription::where('status', 'active')
                                          ->where('end_date', '<', now())
                                          ->with(['appliance', 'client'])
                                          ->get();

        if ($expiredSubscriptions->isEmpty()) {
            $this->line('   ℹ️  No expired subscriptions found');
            return 0;
        }

        $this->line("   📋 Found {$expiredSubscriptions->count()} expired subscriptions");

        foreach ($expiredSubscriptions as $subscription) {
            $deviceId = $subscription->device_id ?? $subscription->appliance->device_id ?? 'UNKNOWN';
            $clientName = $subscription->client->name ?? 'Unknown Client';
            $expiredTime = $subscription->end_date->diffForHumans();

            $this->line("   • Device {$deviceId} ({$clientName}) - expired {$expiredTime}");

            if (!$dryRun) {
                // Mark subscription as expired
                $subscription->markExpired();
                
                // Dispatch stop device job
                StopDeviceJob::dispatch($deviceId, 'subscription_expired', [
                    'subscription_id' => $subscription->id
                ])->delay(now()->addMinutes(1));

                Log::info('Expired subscription processed', [
                    'subscription_id' => $subscription->id,
                    'device_id' => $deviceId,
                    'client_id' => $subscription->client_id
                ]);
            }
        }

        return $expiredSubscriptions->count();
    }

    /**
     * Process payment plans with overdue payments
     */
    private function processOverduePayments($dryRun = false)
    {
        $this->line('');
        $this->line('💰 Processing overdue payments...');

        $overduePaymentPlans = PaymentPlan::where('status', 'active')
                                         ->where('next_payment_due_date', '<', now())
                                         ->with(['appliance', 'client'])
                                         ->get();

        if ($overduePaymentPlans->isEmpty()) {
            $this->line('   ℹ️  No overdue payments found');
            return 0;
        }

        $this->line("   📋 Found {$overduePaymentPlans->count()} overdue payment plans");

        foreach ($overduePaymentPlans as $paymentPlan) {
            $appliance = $paymentPlan->appliance;
            $deviceId = $appliance->device_id ?? 'UNKNOWN';
            $clientName = $paymentPlan->client->name ?? 'Unknown Client';
            $overdueTime = $paymentPlan->next_payment_due_date->diffForHumans();
            $gracePeriod = $paymentPlan->grace_period_days ?? 3;

            // Check if grace period has expired
            $gracePeriodEnd = $paymentPlan->next_payment_due_date->addDays($gracePeriod);
            $gracePeriodExpired = $gracePeriodEnd < now();

            if ($gracePeriodExpired) {
                $this->line("   • Device {$deviceId} ({$clientName}) - overdue {$overdueTime}, grace period expired");

                if (!$dryRun) {
                    // Mark payment plan as defaulted
                    $paymentPlan->update(['status' => 'defaulted']);
                    
                    // Dispatch stop device job
                    StopDeviceJob::dispatch($deviceId, 'payment_overdue', [
                        'payment_plan_id' => $paymentPlan->id,
                        'overdue_amount' => $paymentPlan->installment_amount_ksh
                    ])->delay(now()->addMinutes(2));

                    Log::info('Overdue payment processed', [
                        'payment_plan_id' => $paymentPlan->id,
                        'device_id' => $deviceId,
                        'client_id' => $paymentPlan->client_id,
                        'overdue_amount' => $paymentPlan->installment_amount_ksh
                    ]);
                }
            } else {
                $this->line("   • Device {$deviceId} ({$clientName}) - overdue {$overdueTime}, still in grace period");
            }
        }

        return $overduePaymentPlans->where('next_payment_due_date', '<', now()->subDays(3))->count();
    }

    /**
     * Process subscriptions expiring soon (send warnings)
     */
    private function processExpiringSubscriptions($dryRun = false)
    {
        $this->line('');
        $this->line('⏰ Processing subscriptions expiring soon...');

        $expiringSubscriptions = Subscription::where('status', 'active')
                                           ->where('end_date', '>', now())
                                           ->where('end_date', '<=', now()->addHours(24))
                                           ->with(['appliance', 'client'])
                                           ->get();

        if ($expiringSubscriptions->isEmpty()) {
            $this->line('   ℹ️  No subscriptions expiring in the next 24 hours');
            return 0;
        }

        $this->line("   📋 Found {$expiringSubscriptions->count()} subscriptions expiring soon");

        foreach ($expiringSubscriptions as $subscription) {
            $deviceId = $subscription->device_id ?? $subscription->appliance->device_id ?? 'UNKNOWN';
            $clientName = $subscription->client->name ?? 'Unknown Client';
            $expiresIn = $subscription->end_date->diffForHumans();

            $this->line("   • Device {$deviceId} ({$clientName}) - expires {$expiresIn}");

            if (!$dryRun) {
                // Here you could send SMS reminders or email notifications
                // For now, just log the warning
                Log::info('Subscription expiring soon', [
                    'subscription_id' => $subscription->id,
                    'device_id' => $deviceId,
                    'client_id' => $subscription->client_id,
                    'expires_at' => $subscription->end_date,
                    'hours_remaining' => $subscription->hours_remaining
                ]);
            }
        }

        return $expiringSubscriptions->count();
    }
}
