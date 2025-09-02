<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\SystemSetting;
use App\Http\Controllers\Api\MpesaController;

class TestMpesaConfig extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mpesa:test {--token : Test token generation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test M-Pesa configuration and API connectivity';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Testing M-Pesa Configuration...');
        $this->line('');

        // Test 1: Check database settings
        $this->info('1. Testing Database Configuration:');
        $config = SystemSetting::getMpesaConfig();
        
        $this->table(['Setting', 'Value', 'Status'], [
            ['Environment', $config['environment'], $config['environment'] ? '✅' : '❌'],
            ['Shortcode', $config['shortcode'], $config['shortcode'] ? '✅' : '❌'],
            ['Consumer Key', $config['consumer_key'] ? 'Set (' . substr($config['consumer_key'], 0, 8) . '...)' : 'Not Set', $config['consumer_key'] ? '✅' : '❌'],
            ['Consumer Secret', $config['consumer_secret'] ? 'Set (' . substr($config['consumer_secret'], 0, 8) . '...)' : 'Not Set', $config['consumer_secret'] ? '✅' : '❌'],
            ['Passkey', $config['passkey'] ? 'Set (' . substr($config['passkey'], 0, 12) . '...)' : 'Not Set', $config['passkey'] ? '✅' : '❌'],
            ['Callback URL', $config['callback_url'] ?: 'Not Set', $config['callback_url'] ? '✅' : '⚠️'],
        ]);

        $this->line('');

        // Test 2: Test token generation if requested
        if ($this->option('token')) {
            $this->info('2. Testing M-Pesa Token Generation:');
            
            if (empty($config['consumer_key']) || empty($config['consumer_secret'])) {
                $this->error('❌ Cannot test token generation: Consumer key or secret not configured');
                $this->line('   Please update M-Pesa credentials in admin settings');
                return;
            }

            try {
                $mpesaController = new MpesaController();
                $token = $mpesaController->generateAccessToken();
                
                if ($token) {
                    $this->info('✅ Token generated successfully!');
                    $this->line('   Token: ' . substr($token, 0, 20) . '...');
                    $this->line('   Environment: ' . $config['environment']);
                } else {
                    $this->error('❌ Failed to generate token');
                    $this->line('   Check your consumer key and secret');
                }
            } catch (\Exception $e) {
                $this->error('❌ Token generation failed: ' . $e->getMessage());
            }
        } else {
            $this->info('2. Token Generation Test:');
            $this->line('   Use --token flag to test token generation');
            $this->line('   Example: php artisan mpesa:test --token');
        }

        $this->line('');

        // Test 3: Show API endpoints
        $this->info('3. Available M-Pesa API Endpoints:');
        $endpoints = [
            'STK Push' => 'POST /api/mpesa/stk-push',
            'STK Query' => 'POST /api/mpesa/stk-query',
            'STK Callback' => 'POST /api/mpesa/stk-callback',
            'C2B Validation' => 'POST /api/mpesa/validation',
            'C2B Confirmation' => 'POST /api/mpesa/confirmation',
            'Register URLs' => 'POST /api/mpesa/register-urls',
            'Get Settings' => 'GET /api/admin/settings/mpesa/config',
            'Update Settings' => 'POST /api/admin/settings/mpesa/config',
            'Test Connection' => 'POST /api/admin/settings/mpesa/test',
        ];

        foreach ($endpoints as $name => $endpoint) {
            $this->line("   {$name}: {$endpoint}");
        }

        $this->line('');

        // Test 4: Configuration recommendations
        $this->info('4. Configuration Status:');
        $recommendations = [];

        if ($config['environment'] === 'sandbox') {
            $recommendations[] = '💡 Currently using sandbox environment - safe for testing';
        } else {
            $recommendations[] = '🔴 Using production environment - ensure credentials are correct';
        }

        if (empty($config['consumer_key']) || $config['consumer_key'] === 'your_sandbox_consumer_key_here') {
            $recommendations[] = '⚠️  Update consumer key with actual M-Pesa credentials';
        }

        if (empty($config['consumer_secret']) || $config['consumer_secret'] === 'your_sandbox_consumer_secret_here') {
            $recommendations[] = '⚠️  Update consumer secret with actual M-Pesa credentials';
        }

        if (empty($config['callback_url']) || strpos($config['callback_url'], 'yourapp.com') !== false) {
            $recommendations[] = '⚠️  Update callback URL with your actual domain';
        }

        if (empty($recommendations)) {
            $this->info('✅ Configuration looks good!');
        } else {
            foreach ($recommendations as $rec) {
                $this->line("   {$rec}");
            }
        }

        $this->line('');
        $this->info('🎉 M-Pesa configuration test completed!');
    }
}
