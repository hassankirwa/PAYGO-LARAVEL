<?php

namespace App\Services;

use App\Models\PaymentOrder;
use App\Models\MpesaTransaction;
use App\Models\PaymentReceipt;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ReceiptService
{
    /**
     * Generate receipt for successful payment
     */
    public function generatePaymentReceipt(PaymentOrder $paymentOrder, MpesaTransaction $transaction)
    {
        try {
            $receiptNumber = $this->generateReceiptNumber();
            $receiptContent = $this->generateReceiptContent($paymentOrder, $transaction);
            
            // Create receipt record in database
            $receipt = PaymentReceipt::create([
                'receipt_number' => $receiptNumber,
                'payment_order_id' => $paymentOrder->id,
                'transaction_id' => $transaction->id,
                'customer_name' => $paymentOrder->customer_name,
                'customer_email' => $paymentOrder->customer_email,
                'customer_phone' => $paymentOrder->customer_phone,
                'product_name' => $paymentOrder->product_name,
                'payment_amount' => $paymentOrder->paid_amount,
                'payment_method' => 'M-Pesa',
                'mpesa_receipt_number' => $transaction->mpesa_receipt_number,
                'payment_date' => $transaction->transaction_date ?? now(),
                'payment_type' => $paymentOrder->payment_type,
                'plan_type' => $paymentOrder->plan_type,
                'order_reference' => $paymentOrder->order_reference,
                'receipt_data' => $receiptContent,
                'status' => 'generated',
                'generated_at' => now(),
            ]);
            
            Log::info('Payment receipt generated and stored:', [
                'receipt_number' => $receiptNumber,
                'receipt_id' => $receipt->id,
                'order_reference' => $paymentOrder->order_reference,
                'amount' => $paymentOrder->paid_amount
            ]);

            return [
                'success' => true,
                'receipt_number' => $receiptNumber,
                'receipt_data' => $receipt,
                'receipt_url' => $this->generateReceiptUrl($receiptNumber)
            ];

        } catch (\Exception $e) {
            Log::error('Receipt generation failed:', [
                'order_id' => $paymentOrder->id,
                'transaction_id' => $transaction->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'error' => 'Failed to generate receipt: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get receipt by receipt number
     */
    public function getReceiptByNumber($receiptNumber)
    {
        try {
            $receipt = PaymentReceipt::where('receipt_number', $receiptNumber)->first();
            
            if (!$receipt) {
                return [
                    'success' => false,
                    'error' => 'Receipt not found'
                ];
            }

            // Mark as viewed
            $receipt->markAsViewed();

            return [
                'success' => true,
                'receipt' => $receipt,
                'receipt_data' => $receipt->receipt_data
            ];

        } catch (\Exception $e) {
            Log::error('Receipt retrieval failed:', [
                'receipt_number' => $receiptNumber,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Failed to retrieve receipt: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get customer receipts
     */
    public function getCustomerReceipts($phone = null, $email = null, $limit = 10)
    {
        try {
            $receipts = PaymentReceipt::forCustomer($phone, $email)
                ->orderBy('payment_date', 'desc')
                ->limit($limit)
                ->get();

            return [
                'success' => true,
                'receipts' => $receipts,
                'total' => $receipts->count()
            ];

        } catch (\Exception $e) {
            Log::error('Customer receipts retrieval failed:', [
                'phone' => $phone,
                'email' => $email,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Failed to retrieve receipts: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate unique receipt number
     */
    private function generateReceiptNumber()
    {
        $timestamp = now()->format('YmdHis');
        $random = strtoupper(substr(md5(uniqid()), 0, 4));
        return "RCP-{$timestamp}-{$random}";
    }

    /**
     * Generate receipt content
     */
    private function generateReceiptContent(PaymentOrder $paymentOrder, MpesaTransaction $transaction)
    {
        return [
            'company' => [
                'name' => 'KOYO PayGo',
                'address' => 'Nairobi, Kenya',
                'phone' => '+254-700-000-000',
                'email' => 'support@koyopaygo.com'
            ],
            'receipt_info' => [
                'receipt_number' => $this->generateReceiptNumber(),
                'order_reference' => $paymentOrder->order_reference,
                'payment_date' => ($transaction->transaction_date ?? now())->format('Y-m-d H:i:s'),
                'payment_method' => 'M-Pesa STK Push'
            ],
            'customer_info' => [
                'name' => $paymentOrder->customer_name,
                'email' => $paymentOrder->customer_email,
                'phone' => $paymentOrder->customer_phone
            ],
            'payment_details' => [
                'product_name' => $paymentOrder->product_name,
                'payment_type' => $paymentOrder->payment_type,
                'plan_type' => $paymentOrder->plan_type,
                'amount_paid' => $paymentOrder->paid_amount,
                'mpesa_receipt' => $transaction->mpesa_receipt_number,
                'currency' => 'KSh'
            ],
            'plan_details' => [
                'down_payment' => $paymentOrder->down_payment_amount,
                'installment_amount' => $paymentOrder->installment_amount,
                'total_installments' => $paymentOrder->total_installments,
                'plan_duration' => $paymentOrder->plan_duration
            ]
        ];
    }

    /**
     * Generate receipt URL
     */
    private function generateReceiptUrl($receiptNumber)
    {
        return url("/api/receipts/{$receiptNumber}");
    }

    /**
     * Generate receipt for SMS
     */
    public function generateSmsReceiptData(PaymentOrder $paymentOrder, MpesaTransaction $transaction, $receiptNumber)
    {
        return [
            'receipt_number' => $receiptNumber,
            'customer_name' => $paymentOrder->customer_name,
            'amount' => $paymentOrder->paid_amount,
            'date' => ($transaction->transaction_date ?? now())->format('d/m/Y H:i'),
            'product_name' => $paymentOrder->product_name,
            'mpesa_receipt' => $transaction->mpesa_receipt_number
        ];
    }

    /**
     * Generate receipt for email
     */
    public function generateEmailReceiptData(PaymentOrder $paymentOrder, MpesaTransaction $transaction, $receiptNumber)
    {
        $receiptContent = $this->generateReceiptContent($paymentOrder, $transaction);
        $receiptContent['receipt_info']['receipt_number'] = $receiptNumber;
        
        return [
            'receipt_number' => $receiptNumber,
            'receipt_content' => $receiptContent,
            'receipt_url' => $this->generateReceiptUrl($receiptNumber),
            'customer_email' => $paymentOrder->customer_email,
            'customer_name' => $paymentOrder->customer_name
        ];
    }
} 