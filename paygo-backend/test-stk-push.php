<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Http\Controllers\Api\MpesaController;
use Illuminate\Http\Request;

echo "🧪 Testing STK Push directly...\n\n";

// Create a mock request
$requestData = [
    'phone_number' => '254700000000',
    'amount' => 1,
    'account_reference' => 'TEST123',
    'transaction_desc' => 'Test Payment for Dynamic Pricing'
];

echo "📋 Request Data:\n";
echo json_encode($requestData, JSON_PRETTY_PRINT) . "\n\n";

// Create request object
$request = new Request();
$request->merge($requestData);

// Create controller instance and test
$controller = new MpesaController();

try {
    echo "🚀 Calling STK Push...\n";
    $response = $controller->stkPush($request);
    
    echo "✅ Response received:\n";
    echo "Status Code: " . $response->getStatusCode() . "\n";
    echo "Content: " . $response->getContent() . "\n\n";
    
    $responseData = json_decode($response->getContent(), true);
    
    if ($responseData['success'] ?? false) {
        echo "🎉 STK Push initiated successfully!\n";
        
        if (isset($responseData['data']['checkout_request_id'])) {
            echo "📱 Checkout Request ID: " . $responseData['data']['checkout_request_id'] . "\n";
            echo "📞 Phone will receive STK Push prompt\n";
        }
    } else {
        echo "❌ STK Push failed:\n";
        echo "Error: " . ($responseData['error'] ?? 'Unknown error') . "\n";
        
        if (isset($responseData['details'])) {
            echo "Details: " . json_encode($responseData['details'], JSON_PRETTY_PRINT) . "\n";
        }
    }
    
} catch (\Exception $e) {
    echo "💥 Exception occurred:\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n🔧 Testing complete!\n"; 