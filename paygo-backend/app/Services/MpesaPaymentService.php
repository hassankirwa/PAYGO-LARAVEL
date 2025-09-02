<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class MpesaPaymentService
{
    private $consumerKey;
    private $consumerSecret;
    private $passkey;
    private $shortcode;
    private $environment;
    private $baseUrl;

    public function __construct()
    {
        $this->consumerKey = config('services.mpesa.consumer_key', 'test_consumer_key');
        $this->consumerSecret = config('services.mpesa.consumer_secret', 'test_consumer_secret');
        $this->passkey = config('services.mpesa.passkey', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919');
        $this->shortcode = config('services.mpesa.shortcode', '174379');
        $this->environment = config('services.mpesa.environment', 'sandbox');
        
        $this->baseUrl = $this->environment === 'production' 
            ? 'https://api.safaricom.co.ke' 
            : 'https://sandbox.safaricom.co.ke';
    }

    /**
     * Generate access token for M-Pesa API
     */
    public function generateAccessToken()
    {
        try {
            $credentials = base64_encode($this->consumerKey . ':' . $this->consumerSecret);
            
            $response = Http::withHeaders([
                'Authorization' => 'Basic ' . $credentials,
                'Content-Type' => 'application/json'
            ])->get($this->baseUrl . '/oauth/v1/generate?grant_type=client_credentials');

            if ($response->successful()) {
                $data = $response->json();
                return $data['access_token'] ?? null;
            }

            Log::error('M-Pesa Access Token Error:', $response->json());
            return null;
        } catch (\Exception $e) {
            Log::error('M-Pesa Access Token Exception:', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Initiate STK Push payment
     */
    public function initiateSTKPush($phoneNumber, $amount, $accountReference, $transactionDesc)
    {
        try {
            $accessToken = $this->generateAccessToken();
            
            if (!$accessToken) {
                return [
                    'success' => false,
                    'error' => 'Failed to generate access token'
                ];
            }

            // Format phone number (remove leading 0, add 254)
            $phoneNumber = $this->formatPhoneNumber($phoneNumber);
            
            // Generate timestamp and password
            $timestamp = Carbon::now()->format('YmdHis');
            $password = base64_encode($this->shortcode . $this->passkey . $timestamp);

            $payload = [
                'BusinessShortCode' => $this->shortcode,
                'Password' => $password,
                'Timestamp' => $timestamp,
                'TransactionType' => 'CustomerPayBillOnline',
                'Amount' => $amount,
                'PartyA' => $phoneNumber,
                'PartyB' => $this->shortcode,
                'PhoneNumber' => $phoneNumber,
                'CallBackURL' => route('api.mpesa.callback'),
                'AccountReference' => $accountReference,
                'TransactionDesc' => $transactionDesc
            ];

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'application/json'
            ])->post($this->baseUrl . '/mpesa/stkpush/v1/processrequest', $payload);

            if ($response->successful()) {
                $data = $response->json();
                
                return [
                    'success' => true,
                    'data' => [
                        'merchant_request_id' => $data['MerchantRequestID'] ?? null,
                        'checkout_request_id' => $data['CheckoutRequestID'] ?? null,
                        'response_code' => $data['ResponseCode'] ?? null,
                        'response_description' => $data['ResponseDescription'] ?? null,
                        'customer_message' => $data['CustomerMessage'] ?? null
                    ]
                ];
            }

            $errorData = $response->json();
            Log::error('M-Pesa STK Push Error:', $errorData);
            
            return [
                'success' => false,
                'error' => $errorData['errorMessage'] ?? 'STK Push failed',
                'error_code' => $errorData['errorCode'] ?? null
            ];
            
        } catch (\Exception $e) {
            Log::error('M-Pesa STK Push Exception:', ['error' => $e->getMessage()]);
            
            return [
                'success' => false,
                'error' => 'Payment initiation failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Query STK Push transaction status
     */
    public function querySTKPushStatus($checkoutRequestId)
    {
        try {
            $accessToken = $this->generateAccessToken();
            
            if (!$accessToken) {
                return [
                    'success' => false,
                    'error' => 'Failed to generate access token'
                ];
            }

            $timestamp = Carbon::now()->format('YmdHis');
            $password = base64_encode($this->shortcode . $this->passkey . $timestamp);

            $payload = [
                'BusinessShortCode' => $this->shortcode,
                'Password' => $password,
                'Timestamp' => $timestamp,
                'CheckoutRequestID' => $checkoutRequestId
            ];

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'application/json'
            ])->post($this->baseUrl . '/mpesa/stkpushquery/v1/query', $payload);

            if ($response->successful()) {
                $data = $response->json();
                
                return [
                    'success' => true,
                    'data' => [
                        'response_code' => $data['ResponseCode'] ?? null,
                        'response_description' => $data['ResponseDescription'] ?? null,
                        'merchant_request_id' => $data['MerchantRequestID'] ?? null,
                        'checkout_request_id' => $data['CheckoutRequestID'] ?? null,
                        'result_code' => $data['ResultCode'] ?? null,
                        'result_desc' => $data['ResultDesc'] ?? null
                    ]
                ];
            }

            return [
                'success' => false,
                'error' => 'Query failed'
            ];
            
        } catch (\Exception $e) {
            Log::error('M-Pesa STK Query Exception:', ['error' => $e->getMessage()]);
            
            return [
                'success' => false,
                'error' => 'Query failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process M-Pesa callback
     */
    public function processCallback($callbackData)
    {
        try {
            Log::info('M-Pesa Callback Received:', $callbackData);

            $stkCallback = $callbackData['Body']['stkCallback'] ?? null;
            
            if (!$stkCallback) {
                return [
                    'success' => false,
                    'error' => 'Invalid callback data'
                ];
            }

            $merchantRequestId = $stkCallback['MerchantRequestID'] ?? null;
            $checkoutRequestId = $stkCallback['CheckoutRequestID'] ?? null;
            $resultCode = $stkCallback['ResultCode'] ?? null;
            $resultDesc = $stkCallback['ResultDesc'] ?? null;

            // Process successful payment
            if ($resultCode == 0) {
                $callbackMetadata = $stkCallback['CallbackMetadata']['Item'] ?? [];
                
                $amount = null;
                $mpesaReceiptNumber = null;
                $transactionDate = null;
                $phoneNumber = null;

                foreach ($callbackMetadata as $item) {
                    switch ($item['Name']) {
                        case 'Amount':
                            $amount = $item['Value'];
                            break;
                        case 'MpesaReceiptNumber':
                            $mpesaReceiptNumber = $item['Value'];
                            break;
                        case 'TransactionDate':
                            $transactionDate = $item['Value'];
                            break;
                        case 'PhoneNumber':
                            $phoneNumber = $item['Value'];
                            break;
                    }
                }

                return [
                    'success' => true,
                    'payment_successful' => true,
                    'data' => [
                        'merchant_request_id' => $merchantRequestId,
                        'checkout_request_id' => $checkoutRequestId,
                        'amount' => $amount,
                        'mpesa_receipt_number' => $mpesaReceiptNumber,
                        'transaction_date' => $transactionDate,
                        'phone_number' => $phoneNumber,
                        'result_desc' => $resultDesc
                    ]
                ];
            } else {
                // Payment failed or cancelled
                return [
                    'success' => true,
                    'payment_successful' => false,
                    'data' => [
                        'merchant_request_id' => $merchantRequestId,
                        'checkout_request_id' => $checkoutRequestId,
                        'result_code' => $resultCode,
                        'result_desc' => $resultDesc
                    ]
                ];
            }
            
        } catch (\Exception $e) {
            Log::error('M-Pesa Callback Processing Exception:', ['error' => $e->getMessage()]);
            
            return [
                'success' => false,
                'error' => 'Callback processing failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Format phone number for M-Pesa (254XXXXXXXXX)
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
     * Generate transaction reference
     */
    public function generateTransactionReference($prefix = 'KOYO')
    {
        return $prefix . '_' . time() . '_' . random_int(1000, 9999);
    }
} 