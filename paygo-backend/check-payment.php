<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\C2BTransaction;
use Illuminate\Support\Facades\Log;

$deviceId = 'KOYO_1_1753176916399';

echo "🔍 Checking payment for device ID: $deviceId\n";
echo "=============================================\n\n";

// Check total transactions
$totalTransactions = C2BTransaction::count();
echo "📊 Total C2B transactions in database: $totalTransactions\n\n";

// Check for this specific device
$transaction = C2BTransaction::where('device_id', $deviceId)
    ->orWhere('bill_ref_number', $deviceId)
    ->first();

if ($transaction) {
    echo "✅ PAYMENT FOUND!\n";
    echo "Transaction ID: {$transaction->trans_id}\n";
    echo "Amount: KES {$transaction->trans_amount}\n";
    echo "Phone: {$transaction->msisdn}\n";
    echo "Customer: {$transaction->first_name} {$transaction->last_name}\n";
    echo "Payment Time: {$transaction->trans_time}\n";
    echo "Processed: " . ($transaction->processed ? 'Yes' : 'No') . "\n";
    echo "Created: {$transaction->created_at}\n\n";
    
    echo "📄 Raw Payload:\n";
    echo json_encode($transaction->raw_payload, JSON_PRETTY_PRINT) . "\n";
} else {
    echo "❌ NO PAYMENT FOUND for device ID: $deviceId\n\n";
    
    // Show all transactions for debugging
    echo "📋 All C2B transactions in database:\n";
    $allTransactions = C2BTransaction::orderBy('created_at', 'desc')->take(10)->get();
    
    if ($allTransactions->count() > 0) {
        foreach ($allTransactions as $trans) {
            echo "- ID: {$trans->id} | Device: {$trans->device_id} | Amount: {$trans->trans_amount} | Time: {$trans->created_at}\n";
        }
    } else {
        echo "- No transactions found in database\n";
    }
}

echo "\n🔗 Checking Laravel logs for validation/confirmation calls...\n";
echo "============================================================\n";

// Check if Laravel logs exist
$logPath = storage_path('logs/laravel.log');
if (file_exists($logPath)) {
    echo "📁 Laravel log file found: $logPath\n";
    
    // Get last 50 lines of log
    $command = "tail -50 " . escapeshellarg($logPath);
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        // Windows command
        $command = "Get-Content " . escapeshellarg($logPath) . " -Tail 50";
    }
    
    echo "📄 Recent log entries:\n";
    echo "======================\n";
    
    // Show last few entries
    $logs = file_get_contents($logPath);
    $lines = explode("\n", $logs);
    $recentLines = array_slice($lines, -20);
    
    foreach ($recentLines as $line) {
        if (strpos($line, 'M-Pesa') !== false || strpos($line, 'C2B') !== false || strpos($line, 'Paybill') !== false) {
            echo $line . "\n";
        }
    }
    
} else {
    echo "❌ Laravel log file not found at: $logPath\n";
}

echo "\n💡 Next Steps:\n";
echo "==============\n";
echo "1. If no payment found, the validation/confirmation URLs may not be receiving calls\n";
echo "2. Check if ngrok tunnel is active: https://e66ae42d16d0.ngrok-free.app\n";
echo "3. Test validation endpoint manually\n";
echo "4. Check if M-Pesa sandbox is working\n"; 