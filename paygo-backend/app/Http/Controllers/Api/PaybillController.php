<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use App\Models\C2BTransaction;
use App\Models\PaymentOrder;
use App\Models\SystemSetting;
use App\Services\DarajaPaymentVerificationService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class PaybillController extends Controller
{
    protected $verificationService;

    public function __construct(DarajaPaymentVerificationService $verificationService)
    {
        $this->verificationService = $verificationService;
    }

    /**
     * Generate OAuth access token for M-Pesa API
     */
    private function generateAccessToken()
    {
        $config = SystemSetting::getMpesaConfig();
        
        $consumer_key = $config['consumer_key'];
        $consumer_secret = $config['consumer_secret'];
        
        if (!$consumer_key || !$consumer_secret) {
            Log::error('M-Pesa credentials not configured for Paybill');
            return null;
        }
        
        $credentials = base64_encode("{$consumer_key}:{$consumer_secret}");
        $url = $config['environment'] === 'production'
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
     * Register C2B URLs for Paybill validation and confirmation
     * POST /api/paybill/register-urls
     */
    public function registerUrls(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'shortcode' => 'sometimes|string', // Optional, will use from settings if not provided
            'response_type' => 'required|in:Completed,Cancelled',
            'confirmation_url' => 'sometimes|url',
            'validation_url' => 'sometimes|url',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 400);
        }

        try {
            $config = SystemSetting::getMpesaConfig();
            $apiConfig = SystemSetting::getApiConfig();
            $token = $this->generateAccessToken();
            
            if (!$token) {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to generate access token'
                ], 500);
            }

            // Use provided shortcode or default from settings
            $shortcode = $request->shortcode ?? $config['shortcode'];
            
            // Get base URL from system settings and construct callback URLs
            $baseUrl = rtrim($apiConfig['base_url'], '/');
            
            // Use provided URLs or build default ones using system settings base URL
            $confirmationUrl = $request->confirmation_url ?? $baseUrl . '/api/paybill/confirmation';
            $validationUrl = $request->validation_url ?? $baseUrl . '/api/paybill/validation';

            $url = $config['environment'] === 'production'
                 ? 'https://api.safaricom.co.ke/mpesa/c2b/v1/registerurl'
                 : 'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl';

            $payload = [
                'ShortCode' => $shortcode,
                'ResponseType' => $request->response_type,
                'ConfirmationURL' => $confirmationUrl,
                'ValidationURL' => $validationUrl
            ];

            Log::info('Registering C2B URLs for Paybill:', $payload);

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
                Log::info('C2B URLs registered successfully:', $data);
                
                // Save URLs to system settings
                SystemSetting::set('mpesa', 'paybill_confirmation_url', $confirmationUrl, 'Paybill Confirmation URL', false);
                SystemSetting::set('mpesa', 'paybill_validation_url', $validationUrl, 'Paybill Validation URL', false);
                SystemSetting::set('mpesa', 'paybill_response_type', $request->response_type, 'Paybill Response Type', false);

                return response()->json([
                    'success' => true,
                    'message' => 'C2B URLs registered successfully',
                    'data' => [
                        'shortcode' => $shortcode,
                        'response_type' => $request->response_type,
                        'confirmation_url' => $confirmationUrl,
                        'validation_url' => $validationUrl,
                        'response' => $data
                    ]
                ]);
            } else {
                Log::error('C2B URL Registration Error:', $data);
                return response()->json([
                    'success' => false,
                    'error' => $data['errorMessage'] ?? 'URL registration failed',
                    'error_code' => $data['errorCode'] ?? null
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('C2B URL Registration Exception:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'error' => 'URL registration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * C2B Validation endpoint - Called by Safaricom before payment
     * POST /api/paybill/validation
     */
    public function validation(Request $request)
    {
        Log::info('🔍 M-Pesa C2B Paybill Validation Request:', $request->all());
        
        try {
            // Use the comprehensive validation service for PayGo platform validation
            $validationService = new \App\Services\MpesaValidationService();
            $validationResult = $validationService->validateTransaction($request->all());
            
            // Extract transaction data for saving
            $transactionType = $request->input('TransactionType', 'Pay Bill');
            $transID = $request->input('TransID');
            $transTime = $request->input('TransTime', now()->format('YmdHis'));
            $transAmount = $request->input('TransAmount');
            $businessShortCode = $request->input('BusinessShortCode');
            $billRefNumber = $request->input('BillRefNumber'); // Device ID
            $invoiceNumber = $request->input('InvoiceNumber');
            $orgAccountBalance = $request->input('OrgAccountBalance');
            $thirdPartyTransID = $request->input('ThirdPartyTransID');
            $msisdn = $request->input('MSISDN');
            $firstName = $request->input('FirstName');
            $lastName = $request->input('LastName');
            $middleName = $request->input('MiddleName');

            // Find the appliance to get client information
            $appliance = \App\Models\Appliance::where('unit_id', $billRefNumber)
                ->orWhere('serial_number', $billRefNumber)
                ->first();

            $clientId = null;
            $applianceId = null;
            if ($appliance) {
                $clientId = $appliance->client_id;
                $applianceId = $appliance->id;
            }

            // Find expected payment details regardless of validation result
            $expectedPaymentOrder = \App\Models\PaymentOrder::where('customer_phone', $msisdn)
                ->orWhere(function($query) use ($billRefNumber) {
                    $query->where('notes', 'like', '%' . $billRefNumber . '%')
                          ->orWhereJsonContains('additional_data->device_id', $billRefNumber);
                })
                ->where('status', 'pending')
                ->orderBy('created_at', 'desc')
                ->first();

            $activePaymentPlan = null;
            if ($appliance) {
                $activePaymentPlan = \App\Models\PaymentPlan::where('client_id', $appliance->client_id)
                    ->where('appliance_id', $appliance->id)
                    ->where('status', 'active')
                    ->first();
            }

            // Determine payment type and expected amount
            $paymentType = 'installment';
            $expectedAmount = null;
            $paymentOrderId = null;
            $paymentPlanId = null;

            if ($expectedPaymentOrder) {
                $paymentType = 'down_payment';
                $expectedAmount = $expectedPaymentOrder->down_payment_amount ?? $expectedPaymentOrder->paid_amount;
                $paymentOrderId = $expectedPaymentOrder->id;
            } elseif ($activePaymentPlan) {
                $paymentType = 'installment';
                $expectedAmount = $activePaymentPlan->installment_amount_ksh ?? $activePaymentPlan->installment_amount_usd;
                
                // Convert USD to KSh if needed
                if (is_null($activePaymentPlan->installment_amount_ksh) && !is_null($activePaymentPlan->installment_amount_usd)) {
                    $expectedAmount = $activePaymentPlan->installment_amount_usd * 130;
                }
                
                $paymentPlanId = $activePaymentPlan->id;
            }

            // Check if amount matches exactly
            $amountMatched = false;
            if ($expectedAmount && (float)$transAmount == (float)$expectedAmount) {
                $amountMatched = true;
            }

            // Determine transaction status based on validation result
            $transactionStatus = ($validationResult['ResultCode'] === '0') ? 'processed' : 'failed';
            $creditedToAccount = ($validationResult['ResultCode'] === '0');

            // Always save the PayBill transaction record (both accepted and rejected)
            $paybillTransaction = \App\Models\PaybillTransaction::create([
                'transaction_type' => $transactionType,
                'trans_id' => $transID,
                'trans_time' => $transTime,
                'trans_amount' => $transAmount,
                'business_short_code' => $businessShortCode,
                'bill_ref_number' => $billRefNumber,
                'invoice_number' => $invoiceNumber,
                'org_account_balance' => $orgAccountBalance,
                'third_party_trans_id' => $thirdPartyTransID,
                'msisdn' => $msisdn,
                'first_name' => $firstName,
                'middle_name' => $middleName,
                'last_name' => $lastName,
                'device_id' => $billRefNumber,
                'client_id' => $clientId,
                'appliance_id' => $applianceId,
                'payment_order_id' => $paymentOrderId,
                'payment_plan_id' => $paymentPlanId,
                'payment_type' => $paymentType,
                'expected_amount' => $expectedAmount,
                'amount_matched' => $amountMatched,
                'status' => $transactionStatus,
                'credited_to_account' => $creditedToAccount,
                'processing_notes' => $validationResult['ResultDesc'],
                'validation_details' => [
                    'validation_step' => 'validation_endpoint',
                    'result_code' => $validationResult['ResultCode'],
                    'result_desc' => $validationResult['ResultDesc'],
                    'appliance_found' => $appliance ? true : false,
                    'payment_order_found' => $expectedPaymentOrder ? true : false,
                    'payment_plan_found' => $activePaymentPlan ? true : false,
                    'amount_validation' => [
                        'expected' => $expectedAmount,
                        'received' => (float)$transAmount,
                        'matched' => $amountMatched
                    ],
                    'validation_timestamp' => now()->toDateTimeString()
                ],
                'raw_payload' => $request->all(),
            ]);

            // Log the validation result with enhanced details
            if ($validationResult['ResultCode'] === '0') {
                Log::info('✅ Paybill Validation ACCEPTED and Transaction Saved:', [
                    'transaction_id' => $transID,
                    'paybill_transaction_id' => $paybillTransaction->id,
                    'device_id' => $billRefNumber,
                    'amount' => $transAmount,
                    'expected_amount' => $expectedAmount,
                    'amount_matched' => $amountMatched,
                    'customer' => $firstName . ' ' . $lastName,
                    'phone' => $msisdn,
                    'client_id' => $clientId,
                    'result' => $validationResult
                ]);
            } else {
                Log::warning('❌ Paybill Validation REJECTED and Transaction Saved as Failed:', [
                    'transaction_id' => $transID,
                    'paybill_transaction_id' => $paybillTransaction->id,
                    'device_id' => $billRefNumber,
                    'amount' => $transAmount,
                    'expected_amount' => $expectedAmount,
                    'rejection_reason' => $validationResult['ResultDesc'],
                    'result_code' => $validationResult['ResultCode'],
                    'customer' => $firstName . ' ' . $lastName,
                    'phone' => $msisdn,
                    'client_id' => $clientId
                ]);
            }
            
            return response()->json($validationResult);

        } catch (\Exception $e) {
            Log::error('❌ PayBill Validation Error:', [
                'error' => $e->getMessage(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'ResultCode' => 'C2B00016',
                'ResultDesc' => 'System error during validation. Please try again.'
            ]);
        }
    }

    /**
     * C2B Confirmation endpoint - Called by Safaricom after successful payment
     * POST /api/paybill/confirmation
     */
    public function confirmation(Request $request)
    {
        Log::info('💰 M-Pesa C2B Paybill Confirmation Request:', $request->all());
        
        try {
            // Extract confirmation data
            $transactionType = $request->input('TransactionType');
            $transID = $request->input('TransID');
            $transTime = $request->input('TransTime');
            $transAmount = $request->input('TransAmount');
            $businessShortCode = $request->input('BusinessShortCode');
            $billRefNumber = $request->input('BillRefNumber'); // Device ID
            $invoiceNumber = $request->input('InvoiceNumber');
            $orgAccountBalance = $request->input('OrgAccountBalance');
            $thirdPartyTransID = $request->input('ThirdPartyTransID');
            $msisdn = $request->input('MSISDN');
            $firstName = $request->input('FirstName');
            $lastName = $request->input('LastName');
            $middleName = $request->input('MiddleName');

            // Find the appliance to get client information
            $appliance = \App\Models\Appliance::where('unit_id', $billRefNumber)
                ->orWhere('serial_number', $billRefNumber)
                ->first();

            $clientId = null;
            $applianceId = null;
            if ($appliance) {
                $clientId = $appliance->client_id;
                $applianceId = $appliance->id;
            }

            // Find expected payment order for this device ID
            $expectedPaymentOrder = \App\Models\PaymentOrder::where('customer_phone', $msisdn)
                ->orWhere(function($query) use ($billRefNumber) {
                    $query->where('notes', 'like', '%' . $billRefNumber . '%')
                          ->orWhereJsonContains('additional_data->device_id', $billRefNumber);
                })
                ->where('status', 'pending')
                ->orderBy('created_at', 'desc')
                ->first();

            // Find active payment plan
            $activePaymentPlan = null;
            if ($appliance) {
                $activePaymentPlan = \App\Models\PaymentPlan::where('client_id', $appliance->client_id)
                    ->where('appliance_id', $appliance->id)
                    ->where('status', 'active')
                    ->first();
            }

            // Determine payment type and expected amount
            $paymentType = 'installment';
            $expectedAmount = null;
            $paymentOrderId = null;
            $paymentPlanId = null;

            if ($expectedPaymentOrder) {
                $paymentType = 'down_payment';
                $expectedAmount = $expectedPaymentOrder->down_payment_amount ?? $expectedPaymentOrder->paid_amount;
                $paymentOrderId = $expectedPaymentOrder->id;
            } elseif ($activePaymentPlan) {
                $paymentType = 'installment';
                $expectedAmount = $activePaymentPlan->installment_amount_ksh ?? $activePaymentPlan->installment_amount_usd;
                
                // Convert USD to KSh if needed
                if (is_null($activePaymentPlan->installment_amount_ksh) && !is_null($activePaymentPlan->installment_amount_usd)) {
                    $expectedAmount = $activePaymentPlan->installment_amount_usd * 130;
                }
                
                $paymentPlanId = $activePaymentPlan->id;
            }

            // Check if amount matches exactly
            $amountMatched = false;
            if ($expectedAmount && (float)$transAmount == (float)$expectedAmount) {
                $amountMatched = true;
            }

            // Create PayBill transaction record
            $paybillTransaction = \App\Models\PaybillTransaction::create([
                'transaction_type' => $transactionType,
                'trans_id' => $transID,
                'trans_time' => $transTime,
                'trans_amount' => $transAmount,
                'business_short_code' => $businessShortCode,
                'bill_ref_number' => $billRefNumber,
                'invoice_number' => $invoiceNumber,
                'org_account_balance' => $orgAccountBalance,
                'third_party_trans_id' => $thirdPartyTransID,
                'msisdn' => $msisdn,
                'first_name' => $firstName,
                'middle_name' => $middleName,
                'last_name' => $lastName,
                'device_id' => $billRefNumber,
                'client_id' => $clientId,
                'appliance_id' => $applianceId,
                'payment_order_id' => $paymentOrderId,
                'payment_plan_id' => $paymentPlanId,
                'payment_type' => $paymentType,
                'expected_amount' => $expectedAmount,
                'amount_matched' => $amountMatched,
                'status' => 'pending',
                'credited_to_account' => false,
                'validation_details' => [
                    'appliance_found' => $appliance ? true : false,
                    'payment_order_found' => $expectedPaymentOrder ? true : false,
                    'payment_plan_found' => $activePaymentPlan ? true : false,
                    'amount_validation' => [
                        'expected' => $expectedAmount,
                        'received' => (float)$transAmount,
                        'matched' => $amountMatched
                    ]
                ],
                'raw_payload' => $request->all(),
            ]);

            Log::info('📝 PayBill Transaction created:', [
                'id' => $paybillTransaction->id,
                'transaction_id' => $transID,
                'device_id' => $billRefNumber,
                'client_id' => $clientId,
                'amount' => $transAmount,
                'expected_amount' => $expectedAmount,
                'amount_matched' => $amountMatched,
                'payment_type' => $paymentType
            ]);

            // Process the payment if amount matched
            if ($amountMatched) {
                $this->processSuccessfulPayBillPayment($paybillTransaction, $expectedPaymentOrder, $activePaymentPlan);
            } else {
                $this->processAmountMismatchPayment($paybillTransaction, $expectedAmount);
            }

            // Also create C2B transaction for backward compatibility (if needed)
            $c2bTransaction = \App\Models\C2BTransaction::create([
                'transaction_type' => $transactionType,
                'trans_id' => $transID,
                'trans_time' => $transTime,
                'trans_amount' => $transAmount,
                'business_short_code' => $businessShortCode,
                'bill_ref_number' => $billRefNumber,
                'invoice_number' => $invoiceNumber,
                'org_account_balance' => $orgAccountBalance,
                'third_party_trans_id' => $thirdPartyTransID,
                'msisdn' => $msisdn,
                'first_name' => $firstName,
                'middle_name' => $middleName,
                'last_name' => $lastName,
                'device_id' => $billRefNumber,
                'payment_type' => $paymentType,
                'raw_payload' => $request->all(),
                'processed' => $amountMatched,
                'verification_status' => $amountMatched ? 'verified' : 'failed',
                'expected_amount' => $expectedAmount,
                'payment_order_id' => $paymentOrderId,
                'payment_status' => $amountMatched ? 'verified' : 'rejected',
            ]);

            return response()->json([
                'ResultDesc' => 'Accepted confirmation.'
            ]);

        } catch (\Exception $e) {
            Log::error('❌ PayBill Confirmation Error:', [
                'error' => $e->getMessage(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'ResultDesc' => 'Error processing confirmation.'
            ]);
        }
    }

    /**
     * Process successful PayBill payment with amount match
     */
    private function processSuccessfulPayBillPayment($paybillTransaction, $paymentOrder = null, $paymentPlan = null)
    {
        try {
            // Mark PayBill transaction as processed
            $paybillTransaction->markAsProcessed('system', 'Payment processed successfully - amount matched exactly');

            // Update payment order if exists
            if ($paymentOrder) {
                $paymentOrder->update([
                    'status' => 'completed',
                    'payment_completed_at' => now(),
                ]);

                Log::info('✅ Payment order completed via PayBill:', [
                    'order_id' => $paymentOrder->id,
                    'paybill_transaction_id' => $paybillTransaction->id,
                    'amount' => $paybillTransaction->trans_amount
                ]);
            }

            // Update payment plan if exists
            if ($paymentPlan) {
                // Increment installments completed
                $paymentPlan->increment('installments_completed');
                $paymentPlan->increment('total_paid_ksh', $paybillTransaction->trans_amount);
                $paymentPlan->decrement('remaining_balance_ksh', $paybillTransaction->trans_amount);
                
                // Update next payment due date
                if ($paymentPlan->payment_frequency === 'weekly') {
                    $paymentPlan->next_payment_due_date = $paymentPlan->next_payment_due_date->addWeeks(1);
                } else {
                    $paymentPlan->next_payment_due_date = $paymentPlan->next_payment_due_date->addMonths(1);
                }
                
                // Check if payment plan is completed
                if ($paymentPlan->installments_completed >= $paymentPlan->total_installments) {
                    $paymentPlan->status = 'completed';
                }
                
                $paymentPlan->save();

                Log::info('✅ Payment plan updated via PayBill:', [
                    'plan_id' => $paymentPlan->id,
                    'installments_completed' => $paymentPlan->installments_completed,
                    'total_installments' => $paymentPlan->total_installments,
                    'remaining_balance' => $paymentPlan->remaining_balance_ksh
                ]);
            }

            // TODO: Additional business logic
            // 1. Send SMS confirmation
            // 2. Update IoT device status
            // 3. Send email receipt
            
        } catch (\Exception $e) {
            Log::error('❌ Error processing successful PayBill payment:', [
                'paybill_transaction_id' => $paybillTransaction->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Process payment with amount mismatch
     */
    private function processAmountMismatchPayment($paybillTransaction, $expectedAmount)
    {
        try {
            $reason = "Amount mismatch: Expected KSh " . number_format($expectedAmount, 2) . 
                     " but received KSh " . number_format($paybillTransaction->trans_amount, 2);
            
            $paybillTransaction->markAsFailed($reason);

            Log::warning('⚠️ PayBill payment amount mismatch:', [
                'paybill_transaction_id' => $paybillTransaction->id,
                'expected_amount' => $expectedAmount,
                'received_amount' => $paybillTransaction->trans_amount,
                'device_id' => $paybillTransaction->device_id
            ]);

            // TODO: Send notification about amount mismatch
            // TODO: Initiate refund process if needed
            
        } catch (\Exception $e) {
            Log::error('❌ Error processing amount mismatch payment:', [
                'paybill_transaction_id' => $paybillTransaction->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Process payment verification using Daraja API and amount checking
     */
    private function processPaymentVerification(C2BTransaction $transaction)
    {
        try {
            Log::info('🔍 Starting payment verification process:', [
                'transaction_id' => $transaction->trans_id,
                'device_id' => $transaction->device_id,
                'amount' => $transaction->trans_amount,
                'expected_amount' => $transaction->expected_amount
            ]);

            // Step 1: Verify payment amount if expected amount is set
            if ($transaction->expected_amount) {
                $amountVerification = $this->verificationService->verifyPaymentAmount(
                    $transaction->trans_amount, 
                    $transaction->expected_amount
                );

                Log::info('💰 Amount verification result:', $amountVerification);

                // If amount is insufficient, reject the payment
                if ($amountVerification['is_insufficient']) {
                    $rejectionReason = $amountVerification['verification_message'];
                    
                    $transaction->markAsRejected($rejectionReason);
                    
                    Log::warning('❌ Payment rejected due to insufficient amount:', [
                        'transaction_id' => $transaction->trans_id,
                        'actual_amount' => $amountVerification['actual_amount'],
                        'expected_amount' => $amountVerification['expected_amount'],
                        'shortfall' => $amountVerification['expected_amount'] - $amountVerification['actual_amount']
                    ]);

                    // Initiate refund for insufficient payment
                    $transaction->requestRefund('Insufficient payment amount - refund initiated');
                    
                    // Send SMS notification to customer about insufficient payment
                    $this->sendInsufficientPaymentNotification($transaction, $amountVerification);
                    
                    return;
                }
            }

            // Step 2: Verify payment with Daraja API
            $darajaVerification = $this->verificationService->verifyPayment(
                $transaction->trans_id,
                $transaction->trans_amount,
                $transaction->device_id
            );

            Log::info('🔍 Daraja verification result:', $darajaVerification);

            // Step 3: Process verification results
            if ($darajaVerification['verified']) {
                // Payment verified successfully
                $transaction->markAsVerified(
                    $darajaVerification['verification_method'],
                    json_encode($darajaVerification)
                );

                // Update payment order status if linked
                if ($transaction->paymentOrder) {
                    $transaction->paymentOrder->markAsCompleted();
                }

                // Process successful payment
                $this->processSuccessfulPayment($transaction);
                
                Log::info('✅ Payment verified and processed successfully:', [
                    'transaction_id' => $transaction->trans_id,
                    'device_id' => $transaction->device_id,
                    'verification_method' => $darajaVerification['verification_method']
                ]);

            } else {
                // Verification failed
                $transaction->markVerificationFailed(json_encode($darajaVerification));
                
                Log::error('❌ Payment verification failed:', [
                    'transaction_id' => $transaction->trans_id,
                    'errors' => $darajaVerification['errors']
                ]);

                // Don't mark as paid if verification fails
                // Keep in pending state for manual review
            }

        } catch (\Exception $e) {
            Log::error('❌ Payment verification process error:', [
                'transaction_id' => $transaction->trans_id,
                'error' => $e->getMessage()
            ]);

            $transaction->markVerificationFailed('Verification process error: ' . $e->getMessage());
        }
    }

    /**
     * Process successful verified payment
     */
    private function processSuccessfulPayment(C2BTransaction $transaction)
    {
        try {
            Log::info('🔄 Processing successful verified payment:', [
                'transaction_id' => $transaction->trans_id,
                'device_id' => $transaction->device_id,
                'amount' => $transaction->trans_amount
            ]);

            // TODO: Implement PayGo business logic
            // 1. Find customer by device ID or phone number
            // 2. Update payment plan balance
            // 3. Check if device should be activated/extended
            // 4. Send SMS confirmation to customer
            // 5. Update IoT device status
            // 6. Create payment receipt
            
            // Mark as processed
            $transaction->update([
                'processed' => true,
                'notes' => 'Payment verified and processed successfully'
            ]);

            // Send success notification
            $this->sendPaymentSuccessNotification($transaction);

            Log::info('✅ Successful payment processing completed:', [
                'transaction_id' => $transaction->trans_id,
                'device_id' => $transaction->device_id
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Successful payment processing error:', [
                'transaction_id' => $transaction->trans_id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send notification for insufficient payment
     */
    private function sendInsufficientPaymentNotification(C2BTransaction $transaction, $amountVerification)
    {
        try {
            $shortfall = $amountVerification['expected_amount'] - $amountVerification['actual_amount'];
            $message = "Dear {$transaction->customer_name}, your payment of KSh " . number_format($transaction->trans_amount, 2) . 
                      " to Paybill {$transaction->business_short_code} for device {$transaction->device_id} is insufficient. " .
                      "Please pay the remaining KSh " . number_format($shortfall, 2) . " to complete your order. " .
                      "Your payment will be refunded if you don't pay the full amount within 24 hours.";

            // TODO: Implement SMS sending service
            Log::info('📱 SMS notification for insufficient payment:', [
                'phone' => $transaction->msisdn,
                'message' => $message
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Failed to send insufficient payment notification:', [
                'transaction_id' => $transaction->trans_id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send notification for successful payment
     */
    private function sendPaymentSuccessNotification(C2BTransaction $transaction)
    {
        try {
            $message = "Dear {$transaction->customer_name}, your payment of KSh " . number_format($transaction->trans_amount, 2) . 
                      " to Paybill {$transaction->business_short_code} for device {$transaction->device_id} has been verified and processed successfully. " .
                      "Thank you for your payment!";

            // TODO: Implement SMS sending service
            Log::info('📱 SMS notification for successful payment:', [
                'phone' => $transaction->msisdn,
                'message' => $message
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Failed to send success notification:', [
                'transaction_id' => $transaction->trans_id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get payment verification status
     * GET /api/paybill/verification-status/{transactionId}
     */
    public function getVerificationStatus($transactionId)
    {
        try {
            $transaction = C2BTransaction::where('trans_id', $transactionId)->first();
            
            if (!$transaction) {
                return response()->json([
                    'success' => false,
                    'error' => 'Transaction not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'transaction_id' => $transaction->trans_id,
                    'device_id' => $transaction->device_id,
                    'amount' => $transaction->trans_amount,
                    'expected_amount' => $transaction->expected_amount,
                    'verification_status' => $transaction->verification_status,
                    'payment_status' => $transaction->payment_status,
                    'amount_verified' => $transaction->amount_verified,
                    'verification_method' => $transaction->verification_method,
                    'verified_at' => $transaction->verified_at,
                    'rejection_reason' => $transaction->rejection_reason,
                    'amount_shortfall' => $transaction->amount_shortfall,
                    'amount_excess' => $transaction->amount_excess,
                    'customer_name' => $transaction->customer_name,
                    'phone' => $transaction->msisdn,
                    'is_sufficient' => $transaction->isAmountSufficient(),
                    'is_verified' => $transaction->isVerified(),
                    'is_rejected' => $transaction->isRejected(),
                    'refund_requested' => $transaction->isRefundRequested(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to get verification status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Manual verification trigger (for admin use)
     * POST /api/paybill/verify-payment/{transactionId}
     */
    public function manualVerifyPayment($transactionId)
    {
        try {
            $transaction = C2BTransaction::where('trans_id', $transactionId)->first();
            
            if (!$transaction) {
                return response()->json([
                    'success' => false,
                    'error' => 'Transaction not found'
                ], 404);
            }

            if ($transaction->isVerified()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Transaction is already verified'
                ], 400);
            }

            // Trigger verification process
            $this->processPaymentVerification($transaction);
            
            // Refresh transaction data
            $transaction->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Verification process triggered successfully',
                'data' => [
                    'verification_status' => $transaction->verification_status,
                    'payment_status' => $transaction->payment_status,
                    'is_verified' => $transaction->isVerified(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Manual verification failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Simulate C2B Paybill payment (for testing)
     * POST /api/paybill/simulate
     */
    public function simulate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone_number' => 'required|string',
            'amount' => 'required|numeric|min:50|max:500000',
            'device_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 400);
        }

        try {
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
                'CommandID' => 'CustomerPayBillOnline',
                'Amount' => $request->amount,
                'Msisdn' => $phoneNumber,
                'BillRefNumber' => $request->device_id,
            ];

            Log::info('🧪 Simulating C2B Paybill Payment:', $payload);

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
                Log::info('✅ C2B Paybill Simulation successful:', $data);
                return response()->json([
                    'success' => true,
                    'message' => 'C2B Paybill payment simulated successfully',
                    'data' => [
                        'shortcode' => $config['shortcode'],
                        'device_id' => $request->device_id,
                        'amount' => $request->amount,
                        'phone_number' => $phoneNumber,
                        'response' => $data
                    ]
                ]);
            } else {
                Log::error('❌ C2B Paybill Simulation Error:', $data);
                return response()->json([
                    'success' => false,
                    'error' => $data['errorMessage'] ?? 'C2B Paybill simulation failed',
                    'error_code' => $data['errorCode'] ?? null
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('❌ C2B Paybill Simulation Exception:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'error' => 'Simulation failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get C2B transaction history
     * GET /api/paybill/transactions
     */
    public function getTransactions(Request $request)
    {
        try {
            $query = C2BTransaction::query();

            // Filters
            if ($request->has('device_id')) {
                $query->where('device_id', $request->device_id);
            }

            if ($request->has('processed')) {
                $query->where('processed', $request->boolean('processed'));
            }

            if ($request->has('phone')) {
                $query->where('msisdn', 'like', '%' . $request->phone . '%');
            }

            if ($request->has('from_date')) {
                $query->whereDate('created_at', '>=', $request->from_date);
            }

            if ($request->has('to_date')) {
                $query->whereDate('created_at', '<=', $request->to_date);
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $transactions = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $transactions->items(),
                'pagination' => [
                    'current_page' => $transactions->currentPage(),
                    'last_page' => $transactions->lastPage(),
                    'per_page' => $transactions->perPage(),
                    'total' => $transactions->total(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching C2B transactions:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch transactions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get KOYO Paybill information for customers
     * GET /api/paybill/info
     */
    public function getPaybillInfo()
    {
        try {
            $config = SystemSetting::getMpesaConfig();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'paybill_number' => $config['shortcode'],
                    'business_name' => 'KOYO PayGo',
                    'account_reference_format' => 'KOYO_DEVICE_ID',
                    'minimum_amount' => 1,
                    'maximum_amount' => 500000,
                    'instructions' => [
                        'Go to M-Pesa menu on your phone',
                        'Select "Lipa na M-Pesa" → "Pay Bill"',
                        'Enter Business Number: ' . $config['shortcode'],
                        'Enter Account Number: Your KOYO device ID (starts with KOYO_)',
                        'Enter Amount: Your payment amount',
                        'Enter your M-Pesa PIN to complete'
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to get Paybill info: ' . $e->getMessage()
            ], 500);
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
     * Check payment status for a device (Public endpoint - no authentication required)
     * GET /api/paybill/payment-status/{deviceId}
     */
    public function checkPaymentStatus($deviceId)
    {
        try {
            Log::info('🔍 Checking payment status for device:', ['device_id' => $deviceId]);

            // Validate device ID format
            if (!str_starts_with($deviceId, 'KOYO_')) {
                return response()->json([
                    'success' => false,
                    'error' => 'Invalid KOYO device ID format',
                    'message' => 'Device ID must start with KOYO_'
                ], 400);
            }

            // Get the latest payment for this device
            $latestPayment = C2BTransaction::where('device_id', $deviceId)
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$latestPayment) {
                return response()->json([
                    'success' => false,
                    'has_payments' => false,
                    'message' => 'No payments found for this device ID',
                    'device_id' => $deviceId
                ]);
            }

            // Get payment summary for this device
            $totalPayments = C2BTransaction::where('device_id', $deviceId)->count();
            $totalAmount = C2BTransaction::where('device_id', $deviceId)->sum('trans_amount');
            $processedPayments = C2BTransaction::where('device_id', $deviceId)
                ->where('processed', true)->count();

            return response()->json([
                'success' => true,
                'has_payments' => true,
                'device_id' => $deviceId,
                'latest_payment' => [
                    'transaction_id' => $latestPayment->trans_id,
                    'amount' => $latestPayment->trans_amount,
                    'formatted_amount' => $latestPayment->getFormattedAmountAttribute(),
                    'customer_name' => $latestPayment->getCustomerNameAttribute(),
                    'phone' => $latestPayment->msisdn,
                    'payment_time' => $latestPayment->trans_time,
                    'created_at' => $latestPayment->created_at->format('Y-m-d H:i:s'),
                    'processed' => $latestPayment->processed,
                    'payment_type' => $latestPayment->payment_type,
                    'notes' => $latestPayment->notes
                ],
                'summary' => [
                    'total_payments' => $totalPayments,
                    'total_amount' => $totalAmount,
                    'formatted_total_amount' => 'KSh ' . number_format($totalAmount, 2),
                    'processed_payments' => $processedPayments,
                    'pending_payments' => $totalPayments - $processedPayments
                ],
                'message' => 'Payment found successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error checking payment status:', [
                'device_id' => $deviceId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to check payment status: ' . $e->getMessage()
            ], 500);
        }
    }
}
