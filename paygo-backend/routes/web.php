<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Models\SystemSetting;
use App\Http\Controllers\Api\MpesaController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

// Test route for M-Pesa configuration
Route::get('/test-mpesa', function () {
    $config = SystemSetting::getMpesaConfig();
    
    return response()->json([
        'message' => 'M-Pesa Configuration Test',
        'environment' => $config['environment'],
        'shortcode' => $config['shortcode'],
        'has_credentials' => !empty($config['consumer_key']) && !empty($config['consumer_secret']),
        'callback_url' => $config['callback_url'],
        'endpoints' => [
            'stk_push' => url('/api/mpesa/stk-push'),
            'stk_query' => url('/api/mpesa/stk-query'),
            'stk_callback' => url('/api/mpesa/stk-callback'),
            'c2b_validation' => url('/api/mpesa/validation'),
            'c2b_confirmation' => url('/api/mpesa/confirmation'),
            'c2b_simulate' => url('/api/mpesa/c2b-simulate'),
            'c2b_till' => url('/api/mpesa/c2b-till'),
            'settings_get' => url('/api/admin/settings/mpesa/config'),
            'settings_update' => url('/api/admin/settings/mpesa/config'),
            'test_connection' => url('/api/admin/settings/mpesa/test'),
        ],
        'sample_requests' => [
            'stk_push' => [
                'method' => 'POST',
                'url' => url('/api/mpesa/stk-push'),
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ],
                'body' => [
                    'phone_number' => '254712345678',
                    'amount' => 100,
                    'account_reference' => 'TEST123',
                    'transaction_desc' => 'Test Payment'
                ]
            ],
            'c2b_simulate' => [
                'method' => 'POST',
                'url' => url('/api/mpesa/c2b-simulate'),
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ],
                'body' => [
                    'phone_number' => '254712345678',
                    'amount' => 100,
                    'account_reference' => 'TEST123',
                    'bill_ref_number' => 'REF12345'
                ]
            ],
            'c2b_till' => [
                'method' => 'POST',
                'url' => url('/api/mpesa/c2b-till'),
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ],
                'body' => [
                    'phone_number' => '254712345678',
                    'amount' => 100,
                    'till_number' => '5555555',
                    'account_reference' => 'TILL-TEST123'
                ]
            ]
        ]
    ], 200, [], JSON_PRETTY_PRINT);
});

// Test STK Push endpoint with sample data
Route::get('/test-stk-push', function () {
    $mpesaController = new MpesaController();
    
    // Create a mock request
    $request = new \Illuminate\Http\Request([
        'phone_number' => '254712345678',
        'amount' => 10,
        'account_reference' => 'TEST-' . time(),
        'transaction_desc' => 'Test Payment for PayGo'
    ]);
    
    try {
        $response = $mpesaController->stkPush($request);
        return response()->json([
            'test' => 'STK Push Test',
            'timestamp' => now(),
            'result' => json_decode($response->getContent(), true)
        ], 200, [], JSON_PRETTY_PRINT);
    } catch (\Exception $e) {
        return response()->json([
            'test' => 'STK Push Test',
            'error' => $e->getMessage(),
            'timestamp' => now()
        ], 500, [], JSON_PRETTY_PRINT);
    }
});

// Test C2B Simulate endpoint
Route::get('/test-c2b-simulate', function () {
    $mpesaController = new MpesaController();
    
    // Create a mock request
    $request = new \Illuminate\Http\Request([
        'phone_number' => '254712345678',
        'amount' => 50,
        'account_reference' => 'C2B-TEST-' . time(),
        'bill_ref_number' => 'REF-' . time()
    ]);
    
    try {
        $response = $mpesaController->c2bSimulate($request);
        return response()->json([
            'test' => 'C2B Simulate Test',
            'timestamp' => now(),
            'result' => json_decode($response->getContent(), true)
        ], 200, [], JSON_PRETTY_PRINT);
    } catch (\Exception $e) {
        return response()->json([
            'test' => 'C2B Simulate Test',
            'error' => $e->getMessage(),
            'timestamp' => now()
        ], 500, [], JSON_PRETTY_PRINT);
    }
});

// Test C2B Till payment endpoint
Route::get('/test-c2b-till', function () {
    $mpesaController = new MpesaController();
    
    // Create a mock request
    $request = new \Illuminate\Http\Request([
        'phone_number' => '254712345678',
        'amount' => 75,
        'till_number' => '5555555',
        'account_reference' => 'TILL-TEST-' . time()
    ]);
    
    try {
        $response = $mpesaController->c2bTillPayment($request);
        return response()->json([
            'test' => 'C2B Till Payment Test',
            'timestamp' => now(),
            'result' => json_decode($response->getContent(), true)
        ], 200, [], JSON_PRETTY_PRINT);
    } catch (\Exception $e) {
        return response()->json([
            'test' => 'C2B Till Payment Test',
            'error' => $e->getMessage(),
            'timestamp' => now()
        ], 500, [], JSON_PRETTY_PRINT);
    }
});

// Test token generation
Route::get('/test-token', function () {
    $mpesaController = new MpesaController();
    
    try {
        $token = $mpesaController->generateAccessToken();
        $config = SystemSetting::getMpesaConfig();
        
        return response()->json([
            'test' => 'Token Generation Test',
            'timestamp' => now(),
            'environment' => $config['environment'],
            'token_status' => $token ? 'success' : 'failed',
            'token_preview' => $token ? substr($token, 0, 20) . '...' : null,
            'token_length' => $token ? strlen($token) : 0
        ], 200, [], JSON_PRETTY_PRINT);
    } catch (\Exception $e) {
        return response()->json([
            'test' => 'Token Generation Test',
            'error' => $e->getMessage(),
            'timestamp' => now()
        ], 500, [], JSON_PRETTY_PRINT);
    }
});

// Test M-Pesa Transaction Results Interface
Route::get('/mpesa-dashboard', function () {
    $transactions = App\Models\MpesaTransaction::orderBy('created_at', 'desc')->take(10)->get();
    $config = App\Models\SystemSetting::getMpesaConfig();
    
    $successful = $transactions->where('result_code', 0)->count();
    $failed = $transactions->where('result_code', '!=', 0)->whereNotNull('result_code')->count();
    $pending = $transactions->whereNull('result_code')->count();
    
    return response()->json([
        'title' => 'M-Pesa Transaction Dashboard',
        'config' => [
            'environment' => $config['environment'],
            'shortcode' => $config['shortcode'],
            'callback_url' => $config['callback_url'],
        ],
        'summary' => [
            'total_transactions' => $transactions->count(),
            'successful' => $successful,
            'failed' => $failed,
            'pending' => $pending,
        ],
        'recent_transactions' => $transactions->map(function ($transaction) {
            return [
                'id' => $transaction->id,
                'amount' => $transaction->amount,
                'phone_number' => $transaction->phone_number,
                'status' => $transaction->isSuccessful() ? 'Success' : ($transaction->result_code ? 'Failed' : 'Pending'),
                'result_code' => $transaction->result_code,
                'result_description' => $transaction->result_desc,
                'mpesa_receipt' => $transaction->mpesa_receipt_number,
                'merchant_request_id' => $transaction->merchant_request_id,
                'checkout_request_id' => $transaction->checkout_request_id,
                'created_at' => $transaction->created_at,
                'transaction_date' => $transaction->transaction_date,
            ];
        }),
        'error_codes' => [
            0 => 'Success',
            1 => 'Insufficient Funds',
            17 => 'Invalid Phone Number',
            26 => 'Invalid Transaction',
            1001 => 'Invalid Phone Number',
            1025 => 'Unable to lock subscriber account',
            1032 => 'Transaction cancelled by customer',
            1037 => 'DS timeout (Customer didn\'t complete)',
            2001 => 'Invalid request',
            9999 => 'Request failed'
        ],
        'testing_endpoints' => [
            'initiate_stk' => url('/api/mpesa/stk-push'),
            'query_status' => url('/api/mpesa/stk-query'),
            'test_stk_push' => url('/test-stk-push'),
            'simulate_success' => url('/test-simulate-success'),
            'simulate_failure' => url('/test-simulate-failure'),
        ],
        'sample_requests' => [
            'stk_push' => [
                'phone_number' => '254703822480',
                'amount' => 1,
                'account_reference' => 'CompanyXLTD',
                'transaction_desc' => 'Payment of X'
            ],
            'stk_query' => [
                'checkout_request_id' => 'Use checkout_request_id from STK Push response'
            ]
        ]
    ], 200, [], JSON_PRETTY_PRINT);
});

// Simulate successful transaction callback (for testing)
Route::get('/test-simulate-success', function () {
    $mockCallbackData = [
        'Body' => [
            'stkCallback' => [
                'MerchantRequestID' => 'test-merchant-' . time(),
                'CheckoutRequestID' => 'test-checkout-' . time(),
                'ResultCode' => 0,
                'ResultDesc' => 'The service request is processed successfully.',
                'CallbackMetadata' => [
                    'Item' => [
                        ['Name' => 'Amount', 'Value' => 100],
                        ['Name' => 'MpesaReceiptNumber', 'Value' => 'TEST' . time()],
                        ['Name' => 'Balance', 'Value' => 5000],
                        ['Name' => 'TransactionDate', 'Value' => date('YmdHis')],
                        ['Name' => 'PhoneNumber', 'Value' => 254703822480],
                    ]
                ]
            ]
        ]
    ];
    
    // Process like a real callback
    $mpesaController = new App\Http\Controllers\Api\MpesaController();
    $request = new \Illuminate\Http\Request();
    $request->merge($mockCallbackData);
    
    $response = $mpesaController->stkCallback($request);
    
    return response()->json([
        'test' => 'Simulated Successful Transaction',
        'timestamp' => now(),
        'mock_data' => $mockCallbackData,
        'callback_result' => 'Transaction processed - check database'
    ], 200, [], JSON_PRETTY_PRINT);
});

// Simulate failed transaction callback (for testing)
Route::get('/test-simulate-failure', function () {
    $mockCallbackData = [
        'Body' => [
            'stkCallback' => [
                'MerchantRequestID' => 'test-merchant-fail-' . time(),
                'CheckoutRequestID' => 'test-checkout-fail-' . time(),
                'ResultCode' => 1032,
                'ResultDesc' => 'Transaction cancelled by customer',
            ]
        ]
    ];
    
    // Process like a real callback
    $mpesaController = new App\Http\Controllers\Api\MpesaController();
    $request = new \Illuminate\Http\Request();
    $request->merge($mockCallbackData);
    
    $response = $mpesaController->stkCallback($request);
    
    return response()->json([
        'test' => 'Simulated Failed Transaction',
        'timestamp' => now(),
        'mock_data' => $mockCallbackData,
        'callback_result' => 'Failed transaction processed - check database'
    ], 200, [], JSON_PRETTY_PRINT);
});

// Test M-Pesa callback with real structure
Route::get('/test-mpesa-callback', function () {
    $mpesaController = new MpesaController();
    
    // Simulate the exact callback structure provided
    $callbackData = [
        "Body" => [
            "stkCallback" => [
                "MerchantRequestID" => "29115-34620561-1",
                "CheckoutRequestID" => "ws_CO_191220191020363925",
                "ResultCode" => 0,
                "ResultDesc" => "The service request is processed successfully.",
                "CallbackMetadata" => [
                    "Item" => [
                        [
                            "Name" => "Amount",
                            "Value" => 1.00
                        ],
                        [
                            "Name" => "MpesaReceiptNumber",
                            "Value" => "NLJ7RT61SV"
                        ],
                        [
                            "Name" => "TransactionDate",
                            "Value" => 20191219102115
                        ],
                        [
                            "Name" => "PhoneNumber",
                            "Value" => 254708374149
                        ]
                    ]
                ]
            ]
        ]
    ];
    
    // Create a mock request with the callback data
    $request = new \Illuminate\Http\Request();
    $request->merge($callbackData);
    
    try {
        $response = $mpesaController->stkCallback($request);
        
        return response()->json([
            'test' => 'M-Pesa Callback Test',
            'timestamp' => now(),
            'callback_data' => $callbackData,
            'response_status' => $response->getStatusCode(),
            'response_content' => $response->getContent(),
            'result' => 'Callback processed successfully'
        ], 200, [], JSON_PRETTY_PRINT);
        
    } catch (\Exception $e) {
        return response()->json([
            'test' => 'M-Pesa Callback Test',
            'error' => $e->getMessage(),
            'callback_data' => $callbackData,
            'timestamp' => now()
        ], 500, [], JSON_PRETTY_PRINT);
    }
});
