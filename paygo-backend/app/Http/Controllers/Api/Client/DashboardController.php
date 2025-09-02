<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Models\Client;
use App\Models\Subscription;
use App\Models\PaymentPlan;
use App\Models\MpesaTransaction;
use App\Models\Payment;
use App\Models\Appliance;
use App\Models\Product;

class DashboardController extends Controller
{
    /**
     * Get comprehensive dashboard statistics for the authenticated client
     */
    public function getStats(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }

            Log::info('Client dashboard stats requested', ['user_id' => $user->id]);

            // Find the client record
            $client = Client::where('email', $user->email)
                           ->orWhere('phone', $user->phone)
                           ->first();

            if (!$client) {
                Log::warning('Client record not found', [
                    'user_email' => $user->email,
                    'user_phone' => $user->phone
                ]);
                
                return response()->json([
                    'success' => true,
                    'stats' => $this->getEmptyStats(),
                    'message' => 'No client data found'
                ]);
            }

            // Get comprehensive stats
            $stats = $this->getClientStats($client);
            
            Log::info('Client dashboard stats retrieved successfully', [
                'client_id' => $client->id,
                'stats_count' => count($stats)
            ]);

            return response()->json([
                'success' => true,
                'stats' => $stats,
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching client dashboard stats', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to load dashboard statistics',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get real-time payment data from M-Pesa transactions
     */
    public function getPayments(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }

            $client = Client::where('email', $user->email)
                           ->orWhere('phone', $user->phone)
                           ->first();

            if (!$client) {
                return response()->json([
                    'success' => true,
                    'payments' => [],
                    'message' => 'No client data found'
                ]);
            }

            // Get M-Pesa transactions for this client
            $mpesaTransactions = MpesaTransaction::where('phone_number', $client->phone)
                ->orderBy('created_at', 'desc')
                ->limit(20)
                ->get()
                ->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'receipt_number' => $transaction->mpesa_receipt_number,
                        'amount' => $transaction->amount,
                        'formatted_amount' => 'KSh ' . number_format($transaction->amount, 2),
                        'phone_number' => $transaction->phone_number,
                        'result_code' => $transaction->result_code,
                        'result_description' => $transaction->result_desc,
                        'transaction_date' => $transaction->transaction_date,
                        'payment_date' => $transaction->transaction_date?->format('M j, Y g:i A'),
                        'status' => $transaction->result_code === 0 ? 'completed' : 'failed',
                        'is_successful' => $transaction->result_code === 0,
                        'created_at' => $transaction->created_at,
                        'updated_at' => $transaction->updated_at,
                    ];
                });

            // Get internal Payment records
            $internalPayments = Payment::where('client_id', $client->id)
                ->orderBy('payment_date', 'desc')
                ->limit(20)
                ->get()
                ->map(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'amount' => $payment->amount_ksh,
                        'formatted_amount' => 'KSh ' . number_format($payment->amount_ksh, 2),
                        'payment_method' => $payment->payment_method,
                        'payment_reference' => $payment->payment_reference,
                        'status' => $payment->status,
                        'payment_date' => $payment->payment_date,
                        'formatted_date' => $payment->payment_date?->format('M j, Y g:i A'),
                        'notes' => $payment->notes,
                        'created_at' => $payment->created_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'payments' => [
                    'mpesa_transactions' => $mpesaTransactions,
                    'internal_payments' => $internalPayments
                ],
                'summary' => [
                    'total_mpesa_payments' => $mpesaTransactions->count(),
                    'total_internal_payments' => $internalPayments->count(),
                    'total_amount_paid' => $mpesaTransactions->sum('amount') + $internalPayments->sum('amount')
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching client payments', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to load payment data'
            ], 500);
        }
    }

    /**
     * Get subscription renewal options with M-Pesa STK Push integration
     */
    public function getRenewalOptions(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }

            $client = Client::where('email', $user->email)
                           ->orWhere('phone', $user->phone)
                           ->first();

            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client data not found'
                ], 404);
            }

            // Get active subscriptions
            $subscriptions = Subscription::where('client_id', $client->id)
                ->with(['appliance.product', 'paymentPlan'])
                ->get();

            $renewalOptions = [];

            foreach ($subscriptions as $subscription) {
                if ($subscription->paymentPlan) {
                    $renewalOptions[] = [
                        'subscription_id' => $subscription->id,
                        'device_id' => $subscription->device_id,
                        'product_name' => $subscription->appliance->product->name ?? 'Unknown Product',
                        'current_status' => $subscription->status,
                        'subscription_type' => $subscription->subscription_type,
                        'next_payment_amount' => $subscription->paymentPlan->installment_amount_ksh,
                        'formatted_amount' => 'KSh ' . number_format($subscription->paymentPlan->installment_amount_ksh, 2),
                        'next_payment_due' => $subscription->paymentPlan->next_payment_due_date,
                        'formatted_due_date' => $subscription->paymentPlan->next_payment_due_date?->format('M j, Y'),
                        'remaining_balance' => $subscription->paymentPlan->remaining_balance_ksh,
                        'formatted_balance' => 'KSh ' . number_format($subscription->paymentPlan->remaining_balance_ksh, 2),
                        'payment_method' => 'mpesa_stk_push', // All payments now via M-Pesa STK Push
                        'can_renew' => in_array($subscription->status, ['active', 'expired', 'suspended']),
                        'end_date' => $subscription->end_date,
                        'days_remaining' => $subscription->end_date ? Carbon::now()->diffInDays($subscription->end_date, false) : null
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'renewal_options' => $renewalOptions,
                'payment_method' => 'mpesa_stk_push',
                'client_phone' => $client->phone,
                'instructions' => 'All subscription renewals are processed via M-Pesa STK Push. Select a subscription to renew and complete payment on your phone.'
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching renewal options', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to load renewal options'
            ], 500);
        }
    }

    /**
     * Get comprehensive client statistics
     */
    private function getClientStats($client)
    {
        // Get subscriptions with related data
        $subscriptions = Subscription::where('client_id', $client->id)
            ->with(['appliance.product', 'paymentPlan'])
            ->get();

        // Get appliances
        $appliances = Appliance::where('client_id', $client->id)
            ->with('product')
            ->get();

        // Get payment plans
        $paymentPlans = PaymentPlan::where('client_id', $client->id)->get();

        // Get M-Pesa transactions
        $mpesaTransactions = MpesaTransaction::where('phone_number', $client->phone)
            ->where('result_code', 0) // Only successful transactions
            ->get();

        // Calculate statistics
        $totalPaid = $mpesaTransactions->sum('amount');
        $totalBalance = $paymentPlans->sum('remaining_balance_ksh');
        $activeSubscriptions = $subscriptions->where('status', 'active')->count();
        $expiredSubscriptions = $subscriptions->where('status', 'expired')->count();

        // Get recent payments
        $recentPayments = $mpesaTransactions->sortByDesc('created_at')->take(5)->map(function ($transaction) {
            return [
                'receipt_number' => $transaction->mpesa_receipt_number,
                'amount' => $transaction->amount,
                'formatted_amount' => 'KSh ' . number_format($transaction->amount, 2),
                'date' => $transaction->transaction_date?->format('M j, Y'),
                'status' => 'completed',
                'method' => 'Payment' // Simplified from 'M-Pesa STK Push'
            ];
        });

        // Get subscription details
        $subscriptionDetails = $subscriptions->map(function ($subscription) {
            return [
                'id' => $subscription->id,
                'device_id' => $subscription->device_id,
                'product_name' => $subscription->appliance->product->name ?? 'Unknown',
                'status' => $subscription->status,
                'subscription_type' => $subscription->subscription_type,
                'start_date' => $subscription->start_date?->format('M j, Y'),
                'end_date' => $subscription->end_date?->format('M j, Y'),
                'days_remaining' => $subscription->end_date ? max(0, Carbon::now()->diffInDays($subscription->end_date, false)) : null,
                'progress_percentage' => $subscription->getProgressPercentageAttribute(),
                'next_payment_amount' => $subscription->paymentPlan?->installment_amount_ksh ?? 0,
                'next_payment_due' => $subscription->paymentPlan?->next_payment_due_date?->format('M j, Y'),
            ];
        });

        return [
            'client_info' => [
                'id' => $client->id,
                'name' => $client->first_name . ' ' . $client->last_name,
                'email' => $client->email,
                'phone' => $client->phone,
                'status' => $client->is_active ? 'active' : 'inactive',
                'registration_date' => $client->created_at?->format('M j, Y'),
            ],
            'summary' => [
                'total_subscriptions' => $subscriptions->count(),
                'active_subscriptions' => $activeSubscriptions,
                'expired_subscriptions' => $expiredSubscriptions,
                'total_appliances' => $appliances->count(),
                'total_paid' => $totalPaid,
                'formatted_total_paid' => 'KSh ' . number_format($totalPaid, 2),
                'total_balance' => $totalBalance,
                'formatted_total_balance' => 'KSh ' . number_format($totalBalance, 2),
                'recent_payments_count' => $mpesaTransactions->count()
            ],
            'subscriptions' => $subscriptionDetails,
            'recent_payments' => $recentPayments,
            'appliances' => $appliances->map(function ($appliance) {
                return [
                    'id' => $appliance->id,
                    'device_id' => $appliance->device_id,
                    'product_name' => $appliance->product->name ?? 'Unknown',
                    'status' => $appliance->status,
                    'installation_date' => $appliance->installation_date?->format('M j, Y'),
                    'last_ping' => $appliance->last_ping?->format('M j, Y g:i A'),
                    'temperature' => $appliance->current_temperature,
                    'battery_voltage' => $appliance->current_battery_voltage,
                ];
            }),
            'payment_plans' => $paymentPlans->map(function ($plan) {
                return [
                    'id' => $plan->id,
                    'plan_name' => $plan->plan_name,
                    'frequency' => $plan->frequency,
                    'total_amount' => $plan->total_amount_ksh,
                    'installment_amount' => $plan->installment_amount_ksh,
                    'total_installments' => $plan->total_installments,
                    'completed_installments' => $plan->installments_completed,
                    'progress_percentage' => round(($plan->installments_completed / $plan->total_installments) * 100, 1),
                    'next_payment_due' => $plan->next_payment_due_date?->format('M j, Y'),
                    'remaining_balance' => $plan->remaining_balance_ksh,
                    'status' => $plan->status
                ];
            })
        ];
    }

    /**
     * Get empty stats structure for clients without data
     */
    private function getEmptyStats()
    {
        return [
            'client_info' => null,
            'summary' => [
                'total_subscriptions' => 0,
                'active_subscriptions' => 0,
                'expired_subscriptions' => 0,
                'total_appliances' => 0,
                'total_paid' => 0,
                'formatted_total_paid' => 'KSh 0.00',
                'total_balance' => 0,
                'formatted_total_balance' => 'KSh 0.00',
                'recent_payments_count' => 0
            ],
            'subscriptions' => [],
            'recent_payments' => [],
            'appliances' => [],
            'payment_plans' => []
        ];
    }
}
