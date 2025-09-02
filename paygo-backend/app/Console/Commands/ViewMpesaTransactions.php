<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MpesaTransaction;
use Carbon\Carbon;

class ViewMpesaTransactions extends Command
{
    protected $signature = 'mpesa:transactions {--limit=10 : Number of transactions to show} {--status= : Filter by status (success/failed/pending)}';
    protected $description = 'View M-Pesa transaction results with details';

    public function handle()
    {
        $limit = (int) $this->option('limit');
        $status = $this->option('status');

        $this->info('📱 M-Pesa Transaction Results');
        $this->line('================================');
        $this->line('');

        $query = MpesaTransaction::orderBy('created_at', 'desc');

        // Filter by status if specified
        if ($status) {
            switch (strtolower($status)) {
                case 'success':
                    $query->where('result_code', 0);
                    break;
                case 'failed':
                    $query->where('result_code', '!=', 0)->whereNotNull('result_code');
                    break;
                case 'pending':
                    $query->whereNull('result_code');
                    break;
            }
        }

        $transactions = $query->take($limit)->get();

        if ($transactions->isEmpty()) {
            $this->warn('No transactions found.');
            $this->line('');
            $this->info('💡 Transactions are created when:');
            $this->line('   1. STK Push callbacks are received from Safaricom');
            $this->line('   2. C2B payments are confirmed');
            $this->line('   3. Manual transaction records are created');
            $this->line('');
            $this->info('🧪 To generate test transactions:');
            $this->line('   1. Initiate STK Push: POST /api/mpesa/stk-push');
            $this->line('   2. Complete payment on your phone');
            $this->line('   3. Wait for callback to be received');
            return;
        }

        $this->info("Found {$transactions->count()} transactions:");
        $this->line('');

        $headers = ['ID', 'Amount (KES)', 'Phone', 'Status', 'Receipt', 'Date', 'Description'];
        $rows = [];

        foreach ($transactions as $transaction) {
            $status = $this->getStatusText($transaction->result_code);
            $amount = $transaction->amount ? 'KES ' . number_format($transaction->amount, 2) : '-';
            $phone = $transaction->phone_number ?: '-';
            $receipt = $transaction->mpesa_receipt_number ?: '-';
            $date = $transaction->created_at ? $transaction->created_at->format('M j, Y H:i') : '-';
            
            // Extract account reference from raw payload if available
            $description = '-';
            if ($transaction->raw_payload && is_array($transaction->raw_payload)) {
                $description = $this->extractAccountReference($transaction->raw_payload);
            }

            $rows[] = [
                $transaction->id,
                $amount,
                $phone,
                $status,
                $receipt,
                $date,
                $description
            ];
        }

        $this->table($headers, $rows);

        $this->line('');
        $this->info('📊 Transaction Summary:');
        $successful = $transactions->where('result_code', 0)->count();
        $failed = $transactions->where('result_code', '!=', 0)->whereNotNull('result_code')->count();
        $pending = $transactions->whereNull('result_code')->count();

        $this->line("   ✅ Successful: {$successful}");
        $this->line("   ❌ Failed: {$failed}");
        $this->line("   ⏳ Pending: {$pending}");

        $this->line('');
        $this->info('🔍 Usage Examples:');
        $this->line('   php artisan mpesa:transactions --limit=5');
        $this->line('   php artisan mpesa:transactions --status=success');
        $this->line('   php artisan mpesa:transactions --status=failed');
        $this->line('   php artisan mpesa:transactions --status=pending');
    }

    private function getStatusText($resultCode)
    {
        if (is_null($resultCode)) {
            return '⏳ Pending';
        }

        if ($resultCode == 0) {
            return '✅ Success';
        }

        // Common M-Pesa error codes
        $errorMessages = [
            1 => 'Insufficient Funds',
            17 => 'Invalid Phone Number',
            26 => 'Invalid Transaction',
            1001 => 'Invalid Phone Number',
            1025 => 'Unable to lock subscriber account',
            1032 => 'Transaction cancelled by customer',
            1037 => 'DS timeout (Customer didn\'t complete)',
            2001 => 'Invalid request',
            9999 => 'Request failed'
        ];

        $message = $errorMessages[$resultCode] ?? 'Unknown Error';
        return "❌ Failed ({$resultCode}: {$message})";
    }

    private function extractAccountReference($rawPayload)
    {
        // Try to extract meaningful info from the callback payload
        if (isset($rawPayload['Body']['stkCallback']['CallbackMetadata']['Item'])) {
            $items = $rawPayload['Body']['stkCallback']['CallbackMetadata']['Item'];
            foreach ($items as $item) {
                if (isset($item['Name']) && $item['Name'] === 'AccountReference') {
                    return $item['Value'];
                }
            }
        }

        if (isset($rawPayload['AccountReference'])) {
            return $rawPayload['AccountReference'];
        }

        return 'STK Push';
    }
} 