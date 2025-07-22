<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemSetting;
use App\Models\AdminUser;

echo "🔧 Fixing M-Pesa Callback URL for Public Access...\n\n";

// Get admin user for audit trail
$adminUser = AdminUser::first();
$adminId = $adminUser ? $adminUser->id : null;

echo "❌ Current Issue: M-Pesa Error 400.002.02 - Invalid CallBackURL\n";
echo "   Problem: " . SystemSetting::get('mpesa', 'callback_url') . "\n";
echo "   Reason: localhost URLs are not accessible to M-Pesa servers\n\n";

echo "📋 M-Pesa Callback URL Requirements:\n";
echo "   ✅ Must be HTTPS (not HTTP)\n";
echo "   ✅ Must be publicly accessible (not localhost)\n";
echo "   ✅ Must be reachable from internet\n";
echo "   ✅ Must respond with HTTP 200\n\n";

echo "🛠️ Solution Options:\n\n";

echo "Option 1: Use ngrok (Recommended for Development)\n";
echo "   1. Install ngrok: https://ngrok.com/\n";
echo "   2. Run: ngrok http 8000\n";
echo "   3. Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)\n";
echo "   4. Update callback URL: https://your-ngrok-url.ngrok-free.app/api/mpesa/stk-callback\n\n";

echo "Option 2: Use a Public Test Webhook (Temporary)\n";
echo "   - Use webhook.site for testing: https://webhook.site/\n";
echo "   - Get a unique URL and use it as callback\n";
echo "   - Note: This won't process payments, just receives callbacks\n\n";

echo "Option 3: Deploy to Production Server\n";
echo "   - Use your actual domain: https://yourdomain.com/api/mpesa/stk-callback\n\n";

// For demonstration, let's show how to set a proper ngrok URL
echo "🚀 Example: Setting ngrok callback URL\n";
echo "   If your ngrok URL is: https://abc123.ngrok-free.app\n";
echo "   Run this command to update:\n\n";

$exampleNgrokUrl = "https://abc123.ngrok-free.app";
$exampleCallbackUrl = $exampleNgrokUrl . "/api/mpesa/stk-callback";

echo "   SystemSetting::set('mpesa', 'callback_url', '$exampleCallbackUrl', 'STK Push Callback URL', false, \$adminId);\n\n";

echo "💡 To fix immediately:\n";
echo "   1. Get your ngrok HTTPS URL\n";
echo "   2. Replace 'abc123' in the example above\n";
echo "   3. Run the SystemSetting::set command\n";
echo "   4. Test STK Push again\n\n";

echo "✅ Once fixed, M-Pesa will be able to send payment results to your app!\n"; 