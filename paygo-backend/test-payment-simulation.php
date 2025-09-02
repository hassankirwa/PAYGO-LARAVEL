<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Http\Controllers\Api\MpesaC2BController;
use Illuminate\Http\Request;

echo "🧪 Simulating M-Pesa Confirmation for KY555002\n";
echo "===============================================\n";

// Create controller and mock confirmation request
$controller = new MpesaC2BController();
$confirmationData = [
    'TransactionType' => 'Pay Bill',
    'TransID' => 'TEST_' . time(),
    'TransTime' => date('YmdHis'),
    'TransAmount' => 1.00,
    'BusinessShortCode' => '600000',
    'BillRefNumber' => 'KY555002',
    'MSISDN' => '254712345678',
    'FirstName' => 'Test',
    'MiddleName' => 'Payment',
    'LastName' => 'User'
];

$request = new Request();
$request->replace($confirmationData);

echo "Processing confirmation...\n";
$response = $controller->handleConfirmation($request);
echo "Response: " . $response->getContent() . "\n";

// Check if transaction was saved
$transaction = \App\Models\PaybillTransaction::where('bill_ref_number', 'KY555002')->latest()->first();
if ($transaction) {
    echo "✅ Transaction saved:\n";
    echo "   ID: " . $transaction->id . "\n";
    echo "   Status: " . $transaction->status . "\n";
    echo "   Amount: KSh " . $transaction->trans_amount . "\n";
    echo "   Device: " . $transaction->device_id . "\n";
    echo "   Created: " . $transaction->created_at . "\n";
} else {
    echo "❌ No transaction found\n";
} 