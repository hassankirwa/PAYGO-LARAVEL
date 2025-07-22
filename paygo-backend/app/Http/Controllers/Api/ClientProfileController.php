<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class ClientProfileController extends Controller
{
    /**
     * Get client profile information
     */
    public function getProfile()
    {
        try {
            $client = Auth::guard('sanctum')->user();
            
            if (!$client || !$client instanceof Client) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            return response()->json([
                'success' => true,
                'client' => [
                    'id' => $client->id,
                    'client_code' => $client->client_code,
                    'first_name' => $client->first_name,
                    'last_name' => $client->last_name,
                    'email' => $client->email,
                    'phone' => $client->phone,
                    'address' => $client->address,
                    'location' => $client->location,
                    'payment_plan' => $client->payment_plan,
                    'status' => $client->status,
                    'payment_status' => $client->payment_status,
                    'is_active' => $client->is_active,
                    'registration_date' => $client->registration_date,
                    'last_login' => $client->last_login,
                    'date_of_birth' => $client->date_of_birth,
                    'national_id' => $client->national_id,
                    'nationality' => $client->nationality,
                    'kyc_status' => $client->kyc_status,
                    'eligibility_status' => $client->eligibility_status,
                    'is_business_customer' => $client->is_business_customer,
                    'business_name' => $client->business_name,
                    'business_type' => $client->business_type,
                    'kra_pin' => $client->kra_pin,
                    'user_type' => 'client'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to retrieve profile: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update client profile information
     */
    public function updateProfile(Request $request)
    {
        try {
            $client = Auth::guard('sanctum')->user();
            
            if (!$client || !$client instanceof Client) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $validator = Validator::make($request->all(), [
                'first_name' => 'sometimes|string|max:100',
                'last_name' => 'sometimes|string|max:100',
                'email' => 'sometimes|email|max:255|unique:clients,email,' . $client->id,
                'phone' => 'sometimes|string|max:20',
                'address' => 'sometimes|string|max:500',
                'city' => 'sometimes|string|max:100',
                'region' => 'sometimes|string|max:100',
                'country' => 'sometimes|string|max:100',
                'postal_code' => 'sometimes|string|max:20',
                'occupation' => 'sometimes|string|max:100',
                'monthly_income_range' => 'sometimes|string|max:50',
                'business_type' => 'sometimes|string|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $client->update($request->only([
                'first_name', 'last_name', 'email', 'phone', 'address', 
                'city', 'region', 'country', 'postal_code', 'occupation', 
                'monthly_income_range', 'business_type'
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => [
                    'id' => $client->id,
                    'client_id' => $client->client_id,
                    'first_name' => $client->first_name,
                    'last_name' => $client->last_name,
                    'email' => $client->email,
                    'phone' => $client->phone,
                    'address' => $client->address,
                    'city' => $client->city,
                    'region' => $client->region,
                    'country' => $client->country,
                    'postal_code' => $client->postal_code,
                    'occupation' => $client->occupation,
                    'monthly_income_range' => $client->monthly_income_range,
                    'business_type' => $client->business_type
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to update profile: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Change client password
     */
    public function changePassword(Request $request)
    {
        try {
            $client = Auth::guard('sanctum')->user();
            
            if (!$client || !$client instanceof Client) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verify current password
            if (!Hash::check($request->current_password, $client->password_hash)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Current password is incorrect'
                ], 422);
            }

            // Update password
            $client->password_hash = Hash::make($request->new_password);
            $client->save();

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to change password: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update client preferences
     */
    public function updatePreferences(Request $request)
    {
        try {
            $client = Auth::guard('sanctum')->user();
            
            if (!$client || !$client instanceof Client) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $validator = Validator::make($request->all(), [
                'theme' => 'sometimes|string|in:light,dark,auto',
                'notifications' => 'sometimes|array',
                'notifications.email' => 'sometimes|boolean',
                'notifications.sms' => 'sometimes|boolean',
                'notifications.payment_reminders' => 'sometimes|boolean',
                'language' => 'sometimes|string|max:10',
                'timezone' => 'sometimes|string|max:50',
                'currency_display' => 'sometimes|string|max:10',
                'payment_reminder_days' => 'sometimes|integer|min:1|max:30'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $currentPreferences = $client->preferences ? json_decode($client->preferences, true) : [];
            $newPreferences = array_merge($currentPreferences, $request->all());
            
            $client->preferences = json_encode($newPreferences);
            $client->save();

            return response()->json([
                'success' => true,
                'message' => 'Preferences updated successfully',
                'data' => $newPreferences
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to update preferences: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get client preferences
     */
    public function getPreferences()
    {
        try {
            $client = Auth::guard('sanctum')->user();
            
            if (!$client || !$client instanceof Client) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $preferences = $client->preferences ? json_decode($client->preferences, true) : [
                'theme' => 'light',
                'notifications' => [
                    'email' => true,
                    'sms' => true,
                    'payment_reminders' => true
                ],
                'language' => 'en',
                'timezone' => 'UTC',
                'currency_display' => 'USD',
                'payment_reminder_days' => 3
            ];

            return response()->json([
                'success' => true,
                'data' => $preferences
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch preferences: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get client payment summary
     */
    public function getPaymentSummary()
    {
        try {
            $client = Auth::guard('sanctum')->user();
            
            if (!$client || !$client instanceof Client) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get payment plans for this client
            $paymentPlans = $client->paymentPlans()
                ->with(['appliance.product', 'payments'])
                ->get();

            $summary = [
                'total_plans' => $paymentPlans->count(),
                'active_plans' => $paymentPlans->where('status', 'active')->count(),
                'completed_plans' => $paymentPlans->where('status', 'completed')->count(),
                'total_amount' => $paymentPlans->sum('total_amount_ksh'),
                'total_paid' => $paymentPlans->sum('total_paid_ksh'),
                'remaining_balance' => $paymentPlans->sum('remaining_balance_ksh'),
                'next_payment_due' => $paymentPlans->where('status', 'active')
                    ->min('next_payment_due_date')
            ];

            return response()->json([
                'success' => true,
                'data' => $summary
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch payment summary: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get M-Pesa transactions for the authenticated client
     */
    public function getMpesaTransactions(Request $request)
    {
        try {
            $client = Auth::guard('sanctum')->user();
            
            if (!$client) {
                return response()->json([
                    'success' => false,
                    'error' => 'Unauthorized'
                ], 401);
            }

            // Get query parameters for filtering
            $status = $request->query('status'); // 'successful', 'failed', 'all'
            $perPage = $request->query('per_page', 10);
            $page = $request->query('page', 1);

            // Base query for M-Pesa transactions related to this client
            $query = \App\Models\MpesaTransaction::query()
                ->join('payment_orders', 'mpesa_transactions.checkout_request_id', '=', 'payment_orders.checkout_request_id')
                ->where('payment_orders.client_id', $client->id)
                ->select([
                    'mpesa_transactions.*',
                    'payment_orders.order_reference',
                    'payment_orders.customer_name',
                    'payment_orders.product_name',
                    'payment_orders.payment_type',
                    'payment_orders.paid_amount as order_amount'
                ])
                ->orderBy('mpesa_transactions.created_at', 'desc');

            // Apply status filter
            if ($status === 'successful') {
                $query->where('mpesa_transactions.result_code', 0);
            } elseif ($status === 'failed') {
                $query->where('mpesa_transactions.result_code', '!=', 0);
            }
            // 'all' or no status filter shows everything

            $transactions = $query->paginate($perPage, ['*'], 'page', $page);

            // Format the results
            $formattedTransactions = $transactions->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'order_reference' => $transaction->order_reference,
                    'product_name' => $transaction->product_name,
                    'payment_type' => $transaction->payment_type,
                    'amount' => $transaction->amount ?? $transaction->order_amount,
                    'mpesa_receipt_number' => $transaction->mpesa_receipt_number,
                    'phone_number' => $transaction->phone_number,
                    'result_code' => $transaction->result_code,
                    'result_desc' => $transaction->result_desc,
                    'transaction_date' => $transaction->transaction_date,
                    'status' => $transaction->result_code == 0 ? 'successful' : 'failed',
                    'status_label' => $transaction->result_code == 0 ? 'Successful' : 'Failed',
                    'created_at' => $transaction->created_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedTransactions,
                'pagination' => [
                    'current_page' => $transactions->currentPage(),
                    'last_page' => $transactions->lastPage(),
                    'per_page' => $transactions->perPage(),
                    'total' => $transactions->total(),
                    'from' => $transactions->firstItem(),
                    'to' => $transactions->lastItem(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch M-Pesa transactions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get payment orders for the authenticated client
     */
    public function getPaymentOrders(Request $request)
    {
        try {
            $client = Auth::guard('sanctum')->user();
            
            if (!$client) {
                return response()->json([
                    'success' => false,
                    'error' => 'Unauthorized'
                ], 401);
            }

            $status = $request->query('status'); // 'pending', 'completed', 'failed', 'all'
            $perPage = $request->query('per_page', 10);
            $page = $request->query('page', 1);

            $query = \App\Models\PaymentOrder::where('client_id', $client->id)
                ->orderBy('created_at', 'desc');

            // Apply status filter
            if ($status && $status !== 'all') {
                $query->where('status', $status);
            }

            $orders = $query->paginate($perPage, ['*'], 'page', $page);

            // Format the results
            $formattedOrders = $orders->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_reference' => $order->order_reference,
                    'product_name' => $order->product_name,
                    'payment_type' => $order->payment_type,
                    'paid_amount' => $order->paid_amount,
                    'plan_type' => $order->plan_type,
                    'status' => $order->status,
                    'status_label' => ucfirst($order->status),
                    'mpesa_receipt_number' => $order->mpesa_receipt_number,
                    'payment_completed_at' => $order->payment_completed_at,
                    'created_at' => $order->created_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedOrders,
                'pagination' => [
                    'current_page' => $orders->currentPage(),
                    'last_page' => $orders->lastPage(),
                    'per_page' => $orders->perPage(),
                    'total' => $orders->total(),
                    'from' => $orders->firstItem(),
                    'to' => $orders->lastItem(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch payment orders: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get PayBill transactions for authenticated client
     */
    public function getPaybillTransactions(Request $request)
    {
        try {
            $client = auth('sanctum')->user();
            
            if (!$client) {
                return response()->json([
                    'success' => false,
                    'error' => 'Unauthenticated'
                ], 401);
            }

            // Query parameters
            $page = $request->get('page', 1);
            $perPage = min($request->get('per_page', 10), 50); // Max 50 per page
            $status = $request->get('status'); // 'pending', 'processed', 'failed'
            $paymentType = $request->get('payment_type'); // 'down_payment', 'installment', etc.
            $days = $request->get('days'); // Filter by recent days

            $query = \App\Models\PaybillTransaction::forClient($client->id)
                ->with(['appliance', 'paymentOrder', 'paymentPlan'])
                ->orderBy('created_at', 'desc');

            // Apply filters
            if ($status) {
                $query->where('status', $status);
            }

            if ($paymentType) {
                $query->byPaymentType($paymentType);
            }

            if ($days) {
                $query->recent($days);
            }

            $transactions = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => [
                    'transactions' => $transactions->items(),
                    'pagination' => [
                        'current_page' => $transactions->currentPage(),
                        'last_page' => $transactions->lastPage(),
                        'per_page' => $transactions->perPage(),
                        'total' => $transactions->total(),
                        'from' => $transactions->firstItem(),
                        'to' => $transactions->lastItem(),
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching PayBill transactions:', [
                'client_id' => auth('sanctum')->id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch PayBill transactions'
            ], 500);
        }
    }

    /**
     * Get PayBill transaction summary for authenticated client
     */
    public function getPaybillTransactionSummary(Request $request)
    {
        try {
            $client = auth('sanctum')->user();
            
            if (!$client) {
                return response()->json([
                    'success' => false,
                    'error' => 'Unauthenticated'
                ], 401);
            }

            $days = $request->get('days', 30); // Default to 30 days

            // Get summary statistics
            $totalTransactions = \App\Models\PaybillTransaction::getCountForClient($client->id);
            $totalAmount = \App\Models\PaybillTransaction::getTotalForClient($client->id);
            $recentTransactions = \App\Models\PaybillTransaction::getCountForClient($client->id, $days);
            $recentAmount = \App\Models\PaybillTransaction::getTotalForClient($client->id, $days);

            // Get status breakdown
            $statusBreakdown = \App\Models\PaybillTransaction::forClient($client->id)
                ->selectRaw('status, COUNT(*) as count, SUM(trans_amount) as total_amount')
                ->groupBy('status')
                ->get()
                ->keyBy('status');

            // Get payment type breakdown
            $paymentTypeBreakdown = \App\Models\PaybillTransaction::forClient($client->id)
                ->processed()
                ->selectRaw('payment_type, COUNT(*) as count, SUM(trans_amount) as total_amount')
                ->groupBy('payment_type')
                ->get()
                ->keyBy('payment_type');

            // Get recent transactions for quick view
            $recentTransactionsList = \App\Models\PaybillTransaction::getRecentTransactionsForClient($client->id, 5);

            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => [
                        'total_transactions' => $totalTransactions,
                        'total_amount' => $totalAmount,
                        'recent_transactions' => $recentTransactions,
                        'recent_amount' => $recentAmount,
                        'period_days' => $days
                    ],
                    'status_breakdown' => $statusBreakdown,
                    'payment_type_breakdown' => $paymentTypeBreakdown,
                    'recent_transactions' => $recentTransactionsList
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching PayBill transaction summary:', [
                'client_id' => auth('sanctum')->id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch PayBill transaction summary'
            ], 500);
        }
    }

    /**
     * Get specific PayBill transaction details
     */
    public function getPaybillTransaction($transactionId)
    {
        try {
            $client = auth('sanctum')->user();
            
            if (!$client) {
                return response()->json([
                    'success' => false,
                    'error' => 'Unauthenticated'
                ], 401);
            }

            $transaction = \App\Models\PaybillTransaction::forClient($client->id)
                ->with(['appliance', 'paymentOrder', 'paymentPlan'])
                ->find($transactionId);

            if (!$transaction) {
                return response()->json([
                    'success' => false,
                    'error' => 'Transaction not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $transaction
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching PayBill transaction details:', [
                'client_id' => auth('sanctum')->id(),
                'transaction_id' => $transactionId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch transaction details'
            ], 500);
        }
    }
} 