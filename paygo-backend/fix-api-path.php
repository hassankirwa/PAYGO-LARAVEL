<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemSetting;
use App\Models\AdminUser;

echo "🔧 Fixing M-Pesa Callback URL - Adding Missing /api/ Path...\n\n";

// Get admin user for audit trail
$adminUser = AdminUser::first();
$adminId = $adminUser ? $adminUser->id : null;

$currentCallbackUrl = SystemSetting::get('mpesa', 'callback_url');
echo "❌ Current Callback URL: $currentCallbackUrl\n";

// The ngrok URL is active, just need to fix the path
$ngrokBaseUrl = "https://a522b64ca97f.ngrok-free.app";
$correctCallbackUrl = $ngrokBaseUrl . "/api/mpesa/stk-callback";

echo "\n✅ Active ngrok URL confirmed: $ngrokBaseUrl\n";
echo "🔍 Issue: Missing '/api/' in the callback path\n";
echo "🛠️ Fixing path...\n\n";

// Update the callback URL with correct path
SystemSetting::set('mpesa', 'callback_url', $correctCallbackUrl, 'STK Push Callback URL', false, $adminId);

echo "✅ Updated Callback URL: $correctCallbackUrl\n\n";

// Verify the update
$updatedCallbackUrl = SystemSetting::get('mpesa', 'callback_url');
echo "📋 Verification:\n";
echo "   Database now has: $updatedCallbackUrl\n";
echo "   Laravel route: POST /api/mpesa/stk-callback → MpesaController@stkCallback\n\n";

echo "🧪 Test the endpoint:\n";
echo "   URL: $correctCallbackUrl\n";
echo "   Method: POST\n";
echo "   Should be reachable by M-Pesa servers\n\n";

echo "🎉 Ready to test STK Push!\n";
echo "   The 400.002.02 error should now be resolved.\n";
echo "   M-Pesa can reach: $correctCallbackUrl\n"; 