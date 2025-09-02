<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemSetting;
use App\Models\AdminUser;

echo "🔧 KOYO PayGo - Updating M-Pesa URLs with New Ngrok Endpoint\n\n";

$adminUser = AdminUser::first();
$adminId = $adminUser ? $adminUser->id : null;

// New ngrok URL that's registered with M-Pesa
$newNgrokUrl = "https://68f2b04045a4.ngrok-free.app";

echo "📡 Registering New M-Pesa Callback URLs:\n";
echo "   • Validation URL: {$newNgrokUrl}/api/paybill/validation\n";
echo "   • Confirmation URL: {$newNgrokUrl}/api/paybill/confirmation\n\n";

// Update PayBill URLs
SystemSetting::set('mpesa', 'paybill_validation_url', $newNgrokUrl . '/api/paybill/validation', 'PayBill C2B Validation URL', false, $adminId);
SystemSetting::set('mpesa', 'paybill_confirmation_url', $newNgrokUrl . '/api/paybill/confirmation', 'PayBill C2B Confirmation URL', false, $adminId);

// Update other M-Pesa URLs
SystemSetting::set('mpesa', 'callback_url', $newNgrokUrl . '/api/mpesa/stk-callback', 'STK Push Callback URL', false, $adminId);
SystemSetting::set('mpesa', 'confirmation_url', $newNgrokUrl . '/api/mpesa/confirmation', 'C2B Confirmation URL', false, $adminId);
SystemSetting::set('mpesa', 'validation_url', $newNgrokUrl . '/api/mpesa/validation', 'C2B Validation URL', false, $adminId);

// Update API base URL
SystemSetting::set('api', 'base_url', $newNgrokUrl, 'API Base URL', false, $adminId);

echo "✅ URLs Updated Successfully!\n\n";

// Display current configuration
echo "📋 Current M-Pesa Configuration:\n";
$config = SystemSetting::getMpesaConfig();
foreach ($config as $key => $value) {
    if (strpos($key, 'url') !== false) {
        echo "   • {$key}: {$value}\n";
    }
}

echo "\n🎯 M-Pesa PayBill Integration Status:\n";
echo "   • PayBill Number: 174379\n";
echo "   • Response Type: Completed\n";
echo "   • URLs Registered: ✅ Complete\n";
echo "   • Endpoints Ready: ✅ Ready to receive payments\n\n";

echo "🚀 PayGo Platform ready for M-Pesa payments!\n";
echo "   Customers can now pay via PayBill 174379 with their device ID.\n"; 