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
                    'id_number' => $client->id_number,
                    'id_type' => $client->id_type,
                    'occupation' => $client->occupation,
                    'monthly_income_range' => $client->monthly_income_range,
                    'business_type' => $client->business_type,
                    'paygo_score' => $client->paygo_score,
                    'status' => $client->status,
                    'registration_date' => $client->registration_date,
                    'last_login' => $client->last_login,
                    'preferences' => $client->preferences ? json_decode($client->preferences, true) : []
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch profile: ' . $e->getMessage()
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
                'total_amount' => $paymentPlans->sum('total_amount_usd'),
                'total_paid' => $paymentPlans->sum('total_paid_usd'),
                'remaining_balance' => $paymentPlans->sum('remaining_balance_usd'),
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
} 