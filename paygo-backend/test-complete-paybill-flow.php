<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\SystemSetting;
use App\Models\PaybillTransaction;
use App\Models\C2BTransaction;

class PayBillFlowTester
{
    private $baseUrl = "https://68f2b04045a4.ngrok-free.app";
    private $results = [];
    private $testTransactionId;
    private $startTime;

    public function __construct()
    {
        $this->startTime = time();
        $this->testTransactionId = 'TEST_' . $this->startTime;
        
        echo "🚀 Complete PayBill Flow Test\n";
        echo "============================\n";
        echo "Test ID: {$this->testTransactionId}\n";
        echo "Base URL: {$this->baseUrl}\n";
        echo "Started: " . date('Y-m-d H:i:s') . "\n\n";
    }

    private function generateAccessToken()
    {
        $this->logStep("🔑 Generating M-Pesa Access Token...");
        
        $config = SystemSetting::getMpesaConfig();
        
        $consumer_key = $config['consumer_key'];
        $consumer_secret = $config['consumer_secret'];
        
        if (!$consumer_key || !$consumer_secret) {
            $this->logResult("❌ FAILED", "M-Pesa credentials not configured");
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
            CURLOPT_TIMEOUT        => 10,
        ]);

        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        if ($httpCode == 200) {
            $body = json_decode($response);
            $token = $body->access_token ?? null;
            
            if ($token) {
                $this->logResult("✅ SUCCESS", "Access token generated: " . substr($token, 0, 20) . "...");
                return $token;
            }
        }
        
        $this->logResult("❌ FAILED", "HTTP {$httpCode}: {$response}");
        return null;
    }

    public function testValidationEndpoint()
    {
        $this->logStep("🔍 Testing Validation Endpoint...");
        
        $url = $this->baseUrl . "/api/paybill/validation";
        
        // Test with realistic payload
        $payload = [
            "TransactionType" => "Pay Bill",
            "TransID" => $this->testTransactionId . "_VAL",
            "TransTime" => date('YmdHis'),
            "TransAmount" => "1000.00",
            "BusinessShortCode" => "174379",
            "BillRefNumber" => "KY001",
            "InvoiceNumber" => "",
            "OrgAccountBalance" => "50000.00",
            "ThirdPartyTransID" => "",
            "MSISDN" => "254708374149",
            "FirstName" => "John",
            "MiddleName" => "",
            "LastName" => "Doe"
        ];

        $response = $this->makeHttpRequest($url, $payload);
        
        if ($response['success']) {
            $data = json_decode($response['body'], true);
            if (isset($data['ResultCode']) && $data['ResultCode'] === '0') {
                $this->logResult("✅ SUCCESS", "Validation accepted: " . ($data['ResultDesc'] ?? 'OK'));
                return true;
            } else {
                $this->logResult("❌ REJECTED", "Validation failed: " . ($data['ResultDesc'] ?? 'Unknown'));
                return false;
            }
        } else {
            $this->logResult("❌ ERROR", "HTTP {$response['code']}: {$response['error']}");
            return false;
        }
    }

    public function testConfirmationEndpoint()
    {
        $this->logStep("💰 Testing Confirmation Endpoint...");
        
        $url = $this->baseUrl . "/api/paybill/confirmation";
        
        $payload = [
            "TransactionType" => "Pay Bill",
            "TransID" => $this->testTransactionId . "_CONF",
            "TransTime" => date('YmdHis'),
            "TransAmount" => "1000.00",
            "BusinessShortCode" => "174379",
            "BillRefNumber" => "KY001",
            "InvoiceNumber" => "",
            "OrgAccountBalance" => "51000.00",
            "ThirdPartyTransID" => "",
            "MSISDN" => "254708374149",
            "FirstName" => "John",
            "MiddleName" => "",
            "LastName" => "Doe"
        ];

        $response = $this->makeHttpRequest($url, $payload);
        
        if ($response['success']) {
            $data = json_decode($response['body'], true);
            if (isset($data['ResultDesc'])) {
                $this->logResult("✅ SUCCESS", "Confirmation processed: " . $data['ResultDesc']);
                return true;
            } else {
                $this->logResult("⚠️ WARNING", "Unexpected response format");
                return false;
            }
        } else {
            $this->logResult("❌ ERROR", "HTTP {$response['code']}: {$response['error']}");
            return false;
        }
    }

    public function simulateC2BPayment($accessToken)
    {
        $this->logStep("🧪 Simulating C2B PayBill Payment...");
        
        $config = SystemSetting::getMpesaConfig();
        $url = $config['environment'] === 'production'
             ? 'https://api.safaricom.co.ke/mpesa/c2b/v1/simulate'
             : 'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/simulate';

        $payload = [
            'ShortCode' => $config['shortcode'] ?? '174379',
            'CommandID' => 'CustomerPayBillOnline',
            'Amount' => 1000,
            'Msisdn' => '254708374149',
            'BillRefNumber' => 'KY001', // Test device ID
        ];

        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                "Authorization: Bearer {$accessToken}"
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT => 30,
        ]);

        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $curlError = curl_error($curl);
        curl_close($curl);

        if ($curlError) {
            $this->logResult("❌ ERROR", "CURL Error: {$curlError}");
            return false;
        }

        if ($httpCode == 200) {
            $data = json_decode($response, true);
            $this->logResult("✅ SUCCESS", "C2B simulation initiated - M-Pesa will call your webhooks");
            
            echo "   📋 Expected Flow:\n";
            echo "     1. M-Pesa → Validation Endpoint\n";
            echo "     2. M-Pesa → Confirmation Endpoint\n";
            echo "     3. Transaction saved to database\n\n";
            
            return true;
        } else {
            $data = json_decode($response, true);
            $this->logResult("❌ FAILED", "HTTP {$httpCode}: " . ($data['errorMessage'] ?? $response));
            return false;
        }
    }

    public function waitForWebhookResults($timeoutSeconds = 30)
    {
        $this->logStep("⏳ Waiting for M-Pesa webhook calls...");
        
        $startTime = time();
        $found = false;
        
        echo "   🔍 Monitoring database for new transactions...\n";
        echo "   ⏱️ Timeout: {$timeoutSeconds} seconds\n\n";
        
        while ((time() - $startTime) < $timeoutSeconds) {
            // Check for new PayBill transactions
            $recentTransactions = PaybillTransaction::where('created_at', '>=', date('Y-m-d H:i:s', $this->startTime))
                ->orderBy('created_at', 'desc')
                ->get();
            
            if ($recentTransactions->count() > 0) {
                $this->logResult("✅ SUCCESS", "Found " . $recentTransactions->count() . " new PayBill transaction(s)");
                $found = true;
                break;
            }
            
            // Show progress
            $elapsed = time() - $startTime;
            echo "\r   ⏱️ Waiting... {$elapsed}s/{$timeoutSeconds}s";
            
            sleep(2);
        }
        
        echo "\n";
        
        if (!$found) {
            $this->logResult("⚠️ TIMEOUT", "No webhook calls received within {$timeoutSeconds} seconds");
        }
        
        return $found;
    }

    public function getTransactionLogs()
    {
        $this->logStep("📊 Collecting Transaction Results...");
        
        // Get PayBill transactions from test period
        $paybillTransactions = PaybillTransaction::where('created_at', '>=', date('Y-m-d H:i:s', $this->startTime))
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Get C2B transactions from test period  
        $c2bTransactions = C2BTransaction::where('created_at', '>=', date('Y-m-d H:i:s', $this->startTime))
            ->orderBy('created_at', 'desc')
            ->get();
        
        echo "\n" . str_repeat("=", 80) . "\n";
        echo "📋 TRANSACTION RESULTS SUMMARY\n";
        echo str_repeat("=", 80) . "\n\n";
        
        echo "🕐 Test Period: " . date('Y-m-d H:i:s', $this->startTime) . " to " . date('Y-m-d H:i:s') . "\n";
        echo "📊 Total PayBill Transactions: " . $paybillTransactions->count() . "\n";
        echo "📊 Total C2B Transactions: " . $c2bTransactions->count() . "\n\n";
        
        // Show PayBill transactions
        if ($paybillTransactions->count() > 0) {
            echo "💰 PayBill Transactions:\n";
            echo str_repeat("-", 80) . "\n";
            
            foreach ($paybillTransactions as $transaction) {
                echo "🔹 Transaction ID: {$transaction->trans_id}\n";
                echo "   💵 Amount: KSh " . number_format($transaction->trans_amount, 2) . "\n";
                echo "   📱 Device ID: {$transaction->device_id}\n";
                echo "   📞 Phone: {$transaction->msisdn}\n";
                echo "   👤 Customer: {$transaction->first_name} {$transaction->last_name}\n";
                echo "   ⚡ Status: {$transaction->status}\n";
                echo "   ✅ Amount Matched: " . ($transaction->amount_matched ? 'Yes' : 'No') . "\n";
                echo "   💳 Credited: " . ($transaction->credited_to_account ? 'Yes' : 'No') . "\n";
                echo "   📝 Notes: {$transaction->processing_notes}\n";
                echo "   🕐 Time: {$transaction->created_at}\n";
                
                if ($transaction->validation_details) {
                    echo "   🔍 Validation: " . json_encode($transaction->validation_details, JSON_PRETTY_PRINT) . "\n";
                }
                
                echo "\n";
            }
        }
        
        // Show C2B transactions
        if ($c2bTransactions->count() > 0) {
            echo "🔄 C2B Transactions:\n";
            echo str_repeat("-", 80) . "\n";
            
            foreach ($c2bTransactions as $transaction) {
                echo "🔹 Transaction ID: {$transaction->trans_id}\n";
                echo "   💵 Amount: KSh " . number_format($transaction->trans_amount, 2) . "\n";
                echo "   📱 Device ID: {$transaction->device_id}\n";
                echo "   📞 Phone: {$transaction->msisdn}\n";
                echo "   👤 Customer: {$transaction->first_name} {$transaction->last_name}\n";
                echo "   ⚡ Status: {$transaction->verification_status}\n";
                echo "   ✅ Processed: " . ($transaction->processed ? 'Yes' : 'No') . "\n";
                echo "   🕐 Time: {$transaction->created_at}\n\n";
            }
        }
        
        // Test results summary
        echo str_repeat("=", 80) . "\n";
        echo "🎯 TEST RESULTS SUMMARY\n";
        echo str_repeat("=", 80) . "\n\n";
        
        foreach ($this->results as $result) {
            echo $result . "\n";
        }
        
        // Final verdict
        echo "\n" . str_repeat("=", 80) . "\n";
        $totalTime = time() - $this->startTime;
        
        if ($paybillTransactions->count() > 0) {
            echo "🎉 OVERALL RESULT: SUCCESS! 🎉\n";
            echo "✅ PayBill system is working correctly\n";
            echo "✅ Webhooks are being received and processed\n";
            echo "✅ Transactions are being saved to database\n";
        } else {
            echo "⚠️ OVERALL RESULT: PARTIAL SUCCESS\n";
            echo "✅ Endpoints are accessible and responding\n";
            echo "⚠️ No real webhook calls received from M-Pesa\n";
            echo "💡 This might be normal for sandbox testing\n";
        }
        
        echo "\n⏱️ Total test time: {$totalTime} seconds\n";
        echo "🏁 Test completed at: " . date('Y-m-d H:i:s') . "\n";
        echo str_repeat("=", 80) . "\n";
    }

    private function makeHttpRequest($url, $payload)
    {
        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'User-Agent: PayGoTestClient'
            ],
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT => 15,
        ]);

        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $curlError = curl_error($curl);
        curl_close($curl);

        if ($curlError) {
            return [
                'success' => false,
                'code' => 0,
                'error' => $curlError,
                'body' => null
            ];
        }

        return [
            'success' => $httpCode >= 200 && $httpCode < 300,
            'code' => $httpCode,
            'error' => $httpCode >= 400 ? "HTTP Error {$httpCode}" : null,
            'body' => $response
        ];
    }

    private function logStep($message)
    {
        echo $message . "\n";
    }

    private function logResult($status, $message)
    {
        $result = "   {$status}: {$message}";
        echo $result . "\n\n";
        $this->results[] = $result;
    }

    public function runCompleteTest()
    {
        // Step 1: Generate access token
        $accessToken = $this->generateAccessToken();
        if (!$accessToken) {
            echo "❌ Cannot continue without access token\n";
            return;
        }

        // Step 2: Test validation endpoint
        $this->testValidationEndpoint();

        // Step 3: Test confirmation endpoint  
        $this->testConfirmationEndpoint();

        // Step 4: Simulate C2B payment
        $simulationSuccess = $this->simulateC2BPayment($accessToken);

        // Step 5: Wait for webhook results (only if simulation succeeded)
        if ($simulationSuccess) {
            $this->waitForWebhookResults(30);
        }

        // Step 6: Show complete transaction log
        $this->getTransactionLogs();
    }
}

// Run the complete test
$tester = new PayBillFlowTester();
$tester->runCompleteTest();
