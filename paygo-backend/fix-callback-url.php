<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemSetting;
use App\Models\AdminUser;

echo "🔧 Fixing M-Pesa Callback URL for Local Development...\n\n";

// Get admin user for audit trail
$adminUser = AdminUser::first();
$adminId = $adminUser ? $adminUser->id : null;

// Check current callback URL
$currentCallbackUrl = SystemSetting::get('mpesa', 'callback_url');
echo "❌ Current Callback URL: " . ($currentCallbackUrl ?: 'Not set') . "\n";

// For local development, we need to use localhost endpoint
// But M-Pesa can't reach localhost, so we'll use a testing approach
$localhostCallbackUrl = 'http://localhost:8000/api/mpesa/stk-callback';

echo "📋 Callback URL Options:\n";
echo "1. ✅ Localhost URL (for our app): $localhostCallbackUrl\n";
echo "2. ❌ Current URL (goes nowhere): $currentCallbackUrl\n\n";

// For now, let's set to localhost and create a testing solution
$newCallbackUrl = $localhostCallbackUrl;

// Update the callback URL
SystemSetting::set('mpesa', 'callback_url', $newCallbackUrl, 'STK Push Callback URL', false, $adminId);

echo "✅ M-Pesa Callback URL updated successfully!\n";
echo "New Callback URL: $newCallbackUrl\n\n";

// Verify the updates
$config = SystemSetting::getMpesaConfig();
echo "📋 Updated M-Pesa Configuration:\n";
echo "Environment: " . $config['environment'] . "\n";
echo "Shortcode: " . $config['shortcode'] . "\n";
echo "Callback URL: " . $config['callback_url'] . "\n\n";

echo "🚨 IMPORTANT: For M-Pesa to reach our callback:\n";
echo "   Option 1: Use ngrok to expose localhost\n";
echo "            Run: ngrok http 8000\n";
echo "            Then update callback URL to ngrok HTTPS URL\n\n";

echo "   Option 2: Test callback manually\n";
echo "            Use the test endpoint: /test-mpesa-callback\n";
echo "            This simulates M-Pesa sending callback to our app\n\n";

echo "🧪 Testing Our Callback Handler:\n";
echo "   URL: http://localhost:8000/test-mpesa-callback\n";
echo "   This will simulate a successful payment callback\n\n";

echo "✅ Setup Complete! Ready to test callback handling.\n"; 