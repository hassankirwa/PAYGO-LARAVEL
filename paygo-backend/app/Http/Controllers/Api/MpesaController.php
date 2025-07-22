<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Carbon\Carbon;
use App\Models\MpesaTransaction;
use App\Models\PaymentOrder;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Log;

class MpesaController extends Controller
{
    /**
     * 0. Get M-Pesa Configuration Status (for debugging)
     */
    public function getConfigStatus()
    {
        try {
            $config = SystemSetting::getMpesaConfig();
            
            $status = [
                'environment' => $config['environment'] ?? 'missing',
                'has_consumer_key' => !empty($config['consumer_key']),
                'has_consumer_secret' => !empty($config['consumer_secret']),
                'has_passkey' => !empty($config['passkey']),
                'shortcode' => $config['shortcode'] ?? 'missing',
                'has_callback_url' => !empty($config['callback_url']),
                'has_confirmation_url' => !empty($config['confirmation_url']),
                'has_validation_url' => !empty($config['validation_url']),
            ];
            
            $allConfigured = $status['has_consumer_key'] && 
                           $status['has_consumer_secret'] && 
                           $status['has_passkey'] && 
                           !empty($status['shortcode']);
            
            // Test access token generation
            $tokenStatus = null;
            if ($allConfigured) {
                $token = $this->generateAccessToken();
                $tokenStatus = $token ? 'success' : 'failed';
            } else {
                $tokenStatus = 'skipped_incomplete_config';
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'configuration_complete' => $allConfigured,
                    'config_details' => $status,
                    'access_token_test' => $tokenStatus,
                    'recommendations' => $allConfigured ? 
                        ['Configuration looks good!'] : 
                        ['Please configure M-Pesa settings in admin panel']
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to check M-Pesa configuration: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 1. Generate OAuth access token
     */
    public function generateAccessToken()
    {
        try {
            $config = SystemSetting::getMpesaConfig();
            
            $consumer_key    = $config['consumer_key'];
            $consumer_secret = $config['consumer_secret'];
            
            Log::info('🔑 Generating M-Pesa Access Token:', [
                'environment' => $config['environment'],
                'has_consumer_key' => !empty($consumer_key),
                'has_consumer_secret' => !empty($consumer_secret)
            ]);
            
            if (!$consumer_key || !$consumer_secret) {
                Log::error('❌ M-Pesa credentials not configured');
                return null;
            }
            
            $credentials     = base64_encode("{$consumer_key}:{$consumer_secret}");
            $url             = $config['environment'] === 'production'
                             ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
                             : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

            Log::info('🌐 Making M-Pesa OAuth Request:', ['url' => $url]);

            $curl = curl_init();
            curl_setopt_array($curl, [
                CURLOPT_URL            => $url,
                CURLOPT_HTTPHEADER     => ["Authorization: Basic {$credentials}"],
                CURLOPT_HEADER         => false,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => 30,
                CURLOPT_CONNECTTIMEOUT => 10,
            ]);

            $response = curl_exec($curl);
            $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            $curlError = curl_error($curl);
            curl_close($curl);

            if ($curlError) {
                Log::error('❌ M-Pesa OAuth cURL Error:', ['error' => $curlError]);
                return null;
            }

            if ($httpCode !== 200) {
                Log::error('❌ M-Pesa OAuth HTTP Error:', [
                    'http_code' => $httpCode,
                    'response' => $response
                ]);
                return null;
            }

            $body = json_decode($response);
            
            if (!$body || !isset($body->access_token)) {
                Log::error('❌ M-Pesa OAuth Invalid Response:', [
                    'response' => $response,
                    'parsed' => $body
                ]);
                return null;
            }

            Log::info('✅ M-Pesa Access Token Generated Successfully');
            return $body->access_token;

        } catch (\Exception $e) {
            Log::error('❌ M-Pesa Access Token Generation Exception:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return null;
        }
    }

    /**
     * 2. Generate Lipa-na-M-Pesa password & timestamp
     */
    public function generatePassword()
    {
        $config = SystemSetting::getMpesaConfig();
        
        $timestamp    = Carbon::now()->format('YmdHms');
        $shortcode    = $config['shortcode'];
        $passkey      = $config['passkey'];
        $password     = base64_encode($shortcode . $passkey . $timestamp);

        return response()->json([
            'BusinessShortCode' => $shortcode,
            'Password'          => $password,
            'Timestamp'         => $timestamp,
        ]);
    }

    /**
     * 3. Register Confirmation & Validation URLs
     */
    public function mpesaRegisterUrls()
    {
        $config = SystemSetting::getMpesaConfig();
        $token = $this->generateAccessToken();

        $url = $config['environment'] === 'production'
             ? 'https://api.safaricom.co.ke/mpesa/c2b/v1/registerurl'
             : 'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl';

        $payload = [
            'ShortCode'       => $config['shortcode'],
            'ResponseType'    => 'Completed',
            'ConfirmationURL' => $config['confirmation_url'],
            'ValidationURL'   => $config['validation_url'],
        ];

        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                "Authorization: Bearer {$token}"
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($payload),
        ]);

        $resp = curl_exec($curl);
        curl_close($curl);

        return response($resp);
    }

    /**
     * 4. Validation endpoint (called by Safaricom)
     * Handles M-Pesa C2B validation requests before payment completion
     */
    public function mpesaValidation(Request $request)
    {
        Log::info('🔍 M-Pesa Validation Request:', $request->all());
        
        // Use the comprehensive validation service
        $validationService = new \App\Services\MpesaValidationService();
        $validationResult = $validationService->validateTransaction($request->all());
        
        // Log the validation result
        if ($validationResult['ResultCode'] === '0') {
            Log::info('✅ M-Pesa Validation ACCEPTED via Service:', [
                'transaction_id' => $request->input('TransID'),
                'device_id' => $request->input('BillRefNumber'),
                'amount' => $request->input('TransAmount'),
                'result' => $validationResult
            ]);
        } else {
            Log::warning('❌ M-Pesa Validation REJECTED via Service:', [
                'transaction_id' => $request->input('TransID'),
                'device_id' => $request->input('BillRefNumber'),
                'amount' => $request->input('TransAmount'),
                'result' => $validationResult
            ]);
        }
        
        return response()->json($validationResult);
    }

    /**
     * 5. Confirmation endpoint (called by Safaricom)
     */
    public function mpesaConfirmation(Request $request)
    {
        // Log the confirmation data
        Log::info('M-Pesa Confirmation Request:', $request->all());
        
        // TODO: persist $request->all() into your database or perform business logic
        // You can process C2B payments here
        
        return response()->json([
            'ResultDesc' => 'Accepted confirmation.'
        ]);
    }

    /**
     * 6. STK Push - Initiate Lipa-na-M-Pesa Online Payment
     */
    public function stkPush(Request $request)
    {
        try {
            Log::info('🚀 STK Push Request Started:', $request->all());

            $request->validate([
                'phone_number' => 'required|string',
                'amount' => 'required|numeric|min:1',
                'account_reference' => 'required|string',
                'transaction_desc' => 'required|string'
            ]);

            // Check M-Pesa configuration
            $config = SystemSetting::getMpesaConfig();
            Log::info('📋 M-Pesa Config Retrieved:', [
                'environment' => $config['environment'] ?? 'missing',
                'shortcode' => $config['shortcode'] ?? 'missing',
                'has_consumer_key' => !empty($config['consumer_key']),
                'has_consumer_secret' => !empty($config['consumer_secret']),
                'has_passkey' => !empty($config['passkey']),
                'callback_url' => $config['callback_url'] ?? 'missing'
            ]);

            // Validate required config
            if (empty($config['consumer_key']) || empty($config['consumer_secret']) || empty($config['passkey'])) {
                Log::error('❌ M-Pesa Configuration Incomplete');
                return response()->json([
                    'success' => false,
                    'error' => 'M-Pesa configuration is incomplete. Please check admin settings.'
                ], 500);
            }

            // Generate access token
            Log::info('🔑 Generating M-Pesa Access Token...');
            $config = SystemSetting::getMpesaConfig();
            $token = $this->generateAccessToken();
            
            if (!$token) {
                Log::error('❌ Failed to generate M-Pesa access token');
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to generate access token. Please check M-Pesa credentials.'
                ], 500);
            }

            Log::info('✅ M-Pesa Access Token Generated Successfully');

            // Format phone number
            $phoneNumber = $this->formatPhoneNumber($request->phone_number);
        
        // Generate timestamp and password
        $timestamp = Carbon::now()->format('YmdHms');
        $shortcode = $config['shortcode'];
        $passkey = $config['passkey'];
        $password = base64_encode($shortcode . $passkey . $timestamp);

        $url = $config['environment'] === 'production'
             ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
             : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

        $payload = [
            'BusinessShortCode' => $shortcode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'TransactionType' => 'CustomerPayBillOnline',
            'Amount' => $request->amount,
            'PartyA' => $phoneNumber,
            'PartyB' => $shortcode,
            'PhoneNumber' => $phoneNumber,
            'CallBackURL' => $config['callback_url'] ?? url('/api/mpesa/stk-callback'),
            'AccountReference' => $request->account_reference,
            'TransactionDesc' => $request->transaction_desc
        ];

        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                "Authorization: Bearer {$token}"
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_SSL_VERIFYPEER => false,
        ]);

        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        $data = json_decode($response, true);
        
        // Log the immediate M-Pesa STK Push response for debugging
        Log::info('M-Pesa STK Push Immediate Response (Expected Structure):', [
            'http_code' => $httpCode,
            'merchant_request_id' => $data['MerchantRequestID'] ?? 'missing',
            'checkout_request_id' => $data['CheckoutRequestID'] ?? 'missing', 
            'response_code' => $data['ResponseCode'] ?? 'missing',
            'response_description' => $data['ResponseDescription'] ?? 'missing',
            'customer_message' => $data['CustomerMessage'] ?? 'missing',
            'full_response' => $data
        ]);
        
        if ($httpCode == 200 && isset($data['ResponseCode']) && $data['ResponseCode'] == '0') {
            Log::info('✅ STK Push accepted by M-Pesa (ResponseCode=0), returning success to frontend');
            return response()->json([
                'success' => true,
                'message' => 'STK Push initiated successfully',
                'data' => [
                    'merchant_request_id' => $data['MerchantRequestID'] ?? null,
                    'checkout_request_id' => $data['CheckoutRequestID'] ?? null,
                    'response_code' => $data['ResponseCode'] ?? null,
                    'response_description' => $data['ResponseDescription'] ?? null,
                    'customer_message' => $data['CustomerMessage'] ?? null
                ]
            ]);
        } else {
            Log::error('STK Push Error:', $data);
            
            // If we have M-Pesa response data, include it for better error handling
            if (isset($data['ResponseCode']) && $data['ResponseCode'] !== '0') {
                Log::warning('❌ STK Push rejected by M-Pesa (ResponseCode≠0), returning error to frontend');
                return response()->json([
                    'success' => true, // API call succeeded, but M-Pesa rejected
                    'data' => [
                        'merchant_request_id' => $data['MerchantRequestID'] ?? null,
                        'checkout_request_id' => $data['CheckoutRequestID'] ?? null,
                        'response_code' => $data['ResponseCode'],
                        'response_description' => $data['ResponseDescription'] ?? 'M-Pesa request failed',
                        'customer_message' => $data['CustomerMessage'] ?? null
                    ]
                ]);
            } else {
                // Network or API level error
                return response()->json([
                    'success' => false,
                    'error' => $data['errorMessage'] ?? 'STK Push failed',
                    'error_code' => $data['errorCode'] ?? null
                ], 400);
            }
        }

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('❌ STK Push Validation Failed:', $e->errors());
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('❌ STK Push Error:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'error' => 'STK Push failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 7. STK Push Callback - Handle payment notifications
     */
    public function stkCallback(Request $request)
    {
        $callbackData = $request->all();
        Log::info('STK Push Callback Received:', $callbackData);

        try {
            $stkCallback = $callbackData['Body']['stkCallback'] ?? null;
            
            if (!$stkCallback) {
                Log::error('Invalid STK callback data');
                return response('Invalid callback data', 400);
            }

            $merchantRequestId = $stkCallback['MerchantRequestID'] ?? null;
            $checkoutRequestId = $stkCallback['CheckoutRequestID'] ?? null;
            $resultCode = $stkCallback['ResultCode'] ?? null;
            $resultDesc = $stkCallback['ResultDesc'] ?? null;

            // Initialize transaction data
            $transactionData = [
                'merchant_request_id' => $merchantRequestId,
                'checkout_request_id' => $checkoutRequestId,
                'result_code' => $resultCode,
                'result_desc' => $resultDesc,
                'raw_payload' => $callbackData,
                'transaction_date' => now(),
                'phone_number' => null,
                'amount' => null,
                'mpesa_receipt_number' => null,
                'balance' => null
            ];

            // Process successful payment
            if ($resultCode == 0) {
                $callbackMetadata = $stkCallback['CallbackMetadata']['Item'] ?? [];
                
                foreach ($callbackMetadata as $item) {
                    switch ($item['Name']) {
                        case 'Amount':
                            $transactionData['amount'] = $item['Value'];
                            break;
                        case 'MpesaReceiptNumber':
                            $transactionData['mpesa_receipt_number'] = $item['Value'];
                            break;
                        case 'Balance':
                            // Handle complex balance objects from M-Pesa
                            $balanceValue = $item['Value'];
                            if (is_numeric($balanceValue)) {
                                $transactionData['balance'] = $balanceValue;
                            } else {
                                // If balance is a complex object, extract numeric value or set to null
                                if (is_string($balanceValue) && preg_match('/BasicAmount=([\d.]+)/', $balanceValue, $matches)) {
                                    $transactionData['balance'] = $matches[1];
                                } else {
                                    $transactionData['balance'] = null; // Skip complex balance objects
                                    Log::warning('Complex balance object received, skipping:', ['balance' => $balanceValue]);
                                }
                            }
                            break;
                        case 'TransactionDate':
                            // Handle M-Pesa transaction date format safely
                            try {
                                $transactionData['transaction_date'] = Carbon::createFromFormat('YmdHis', $item['Value']);
                            } catch (\Exception $e) {
                                Log::warning('Invalid transaction date format, using current time:', [
                                    'received_date' => $item['Value'],
                                    'error' => $e->getMessage()
                                ]);
                                $transactionData['transaction_date'] = now();
                            }
                            break;
                        case 'PhoneNumber':
                            $transactionData['phone_number'] = $item['Value'];
                            break;
                    }
                }

                // Create transaction record
                $transaction = MpesaTransaction::create($transactionData);
                
                // Process successful payment and update payment order
                $this->processSuccessfulPayment($transaction);
                
                Log::info('STK Push Payment Successful:', $transaction->toArray());
            } else {
                // Payment failed or cancelled
                $transaction = MpesaTransaction::create($transactionData);
                
                // Process failed payment and update payment order
                $this->processFailedPayment($transaction);
                
                Log::info('STK Push Payment Failed:', $transaction->toArray());
            }

            return response('OK', 200);
            
        } catch (\Exception $e) {
            Log::error('STK Callback Processing Error:', [
                'error' => $e->getMessage(),
                'callback_data' => $callbackData
            ]);
            return response('Internal Server Error', 500);
        }
    }

    /**
     * 8. Query STK Push Status
     */
    public function stkQuery(Request $request)
    {
        $request->validate([
            'checkout_request_id' => 'required|string'
        ]);

        $config = SystemSetting::getMpesaConfig();
        $token = $this->generateAccessToken();
        
        if (!$token) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate access token'
            ], 500);
        }

        $timestamp = Carbon::now()->format('YmdHms');
        $shortcode = $config['shortcode'];
        $passkey = $config['passkey'];
        $password = base64_encode($shortcode . $passkey . $timestamp);

        $url = $config['environment'] === 'production'
             ? 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
             : 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';

        $payload = [
            'BusinessShortCode' => $shortcode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'CheckoutRequestID' => $request->checkout_request_id
        ];

        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                "Authorization: Bearer {$token}"
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_SSL_VERIFYPEER => false,
        ]);

        $response = curl_exec($curl);
        curl_close($curl);

        $data = json_decode($response, true);
        
        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * C2B Simulate Transaction (Till Number)
     */
    public function c2bSimulate(Request $request)
    {
        $request->validate([
            'phone_number' => 'required|string',
            'amount' => 'required|numeric|min:1',
            'account_reference' => 'required|string',
            'bill_ref_number' => 'sometimes|string',
        ]);

        $config = SystemSetting::getMpesaConfig();
        $token = $this->generateAccessToken();
        
        if (!$token) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate access token'
            ], 500);
        }

        // Format phone number
        $phoneNumber = $this->formatPhoneNumber($request->phone_number);
        
        $url = $config['environment'] === 'production'
             ? 'https://api.safaricom.co.ke/mpesa/c2b/v1/simulate'
             : 'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/simulate';

        $payload = [
            'ShortCode' => $config['shortcode'],
            'CommandID' => 'CustomerPayBillOnline', // or CustomerBuyGoodsOnline for Till
            'Amount' => $request->amount,
            'Msisdn' => $phoneNumber,
            'BillRefNumber' => $request->bill_ref_number ?? $request->account_reference,
        ];

        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                "Authorization: Bearer {$token}"
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_SSL_VERIFYPEER => false,
        ]);

        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        $data = json_decode($response, true);
        
        if ($httpCode == 200) {
            Log::info('C2B Simulation successful:', $data);
            return response()->json([
                'success' => true,
                'message' => 'C2B transaction simulated successfully',
                'data' => $data
            ]);
        } else {
            Log::error('C2B Simulation Error:', $data);
            return response()->json([
                'success' => false,
                'error' => $data['errorMessage'] ?? 'C2B simulation failed',
                'error_code' => $data['errorCode'] ?? null
            ], 400);
        }
    }

    /**
     * C2B Till Number Payment (CustomerBuyGoodsOnline)
     */
    public function c2bTillPayment(Request $request)
    {
        $request->validate([
            'phone_number' => 'required|string',
            'amount' => 'required|numeric|min:1',
            'till_number' => 'required|string',
            'account_reference' => 'sometimes|string',
        ]);

        $config = SystemSetting::getMpesaConfig();
        $token = $this->generateAccessToken();
        
        if (!$token) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate access token'
            ], 500);
        }

        // Format phone number
        $phoneNumber = $this->formatPhoneNumber($request->phone_number);
        
        $url = $config['environment'] === 'production'
             ? 'https://api.safaricom.co.ke/mpesa/c2b/v1/simulate'
             : 'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/simulate';

        $payload = [
            'ShortCode' => $request->till_number,
            'CommandID' => 'CustomerBuyGoodsOnline', // Till Number command
            'Amount' => $request->amount,
            'Msisdn' => $phoneNumber,
            'BillRefNumber' => $request->account_reference ?? 'TILL-' . time(),
        ];

        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                "Authorization: Bearer {$token}"
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_SSL_VERIFYPEER => false,
        ]);

        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        $data = json_decode($response, true);
        
        if ($httpCode == 200) {
            Log::info('C2B Till Payment successful:', $data);
            return response()->json([
                'success' => true,
                'message' => 'Till payment processed successfully',
                'data' => [
                    'till_number' => $request->till_number,
                    'amount' => $request->amount,
                    'phone_number' => $phoneNumber,
                    'response' => $data
                ]
            ]);
        } else {
            Log::error('C2B Till Payment Error:', $data);
            return response()->json([
                'success' => false,
                'error' => $data['errorMessage'] ?? 'Till payment failed',
                'error_code' => $data['errorCode'] ?? null
            ], 400);
        }
    }

    /**
     * Helper: Format phone number for M-Pesa (254XXXXXXXXX)
     */
    private function formatPhoneNumber($phoneNumber)
    {
        // Remove any non-digit characters
        $phoneNumber = preg_replace('/\D/', '', $phoneNumber);
        
        // Remove leading zero if present
        if (substr($phoneNumber, 0, 1) === '0') {
            $phoneNumber = substr($phoneNumber, 1);
        }
        
        // Add country code if not present
        if (substr($phoneNumber, 0, 3) !== '254') {
            $phoneNumber = '254' . $phoneNumber;
        }
        
        return $phoneNumber;
    }

    /**
     * Create payment order when STK push is initiated
     */
    public function createPaymentOrder(Request $request)
    {
        $request->validate([
            'quote_id' => 'required|string',
            'checkout_request_id' => 'required|string',
            'customer_name' => 'required|string',
            'customer_email' => 'required|email',
            'customer_phone' => 'required|string',
            'mpesa_phone_number' => 'required|string',
            'product_id' => 'required|integer',
            'product_name' => 'required|string',
            'product_price' => 'required|numeric',
            'payment_type' => 'required|in:down_payment,full_payment,installment',
            'paid_amount' => 'required|numeric',
            'plan_type' => 'nullable|string',
            'down_payment_amount' => 'nullable|numeric',
            'installment_amount' => 'nullable|numeric',
            'total_installments' => 'nullable|integer',
            'plan_duration' => 'nullable|string',
            'delivery_address' => 'nullable|string',
            'delivery_county' => 'nullable|string',
        ]);

        try {
            // Get authenticated client if available
            $clientId = null;
            if (auth('sanctum')->check()) {
                $clientId = auth('sanctum')->user()->id;
            }

            $paymentOrder = PaymentOrder::create([
                'order_reference' => PaymentOrder::generateOrderReference(),
                'quote_id' => $request->quote_id,
                'payment_type' => $request->payment_type,
                'status' => 'pending',
                'client_id' => $clientId,
                'customer_name' => $request->customer_name,
                'customer_email' => $request->customer_email,
                'customer_phone' => $request->customer_phone,
                'product_id' => $request->product_id,
                'product_name' => $request->product_name,
                'product_price' => $request->product_price,
                'plan_type' => $request->plan_type,
                'down_payment_amount' => $request->down_payment_amount,
                'installment_amount' => $request->installment_amount,
                'total_installments' => $request->total_installments,
                'plan_duration' => $request->plan_duration,
                'paid_amount' => $request->paid_amount,
                'payment_method' => 'mpesa_stk',
                'mpesa_phone_number' => $request->mpesa_phone_number,
                'checkout_request_id' => $request->checkout_request_id,
                'delivery_address' => $request->delivery_address,
                'delivery_county' => $request->delivery_county,
            ]);

            Log::info('Payment order created:', $paymentOrder->toArray());

            return response()->json([
                'success' => true,
                'message' => 'Payment order created successfully',
                'data' => [
                    'order_reference' => $paymentOrder->order_reference,
                    'order_id' => $paymentOrder->id,
                    'status' => $paymentOrder->status,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error creating payment order:', [
                'error' => $e->getMessage(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to create payment order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get payment order status
     */
    public function getPaymentOrderStatus(Request $request)
    {
        $request->validate([
            'checkout_request_id' => 'required|string'
        ]);

        try {
            $paymentOrder = PaymentOrder::where('checkout_request_id', $request->checkout_request_id)->first();
            $mpesaTransaction = MpesaTransaction::where('checkout_request_id', $request->checkout_request_id)->first();

            // If no payment order found, return not found but check if transaction exists
            if (!$paymentOrder) {
                // Check if we have transaction data from callback
                if ($mpesaTransaction) {
                    return response()->json([
                        'success' => true,
                        'payment_confirmed' => $mpesaTransaction->result_code == 0,
                        'data' => [
                            'order' => null,
                            'transaction' => [
                                'result_code' => $mpesaTransaction->result_code,
                                'result_desc' => $mpesaTransaction->result_desc,
                                'mpesa_receipt_number' => $mpesaTransaction->mpesa_receipt_number,
                                'transaction_date' => $mpesaTransaction->transaction_date,
                                'amount' => $mpesaTransaction->amount,
                                'phone_number' => $mpesaTransaction->phone_number,
                            ]
                        ]
                    ]);
                }
                
                return response()->json([
                    'success' => false,
                    'payment_confirmed' => false,
                    'error' => 'Payment order not found',
                    'status' => 'not_found'
                ], 404);
            }

            // Return payment order with transaction data
            return response()->json([
                'success' => true,
                'payment_confirmed' => $paymentOrder->status === 'completed' && $mpesaTransaction && $mpesaTransaction->result_code == 0,
                'data' => [
                    'order' => [
                        'order_reference' => $paymentOrder->order_reference,
                        'status' => $paymentOrder->status,
                        'customer_name' => $paymentOrder->customer_name,
                        'product_name' => $paymentOrder->product_name,
                        'paid_amount' => $paymentOrder->paid_amount,
                        'payment_completed_at' => $paymentOrder->payment_completed_at,
                        'mpesa_receipt_number' => $paymentOrder->mpesa_receipt_number,
                        'payment_type' => $paymentOrder->payment_type,
                        'plan_type' => $paymentOrder->plan_type,
                    ],
                    'transaction' => $mpesaTransaction ? [
                        'result_code' => $mpesaTransaction->result_code,
                        'result_desc' => $mpesaTransaction->result_desc,
                        'mpesa_receipt_number' => $mpesaTransaction->mpesa_receipt_number,
                        'transaction_date' => $mpesaTransaction->transaction_date,
                        'amount' => $mpesaTransaction->amount,
                        'phone_number' => $mpesaTransaction->phone_number,
                    ] : null
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error getting payment order status:', [
                'error' => $e->getMessage(),
                'checkout_request_id' => $request->checkout_request_id
            ]);

            return response()->json([
                'success' => false,
                'payment_confirmed' => false,
                'error' => 'Failed to get payment order status'
            ], 500);
        }
    }

    /**
     * Process successful payment - integrate with PayGo system
     */
    private function processSuccessfulPayment(MpesaTransaction $transaction)
    {
        try {
            // Find and update payment order
            $paymentOrder = PaymentOrder::where('checkout_request_id', $transaction->checkout_request_id)->first();
            
            if ($paymentOrder) {
                $paymentOrder->update([
                    'status' => 'completed',
                    'mpesa_receipt_number' => $transaction->mpesa_receipt_number,
                    'payment_completed_at' => $transaction->transaction_date ?? now(),
                ]);

                Log::info('Payment order completed:', [
                    'order_reference' => $paymentOrder->order_reference,
                    'customer_name' => $paymentOrder->customer_name,
                    'amount' => $paymentOrder->paid_amount,
                    'mpesa_receipt' => $transaction->mpesa_receipt_number
                ]);

                // TODO: Additional business logic
                // 1. Trigger IoT device activation if needed
                // 2. Send SMS confirmation to customer
                // 3. Send email receipt
                // 4. Create delivery order
                // 5. Update inventory
                
            } else {
                Log::warning('No payment order found for successful transaction:', [
                    'checkout_request_id' => $transaction->checkout_request_id,
                    'transaction_id' => $transaction->id
                ]);
            }
            
        } catch (\Exception $e) {
            Log::error('Error processing successful payment:', [
                'transaction_id' => $transaction->id,
                'checkout_request_id' => $transaction->checkout_request_id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Process failed payment - integrate with PayGo system
     */
    private function processFailedPayment(MpesaTransaction $transaction)
    {
        try {
            // Find and update payment order
            $paymentOrder = PaymentOrder::where('checkout_request_id', $transaction->checkout_request_id)->first();
            
            if ($paymentOrder) {
                $paymentOrder->update([
                    'status' => 'failed',
                    'payment_completed_at' => $transaction->transaction_date ?? now(),
                ]);

                Log::warning('Payment order failed:', [
                    'order_reference' => $paymentOrder->order_reference,
                    'customer_name' => $paymentOrder->customer_name,
                    'amount' => $paymentOrder->paid_amount,
                    'mpesa_receipt' => $transaction->mpesa_receipt_number,
                    'reason' => $transaction->result_desc
                ]);

                // TODO: Additional business logic for failed payments
                // 1. Send SMS notification to customer
                // 2. Send email receipt (if applicable)
                // 3. Log the failure reason
            } else {
                Log::warning('No payment order found for failed transaction:', [
                    'checkout_request_id' => $transaction->checkout_request_id,
                    'transaction_id' => $transaction->id
                ]);
            }
            
        } catch (\Exception $e) {
            Log::error('Error processing failed payment:', [
                'transaction_id' => $transaction->id,
                'checkout_request_id' => $transaction->checkout_request_id,
                'error' => $e->getMessage()
            ]);
        }
    }
} 