<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class SubscriptionController extends Controller
{
    /**
     * Get all subscriptions for the authenticated client
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Get authenticated user
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }

            // Find the client record for this user
            $client = Client::where('email', $user->email)
                           ->orWhere('phone', $user->phone)
                           ->first();

            if (!$client) {
                // Return empty subscriptions for authenticated users without client records
                return response()->json([
                    'success' => true,
                    'subscriptions' => [],
                    'message' => 'No client record found'
                ]);
            }

            // Get all subscriptions for this client with related data
            $subscriptions = Subscription::where('client_id', $client->id)
                ->with([
                    'appliance.product',
                    'paymentPlan',
                    'activationPayment'
                ])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($subscription) {
                    return [
                        'id' => $subscription->id,
                        'device_id' => $subscription->device_id,
                        'subscription_type' => $subscription->subscription_type,
                        'status' => $subscription->status,
                        'start_date' => $subscription->start_date->toISOString(),
                        'end_date' => $subscription->end_date->toISOString(),
                        'days_remaining' => $subscription->getDaysRemainingAttribute(),
                        'hours_remaining' => $subscription->getHoursRemainingAttribute(),
                        'progress_percentage' => $subscription->getProgressPercentageAttribute(),
                        'appliance' => [
                            'id' => $subscription->appliance->id,
                            'device_id' => $subscription->appliance->device_id,
                            'status' => $subscription->appliance->status,
                            'product' => [
                                'name' => $subscription->appliance->product->name ?? 'Unknown Product',
                                'model_code' => $subscription->appliance->product->model_code ?? 'N/A',
                            ]
                        ]
                    ];
                });

            return response()->json([
                'success' => true,
                'subscriptions' => $subscriptions,
                'client_id' => $client->id,
                'total_subscriptions' => $subscriptions->count()
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch client subscriptions', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch subscriptions',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get subscription countdown for a specific device
     */
    public function getCountdown(Request $request, string $deviceId): JsonResponse
    {
        try {
            // Get authenticated user
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }

            // Find the client record for this user
            $client = Client::where('email', $user->email)
                           ->orWhere('phone', $user->phone)
                           ->first();

            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client record not found'
                ], 404);
            }

            // Find the subscription for this device and client
            $subscription = Subscription::where('client_id', $client->id)
                ->where('device_id', $deviceId)
                ->where('status', 'active')
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$subscription) {
                return response()->json([
                    'success' => true,
                    'subscription' => null,
                    'message' => 'No active subscription found for this device'
                ]);
            }

            return response()->json([
                'success' => true,
                'subscription' => [
                    'id' => $subscription->id,
                    'status' => $subscription->status,
                    'end_date' => $subscription->end_date->toISOString(),
                    'days_remaining' => $subscription->getDaysRemainingAttribute(),
                    'hours_remaining' => $subscription->getHoursRemainingAttribute(),
                    'progress_percentage' => $subscription->getProgressPercentageAttribute(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch subscription countdown', [
                'user_id' => Auth::id(),
                'device_id' => $deviceId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch subscription countdown',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get subscription status summary for the client
     */
    public function getSummary(Request $request): JsonResponse
    {
        try {
            // Get authenticated user
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }

            // Find the client record for this user
            $client = Client::where('email', $user->email)
                           ->orWhere('phone', $user->phone)
                           ->first();

            if (!$client) {
                return response()->json([
                    'success' => true,
                    'summary' => [
                        'total' => 0,
                        'active' => 0,
                        'expired' => 0,
                        'suspended' => 0,
                        'expiring_soon' => 0
                    ]
                ]);
            }

            // Get subscription counts by status
            $subscriptions = Subscription::where('client_id', $client->id);
            
            $summary = [
                'total' => $subscriptions->count(),
                'active' => $subscriptions->clone()->where('status', 'active')->count(),
                'expired' => $subscriptions->clone()->where('status', 'expired')->count(),
                'suspended' => $subscriptions->clone()->where('status', 'suspended')->count(),
                'expiring_soon' => $subscriptions->clone()
                    ->where('status', 'active')
                    ->where('end_date', '<=', now()->addDays(3))
                    ->count()
            ];

            return response()->json([
                'success' => true,
                'summary' => $summary
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch subscription summary', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch subscription summary',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}
