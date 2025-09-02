<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemSetting;
use App\Models\AdminUser;

// Example ngrok URL - replace with your actual ngrok URL
$ngrokUrl = 'https://your-ngrok-url.ngrok-free.app';

// You can pass the URL as a command line argument
if (isset($argv[1])) {
    $ngrokUrl = rtrim($argv[1], '/');
}

if (!filter_var($ngrokUrl, FILTER_VALIDATE_URL) || strpos($ngrokUrl, 'your-ngrok-url') !== false) {
    echo "❌ Please provide a valid ngrok URL\n";
    echo "Usage: php set-ngrok-base-url.php https://abc123.ngrok-free.app\n";
    echo "\n🔗 To get your ngrok URL:\n";
    echo "1. Run: ngrok http 8000\n";
    echo "2. Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)\n";
    echo "3. Run: php set-ngrok-base-url.php https://abc123.ngrok-free.app\n";
    exit(1);
}

// Get admin user for audit trail
$adminUser = AdminUser::first();
$adminId = $adminUser ? $adminUser->id : null;

echo "🔧 Setting up ngrok base URL for M-Pesa C2B callbacks...\n";
echo "Base URL: $ngrokUrl\n";
echo "Admin ID: " . ($adminId ?? 'null') . "\n\n";

// Set API base URL
SystemSetting::set('api', 'base_url', $ngrokUrl, 'API Base URL for external callbacks', false, $adminId);

// Also update M-Pesa specific URLs if they don't exist or are localhost
$currentCallbackUrl = SystemSetting::get('mpesa', 'callback_url');
$currentConfirmationUrl = SystemSetting::get('mpesa', 'confirmation_url');
$currentValidationUrl = SystemSetting::get('mpesa', 'validation_url');

// Update STK callback URL
if (empty($currentCallbackUrl) || strpos($currentCallbackUrl, 'localhost') !== false || strpos($currentCallbackUrl, 'yourapp.com') !== false) {
    SystemSetting::set('mpesa', 'callback_url', $ngrokUrl . '/api/mpesa/stk-callback', 'STK Push Callback URL', false, $adminId);
    echo "✅ Updated STK callback URL\n";
}

// Update C2B confirmation URL (for legacy C2B if needed)
if (empty($currentConfirmationUrl) || strpos($currentConfirmationUrl, 'localhost') !== false || strpos($currentConfirmationUrl, 'yourapp.com') !== false) {
    SystemSetting::set('mpesa', 'confirmation_url', $ngrokUrl . '/api/mpesa/confirmation', 'C2B Confirmation URL', false, $adminId);
    echo "✅ Updated C2B confirmation URL\n";
}

// Update C2B validation URL (for legacy C2B if needed)
if (empty($currentValidationUrl) || strpos($currentValidationUrl, 'localhost') !== false || strpos($currentValidationUrl, 'yourapp.com') !== false) {
    SystemSetting::set('mpesa', 'validation_url', $ngrokUrl . '/api/mpesa/validation', 'C2B Validation URL', false, $adminId);
    echo "✅ Updated C2B validation URL\n";
}

echo "\n📋 Updated Configuration:\n";
echo "=========================\n";

// Verify all URLs
$apiConfig = SystemSetting::getApiConfig();
$mpesaConfig = SystemSetting::getMpesaConfig();

echo "API Base URL: " . $apiConfig['base_url'] . "\n";
echo "Environment: " . $mpesaConfig['environment'] . "\n";
echo "Shortcode: " . $mpesaConfig['shortcode'] . "\n\n";

echo "📡 Callback URLs for Safaricom:\n";
echo "STK Callback: " . $mpesaConfig['callback_url'] . "\n";
echo "C2B Confirmation: " . $mpesaConfig['confirmation_url'] . "\n";
echo "C2B Validation: " . $mpesaConfig['validation_url'] . "\n\n";

echo "🔗 Paybill URLs (auto-generated from base URL):\n";
echo "Paybill Confirmation: " . $ngrokUrl . "/api/paybill/confirmation\n";
echo "Paybill Validation: " . $ngrokUrl . "/api/paybill/validation\n\n";

echo "✅ Setup Complete!\n";
echo "\n🚀 Next Steps:\n";
echo "1. Test URL registration: POST /api/paybill/register-urls\n";
echo "2. The URLs will be automatically constructed using your ngrok base URL\n";
echo "3. Safaricom will be able to reach your validation and confirmation endpoints\n";

echo "\n💡 Test Command:\n";
echo 'curl -X POST "' . $ngrokUrl . '/api/paybill/register-urls" \\'  . "\n";
echo '  -H "Content-Type: application/json" \\'  . "\n";
echo '  -d \'{"response_type": "Completed"}\'' . "\n"; 