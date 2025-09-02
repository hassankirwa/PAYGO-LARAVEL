<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemSetting;
use Illuminate\Support\Facades\DB;

echo "🔍 KOYO PayGo - Checking System Settings for PayBill URLs\n\n";

// Check all M-Pesa related settings
echo "📋 All M-Pesa Settings in Database:\n";
$mpesaSettings = DB::table('system_settings')
    ->where('category', 'mpesa')
    ->get();

foreach ($mpesaSettings as $setting) {
    echo "   • {$setting->key}: {$setting->value}\n";
}

echo "\n🎯 PayBill Specific URLs:\n";
$paybillValidation = SystemSetting::get('mpesa', 'paybill_validation_url');
$paybillConfirmation = SystemSetting::get('mpesa', 'paybill_confirmation_url');

echo "   • paybill_validation_url: " . ($paybillValidation ?: 'NOT SET') . "\n";
echo "   • paybill_confirmation_url: " . ($paybillConfirmation ?: 'NOT SET') . "\n";

// Check if the registered URLs match what we expect
$expectedBase = 'https://68f2b04045a4.ngrok-free.app';
echo "\n✅ Expected URLs:\n";
echo "   • Validation: {$expectedBase}/api/paybill/validation\n";
echo "   • Confirmation: {$expectedBase}/api/paybill/confirmation\n";

echo "\n🔄 URL Status:\n";
if ($paybillValidation && $paybillConfirmation) {
    echo "   • URLs are configured in database ✅\n";
    
    if (strpos($paybillValidation, $expectedBase) !== false) {
        echo "   • Validation URL matches expected ngrok ✅\n";
    } else {
        echo "   • Validation URL needs update ⚠️\n";
    }
    
    if (strpos($paybillConfirmation, $expectedBase) !== false) {
        echo "   • Confirmation URL matches expected ngrok ✅\n";
    } else {
        echo "   • Confirmation URL needs update ⚠️\n";
    }
} else {
    echo "   • URLs not configured in database ❌\n";
}

echo "\n🚀 Ready to use these URLs in PayBillController!\n"; 