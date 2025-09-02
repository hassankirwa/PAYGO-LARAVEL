<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Http\Controllers\Api\MpesaController;
use Illuminate\Http\Request;

echo "🔍 Testing Payment Order Status Endpoint...\n\n";

// Test with the successful payment checkout ID
$checkoutRequestId = "ws_CO_220720251923243703822480";

echo "📋 Testing checkout ID: $checkoutRequestId\n\n";

// Create request object
$request = new Request();
$request->merge(['checkout_request_id' => $checkoutRequestId]);

// Create controller instance and test
$controller = new MpesaController();

try {
    echo "🚀 Calling getPaymentOrderStatus endpoint...\n";
    $response = $controller->getPaymentOrderStatus($request);
    
    echo "✅ Response Status: " . $response->getStatusCode() . "\n";
    echo "✅ Response Content:\n" . $response->getContent() . "\n\n";
    
    $responseData = json_decode($response->getContent(), true);
    
    if ($responseData['success'] ?? false) {
        echo "🎉 SUCCESS: Payment status retrieved successfully!\n";
        
        if ($responseData['payment_confirmed'] ?? false) {
            echo "✅ Payment Confirmed: YES\n";
            echo "📊 Transaction Details:\n";
            $transaction = $responseData['data']['transaction'] ?? null;
            if ($transaction) {
                echo "   - Result Code: " . ($transaction['result_code'] ?? 'null') . "\n";
                echo "   - Receipt: " . ($transaction['mpesa_receipt_number'] ?? 'null') . "\n";
                echo "   - Amount: KSh " . ($transaction['amount'] ?? 'null') . "\n";
                echo "   - Phone: " . ($transaction['phone_number'] ?? 'null') . "\n";
            }
            
            echo "📊 Order Details:\n";
            $order = $responseData['data']['order'] ?? null;
            if ($order) {
                echo "   - Order Reference: " . ($order['order_reference'] ?? 'null') . "\n";
                echo "   - Status: " . ($order['status'] ?? 'null') . "\n";
                echo "   - Customer: " . ($order['customer_name'] ?? 'null') . "\n";
            }
        } else {
            echo "⏳ Payment Confirmed: NO (still pending)\n";
        }
    } else {
        echo "❌ FAILED: " . ($responseData['error'] ?? 'Unknown error') . "\n";
    }
    
} catch (\Exception $e) {
    echo "💥 Exception occurred:\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n🔧 Testing complete!\n";
echo "This is exactly what the frontend polls to detect payment completion.\n";
echo "If payment_confirmed is true, frontend should stop polling and show success.\n"; 