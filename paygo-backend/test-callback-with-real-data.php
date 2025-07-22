<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Http\Controllers\Api\MpesaController;
use Illuminate\Http\Request;

echo "🧪 Testing Callback Handler with Real M-Pesa Data...\n\n";

// Use the exact callback data from your logs that failed
$realCallbackData = [
    "Body" => [
        "stkCallback" => [
            "MerchantRequestID" => "bf85-4518-aa79-055ba430a47f9747",
            "CheckoutRequestID" => "ws_CO_220720251923243703822480",
            "ResultCode" => 0,
            "ResultDesc" => "The service request is processed successfully",
            "CallbackMetadata" => [
                "Item" => [
                    [
                        "Name" => "Amount",
                        "Value" => 1
                    ],
                    [
                        "Name" => "MpesaReceiptNumber", 
                        "Value" => "TGM83FBOAK"
                    ],
                    [
                        "Name" => "Balance",
                        "Value" => "{Amount={CurrencyCode=KES, MinimumAmount=11455900, BasicAmount=114559.00}}"
                    ],
                    [
                        "Name" => "TransactionDate",
                        "Value" => 20250722192334
                    ],
                    [
                        "Name" => "PhoneNumber",
                        "Value" => 254703822480
                    ]
                ]
            ]
        ]
    ]
];

echo "📋 Testing with Real Callback Data:\n";
echo "   Checkout ID: " . $realCallbackData['Body']['stkCallback']['CheckoutRequestID'] . "\n";
echo "   Receipt: " . $realCallbackData['Body']['stkCallback']['CallbackMetadata']['Item'][1]['Value'] . "\n";
echo "   Complex Balance: " . $realCallbackData['Body']['stkCallback']['CallbackMetadata']['Item'][2]['Value'] . "\n\n";

// Create request object
$request = new Request();
$request->merge($realCallbackData);

// Create controller instance and test
$controller = new MpesaController();

try {
    echo "🚀 Processing callback with fixed handler...\n";
    $response = $controller->stkCallback($request);
    
    echo "✅ Response Status: " . $response->getStatusCode() . "\n";
    echo "✅ Response Content: " . $response->getContent() . "\n\n";
    
    if ($response->getStatusCode() == 200) {
        echo "🎉 SUCCESS! Callback processed without database errors!\n";
        
        // Check if payment order was updated
        $paymentOrder = \App\Models\PaymentOrder::where('checkout_request_id', 'ws_CO_220720251923243703822480')->first();
        if ($paymentOrder) {
            echo "📊 Payment Order Status: " . $paymentOrder->status . "\n";
            echo "📊 Receipt Number: " . ($paymentOrder->mpesa_receipt_number ?: 'Not set') . "\n";
        }
        
        // Check if transaction was created
        $transaction = \App\Models\MpesaTransaction::where('checkout_request_id', 'ws_CO_220720251923243703822480')->first();
        if ($transaction) {
            echo "💳 Transaction Created: ID " . $transaction->id . "\n";
            echo "💳 Receipt: " . $transaction->mpesa_receipt_number . "\n";
            echo "💳 Amount: KSh " . $transaction->amount . "\n";
            echo "💳 Balance: " . ($transaction->balance ?: 'null (complex object handled)') . "\n";
        }
    } else {
        echo "❌ Callback processing failed\n";
    }
    
} catch (\Exception $e) {
    echo "💥 Exception occurred:\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n🔧 Testing complete!\n";
echo "If successful, future callbacks will process automatically.\n"; 