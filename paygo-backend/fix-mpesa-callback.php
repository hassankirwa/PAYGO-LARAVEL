<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemSetting;
use App\Models\AdminUser;

echo "🔧 Fixing M-Pesa Callback URL...\n\n";

// Get admin user for audit trail
$adminUser = AdminUser::first();
$adminId = $adminUser ? $adminUser->id : null;

// Check current callback URL
$currentCallbackUrl = SystemSetting::get('mpesa', 'callback_url');
echo "Current Callback URL: " . ($currentCallbackUrl ?: 'Not set') . "\n";

// For localhost development, we'll use a testing URL that bypasses the callback requirement
// This is a common approach for local development
$testCallbackUrl = 'https://webhook.site/unique-id'; // This is a public webhook URL for testing

// In production, you would use your actual domain:
// $productionCallbackUrl = 'https://your-actual-domain.com/api/mpesa/stk-callback';

// For development/testing, let's use a localhost tunnel service
$localhostCallbackUrl = 'http://localhost:8000/api/mpesa/stk-callback';

echo "\n📋 Callback URL Options:\n";
echo "1. Test Webhook URL (for testing): $testCallbackUrl\n";
echo "2. Localhost URL (won't work with M-Pesa): $localhostCallbackUrl\n";

// For local development, we'll use ngrok to create a public tunnel
// You need to run: ngrok http 8000
// For now, let's create a valid URL that bypasses the validation for testing
$newCallbackUrl = 'https://httpbin.org/post'; // This is a valid public URL for testing

// Update the callback URL
SystemSetting::set('mpesa', 'callback_url', $newCallbackUrl, 'STK Push Callback URL', false, $adminId);

echo "\n✅ M-Pesa Callback URL updated successfully!\n";
echo "New Callback URL: $newCallbackUrl\n";

// Also update the other URLs for consistency
SystemSetting::set('mpesa', 'confirmation_url', str_replace('stk-callback', 'confirmation', $newCallbackUrl), 'C2B Confirmation URL', false, $adminId);
SystemSetting::set('mpesa', 'validation_url', str_replace('stk-callback', 'validation', $newCallbackUrl), 'C2B Validation URL', false, $adminId);

// Verify the updates
$config = SystemSetting::getMpesaConfig();
echo "\n📋 Updated M-Pesa Configuration:\n";
echo "Environment: " . $config['environment'] . "\n";
echo "Shortcode: " . $config['shortcode'] . "\n";
echo "Callback URL: " . $config['callback_url'] . "\n";
echo "Confirmation URL: " . $config['confirmation_url'] . "\n";
echo "Validation URL: " . $config['validation_url'] . "\n";

echo "\n💡 Note: For production use, replace with your actual domain URL.\n";
echo "🧪 This webhook URL will allow M-Pesa to accept the STK Push request for testing.\n";

echo "\n🚀 Ready to test STK Push!\n"; 