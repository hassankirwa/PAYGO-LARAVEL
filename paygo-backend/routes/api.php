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
use App\Http\Controllers\Api\MpesaC2BController;
use App\Http\Controllers\Api\VisaPaymentController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\SettingsController;
use Illuminate\Support\Facades\Hash;
use App\Http\Controllers\Api\OngoingPaymentController;
use App\Http\Controllers\DeviceController;


Route::prefix('admin/mqtt/devices')->middleware('auth:api')->group(function () {
    Route::get('/overview', [DeviceController::class, 'getOverview']);
});

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

// Get API configuration including base URL
Route::get('/config', function () {
    try {
        $config = \App\Models\SystemSetting::getApiConfig();
        
        // Ensure the base URL ends with /api
        $baseUrl = rtrim($config['base_url'], '/');
        if (!str_ends_with($baseUrl, '/api')) {
            $baseUrl .= '/api';
        }
        
        return response()->json([
            'success' => true,
            'api_base_url' => $baseUrl,
            'config' => [
                'timeout' => $config['timeout'],
                'rate_limit' => $config['rate_limit'],
                'environment' => $config['environment'],
            ],
            'timestamp' => now(),
        ]);
    } catch (\Exception $e) {
        \Illuminate\Support\Facades\Log::error('API config error: ' . $e->getMessage());
        
        // Fallback response
        return response()->json([
            'success' => true,
            'api_base_url' => url('/api'),
            'config' => [
                'timeout' => 30,
                'rate_limit' => 1000,
                'environment' => app()->environment(),
            ],
            'timestamp' => now(),
            'fallback' => true,
        ]);
    }
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
    
    Route::middleware('auth:sanctum')->group(function () {
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
    Route::middleware('auth:sanctum')->group(function () {
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
    
    // M-Pesa Payments and Transactions
    Route::get('/mpesa-transactions', [ClientProfileController::class, 'getMpesaTransactions']);
    Route::get('/payment-orders', [ClientProfileController::class, 'getPaymentOrders']);
    
    // PayBill Transactions
    Route::get('/paybill-transactions', [ClientProfileController::class, 'getPaybillTransactions']);
    Route::get('/paybill-transactions/summary', [ClientProfileController::class, 'getPaybillTransactionSummary']);
    Route::get('/paybill-transactions/{transactionId}', [ClientProfileController::class, 'getPaybillTransaction']);
    
    // Subscription Management
    Route::get('/subscriptions', [\App\Http\Controllers\Api\Client\SubscriptionController::class, 'index']);
    Route::get('/subscriptions/{deviceId}/countdown', [\App\Http\Controllers\Api\Client\SubscriptionController::class, 'getCountdown']);
    Route::get('/subscriptions/summary', [\App\Http\Controllers\Api\Client\SubscriptionController::class, 'getSummary']);
    
    // Dashboard Stats & Real-time Data
    Route::get('/dashboard/stats', [\App\Http\Controllers\Api\Client\DashboardController::class, 'getStats']);
    Route::get('/dashboard/payments', [\App\Http\Controllers\Api\Client\DashboardController::class, 'getPayments']);
    Route::get('/dashboard/renewal-options', [\App\Http\Controllers\Api\Client\DashboardController::class, 'getRenewalOptions']);
});

// ==============================================
// CLIENT PUBLIC ROUTES (No Auth Required)
// ==============================================
Route::prefix('client')->group(function () {
    // PayBill Validation and Confirmation (accessible from frontend without auth)
    Route::post('/validation', [MpesaC2BController::class, 'handleValidation']);
    Route::post('/confirmation', [MpesaC2BController::class, 'handleConfirmation']);
});

// ==============================================
// ADMIN DASHBOARD ROUTES (Protected)
// ==============================================
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'getDashboardStats']);
    Route::get('/analytics/revenue', [AdminDashboardController::class, 'getRevenueAnalytics']);
    Route::get('/analytics/customers', [AdminDashboardController::class, 'getCustomerAnalytics']);
    Route::get('/analytics/devices', [AdminDashboardController::class, 'getDeviceAnalytics']);
    Route::get('/analytics/payments', [AdminDashboardController::class, 'getPaymentAnalytics']);
    
    // Appliance Management
    Route::get('/appliances', [AdminDashboardController::class, 'getAppliances']);
    Route::get('/appliances/{id}', [AdminDashboardController::class, 'getAppliance']);
    Route::put('/appliances/{id}/status', [AdminDashboardController::class, 'updateApplianceStatus']);
    Route::post('/appliances/{id}/toggle-power', [AdminDashboardController::class, 'toggleAppliancePower']);
    Route::post('/appliances/{id}/sync', [AdminDashboardController::class, 'syncApplianceStatus']);
    
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
    Route::get('/', [ProductController::class, 'adminIndex']); // List all products for admin (including inactive)
    Route::post('/', [ProductController::class, 'store']); // Create product
    Route::get('/{product}', [ProductController::class, 'show']); // View product details
    Route::put('/{product}', [ProductController::class, 'update']); // Update product
    Route::delete('/{product}', [ProductController::class, 'destroy']); // Delete product
});

// ==============================================
// M-PESA PAYMENT ROUTES
// ==============================================

// M-Pesa STK Push and utility routes
Route::prefix('mpesa')->group(function () {
    // Debug and configuration routes
    Route::get('config-status', [MpesaController::class, 'getConfigStatus']); // Check M-Pesa configuration status
    
    // STK Push routes
    Route::post('stk-push', [MpesaController::class, 'stkPush']); // Initiate STK Push
    Route::post('stk-query', [MpesaController::class, 'stkQuery']); // Query STK Push status
    Route::post('stk-callback', [MpesaController::class, 'stkCallback']); // STK Push callback (called by Safaricom)
    
    // Payment Order routes
    Route::post('create-payment-order', [MpesaController::class, 'createPaymentOrder']); // Create payment order
    Route::post('payment-order-status', [MpesaController::class, 'getPaymentOrderStatus']); // Get payment order status
    
    // Paybill Validation and Confirmation (called by Safaricom)
    Route::post('validation', [MpesaC2BController::class, 'handleValidation']); // M-Pesa paybill validation callback
    Route::post('confirmation', [MpesaC2BController::class, 'processPaymentsReceived']); // M-Pesa paybill confirmation callback
    
    // C2B Transaction monitoring endpoints (for frontend)
    Route::get('c2b-transactions', [MpesaC2BController::class, 'getC2BTransactions']); // Get C2B transactions
    Route::get('check-transaction', [MpesaC2BController::class, 'checkRecentTransaction']); // Check for recent transaction
    
    // Utility routes
    Route::post('access-token', [MpesaController::class, 'generateAccessToken']); // Generate access token
    Route::post('password', [MpesaController::class, 'generatePassword']); // Generate password and timestamp
});

// M-Pesa URL Registration (for setting up PayBill with Safaricom)
Route::prefix('mpesa')->group(function () {
    Route::post('register-urls', [App\Http\Controllers\Api\MpesaUrlRegistrationController::class, 'registerUrls']);
    Route::get('test-endpoints', [App\Http\Controllers\Api\MpesaUrlRegistrationController::class, 'testEndpoints']);
    Route::get('registration-status', [App\Http\Controllers\Api\MpesaUrlRegistrationController::class, 'getRegistrationStatus']);
});

// ==============================================
// VISA/MASTERCARD PAYMENT ROUTES
// ==============================================

// Visa/Mastercard payment processing routes
Route::prefix('visa')->group(function () {
    // Payment processing
    Route::post('process-payment', [VisaPaymentController::class, 'processPayment']); // Process card payment
    Route::post('validate-card', [VisaPaymentController::class, 'validateCard']); // Validate card details
    
    // Information and receipts
    Route::get('supported-cards', [VisaPaymentController::class, 'getSupportedCards']); // Get supported card types
    Route::get('receipt/{paymentId}', [VisaPaymentController::class, 'getReceipt']); // Get payment receipt
});

// Legacy STS routes (keeping for backward compatibility if needed)
Route::prefix('sts')->group(function () {
    Route::post('access/token', [MpesaController::class, 'generateAccessToken']);
    Route::post('password/generate', [MpesaController::class, 'generatePassword']);
});

// Ongoing Payment Routes (Authenticated Client)
Route::middleware('auth:sanctum')->prefix('ongoing-payments')->group(function () {
    Route::get('/plan-details', [OngoingPaymentController::class, 'getPaymentPlanDetails']);
    Route::post('/check-status', [OngoingPaymentController::class, 'checkPaymentStatus']);
    Route::post('/record-manual', [OngoingPaymentController::class, 'recordManualPayment']);
    Route::get('/history', [OngoingPaymentController::class, 'getPaymentHistory']);
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

    // Admin MQTT & IoT Management Routes
    Route::prefix('admin/mqtt')->group(function () {
        Route::get('/config', [\App\Http\Controllers\Api\MqttController::class, 'getConfig']); // Get MQTT settings
        Route::post('/config', [\App\Http\Controllers\Api\MqttController::class, 'updateConfig']); // Update MQTT settings

        
        // Device Management
        Route::get('/devices-overview', [\App\Http\Controllers\Api\MqttController::class, 'getDeviceOverview']); // Device statistics
        Route::post('/devices/manual-start', [\App\Http\Controllers\Api\MqttController::class, 'startDevice']); // Manual start device
        Route::post('/devices/manual-stop', [\App\Http\Controllers\Api\MqttController::class, 'stopDevice']); // Manual stop device
        Route::post('/devices/status', [\App\Http\Controllers\Api\MqttController::class, 'checkDeviceStatus']); // Check device status
        
        // Device Creation & Registration
        Route::post('/devices/create', [\App\Http\Controllers\Api\MqttController::class, 'createDevice']); // Create new device
        Route::get('/devices/products', [\App\Http\Controllers\Api\MqttController::class, 'getProductsForDevice']); // Get products list
        Route::get('/devices/clients', [\App\Http\Controllers\Api\MqttController::class, 'getClientsForDevice']); // Get clients list
    });
});

// ==============================================
// M-PESA C2B Tutorial ROUTES
// ==============================================
Route::prefix('sts')->group(function () {
    Route::post('access/token', [MpesaC2BController::class, 'generateAccessToken']);
    Route::post('password/generate', [MpesaC2BController::class, 'generatePassword']);
    Route::post('confirmation', [MpesaC2BController::class, 'mpesaConfirmation']);
    Route::post('validation', [MpesaC2BController::class, 'mpesaValidation']);
    Route::post('register/urls', [MpesaC2BController::class, 'mpesaRegisterUrls']);
    
    // C2B Testing and Simulation Routes
    Route::post('simulate-payment', [MpesaC2BController::class, 'simulateC2BPayment']);
    Route::get('recent-transactions', [MpesaC2BController::class, 'getRecentTransactions']);
    Route::any('debug-request', [MpesaC2BController::class, 'debugRequest']); // Debug any HTTP method
});

// ==============================================
// RECEIPT ROUTES
// ==============================================
Route::prefix('receipts')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\ReceiptController::class, 'listReceipts']);
    Route::get('/{receiptNumber}', [\App\Http\Controllers\Api\ReceiptController::class, 'getReceipt']);
    Route::get('/{receiptNumber}/download', [\App\Http\Controllers\Api\ReceiptController::class, 'downloadReceipt']);
    Route::get('/{receiptNumber}/preview', [\App\Http\Controllers\Api\ReceiptController::class, 'previewReceipt']);
});

// Client receipts route (authenticated)
Route::middleware('auth:sanctum')->prefix('client')->group(function () {
    Route::get('/receipts', [\App\Http\Controllers\Api\ReceiptController::class, 'getClientReceipts']);
});

// Admin receipts routes
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/receipts', [\App\Http\Controllers\Api\ReceiptController::class, 'getAllReceipts']);
    Route::put('/receipts/{receiptNumber}/status', [\App\Http\Controllers\Api\ReceiptController::class, 'updateReceiptStatus']);
    Route::put('/receipts/bulk-status', [\App\Http\Controllers\Api\ReceiptController::class, 'bulkUpdateStatus']);
});