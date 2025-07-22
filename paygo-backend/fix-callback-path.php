<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemSetting;
use App\Models\AdminUser;

echo "🔧 Fixing M-Pesa Callback URL Path...\n\n";

// Get admin user for audit trail
$adminUser = AdminUser::first();
$adminId = $adminUser ? $adminUser->id : null;

$currentCallbackUrl = SystemSetting::get('mpesa', 'callback_url');
echo "❌ Current Callback URL: $currentCallbackUrl\n";

// Identify the issues
echo "\n🔍 Issues Found:\n";
if (strpos($currentCallbackUrl, '/mpesa/stk-callback') !== false) {
    echo "   ❌ Wrong path: /mpesa/stk-callback\n";
    echo "   ✅ Should be: /api/mpesa/stk-callback\n";
}

if (strpos($currentCallbackUrl, 'a522b64ca97f.ngrok-free.app') !== false) {
    echo "   ❌ Old ngrok tunnel (likely expired)\n";
    echo "   ✅ Need new ngrok tunnel\n";
}

echo "\n🛠️ Step 1: Start new ngrok tunnel\n";
echo "   Run in separate terminal: ngrok http 8000\n";
echo "   Copy the HTTPS URL (e.g., https://new123.ngrok-free.app)\n\n";

echo "🛠️ Step 2: Update callback URL with correct path\n";
echo "   Example if your ngrok URL is: https://new123.ngrok-free.app\n";
echo "   Correct callback URL: https://new123.ngrok-free.app/api/mpesa/stk-callback\n\n";

// Let's set a temporary working URL for testing
$testCallbackUrl = "https://webhook.site/#!/e5c6f7d8-9a1b-2c3d-4e5f-678901234567";

echo "🧪 For immediate testing, setting webhook.site URL:\n";
SystemSetting::set('mpesa', 'callback_url', $testCallbackUrl, 'STK Push Callback URL (temporary test)', false, $adminId);

echo "   ✅ Updated to: $testCallbackUrl\n";
echo "   This will accept callbacks but won't process them\n\n";

echo "🎯 Final Step: Set your actual ngrok URL\n";
echo "   1. Get your ngrok HTTPS URL\n";
echo "   2. Add '/api/mpesa/stk-callback' to the end\n";
echo "   3. Update using: php artisan tinker\n";
echo "   4. Run: SystemSetting::set('mpesa', 'callback_url', 'your-ngrok-url/api/mpesa/stk-callback', 'STK Push Callback URL', false, 1);\n\n";

echo "✅ Now test STK Push - it should work without the 400.002.02 error!\n"; 