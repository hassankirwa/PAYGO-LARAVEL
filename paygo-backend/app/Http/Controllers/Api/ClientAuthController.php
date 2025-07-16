<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ClientAuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|string|email|max:255|unique:clients',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:8|confirmed',
            'address' => 'nullable|string',
            'location' => 'nullable|string',
            'payment_plan' => 'required|in:weekly,monthly',
        ]);

        $client = Client::create([
            'client_code' => Client::generateClientCode(),
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password_hash' => Hash::make($request->password),
            'address' => $request->address,
            'location' => $request->location,
            'payment_plan' => $request->payment_plan,
        ]);

        $token = $client->createToken('client_auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'token' => $token,
            'client' => $client,
            'user_type' => 'client'
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $client = Client::where('email', $request->email)->first();

        if (!$client || !Hash::check($request->password, $client->password_hash)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        if (!$client->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Account is suspended. Please contact support.'],
            ]);
        }

        // Update last login
        $client->update(['last_login' => now()]);

        // Revoke old tokens
        $client->tokens()->delete();
        
        $token = $client->createToken('client_auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'client' => $client,
            'user_type' => 'client'
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function profile(Request $request)
    {
        $client = $request->user();
        
        return response()->json([
            'client' => $client,
            'appliances' => $client->appliances()->with('product')->get(),
            'payment_plans' => $client->paymentPlans()->with('appliance.product')->get(),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $client = $request->user();
        
        $request->validate([
            'first_name' => 'sometimes|required|string|max:100',
            'last_name' => 'sometimes|required|string|max:100',
            'phone' => 'sometimes|required|string|max:20',
            'address' => 'nullable|string',
            'location' => 'nullable|string',
        ]);

        $client->update($request->only([
            'first_name', 'last_name', 'phone', 'address', 'location'
        ]));

        return response()->json([
            'message' => 'Profile updated successfully',
            'client' => $client
        ]);
    }
}
