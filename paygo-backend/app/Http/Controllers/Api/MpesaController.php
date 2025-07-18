<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Carbon\Carbon;
use App\Models\MpesaTransaction;
use Illuminate\Support\Facades\Log;

class MpesaController extends Controller
{
    /**
     * 1. Generate OAuth access token
     */
    public function generateAccessToken()
    {
        $consumer_key    = env('CONSUMER_KEY');
        $consumer_secret = env('CONSUMER_SECRET');
        $credentials     = base64_encode("{$consumer_key}:{$consumer_secret}");
        $url             = env('MPESA_ENV') === 'production'
                         ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
                         : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL            => $url,
            CURLOPT_HTTPHEADER     => ["Authorization: Basic {$credentials}"],
            CURLOPT_HEADER         => false,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_RETURNTRANSFER => true,
        ]);

        $response = curl_exec($curl);
        curl_close($curl);

        $body = json_decode($response);
        return $body->access_token ?? null;
    }

    /**
     * 2. Generate Lipa-na-M-Pesa password & timestamp
     */
    public function generatePassword()
    {
        $timestamp    = Carbon::now()->format('YmdHms');
        $shortcode    = env('BUSINESS_SHORTCODE');
        $passkey      = env('PASS_KEY');
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
        $token = $this->generateAccessToken();

        $url = env('MPESA_ENV') === 'production'
             ? 'https://api.safaricom.co.ke/mpesa/c2b/v1/registerurl'
             : 'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl';

        $payload = [
            'ShortCode'       => env('BUSINESS_SHORTCODE'),
            'ResponseType'    => 'Completed',
            'ConfirmationURL' => env('CONFIRMATION_URL'),
            'ValidationURL'   => env('VALIDATION_URL'),
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
     */
    public function mpesaValidation(Request $request)
    {
        // Here you could inspect $request->all() and decide to accept or reject
        Log::info('M-Pesa Validation Request:', $request->all());
        
        return response()->json([
            'ResultCode' => 0,
            'ResultDesc' => 'Accepted validation request.'
        ]);
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
        $request->validate([
            'phone_number' => 'required|string',
            'amount' => 'required|numeric|min:1',
            'account_reference' => 'required|string',
            'transaction_desc' => 'required|string'
        ]);

        $token = $this->generateAccessToken();
        
        if (!$token) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate access token'
            ], 500);
        }

        // Format phone number
        $phoneNumber = $this->formatPhoneNumber($request->phone_number);
        
        // Generate timestamp and password
        $timestamp = Carbon::now()->format('YmdHms');
        $shortcode = env('BUSINESS_SHORTCODE');
        $passkey = env('PASS_KEY');
        $password = base64_encode($shortcode . $passkey . $timestamp);

        $url = env('MPESA_ENV') === 'production'
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
            'CallBackURL' => env('STK_CALLBACK_URL', url('/api/mpesa/stk-callback')),
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
        
        if ($httpCode == 200 && isset($data['ResponseCode']) && $data['ResponseCode'] == '0') {
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
            return response()->json([
                'success' => false,
                'error' => $data['errorMessage'] ?? 'STK Push failed',
                'error_code' => $data['errorCode'] ?? null
            ], 400);
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
                            $transactionData['balance'] = $item['Value'];
                            break;
                        case 'TransactionDate':
                            $transactionData['transaction_date'] = Carbon::createFromFormat('YmdHis', $item['Value']);
                            break;
                        case 'PhoneNumber':
                            $transactionData['phone_number'] = $item['Value'];
                            break;
                    }
                }

                // Create transaction record
                $transaction = MpesaTransaction::create($transactionData);
                
                // TODO: Update payment plan and trigger business logic here
                $this->processSuccessfulPayment($transaction);
                
                Log::info('STK Push Payment Successful:', $transaction->toArray());
            } else {
                // Payment failed or cancelled
                $transaction = MpesaTransaction::create($transactionData);
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

        $token = $this->generateAccessToken();
        
        if (!$token) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate access token'
            ], 500);
        }

        $timestamp = Carbon::now()->format('YmdHms');
        $shortcode = env('BUSINESS_SHORTCODE');
        $passkey = env('PASS_KEY');
        $password = base64_encode($shortcode . $passkey . $timestamp);

        $url = env('MPESA_ENV') === 'production'
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
     * Process successful payment - integrate with PayGo system
     */
    private function processSuccessfulPayment(MpesaTransaction $transaction)
    {
        try {
            // TODO: Implement payment processing logic
            // 1. Find the payment plan by account reference
            // 2. Update payment plan status
            // 3. Create payment record
            // 4. Trigger IoT device activation if needed
            // 5. Send SMS confirmation
            
            Log::info('Processing successful payment for transaction:', $transaction->toArray());
            
        } catch (\Exception $e) {
            Log::error('Error processing successful payment:', [
                'transaction_id' => $transaction->id,
                'error' => $e->getMessage()
            ]);
        }
    }
} 