<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientAuthController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminProfileController;
use App\Http\Controllers\Api\ClientProfileController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PayGoPlanController;
use App\Http\Controllers\Api\MpesaController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\SettingsController;
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
Route::get('/test-auth', function () {
    $client = App\Models\Client::where('email', 'client@example.com')->first();
    
    if (!$client) {
        return response()->json(['error' => 'Client not found'], 404);
    }
    
    return response()->json([
        'client' => $client,
        'password_check' => Hash::check('client123', $client->password_hash),
        'has_tokens' => $client->tokens()->count()
    ]);
});

// Test login for debugging
Route::post('/test-login', function (Request $request) {
    $request->validate([
        'email' => 'required|string|email',
        'password' => 'required|string',
    ]);

    $client = App\Models\Client::where('email', $request->email)->first();

    if (!$client) {
        return response()->json(['error' => 'Client not found'], 404);
    }

    $passwordCheck = Hash::check($request->password, $client->password_hash);
    
    return response()->json([
        'client_found' => true,
        'password_correct' => $passwordCheck,
        'stored_hash' => $client->password_hash,
        'is_active' => $client->is_active,
        'client' => $client
    ]);
});

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'environment' => app()->environment()
    ]);
});

// Root API info
Route::get('/', function () {
    return response()->json([
        'name' => 'KOYO PayGo Platform API',
        'version' => '1.0.0',
        'environment' => app()->environment(),
        'timestamp' => now()
    ]);
});

// ==============================================
// AUTHENTICATION ROUTES
// ==============================================

// Client Authentication
Route::prefix('client')->group(function () {
    Route::post('/register', [ClientAuthController::class, 'register']);
    Route::post('/login', [ClientAuthController::class, 'login']);
    
    // Protected client routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [ClientAuthController::class, 'logout']);
        Route::get('/profile', [ClientAuthController::class, 'profile']);
        Route::put('/profile', [ClientAuthController::class, 'updateProfile']);
    });
});

// Admin Authentication
Route::prefix('admin')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login']);
    Route::post('/register', [AdminAuthController::class, 'register']);
    
    // Protected admin routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AdminAuthController::class, 'logout']);
        Route::get('/profile', [AdminAuthController::class, 'profile']);
        Route::put('/profile', [AdminAuthController::class, 'updateProfile']);
    });
});

// ==============================================
// CLIENT AUTHENTICATION ROUTES
// ==============================================
Route::prefix('client')->group(function () {
    Route::post('/login', [ClientAuthController::class, 'login']);
    Route::post('/register', [ClientAuthController::class, 'register']);
    
    Route::middleware('auth:client')->group(function () {
        Route::post('/logout', [ClientAuthController::class, 'logout']);
        Route::get('/profile', [ClientProfileController::class, 'getProfile']);
        Route::put('/profile', [ClientProfileController::class, 'updateProfile']);
        Route::post('/upload-avatar', [ClientProfileController::class, 'uploadAvatar']);
    });
});

// ==============================================
// CUSTOMER KYC ROUTES (Story 3 Implementation)
// ==============================================
Route::prefix('customer')->group(function () {
    // Customer registration (Story 3.1) - Public route for initial registration
    Route::post('/register', [CustomerController::class, 'register']);
    
    // Protected KYC routes - require authentication
    Route::middleware('auth:client')->group(function () {
        // Personal Information Collection (Story 3.2)
        Route::put('/personal-info', [CustomerController::class, 'updatePersonalInfo']);
        
        // Business Information Collection (Story 3.3)
        Route::put('/business-info', [CustomerController::class, 'updateBusinessInfo']);
        
        // Reference and Emergency Contacts (Story 3.4)
        Route::put('/contacts', [CustomerController::class, 'updateContacts']);
        
        // Document Upload and Verification (Story 3.6)
        Route::post('/documents', [CustomerController::class, 'uploadDocuments']);
        
        // KYC Status and Progress Tracking
        Route::get('/kyc-status', [CustomerController::class, 'getKycStatus']);
        Route::post('/submit-kyc', [CustomerController::class, 'submitForReview']);
    });
});

// ==============================================
// CLIENT PROFILE ROUTES (Protected)
// ==============================================
Route::middleware('auth:sanctum')->prefix('client')->group(function () {
    Route::get('/dashboard-data', [ClientProfileController::class, 'getDashboardData']);
    Route::get('/appliances', [ClientProfileController::class, 'getAppliances']);
    Route::get('/payment-plans', [ClientProfileController::class, 'getPaymentPlans']);
    Route::get('/payment-history', [ClientProfileController::class, 'getPaymentHistory']);
    Route::get('/payment-summary', [ClientProfileController::class, 'getPaymentSummary']);
    Route::put('/preferences', [ClientProfileController::class, 'updatePreferences']);
    Route::post('/upload-avatar', [ClientProfileController::class, 'uploadAvatar']);
});

// ==============================================
// ADMIN DASHBOARD ROUTES (Protected)
// ==============================================
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'getDashboardData']);
    Route::get('/analytics/revenue', [AdminDashboardController::class, 'getRevenueAnalytics']);
    Route::get('/analytics/customers', [AdminDashboardController::class, 'getCustomerAnalytics']);
    Route::get('/analytics/devices', [AdminDashboardController::class, 'getDeviceAnalytics']);
    Route::get('/analytics/payments', [AdminDashboardController::class, 'getPaymentAnalytics']);
    
    // Profile management
    Route::get('/profile', [AdminProfileController::class, 'getProfile']);
    Route::put('/profile', [AdminProfileController::class, 'updateProfile']);
    Route::post('/upload-avatar', [AdminProfileController::class, 'uploadAvatar']);
});

// ==============================================
// PRODUCT CATALOG ROUTES (Public)
// ==============================================
Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']); // Browse products with filters
    Route::get('/categories', [ProductController::class, 'categories']); // Get product categories
    Route::get('/featured', [ProductController::class, 'featured']); // Get featured products
    Route::get('/{product}', [ProductController::class, 'show']); // View product details
    Route::post('/{product}/check-availability', [ProductController::class, 'checkAvailability']); // Check availability
    
    // PayGo Plan Routes (Public access for browsing payment plans)
    Route::get('/{product}/paygo-plans', [PayGoPlanController::class, 'getPlansForProduct']); // Get all plans for product
    Route::post('/{product}/paygo-plans/calculate', [PayGoPlanController::class, 'calculateCustomPlan']); // Calculate custom plan
    Route::post('/{product}/paygo-plans/compare', [PayGoPlanController::class, 'comparePlans']); // Compare plans
    Route::post('/{product}/paygo-plans/recommendations', [PayGoPlanController::class, 'getRecommendations']); // Get recommendations
    Route::post('/{product}/paygo-plans/schedule', [PayGoPlanController::class, 'getPaymentSchedule']); // Get payment schedule
});

// PayGo Plan Global Routes (not product-specific)
Route::prefix('paygo-plans')->group(function () {
    Route::get('/settings', [PayGoPlanController::class, 'getSettings']); // Get calculator settings
    Route::post('/validate', [PayGoPlanController::class, 'validateParameters']); // Validate plan parameters
});

// Admin Product Management (Protected routes)
Route::middleware('auth:sanctum')->prefix('admin/products')->group(function () {
    Route::post('/', [ProductController::class, 'store']); // Create product
    Route::put('/{product}', [ProductController::class, 'update']); // Update product
    Route::delete('/{product}', [ProductController::class, 'destroy']); // Delete product
});

// ==============================================
// M-PESA PAYMENT ROUTES
// ==============================================

// M-Pesa STK Push and utility routes
Route::prefix('mpesa')->group(function () {
    // STK Push routes
    Route::post('stk-push', [MpesaController::class, 'stkPush']); // Initiate STK Push
    Route::post('stk-query', [MpesaController::class, 'stkQuery']); // Query STK Push status
    Route::post('stk-callback', [MpesaController::class, 'stkCallback']); // STK Push callback (called by Safaricom)
    
    // C2B routes (Buy Goods and Paybill)
    Route::post('register-urls', [MpesaController::class, 'mpesaRegisterUrls']); // Register validation and confirmation URLs
    Route::post('validation', [MpesaController::class, 'mpesaValidation']); // Validation endpoint (called by Safaricom)
    Route::post('confirmation', [MpesaController::class, 'mpesaConfirmation']); // Confirmation endpoint (called by Safaricom)
    Route::post('c2b-simulate', [MpesaController::class, 'c2bSimulate']); // C2B transaction simulation
    Route::post('c2b-till', [MpesaController::class, 'c2bTillPayment']); // C2B Till Number payment
    
    // Utility routes
    Route::post('access-token', [MpesaController::class, 'generateAccessToken']); // Generate access token
    Route::post('password', [MpesaController::class, 'generatePassword']); // Generate password and timestamp
});

// Legacy STS routes (keeping for backward compatibility if needed)
Route::prefix('sts')->group(function () {
    Route::post('access/token', [MpesaController::class, 'generateAccessToken']);
    Route::post('password/generate', [MpesaController::class, 'generatePassword']);
    Route::post('register/urls', [MpesaController::class, 'mpesaRegisterUrls']);
    Route::post('validation', [MpesaController::class, 'mpesaValidation']);
    Route::post('payment/confirmation', [MpesaController::class, 'mpesaConfirmation']);
});

// Protected routes (requires authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    // Admin Settings Routes
    Route::prefix('admin/settings')->group(function () {
        Route::get('/', [SettingsController::class, 'getSettings']); // Get all settings
        Route::get('/{category}', [SettingsController::class, 'getSettings']); // Get settings by category
        
        // M-Pesa specific routes
        Route::get('/mpesa/config', [SettingsController::class, 'getMpesaSettings']); // Get M-Pesa settings
        Route::post('/mpesa/config', [SettingsController::class, 'updateMpesaSettings']); // Update M-Pesa settings
        Route::post('/mpesa/test', [SettingsController::class, 'testMpesaConnection']); // Test M-Pesa connection
    });
}); 