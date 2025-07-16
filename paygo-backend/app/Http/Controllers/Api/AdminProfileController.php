<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AdminProfileController extends Controller
{
    /**
     * Get admin profile information
     */
    public function getProfile()
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $admin->id,
                    'username' => $admin->username,
                    'email' => $admin->email,
                    'full_name' => $admin->full_name,
                    'role' => $admin->role,
                    'phone' => $admin->phone,
                    'department' => $admin->department,
                    'status' => $admin->status,
                    'last_login' => $admin->last_login,
                    'created_at' => $admin->created_at,
                    'preferences' => $admin->preferences ? json_decode($admin->preferences, true) : []
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
     * Update admin profile information
     */
    public function updateProfile(Request $request)
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $validator = Validator::make($request->all(), [
                'username' => 'sometimes|string|max:255|unique:admin_users,username,' . $admin->id,
                'email' => 'sometimes|email|max:255|unique:admin_users,email,' . $admin->id,
                'full_name' => 'sometimes|string|max:255',
                'phone' => 'sometimes|string|max:20',
                'department' => 'sometimes|string|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $admin->update($request->only(['username', 'email', 'full_name', 'phone', 'department']));

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => [
                    'id' => $admin->id,
                    'username' => $admin->username,
                    'email' => $admin->email,
                    'full_name' => $admin->full_name,
                    'role' => $admin->role,
                    'phone' => $admin->phone,
                    'department' => $admin->department,
                    'status' => $admin->status
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
     * Change admin password
     */
    public function changePassword(Request $request)
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
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
            if (!Hash::check($request->current_password, $admin->password_hash)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Current password is incorrect'
                ], 422);
            }

            // Update password
            $admin->password_hash = Hash::make($request->new_password);
            $admin->save();

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
     * Update admin preferences
     */
    public function updatePreferences(Request $request)
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $validator = Validator::make($request->all(), [
                'theme' => 'sometimes|string|in:light,dark,auto',
                'notifications' => 'sometimes|array',
                'notifications.email' => 'sometimes|boolean',
                'notifications.push' => 'sometimes|boolean',
                'notifications.sms' => 'sometimes|boolean',
                'language' => 'sometimes|string|max:10',
                'timezone' => 'sometimes|string|max:50',
                'dashboard_layout' => 'sometimes|string|in:grid,list',
                'items_per_page' => 'sometimes|integer|min:10|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $currentPreferences = $admin->preferences ? json_decode($admin->preferences, true) : [];
            $newPreferences = array_merge($currentPreferences, $request->all());
            
            $admin->preferences = json_encode($newPreferences);
            $admin->save();

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
     * Get admin preferences
     */
    public function getPreferences()
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $preferences = $admin->preferences ? json_decode($admin->preferences, true) : [
                'theme' => 'light',
                'notifications' => [
                    'email' => true,
                    'push' => true,
                    'sms' => false
                ],
                'language' => 'en',
                'timezone' => 'UTC',
                'dashboard_layout' => 'grid',
                'items_per_page' => 25
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
} 