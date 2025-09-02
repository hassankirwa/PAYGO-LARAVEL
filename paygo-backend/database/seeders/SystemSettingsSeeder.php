<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\SystemSetting;
use App\Models\AdminUser;

class SystemSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first admin user for created_by field
        $adminUser = AdminUser::first();
        $adminId = $adminUser ? $adminUser->id : null;

        // Default M-Pesa Sandbox Settings
        $mpesaSettings = [
            [
                'category' => 'mpesa',
                'key' => 'environment',
                'value' => 'sandbox',
                'description' => 'M-Pesa API Environment (sandbox/production)',
                'is_encrypted' => false,
                'created_by' => $adminId,
                'updated_by' => $adminId,
            ],
            [
                'category' => 'mpesa',
                'key' => 'shortcode',
                'value' => '174379',
                'description' => 'M-Pesa Business Shortcode',
                'is_encrypted' => false,
                'created_by' => $adminId,
                'updated_by' => $adminId,
            ],
            [
                'category' => 'mpesa',
                'key' => 'consumer_key',
                'value' => 'your_sandbox_consumer_key_here',
                'description' => 'M-Pesa Consumer Key',
                'is_encrypted' => true,
                'created_by' => $adminId,
                'updated_by' => $adminId,
            ],
            [
                'category' => 'mpesa',
                'key' => 'consumer_secret',
                'value' => 'your_sandbox_consumer_secret_here',
                'description' => 'M-Pesa Consumer Secret',
                'is_encrypted' => true,
                'created_by' => $adminId,
                'updated_by' => $adminId,
            ],
            [
                'category' => 'mpesa',
                'key' => 'passkey',
                'value' => 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
                'description' => 'M-Pesa STK Push Passkey',
                'is_encrypted' => true,
                'created_by' => $adminId,
                'updated_by' => $adminId,
            ],
            [
                'category' => 'mpesa',
                'key' => 'callback_url',
                'value' => 'https://yourapp.com/api/mpesa/stk-callback',
                'description' => 'STK Push Callback URL',
                'is_encrypted' => false,
                'created_by' => $adminId,
                'updated_by' => $adminId,
            ],
            [
                'category' => 'mpesa',
                'key' => 'confirmation_url',
                'value' => 'https://yourapp.com/api/mpesa/confirmation',
                'description' => 'C2B Confirmation URL',
                'is_encrypted' => false,
                'created_by' => $adminId,
                'updated_by' => $adminId,
            ],
            [
                'category' => 'mpesa',
                'key' => 'validation_url',
                'value' => 'https://yourapp.com/api/mpesa/validation',
                'description' => 'C2B Validation URL',
                'is_encrypted' => false,
                'created_by' => $adminId,
                'updated_by' => $adminId,
            ],
        ];

        // System Settings
        $systemSettings = [
            [
                'category' => 'system',
                'key' => 'app_name',
                'value' => 'KOYO PayGo Platform',
                'description' => 'Application name',
                'is_encrypted' => false,
                'created_by' => $adminId,
                'updated_by' => $adminId,
            ],
            [
                'category' => 'system',
                'key' => 'default_currency',
                'value' => 'KES',
                'description' => 'Default currency for the platform',
                'is_encrypted' => false,
                'created_by' => $adminId,
                'updated_by' => $adminId,
            ],
            [
                'category' => 'system',
                'key' => 'payment_reminder_days',
                'value' => '3',
                'description' => 'Days before payment due date to send reminder',
                'is_encrypted' => false,
                'created_by' => $adminId,
                'updated_by' => $adminId,
            ],
            [
                'category' => 'system',
                'key' => 'grace_period_days',
                'value' => '5',
                'description' => 'Grace period after payment due date',
                'is_encrypted' => false,
                'created_by' => $adminId,
                'updated_by' => $adminId,
            ],
        ];

        // Insert all settings
        foreach (array_merge($mpesaSettings, $systemSettings) as $setting) {
            SystemSetting::updateOrCreate(
                ['category' => $setting['category'], 'key' => $setting['key']],
                $setting
            );
        }

        $this->command->info('System settings seeded successfully!');
        $this->command->info('M-Pesa settings configured for sandbox environment.');
        $this->command->info('Remember to update M-Pesa credentials in admin settings for production use.');
    }
}
