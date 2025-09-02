<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemSetting;
use App\Models\AdminUser;

echo "🔧 Setting up PayBill System with Register URL API...\n\n";

$adminUser = AdminUser::first();
$adminId = $adminUser ? $adminUser->id : null;

// Check current configuration
echo "📋 Current PayBill Configuration:\n";
$config = SystemSetting::getMpesaConfig();
$apiConfig = SystemSetting::getApiConfig();

$ngrokBaseUrl = "https://a522b64ca97f.ngrok-free.app";
$baseUrl = $apiConfig['base_url'] ?? $ngrokBaseUrl;

// Set PayBill URLs
$paybillValidationUrl = $baseUrl . '/api/paybill/validation';
$paybillConfirmationUrl = $baseUrl . '/api/paybill/confirmation';

SystemSetting::set('mpesa', 'paybill_validation_url', $paybillValidationUrl, 'PayBill C2B Validation URL', false, $adminId);
SystemSetting::set('mpesa', 'paybill_confirmation_url', $paybillConfirmationUrl, 'PayBill C2B Confirmation URL', false, $adminId);
SystemSetting::set('mpesa', 'paybill_response_type', 'Completed', 'PayBill Response Type', false, $adminId);

echo "✅ PayBill URLs configured:\n";
echo "   Validation: $paybillValidationUrl\n";
echo "   Confirmation: $paybillConfirmationUrl\n";
echo "   Response Type: Completed\n\n";

echo "🎉 PayBill System Setup Complete!\n"; 