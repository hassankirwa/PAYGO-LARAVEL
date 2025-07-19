<?php

use Illuminate\Support\Facades\Route;
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
