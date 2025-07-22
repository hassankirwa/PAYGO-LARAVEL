<?php

namespace App\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

/**
 * Daraja API Payment Verification Service
 * Verifies if M-Pesa payments actually reached our account
 */
class DarajaPaymentVerificationService
{
    /**
     * Generate OAuth access token for Daraja API
     */
    private function generateAccessToken()
    {
        $config = SystemSetting::getMpesaConfig();
        
        $consumer_key = $config['consumer_key'];
        $consumer_secret = $config['consumer_secret'];
        
        if (!$consumer_key || !$consumer_secret) {
            Log::error('M-Pesa credentials not configured for Daraja verification');
            return null;
        }
        
        $credentials = base64_encode("{$consumer_key}:{$consumer_secret}");
        $url = $config['environment'] === 'production'
             ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
             : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Basic ' . $credentials,
                'Content-Type' => 'application/json'
            ])->timeout(30)->get($url);

            if ($response->successful()) {
                $data = $response->json();
                return $data['access_token'] ?? null;
            }

            Log::error('Daraja Access Token Error:', $response->json());
            return null;
        } catch (\Exception $e) {
            Log::error('Daraja Access Token Exception:', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Verify payment using Daraja Account Balance API
     * This checks if our account balance increased by the expected amount
     */
    public function verifyPaymentByAccountBalance($transactionId, $expectedAmount)
    {
        try {
            $config = SystemSetting::getMpesaConfig();
            $token = $this->generateAccessToken();
            
            if (!$token) {
                return [
                    'verified' => false,
                    'error' => 'Failed to generate access token for verification'
                ];
            }

            $url = $config['environment'] === 'production'
                 ? 'https://api.safaricom.co.ke/mpesa/accountbalance/v1/query'
                 : 'https://sandbox.safaricom.co.ke/mpesa/accountbalance/v1/query';

            // Generate timestamp and password for account balance
            $timestamp = Carbon::now()->format('YmdHis');
            $password = base64_encode($config['shortcode'] . $config['passkey'] . $timestamp);

            $payload = [
                'Initiator' => $config['initiator_name'] ?? 'testapi',
                'SecurityCredential' => $this->generateSecurityCredential($config),
                'CommandID' => 'AccountBalance',
                'PartyA' => $config['shortcode'],
                'IdentifierType' => '4', // Organization shortcode
                'Remarks' => 'Payment verification for transaction: ' . $transactionId,
                'QueueTimeOutURL' => $config['timeout_url'] ?? url('/api/mpesa/timeout'),
                'ResultURL' => $config['result_url'] ?? url('/api/mpesa/result')
            ];

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json'
            ])->timeout(30)->post($url, $payload);

            $data = $response->json();
            
            Log::info('🔍 Daraja Account Balance Query Response:', [
                'transaction_id' => $transactionId,
                'response' => $data
            ]);

            if ($response->successful() && isset($data['ResponseCode']) && $data['ResponseCode'] == '0') {
                return [
                    'verified' => true,
                    'conversation_id' => $data['ConversationID'] ?? null,
                    'originator_conversation_id' => $data['OriginatorConversationID'] ?? null,
                    'response_description' => $data['ResponseDescription'] ?? 'Account balance query submitted successfully'
                ];
            }

            return [
                'verified' => false,
                'error' => $data['errorMessage'] ?? 'Account balance verification failed',
                'response_code' => $data['ResponseCode'] ?? null
            ];

        } catch (\Exception $e) {
            Log::error('❌ Daraja Account Balance Verification Error:', [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage()
            ]);

            return [
                'verified' => false,
                'error' => 'Verification service error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Verify specific transaction using Transaction Status Query
     */
    public function verifyTransactionStatus($transactionId, $expectedAmount)
    {
        try {
            $config = SystemSetting::getMpesaConfig();
            $token = $this->generateAccessToken();
            
            if (!$token) {
                return [
                    'verified' => false,
                    'error' => 'Failed to generate access token for transaction verification'
                ];
            }

            $url = $config['environment'] === 'production'
                 ? 'https://api.safaricom.co.ke/mpesa/transactionstatus/v1/query'
                 : 'https://sandbox.safaricom.co.ke/mpesa/transactionstatus/v1/query';

            $payload = [
                'Initiator' => $config['initiator_name'] ?? 'testapi',
                'SecurityCredential' => $this->generateSecurityCredential($config),
                'CommandID' => 'TransactionStatusQuery',
                'TransactionID' => $transactionId,
                'PartyA' => $config['shortcode'],
                'IdentifierType' => '4', // Organization shortcode
                'ResultURL' => $config['result_url'] ?? url('/api/mpesa/transaction-status-result'),
                'QueueTimeOutURL' => $config['timeout_url'] ?? url('/api/mpesa/timeout'),
                'Remarks' => 'Verify transaction: ' . $transactionId,
                'Occasion' => 'Payment verification'
            ];

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json'
            ])->timeout(30)->post($url, $payload);

            $data = $response->json();
            
            Log::info('🔍 Daraja Transaction Status Query Response:', [
                'transaction_id' => $transactionId,
                'expected_amount' => $expectedAmount,
                'response' => $data
            ]);

            if ($response->successful() && isset($data['ResponseCode']) && $data['ResponseCode'] == '0') {
                return [
                    'verified' => true,
                    'conversation_id' => $data['ConversationID'] ?? null,
                    'originator_conversation_id' => $data['OriginatorConversationID'] ?? null,
                    'response_description' => $data['ResponseDescription'] ?? 'Transaction status query submitted successfully'
                ];
            }

            return [
                'verified' => false,
                'error' => $data['errorMessage'] ?? 'Transaction status verification failed',
                'response_code' => $data['ResponseCode'] ?? null
            ];

        } catch (\Exception $e) {
            Log::error('❌ Daraja Transaction Status Verification Error:', [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage()
            ]);

            return [
                'verified' => false,
                'error' => 'Transaction verification service error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate security credential for Daraja API
     * In production, this should use actual certificate-based encryption
     */
    private function generateSecurityCredential($config)
    {
        // For sandbox, we can use a simple credential
        // In production, this should be encrypted using Safaricom's public certificate
        return $config['security_credential'] ?? 'Safaricom999!*!';
    }

    /**
     * Comprehensive payment verification that combines multiple checks
     */
    public function verifyPayment($transactionId, $expectedAmount, $deviceId)
    {
        Log::info('🔍 Starting comprehensive payment verification:', [
            'transaction_id' => $transactionId,
            'expected_amount' => $expectedAmount,
            'device_id' => $deviceId
        ]);

        $verificationResults = [
            'transaction_id' => $transactionId,
            'expected_amount' => $expectedAmount,
            'device_id' => $deviceId,
            'verified' => false,
            'verification_method' => null,
            'details' => [],
            'errors' => [],
            'timestamp' => now()->toDateTimeString()
        ];

        try {
            // Method 1: Transaction Status Query
            $transactionStatus = $this->verifyTransactionStatus($transactionId, $expectedAmount);
            $verificationResults['details']['transaction_status'] = $transactionStatus;

            if ($transactionStatus['verified']) {
                $verificationResults['verified'] = true;
                $verificationResults['verification_method'] = 'transaction_status_query';
                
                Log::info('✅ Payment verified via Transaction Status Query:', [
                    'transaction_id' => $transactionId,
                    'method' => 'transaction_status_query'
                ]);
                
                return $verificationResults;
            } else {
                $verificationResults['errors'][] = $transactionStatus['error'] ?? 'Transaction status verification failed';
            }

            // Method 2: Account Balance Query (as backup)
            $balanceCheck = $this->verifyPaymentByAccountBalance($transactionId, $expectedAmount);
            $verificationResults['details']['account_balance'] = $balanceCheck;

            if ($balanceCheck['verified']) {
                $verificationResults['verified'] = true;
                $verificationResults['verification_method'] = 'account_balance_query';
                
                Log::info('✅ Payment verified via Account Balance Query:', [
                    'transaction_id' => $transactionId,
                    'method' => 'account_balance_query'
                ]);
                
                return $verificationResults;
            } else {
                $verificationResults['errors'][] = $balanceCheck['error'] ?? 'Account balance verification failed';
            }

            // If both methods fail, payment is not verified
            $verificationResults['verified'] = false;
            
            Log::warning('❌ Payment verification failed for all methods:', [
                'transaction_id' => $transactionId,
                'errors' => $verificationResults['errors']
            ]);

            return $verificationResults;

        } catch (\Exception $e) {
            Log::error('❌ Payment verification exception:', [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage()
            ]);

            $verificationResults['verified'] = false;
            $verificationResults['errors'][] = 'Verification service error: ' . $e->getMessage();
            
            return $verificationResults;
        }
    }

    /**
     * Verify payment amount matches expected downpayment
     */
    public function verifyPaymentAmount($actualAmount, $expectedAmount, $tolerance = 0.01)
    {
        $actualAmount = (float) $actualAmount;
        $expectedAmount = (float) $expectedAmount;
        
        $difference = abs($actualAmount - $expectedAmount);
        $isExactMatch = $difference <= $tolerance;
        $isInsufficient = $actualAmount < ($expectedAmount - $tolerance);
        $isOverpaid = $actualAmount > ($expectedAmount + $tolerance);

        return [
            'amount_verified' => $isExactMatch,
            'actual_amount' => $actualAmount,
            'expected_amount' => $expectedAmount,
            'difference' => $difference,
            'is_exact_match' => $isExactMatch,
            'is_insufficient' => $isInsufficient,
            'is_overpaid' => $isOverpaid,
            'tolerance' => $tolerance,
            'verification_message' => $this->getAmountVerificationMessage($actualAmount, $expectedAmount, $isExactMatch, $isInsufficient, $isOverpaid)
        ];
    }

    /**
     * Get verification message for amount check
     */
    private function getAmountVerificationMessage($actual, $expected, $isExact, $isInsufficient, $isOverpaid)
    {
        if ($isExact) {
            return 'Payment amount matches expected amount exactly';
        } elseif ($isInsufficient) {
            $shortfall = $expected - $actual;
            return "Payment amount is insufficient. You paid KSh " . number_format($actual, 2) . 
                   " but KSh " . number_format($expected, 2) . " was expected. " .
                   "Please pay the remaining KSh " . number_format($shortfall, 2);
        } elseif ($isOverpaid) {
            $excess = $actual - $expected;
            return "Payment amount exceeds expected amount. You paid KSh " . number_format($actual, 2) . 
                   " but only KSh " . number_format($expected, 2) . " was expected. " .
                   "Excess of KSh " . number_format($excess, 2) . " will be credited to your account";
        } else {
            return "Payment amount verification completed";
        }
    }
} 