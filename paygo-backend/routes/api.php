<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientAuthController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminProfileController;
use App\Http\Controllers\Api\ClientProfileController;
use App\Http\Controllers\Api\AdminDashboardController;
use Illuminate\Support\Facades\Hash;

// Test client creation directly
Route::get('/test-create-client', function () {
    try {
        // Delete existing client
        App\Models\Client::where('email', 'client@example.com')->delete();
        
        // Create new client
        $client = App\Models\Client::create([
            'client_code' => 'CL001',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'client@example.com',
            'phone' => '+254123456789',
            'password_hash' => Hash::make('client123'),
            'payment_plan' => 'weekly',
            'address' => '123 Test Street',
            'location' => 'Nairobi, Kenya',
            'is_active' => true,
        ]);
        
        return response()->json([
            'message' => 'Client created successfully',
            'client' => $client->only(['id', 'client_code', 'email', 'first_name', 'last_name']),
            'password_check' => Hash::check('client123', $client->password_hash)
        ]);
        
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

// Debug endpoint for testing client authentication
Route::get('/debug-client-auth', function (Request $request) {
    try {
        $authHeader = $request->header('Authorization');
        $token = null;
        
        if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
            $token = substr($authHeader, 7);
        }
        
        $response = [
            'has_auth_header' => !!$authHeader,
            'token_provided' => !!$token,
            'token_length' => $token ? strlen($token) : 0,
        ];
        
        if ($token) {
            // Check if token exists in personal_access_tokens table
            $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
            $response['token_found_in_db'] = !!$accessToken;
            
            if ($accessToken) {
                $response['token_model_type'] = $accessToken->tokenable_type;
                $response['token_model_id'] = $accessToken->tokenable_id;
                
                // Try to load the model
                $model = $accessToken->tokenable;
                $response['model_loaded'] = !!$model;
                
                if ($model) {
                    $response['model_class'] = get_class($model);
                    $response['model_data'] = $model->only(['id', 'email', 'first_name', 'last_name']);
                }
            }
        }
        
        return response()->json($response);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

// Create admin user
Route::get('/create-admin', function () {
    try {
        $admin = new App\Models\AdminUser();
        $admin->email = 'admin@koyo.com';
        $admin->password_hash = Hash::make('admin123');
        $admin->first_name = 'Admin';
        $admin->last_name = 'User';
        $admin->role = 'admin';
        $admin->is_active = true;
        $admin->save();
        
        return response()->json(['message' => 'Admin created', 'admin' => $admin->only(['id', 'email', 'first_name'])]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

// Create client user
Route::get('/create-client', function () {
    try {
        $client = new App\Models\Client();
        $client->client_code = 'CL001';
        $client->first_name = 'John';
        $client->last_name = 'Doe';
        $client->email = 'client@example.com';
        $client->phone = '+254123456789';
        $client->password_hash = Hash::make('client123');
        $client->payment_plan = 'weekly';
        $client->address = '123 Test Street';
        $client->location = 'Nairobi, Kenya';
        $client->is_active = true;
        $client->save();
        
        return response()->json(['message' => 'Client created', 'client' => $client->only(['id', 'client_code', 'email', 'first_name'])]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});



// User Authentication (for testing/backward compatibility)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Client Authentication
Route::prefix('client')->group(function () {
    Route::post('/register', [ClientAuthController::class, 'register']);
    Route::post('/login', [ClientAuthController::class, 'login']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [ClientAuthController::class, 'logout']);
        Route::get('/profile', [ClientAuthController::class, 'profile']);
        Route::put('/profile', [ClientAuthController::class, 'updateProfile']);
        
        // Client Profile Management
        Route::get('/profile-details', [ClientProfileController::class, 'getProfile']);
        Route::put('/profile-details', [ClientProfileController::class, 'updateProfile']);
        Route::post('/change-password', [ClientProfileController::class, 'changePassword']);
        Route::get('/preferences', [ClientProfileController::class, 'getPreferences']);
        Route::put('/preferences', [ClientProfileController::class, 'updatePreferences']);
        Route::get('/payment-summary', [ClientProfileController::class, 'getPaymentSummary']);
    });
});



// Admin Authentication
Route::prefix('admin')->group(function () {
    Route::post('/register', [AdminAuthController::class, 'register']);
    Route::post('/login', [AdminAuthController::class, 'login']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AdminAuthController::class, 'logout']);
        Route::get('/profile', [AdminAuthController::class, 'profile']);
        
        // Admin Profile Management
        Route::get('/profile-details', [AdminProfileController::class, 'getProfile']);
        Route::put('/profile-details', [AdminProfileController::class, 'updateProfile']);
        Route::post('/change-password', [AdminProfileController::class, 'changePassword']);
        Route::get('/preferences', [AdminProfileController::class, 'getPreferences']);
        Route::put('/preferences', [AdminProfileController::class, 'updatePreferences']);
        
        // Admin Dashboard Analytics
        Route::get('/dashboard/stats', [AdminDashboardController::class, 'getDashboardStats']);
        Route::get('/dashboard/clients', [AdminDashboardController::class, 'getClientStatistics']);
        Route::get('/dashboard/revenue', [AdminDashboardController::class, 'getRevenueStatistics']);
        Route::get('/dashboard/appliances', [AdminDashboardController::class, 'getApplianceStatistics']);
    });
});

// Protected routes (requires authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
}); 