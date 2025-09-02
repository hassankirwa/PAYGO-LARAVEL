<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\PaymentPlan;
use App\Models\Payment;
use App\Models\C2BTransaction;
use App\Models\PaybillTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class OngoingPaymentController extends Controller
{
    /**
     * Get client's current payment plan and installment details
     */
    public function getPaymentPlanDetails(Request $request)
    {
        try {
            $user = auth()->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => 'Authentication required'
                ], 401);
            }

            // Get client data
            $client = Client::where('email', $user->email)
                          ->orWhere('phone', $user->phone)
                          ->first();

            if (!$client) {
                return response()->json([
                    'success' => false,
                    'error' => 'Client not found'
                ], 404);
            }

            // Get active payment plan
            $paymentPlan = PaymentPlan::where('client_id', $client->id)
                                    ->where('status', 'active')
                                    ->with(['appliance.product'])
                                    ->first();

            if (!$paymentPlan) {
                return response()->json([
                    'success' => false,
                    'error' => 'No active payment plan found'
                ], 404);
            }

            // Calculate next payment due date
            $nextPaymentDate = $this->calculateNextPaymentDate($paymentPlan);
            $daysUntilDue = Carbon::parse($nextPaymentDate)->diffInDays(Carbon::now(), false);
            $isOverdue = $daysUntilDue < 0;

            // Get recent payment history
            $recentPayments = Payment::where('payment_plan_id', $paymentPlan->id)
                                   ->orderBy('payment_date', 'desc')
                                   ->limit(5)
                                   ->get()
                                   ->map(function ($payment) {
                                       return [
                                           'id' => $payment->id,
                                           'amount' => $payment->amount_ksh,
                                           'payment_date' => $payment->payment_date->format('Y-m-d'),
                                           'payment_method' => $payment->payment_method,
                                           'reference' => $payment->payment_reference,
                                           'status' => $payment->status
                                       ];
                                   });

            return response()->json([
                'success' => true,
                'data' => [
                    'client' => [
                        'id' => $client->id,
                        'name' => $client->first_name . ' ' . $client->last_name,
                        'email' => $client->email,
                        'phone' => $client->phone,
                        'device_id' => $client->client_code ?? 'KY' . str_pad($client->id, 6, '0', STR_PAD_LEFT)
                    ],
                    'payment_plan' => [
                        'id' => $paymentPlan->id,
                        'total_amount' => $paymentPlan->total_amount_ksh,
                        'installment_amount' => $paymentPlan->installment_amount_ksh,
                        'payment_frequency' => $paymentPlan->payment_frequency,
                        'total_installments' => $paymentPlan->total_installments,
                        'completed_installments' => $paymentPlan->installments_completed,
                        'remaining_installments' => $paymentPlan->total_installments - $paymentPlan->installments_completed,
                        'total_paid' => $paymentPlan->total_paid_ksh,
                        'remaining_balance' => $paymentPlan->remaining_balance_ksh,
                        'next_payment_date' => $nextPaymentDate,
                        'days_until_due' => abs($daysUntilDue),
                        'is_overdue' => $isOverdue,
                        'progress_percentage' => $paymentPlan->total_installments > 0 
                            ? ($paymentPlan->installments_completed / $paymentPlan->total_installments) * 100 
                            : 0
                    ],
                    'appliance' => [
                        'id' => $paymentPlan->appliance->id,
                        'model' => $paymentPlan->appliance->product->name ?? 'Unknown Model',
                        'serial_number' => $paymentPlan->appliance->serial_number,
                        'status' => $paymentPlan->appliance->status
                    ],
                    'payment_options' => [
                        'paybill' => [
                            'business_number' => '174379',
                            'account_number' => $client->client_code ?? 'KY' . str_pad($client->id, 6, '0', STR_PAD_LEFT),
                            'amount' => $paymentPlan->installment_amount_ksh
                        ],
                        'till_number' => [
                            'till_number' => '5544332',
                            'reference' => $client->client_code ?? 'KY' . str_pad($client->id, 6, '0', STR_PAD_LEFT),
                            'amount' => $paymentPlan->installment_amount_ksh
                        ],
                        'bank_transfer' => [
                            'account_name' => 'KOYO PayGo Ltd',
                            'account_number' => '1234567890',
                            'bank' => 'KCB Bank Kenya',
                            'reference' => $client->client_code ?? 'KY' . str_pad($client->id, 6, '0', STR_PAD_LEFT),
                            'amount' => $paymentPlan->installment_amount_ksh
                        ]
                    ],
                    'recent_payments' => $recentPayments
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get payment plan details:', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to retrieve payment plan details'
            ], 500);
        }
    }

    /**
     * Check payment status by reference number
     */
    public function checkPaymentStatus(Request $request)
    {
        $request->validate([
            'reference_number' => 'required|string',
            'payment_method' => 'required|in:mpesa_paybill,mpesa_till,bank_transfer'
        ]);

        try {
            $user = auth()->user();
            $referenceNumber = $request->reference_number;
            $paymentMethod = $request->payment_method;

            // Check different payment sources based on method
            $paymentFound = false;
            $paymentData = null;

            if ($paymentMethod === 'mpesa_paybill') {
                $transaction = C2BTransaction::where('mpesa_receipt_number', $referenceNumber)
                                           ->orWhere('trans_id', $referenceNumber)
                                           ->first();
                
                if ($transaction) {
                    $paymentFound = true;
                    $paymentData = [
                        'reference' => $transaction->mpesa_receipt_number,
                        'amount' => $transaction->trans_amount,
                        'status' => $transaction->payment_status,
                        'payment_date' => $transaction->trans_time,
                        'method' => 'M-Pesa PayBill',
                        'phone' => $transaction->msisdn
                    ];
                }
            } elseif ($paymentMethod === 'mpesa_till') {
                $transaction = PaybillTransaction::where('mpesa_receipt_number', $referenceNumber)
                                                ->orWhere('checkout_request_id', $referenceNumber)
                                                ->first();
                
                if ($transaction) {
                    $paymentFound = true;
                    $paymentData = [
                        'reference' => $transaction->mpesa_receipt_number,
                        'amount' => $transaction->amount,
                        'status' => $transaction->status,
                        'payment_date' => $transaction->created_at,
                        'method' => 'M-Pesa Till Number',
                        'phone' => $transaction->phone_number
                    ];
                }
            } else {
                // For bank transfers, check the payments table
                $payment = Payment::where('payment_reference', $referenceNumber)
                               ->where('payment_method', 'bank_transfer')
                               ->first();
                
                if ($payment) {
                    $paymentFound = true;
                    $paymentData = [
                        'reference' => $payment->payment_reference,
                        'amount' => $payment->amount_ksh,
                        'status' => $payment->status,
                        'payment_date' => $payment->payment_date,
                        'method' => 'Bank Transfer'
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'payment_found' => $paymentFound,
                'data' => $paymentData
            ]);

        } catch (\Exception $e) {
            Log::error('Payment status check failed:', [
                'user_id' => auth()->id(),
                'reference' => $request->reference_number,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to check payment status'
            ], 500);
        }
    }

    /**
     * Record manual payment (for bank transfers or cash payments)
     */
    public function recordManualPayment(Request $request)
    {
        $request->validate([
            'payment_method' => 'required|in:bank_transfer,cash,other',
            'amount' => 'required|numeric|min:1',
            'reference_number' => 'required|string',
            'payment_date' => 'required|date',
            'notes' => 'nullable|string|max:500'
        ]);

        try {
            $user = auth()->user();
            
            // Get client and active payment plan
            $client = Client::where('email', $user->email)->first();
            if (!$client) {
                return response()->json([
                    'success' => false,
                    'error' => 'Client not found'
                ], 404);
            }

            $paymentPlan = PaymentPlan::where('client_id', $client->id)
                                    ->where('status', 'active')
                                    ->first();

            if (!$paymentPlan) {
                return response()->json([
                    'success' => false,
                    'error' => 'No active payment plan found'
                ], 404);
            }

            // Validate amount matches installment amount
            $expectedAmount = $paymentPlan->installment_amount_ksh;
            $actualAmount = $request->amount;

            if (abs($actualAmount - $expectedAmount) > 1) { // Allow 1 KSh tolerance
                return response()->json([
                    'success' => false,
                    'error' => "Payment amount (KSh {$actualAmount}) does not match expected installment amount (KSh {$expectedAmount})"
                ], 422);
            }

            DB::beginTransaction();

            // Create payment record
            $payment = Payment::create([
                'payment_plan_id' => $paymentPlan->id,
                'client_id' => $client->id,
                'amount_ksh' => $actualAmount,
                'payment_date' => $request->payment_date,
                'payment_method' => $request->payment_method,
                'payment_reference' => $request->reference_number,
                'status' => 'pending', // Manual payments need verification
                'notes' => $request->notes
            ]);

            DB::commit();

            Log::info('Manual payment recorded:', [
                'payment_id' => $payment->id,
                'client_id' => $client->id,
                'plan_id' => $paymentPlan->id,
                'amount' => $actualAmount,
                'method' => $request->payment_method,
                'reference' => $request->reference_number
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment recorded successfully. It will be verified by our team.',
                'data' => [
                    'payment_id' => $payment->id,
                    'reference' => $payment->payment_reference,
                    'status' => $payment->status,
                    'amount' => $payment->amount_ksh
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            
            Log::error('Manual payment recording failed:', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to record payment'
            ], 500);
        }
    }

    /**
     * Get payment history for authenticated client
     */
    public function getPaymentHistory(Request $request)
    {
        try {
            $user = auth()->user();
            $page = $request->query('page', 1);
            $perPage = $request->query('per_page', 15);
            $status = $request->query('status', 'all');

            $client = Client::where('email', $user->email)->first();
            if (!$client) {
                return response()->json([
                    'success' => false,
                    'error' => 'Client not found'
                ], 404);
            }

            $query = Payment::where('client_id', $client->id)
                          ->with(['paymentPlan.appliance.product']);

            if ($status !== 'all') {
                $query->where('status', $status);
            }

            $payments = $query->orderBy('payment_date', 'desc')
                            ->paginate($perPage, ['*'], 'page', $page);

            $formattedPayments = $payments->getCollection()->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'amount' => $payment->amount_ksh,
                    'formatted_amount' => 'KSh ' . number_format($payment->amount_ksh, 2),
                    'payment_date' => $payment->payment_date->format('Y-m-d'),
                    'payment_method' => $payment->payment_method,
                    'reference' => $payment->payment_reference,
                    'status' => $payment->status,
                    'appliance_model' => $payment->paymentPlan->appliance->product->name ?? 'Unknown',
                    'late_fee' => $payment->late_fee_ksh ?? 0,
                    'total_amount' => $payment->amount_ksh + ($payment->late_fee_ksh ?? 0),
                    'notes' => $payment->notes
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedPayments,
                'pagination' => [
                    'current_page' => $payments->currentPage(),
                    'per_page' => $payments->perPage(),
                    'total' => $payments->total(),
                    'last_page' => $payments->lastPage(),
                    'from' => $payments->firstItem(),
                    'to' => $payments->lastItem(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Payment history retrieval failed:', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to retrieve payment history'
            ], 500);
        }
    }

    /**
     * Calculate next payment due date based on frequency
     */
    private function calculateNextPaymentDate(PaymentPlan $paymentPlan)
    {
        $lastPayment = Payment::where('payment_plan_id', $paymentPlan->id)
                             ->where('status', 'completed')
                             ->orderBy('payment_date', 'desc')
                             ->first();

        $baseDate = $lastPayment ? $lastPayment->payment_date : $paymentPlan->start_date;

        switch ($paymentPlan->payment_frequency) {
            case 'weekly':
                return Carbon::parse($baseDate)->addWeek()->format('Y-m-d');
            case 'bi-weekly':
                return Carbon::parse($baseDate)->addWeeks(2)->format('Y-m-d');
            case 'monthly':
                return Carbon::parse($baseDate)->addMonth()->format('Y-m-d');
            default:
                return Carbon::parse($baseDate)->addWeek()->format('Y-m-d');
        }
    }
} 