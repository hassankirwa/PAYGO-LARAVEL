<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Log;

function generateAccessToken()
{
    echo "🔑 Step 1: Generating M-Pesa Access Token...\n";
    
    $config = SystemSetting::getMpesaConfig();
    
    $consumer_key = $config['consumer_key'];
    $consumer_secret = $config['consumer_secret'];
    
    if (!$consumer_key || !$consumer_secret) {
        echo "❌ M-Pesa credentials not configured\n";
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
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if ($httpCode == 200) {
        $body = json_decode($response);
        $token = $body->access_token ?? null;
        
        if ($token) {
            echo "✅ Access Token Generated: " . substr($token, 0, 20) . "...\n";
            return $token;
        }
    }
    
    echo "❌ Failed to generate access token. HTTP Code: {$httpCode}\n";
    echo "Response: {$response}\n";
    return null;
}

function registerMpesaUrls($accessToken)
{
    echo "\n📡 Step 2: Registering M-Pesa C2B URLs with Safaricom...\n";
    
    // Get configuration
    $environment = config('mpesa.environment', 'sandbox');
    $shortCode = config('mpesa.c2b_shortcode', '174379'); // PayGo PayBill number
    $baseUrl = config('app.url', 'https://68f2b04045a4.ngrok-free.app'); // Update this!
    
    // Define URLs
    $validationUrl = $baseUrl . '/api/paybill/validation';
    $confirmationUrl = $baseUrl . '/api/paybill/confirmation';
    $responseType = config('mpesa.c2b_response_type', 'Completed');
    
    echo "🏢 Environment: {$environment}\n";
    echo "🔢 Short Code: {$shortCode}\n";
    echo "🌐 Base URL: {$baseUrl}\n";
    echo "✅ Validation URL: {$validationUrl}\n";
    echo "✅ Confirmation URL: {$confirmationUrl}\n";
    echo "⚙️ Response Type: {$responseType}\n\n";
    
    // Prepare the registration payload
    $registrationData = [
        'ShortCode' => $shortCode,
        'ResponseType' => $responseType,
        'ConfirmationURL' => $confirmationUrl,
        'ValidationURL' => $validationUrl
    ];
    
    // M-Pesa Register URL API endpoint
    $apiUrl = $environment === 'production'
        ? 'https://api.safaricom.co.ke/mpesa/c2b/v1/registerurl'
        : 'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl';
    
    echo "🎯 API Endpoint: {$apiUrl}\n";
    echo "📦 Payload: " . json_encode($registrationData, JSON_PRETTY_PRINT) . "\n\n";
    
    // Make the API call
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => $apiUrl,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            "Authorization: Bearer {$accessToken}"
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($registrationData),
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT => 30,
    ]);

    echo "🚀 Making API call to Safaricom...\n";
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $curlError = curl_error($curl);
    curl_close($curl);

    echo "📡 HTTP Response Code: {$httpCode}\n";
    
    if ($curlError) {
        echo "❌ CURL Error: {$curlError}\n";
        return false;
    }
    
    echo "📄 Raw Response: {$response}\n\n";
    
    // Parse response
    $responseData = json_decode($response, true);
    
    if ($httpCode == 200) {
        if (isset($responseData['ResponseCode']) && $responseData['ResponseCode'] == '0') {
            echo "🎉 SUCCESS: URLs registered successfully with M-Pesa!\n";
            echo "✅ Response Code: {$responseData['ResponseCode']}\n";
            echo "✅ Response Description: {$responseData['ResponseDescription']}\n";
            
            // Log success
            echo "\n📝 What this means:\n";
            echo "   • M-Pesa will now send validation requests to: {$validationUrl}\n";
            echo "   • M-Pesa will send confirmation notifications to: {$confirmationUrl}\n";
            echo "   • Your PayBill {$shortCode} is ready to receive C2B payments\n";
            echo "   • Response Type '{$responseType}' is configured\n";
            
            return true;
        } else {
            echo "❌ FAILED: M-Pesa returned an error\n";
            echo "❌ Response Code: " . ($responseData['ResponseCode'] ?? 'Unknown') . "\n";
            echo "❌ Response Description: " . ($responseData['ResponseDescription'] ?? 'Unknown') . "\n";
            
            if (isset($responseData['errorCode'])) {
                echo "❌ Error Code: {$responseData['errorCode']}\n";
                echo "❌ Error Message: {$responseData['errorMessage']}\n";
            }
            
            return false;
        }
    } else {
        echo "❌ HTTP Error: {$httpCode}\n";
        
        if (isset($responseData['errorCode'])) {
            echo "❌ Error Code: {$responseData['errorCode']}\n";
            echo "❌ Error Message: {$responseData['errorMessage']}\n";
        }
        
        // Common error explanations
        switch ($httpCode) {
            case 400:
                echo "💡 Bad Request - Check your payload format and required fields\n";
                break;
            case 401:
                echo "💡 Unauthorized - Access token might be invalid or expired\n";
                break;
            case 403:
                echo "💡 Forbidden - Check your consumer key/secret and permissions\n";
                break;
            case 500:
                echo "💡 Server Error - M-Pesa API might be down, try again later\n";
                break;
        }
        
        return false;
    }
}

function validateConfiguration()
{
    echo "🔍 Step 0: Validating Configuration...\n";
    
    $config = SystemSetting::getMpesaConfig();
    $baseUrl = config('app.url');
    
    $issues = [];
    
    if (empty($config['consumer_key'])) {
        $issues[] = "Missing M-Pesa consumer key";
    }
    
    if (empty($config['consumer_secret'])) {
        $issues[] = "Missing M-Pesa consumer secret";
    }
    
    if (empty($baseUrl) || $baseUrl === 'http://localhost') {
        $issues[] = "Base URL is localhost - M-Pesa needs publicly accessible URLs";
    }
    
    if (!filter_var($baseUrl, FILTER_VALIDATE_URL)) {
        $issues[] = "Invalid base URL format";
    }
    
    if (empty($issues)) {
        echo "✅ Configuration looks good!\n\n";
        return true;
    } else {
        echo "❌ Configuration Issues Found:\n";
        foreach ($issues as $issue) {
            echo "   • {$issue}\n";
        }
        echo "\n💡 Fix these issues before proceeding:\n";
        echo "   1. Set M-Pesa credentials in system_settings table\n";
        echo "   2. Update APP_URL in .env to your public domain (not localhost)\n";
        echo "   3. For development, use ngrok: ngrok http 8000\n\n";
        return false;
    }
}

// Main execution
echo "🚀 M-Pesa C2B URL Registration Test\n";
echo "=====================================\n\n";

if (!validateConfiguration()) {
    echo "❌ Cannot proceed due to configuration issues.\n";
    exit(1);
}

$accessToken = generateAccessToken();

if (!$accessToken) {
    echo "❌ Cannot proceed without access token.\n";
    exit(1);
}

$success = registerMpesaUrls($accessToken);

echo "\n" . str_repeat("=", 50) . "\n";

if ($success) {
    echo "🎉 REGISTRATION COMPLETED SUCCESSFULLY!\n\n";
    echo "📋 Next Steps:\n";
    echo "   1. Test validation endpoint: GET /api/paybill/validation\n";
    echo "   2. Test confirmation endpoint: GET /api/paybill/confirmation\n";
    echo "   3. Simulate a C2B payment to test the flow\n";
    echo "   4. Monitor Laravel logs for incoming webhook calls\n\n";
    echo "🔔 Important Notes:\n";
    echo "   • URLs are now registered with M-Pesa sandbox\n";
    echo "   • Keep your Laravel app running to receive webhooks\n";
    echo "   • In production, you can only register URLs once\n";
    echo "   • For production, contact M-Pesa support for validation activation\n";
} else {
    echo "❌ REGISTRATION FAILED!\n\n";
    echo "🔧 Troubleshooting:\n";
    echo "   1. Check your internet connection\n";
    echo "   2. Verify M-Pesa credentials in system_settings\n";
    echo "   3. Ensure APP_URL is publicly accessible\n";
    echo "   4. Try again in a few minutes\n";
    echo "   5. Check M-Pesa API status\n";
}

echo "\n";