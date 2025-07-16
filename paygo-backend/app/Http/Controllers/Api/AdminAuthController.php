<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AdminAuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|string|email|max:255|unique:admin_users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:super_admin,admin,support',
        ]);

        $admin = AdminUser::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password_hash' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        $token = $admin->createToken('admin_auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Admin registration successful',
            'token' => $token,
            'admin' => $admin,
            'user_type' => 'admin'
        ]);
    }

    public function login(Request $request)
    {
        try {
            // Validate input
            $validated = $request->validate([
                'email' => 'required|string|email',
                'password' => 'required|string',
            ]);

            // Find admin by email
            $admin = AdminUser::where('email', $validated['email'])->first();

            if (!$admin) {
                return response()->json([
                    'message' => 'Invalid credentials.',
                    'errors' => ['email' => ['Invalid credentials.']]
                ], 401);
            }

            // Check password
            if (!Hash::check($validated['password'], $admin->password_hash)) {
                return response()->json([
                    'message' => 'Invalid credentials.',
                    'errors' => ['email' => ['Invalid credentials.']]
                ], 401);
            }

            // Check if account is active
            if (!$admin->is_active) {
                return response()->json([
                    'message' => 'Account is suspended.',
                    'errors' => ['email' => ['Account is suspended. Please contact super admin.']]
                ], 401);
            }

            // Revoke old tokens
            $admin->tokens()->delete();
            
            // Create new token
            $token = $admin->createToken('admin_auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Admin login successful',
                'token' => $token,
                'admin' => $admin->only(['id', 'email', 'first_name', 'last_name', 'role']),
                'user_type' => 'admin'
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Admin login error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred during login.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Admin logged out successfully']);
    }

    public function profile(Request $request)
    {
        return response()->json([
            'admin' => $request->user()
        ]);
    }
}
