<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemSetting;
use App\Models\AdminUser;

$ngrokUrl = 'https://d894b7a73656.ngrok-free.app';

// Get the first admin user or use null
$adminUser = AdminUser::first();
$adminId = $adminUser ? $adminUser->id : null;

echo "🔧 Updating M-Pesa URLs with ngrok domain...\n";
echo "Admin User ID: " . ($adminId ?? 'null') . "\n\n";

// Update M-Pesa callback URLs
SystemSetting::set('mpesa', 'callback_url', $ngrokUrl . '/api/mpesa/stk-callback', 'STK Push Callback URL', false, $adminId);
SystemSetting::set('mpesa', 'confirmation_url', $ngrokUrl . '/api/mpesa/confirmation', 'C2B Confirmation URL', false, $adminId);
SystemSetting::set('mpesa', 'validation_url', $ngrokUrl . '/api/mpesa/validation', 'C2B Validation URL', false, $adminId);

echo "✅ M-Pesa URLs updated successfully!\n";
echo "STK Callback: " . $ngrokUrl . "/api/mpesa/stk-callback\n";
echo "C2B Confirmation: " . $ngrokUrl . "/api/mpesa/confirmation\n";
echo "C2B Validation: " . $ngrokUrl . "/api/mpesa/validation\n";

// Verify the updates
$config = SystemSetting::getMpesaConfig();
echo "\n📋 Updated Configuration:\n";
echo "Environment: " . $config['environment'] . "\n";
echo "Shortcode: " . $config['shortcode'] . "\n";
echo "Callback URL: " . $config['callback_url'] . "\n";
echo "Confirmation URL: " . $config['confirmation_url'] . "\n";
echo "Validation URL: " . $config['validation_url'] . "\n"; 