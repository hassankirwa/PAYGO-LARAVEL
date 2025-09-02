<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\C2BTransaction;
use Symfony\Component\HttpFoundation\Response;

class MpesaC2BController extends Controller
{
    public function generateAccessToken()
    {
        $consumerKey    = env('MPESA_CONSUMER_KEY');
        $consumerSecret = env('MPESA_CONSUMER_SECRET');
        $credentials    = base64_encode("{$consumerKey}:{$consumerSecret}");
        $url            = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_HTTPHEADER     => ["Authorization: Basic {$credentials}"],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);

        $response = curl_exec($ch);
        if ($response === false) {
            throw new \RuntimeException('cURL error: ' . curl_error($ch));
        }
        curl_close($ch);

        $data = json_decode($response, true);
        if (empty($data['access_token'])) {
            throw new \RuntimeException('Invalid MPESA token response: ' . $response);
        }

        return $data['access_token'];
    }

    public function createValidationResponse($result_code, $result_description)
    {
        $result=json_encode(["ResultCode"=>$result_code, "ResultDesc"=>$result_description]);
        $response= new Response();
        $response->headers->set('Content-Type', 'application/json; charset=utf-8');
        $response->setContent($result);
        return $response;

    }

    public function mpesaValidation()
    {
        $result_code = "0";
        $result_description = "Accepted validation request";
        return $this->createValidationResponse($result_code, $result_description);

    }

    public function mpesaRegisterUrls()
    {
        $curl = curl_init();
        curl_setopt($curl, CURLOPT_URL, "https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl");
        curl_setopt($curl,CURLOPT_HTTPHEADER, array('Content-Type: application/json', 'Authorization: Bearer ' . $this->generateAccessToken()));
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode(array(
            "ShortCode" => '174379',
            "ResponseType" => "Completed",
                         "ConfirmationURL" => "https://99d1a75aa1f4.ngrok-free.app/api/sts/confirmation",
            "ValidationURL" => "https://99d1a75aa1f4.ngrok-free.app/api/sts/validation"
        )));
        $curl_response = curl_exec($curl);
        echo $curl_response;
        // curl_close($curl);
        // return $curl_response;
    }

    public function mpesaConfirmation(Request $request)
    {
        try {
            // Log the raw request for debugging
            Log::info('M-Pesa C2B Confirmation received', [
                'content' => $request->getContent(),
                'headers' => $request->headers->all()
            ]);

            $rawContent = $request->getContent();
            
            // Check if request body is empty
            if (empty($rawContent)) {
                Log::error('Empty request body received from M-Pesa callback', [
                    'content_length' => $request->header('Content-Length', 'not set'),
                    'content_type' => $request->header('Content-Type', 'not set')
                ]);
                return response()->json(['ResultCode' => '1', 'ResultDesc' => 'Empty request body']);
            }
            
            $content = json_decode($rawContent);
            
            // Check if JSON decoding was successful
            if ($content === null) {
                Log::error('Failed to decode JSON from M-Pesa callback', [
                    'raw_content' => $rawContent,
                    'json_error' => json_last_error_msg()
                ]);
                return response()->json(['ResultCode' => '1', 'ResultDesc' => 'Invalid JSON payload']);
            }

            // Validate required fields
            $requiredFields = ['TransactionType', 'TransID', 'TransTime', 'TransAmount', 'BusinessShortCode', 'BillRefNumber', 'MSISDN', 'FirstName', 'LastName'];
            foreach ($requiredFields as $field) {
                if (!isset($content->$field)) {
                    Log::error('Missing required field in M-Pesa callback', [
                        'missing_field' => $field,
                        'content' => $content
                    ]);
                    return response()->json(['ResultCode' => '1', 'ResultDesc' => "Missing required field: {$field}"]);
                }
            }

            $c2bTransaction = new C2BTransaction();
            $c2bTransaction->transaction_type = $content->TransactionType;
            $c2bTransaction->trans_id = $content->TransID;
            $c2bTransaction->trans_time = $content->TransTime;
            $c2bTransaction->trans_amount = $content->TransAmount;
            $c2bTransaction->business_short_code = $content->BusinessShortCode;
            $c2bTransaction->bill_ref_number = $content->BillRefNumber;
            $c2bTransaction->device_id = $content->BillRefNumber; // Use bill ref as device ID
            $c2bTransaction->invoice_number = $content->InvoiceNumber ?? null;
            $c2bTransaction->org_account_balance = $content->OrgAccountBalance ?? null;
            $c2bTransaction->third_party_trans_id = $content->ThirdPartyTransID ?? null;
            $c2bTransaction->msisdn = $content->MSISDN;
            $c2bTransaction->first_name = $content->FirstName;
            $c2bTransaction->middle_name = $content->MiddleName ?? null;
            $c2bTransaction->last_name = $content->LastName;
            $c2bTransaction->raw_payload = (array) $content;
            $c2bTransaction->verification_status = 'pending';
            $c2bTransaction->payment_status = 'received';
            $c2bTransaction->save();

            Log::info('C2B Transaction saved successfully', [
                'transaction_id' => $c2bTransaction->id,
                'trans_id' => $content->TransID, 
                'amount' => $content->TransAmount
            ]);
            
            return response()->json(['ResultCode' => '0', 'ResultDesc' => 'Accepted']);
            
        } catch (\Exception $e) {
            Log::error('Error processing M-Pesa C2B confirmation', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_content' => $request->getContent()
            ]);
            
            return response()->json(['ResultCode' => '1', 'ResultDesc' => 'Internal server error']);
        }
    }

    /**
     * Simulate C2B Payment - Triggers Safaricom sandbox to send payment to our confirmation URL
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function simulateC2BPayment(Request $request)
    {
        try {
            // Validate input
            $request->validate([
                'amount' => 'required|numeric|min:1',
                'msisdn' => 'required|string|regex:/^254[0-9]{9}$/',
                'bill_ref_number' => 'required|string|max:20',
            ]);

            $token = $this->generateAccessToken();
            $url = 'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/simulate';
            
            $payload = [
                'ShortCode' => '174379', // Test shortcode for sandbox
                'CommandID' => 'CustomerPayBillOnline', // For PayBill payments
                'Amount' => (int) $request->amount, // Ensure amount is integer
                'Msisdn' => $request->msisdn,
                'BillRefNumber' => $request->bill_ref_number, // This will be your device/customer ID
            ];

            Log::info('Initiating C2B Payment Simulation', $payload);

            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    "Authorization: Bearer {$token}",
                ],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($payload),
                CURLOPT_TIMEOUT => 30,
                CURLOPT_SSL_VERIFYPEER => false,
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            
            if ($response === false) {
                $error = curl_error($ch);
                curl_close($ch);
                throw new \RuntimeException('cURL error: ' . $error);
            }
            
            curl_close($ch);
            
            $responseData = json_decode($response, true);
            
            Log::info('C2B Simulation Response', [
                'http_code' => $httpCode,
                'response' => $responseData
            ]);

            if ($httpCode === 200 && isset($responseData['ResponseCode']) && $responseData['ResponseCode'] === '0') {
                return response()->json([
                    'success' => true,
                    'message' => 'C2B payment simulation initiated successfully',
                    'data' => [
                        'amount' => $request->amount,
                        'msisdn' => $request->msisdn,
                        'bill_ref_number' => $request->bill_ref_number,
                        'safaricom_response' => $responseData,
                        'note' => 'Check your confirmation endpoint for the payment callback'
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'C2B simulation failed',
                    'error' => $responseData['errorMessage'] ?? 'Unknown error',
                    'response' => $responseData
                ], 400);
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            Log::error('Error in C2B simulation', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Internal server error during simulation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Debug endpoint to inspect incoming requests
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function debugRequest(Request $request)
    {
        $rawContent = $request->getContent();
        
        return response()->json([
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'headers' => $request->headers->all(),
            'raw_content' => $rawContent,
            'content_length' => strlen($rawContent),
            'is_json' => $request->isJson(),
            'content_type' => $request->header('Content-Type'),
            'all_input' => $request->all(),
            'json_decoded' => json_decode($rawContent),
            'json_error' => json_last_error_msg(),
        ]);
    }

    /**
     * Get recent C2B transactions for testing/monitoring
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRecentTransactions()
    {
        try {
            $transactions = C2BTransaction::latest()
                ->take(10)
                ->get()
                ->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'trans_id' => $transaction->trans_id,
                        'amount' => $transaction->trans_amount,
                        'msisdn' => $transaction->msisdn,
                        'customer_name' => $transaction->getCustomerNameAttribute(),
                        'device_id' => $transaction->device_id,
                        'payment_status' => $transaction->payment_status,
                        'verification_status' => $transaction->verification_status,
                        'created_at' => $transaction->created_at->format('Y-m-d H:i:s'),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $transactions,
                'total' => C2BTransaction::count()
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error fetching C2B transactions', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error fetching transactions',
                'error' => $e->getMessage()
            ], 500);
        }
    }
 
}
