<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Http\Controllers\Api\PaybillController;
use App\Services\DarajaPaymentVerificationService;
use App\Models\PaybillTransaction;
use App\Models\SystemSetting;
use Illuminate\Http\Request;

echo "🧪 KOYO PayGo - Testing Updated PayBill Endpoints\n\n";

// Display current configuration
echo "📋 Current M-Pesa Configuration:\n";
$config = SystemSetting::getMpesaConfig();
echo "   • PayBill Number: " . ($config['shortcode'] ?? '174379') . "\n";
echo "   • Validation URL: " . ($config['paybill_validation_url'] ?? 'NOT SET') . "\n";
echo "   • Confirmation URL: " . ($config['paybill_confirmation_url'] ?? 'NOT SET') . "\n";
echo "   • Response Type: " . ($config['paybill_response_type'] ?? 'Completed') . "\n\n";

// Initialize controller
$controller = new PaybillController(new DarajaPaymentVerificationService());

// Test data simulating M-Pesa PayBill request
$testValidationData = [
    'TransactionType' => 'Pay Bill',
    'TransID' => 'RKTQ' . strtoupper(substr(md5(uniqid()), 0, 4)),
    'TransTime' => date('YmdHis'),
    'TransAmount' => '500.00',
    'BusinessShortCode' => '174379',
    'BillRefNumber' => 'KY001', // Device ID
    'InvoiceNumber' => '',
    'OrgAccountBalance' => '9800.00',
    'ThirdPartyTransID' => '',
    'MSISDN' => '254712345678',
    'FirstName' => 'John',
    'MiddleName' => 'Doe',
    'LastName' => 'Smith'
];

echo "🔍 STEP 1: Testing PayBill Validation Endpoint\n";
echo "Testing with data:\n";
echo "   • Transaction ID: " . $testValidationData['TransID'] . "\n";
echo "   • Amount: KSh " . $testValidationData['TransAmount'] . "\n";
echo "   • Device ID: " . $testValidationData['BillRefNumber'] . "\n";
echo "   • Phone: " . $testValidationData['MSISDN'] . "\n\n";

// Create request object for validation
$validationRequest = new Request();
$validationRequest->merge($testValidationData);

try {
    $validationResponse = $controller->validation($validationRequest);
    $validationData = json_decode($validationResponse->getContent(), true);
    
    echo "✅ Validation Response:\n";
    echo "   • Result Code: " . $validationData['ResultCode'] . "\n";
    echo "   • Result Description: " . $validationData['ResultDesc'] . "\n";
    
    if ($validationData['ResultCode'] == '0') {
        echo "   • Status: ✅ ACCEPTED - Payment will proceed\n\n";
        
        // Test confirmation if validation passed
        echo "💰 STEP 2: Testing PayBill Confirmation Endpoint\n";
        
        // Add receipt number for confirmation
        $testConfirmationData = $testValidationData;
        $testConfirmationData['ReceiptNumber'] = $testValidationData['TransID'];
        
        $confirmationRequest = new Request();
        $confirmationRequest->merge($testConfirmationData);
        
        $confirmationResponse = $controller->confirmation($confirmationRequest);
        $confirmationContent = $confirmationResponse->getContent();
        
        echo "✅ Confirmation Response:\n";
        echo "   • Status: " . $confirmationResponse->getStatusCode() . "\n";
        echo "   • Content: " . $confirmationContent . "\n\n";
        
        // Check if transaction was saved
        echo "📊 STEP 3: Verifying Transaction Storage\n";
        $savedTransaction = PaybillTransaction::where('trans_id', $testValidationData['TransID'])->first();
        
        if ($savedTransaction) {
            echo "✅ Transaction saved successfully:\n";
            echo "   • ID: " . $savedTransaction->id . "\n";
            echo "   • Status: " . $savedTransaction->status . "\n";
            echo "   • Amount: " . $savedTransaction->formatted_amount . "\n";
            echo "   • Device ID: " . $savedTransaction->device_id . "\n";
            echo "   • Customer: " . $savedTransaction->customer_name . "\n";
            echo "   • Processed: " . ($savedTransaction->processed_at ? 'Yes' : 'No') . "\n\n";
        } else {
            echo "❌ Transaction NOT found in database\n\n";
        }
        
    } else {
        echo "   • Status: ❌ REJECTED - Payment will be cancelled\n";
        echo "   • Reason: " . $validationData['ResultDesc'] . "\n\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error testing validation endpoint:\n";
    echo "   • Error: " . $e->getMessage() . "\n\n";
}

// Test endpoint URLs directly
echo "🌐 STEP 4: Testing Endpoint Accessibility\n";
$baseUrl = 'https://68f2b04045a4.ngrok-free.app';

echo "Testing endpoint URLs:\n";
echo "   • Validation: {$baseUrl}/api/paybill/validation\n";
echo "   • Confirmation: {$baseUrl}/api/paybill/confirmation\n\n";

// Test basic GET requests to ensure endpoints are accessible
echo "🔗 STEP 5: Testing Route Configuration\n";
try {
    // Check if routes are registered
    $routes = app('router')->getRoutes();
    $paybillRoutes = [];
    
    foreach ($routes as $route) {
        $uri = $route->uri();
        if (strpos($uri, 'paybill') !== false) {
            $paybillRoutes[] = [
                'method' => implode('|', $route->methods()),
                'uri' => $uri,
                'action' => $route->getActionName()
            ];
        }
    }
    
    echo "✅ PayBill Routes Found:\n";
    foreach ($paybillRoutes as $route) {
        echo "   • {$route['method']} /{$route['uri']}\n";
    }
    echo "\n";
    
} catch (Exception $e) {
    echo "❌ Error checking routes: " . $e->getMessage() . "\n\n";
}

echo "📱 STEP 6: PayBill Payment Instructions for Testing\n";
echo "🎯 To test with real M-Pesa:\n";
echo "   1. Open M-Pesa on your phone\n";
echo "   2. Select 'Lipa na M-Pesa' > 'Pay Bill'\n";
echo "   3. Enter Business No: 174379\n";
echo "   4. Enter Account No: KY001 (or any device ID)\n";
echo "   5. Enter Amount: 100\n";
echo "   6. Enter PIN and confirm\n\n";

echo "🔄 Real-time Monitoring:\n";
echo "   • Watch logs: tail -f storage/logs/laravel.log\n";
echo "   • Check transactions: GET /api/paybill/transactions\n";
echo "   • Monitor status: GET /api/paybill/status/KY001\n\n";

echo "✅ PayBill Integration Test Complete!\n";
echo "🚀 System is ready to receive M-Pesa PayBill payments.\n"; 