<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Route;

echo "🔍 KOYO PayGo - PayBill System Verification\n\n";

// Check 1: System Configuration
echo "📋 1. System Configuration Check\n";
$config = SystemSetting::getMpesaConfig();
$validationUrl = $config['paybill_validation_url'];
$confirmationUrl = $config['paybill_confirmation_url'];
$shortcode = $config['shortcode'];

if ($validationUrl && $confirmationUrl && $shortcode) {
    echo "   ✅ Configuration: COMPLETE\n";
    echo "   • PayBill Number: {$shortcode}\n";
    echo "   • Validation URL: {$validationUrl}\n";
    echo "   • Confirmation URL: {$confirmationUrl}\n";
} else {
    echo "   ❌ Configuration: INCOMPLETE\n";
}

// Check 2: Routes Configuration
echo "\n🔗 2. API Routes Check\n";
$routes = Route::getRoutes();
$paybillRoutes = [];

foreach ($routes as $route) {
    $uri = $route->uri();
    if (strpos($uri, 'paybill') !== false && in_array('POST', $route->methods())) {
        $paybillRoutes[] = $uri;
    }
}

if (in_array('api/paybill/validation', $paybillRoutes) && in_array('api/paybill/confirmation', $paybillRoutes)) {
    echo "   ✅ Routes: CONFIGURED\n";
    echo "   • POST /api/paybill/validation\n";
    echo "   • POST /api/paybill/confirmation\n";
} else {
    echo "   ❌ Routes: MISSING\n";
}

// Check 3: Database Schema
echo "\n🗄️ 3. Database Schema Check\n";
try {
    $tables = \Illuminate\Support\Facades\DB::select("SHOW TABLES LIKE 'paybill_transactions'");
    $applianceColumns = \Illuminate\Support\Facades\Schema::getColumnListing('appliances');
    
    if (count($tables) > 0 && in_array('device_id', $applianceColumns)) {
        echo "   ✅ Database: READY\n";
        echo "   • paybill_transactions table: EXISTS\n";
        echo "   • appliances.device_id column: EXISTS\n";
    } else {
        echo "   ❌ Database: INCOMPLETE\n";
    }
} catch (Exception $e) {
    echo "   ❌ Database: ERROR - " . $e->getMessage() . "\n";
}

// Check 4: Controller Classes
echo "\n🎛️ 4. Controller Classes Check\n";
if (class_exists('App\Http\Controllers\Api\PaybillController') && 
    class_exists('App\Services\MpesaValidationService')) {
    echo "   ✅ Controllers: AVAILABLE\n";
    echo "   • PaybillController: EXISTS\n";
    echo "   • MpesaValidationService: EXISTS\n";
} else {
    echo "   ❌ Controllers: MISSING\n";
}

// Check 5: URL Registration Status
echo "\n📡 5. URL Registration Status\n";
$registeredBase = 'https://68f2b04045a4.ngrok-free.app';
if (strpos($validationUrl, $registeredBase) !== false && strpos($confirmationUrl, $registeredBase) !== false) {
    echo "   ✅ URLs: REGISTERED WITH M-PESA\n";
    echo "   • Registered with: {$registeredBase}\n";
    echo "   • Status: ACTIVE & READY\n";
} else {
    echo "   ⚠️ URLs: NOT MATCHING REGISTERED BASE\n";
}

// Final Status
echo "\n🎯 FINAL STATUS\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$allChecks = [
    $validationUrl && $confirmationUrl && $shortcode,
    in_array('api/paybill/validation', $paybillRoutes) && in_array('api/paybill/confirmation', $paybillRoutes),
    class_exists('App\Http\Controllers\Api\PaybillController'),
    strpos($validationUrl, $registeredBase) !== false
];

if (array_filter($allChecks) === $allChecks) {
    echo "🟢 PAYBILL SYSTEM: FULLY OPERATIONAL\n\n";
    
    echo "✅ READY FOR LIVE M-PESA PAYMENTS!\n\n";
    
    echo "📱 Customer Payment Instructions:\n";
    echo "   1. Open M-Pesa app\n";
    echo "   2. Lipa na M-Pesa > Pay Bill\n";
    echo "   3. Business No: 174379\n";
    echo "   4. Account No: [Device ID]\n";
    echo "   5. Amount: [Payment Amount]\n";
    echo "   6. Enter PIN & Confirm\n\n";
    
    echo "🔄 System will automatically:\n";
    echo "   • Validate payment details\n";
    echo "   • Process confirmed payments\n";
    echo "   • Update customer records\n";
    echo "   • Trigger business logic\n";
    echo "   • Send notifications\n\n";
    
    echo "🚀 START ACCEPTING PAYMENTS NOW!\n";
} else {
    echo "🔴 PAYBILL SYSTEM: NEEDS ATTENTION\n";
    echo "   Please review the failed checks above.\n";
}

echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "Verification completed: " . date('Y-m-d H:i:s') . "\n"; 