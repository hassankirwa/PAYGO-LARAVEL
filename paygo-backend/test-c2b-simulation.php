<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\SystemSetting;

function generateAccessToken()
{
    $config = SystemSetting::getMpesaConfig();
    
    $consumer_key = $config['consumer_key'];
    $consumer_secret = $config['consumer_secret'];
    
    if (!$consumer_key || !$consumer_secret) {
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

echo "🧪 Simulating C2B PayBill Payment\n";
echo "=================================\n\n";

// Generate access token
echo "🔑 Step 1: Getting access token...\n";
$token = generateAccessToken();

if (!$token) {
    echo "❌ Failed to get access token\n";
    exit(1);
}

echo "✅ Access token obtained\n\n";

// Simulate payment
echo "💰 Step 2: Simulating PayBill payment...\n";

$config = SystemSetting::getMpesaConfig();
$url = $config['environment'] === 'production'
     ? 'https://api.safaricom.co.ke/mpesa/c2b/v1/simulate'
     : 'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/simulate';

$payload = [
    'ShortCode' => $config['shortcode'] ?? '174379',
    'CommandID' => 'CustomerPayBillOnline',
    'Amount' => 1000,
    'Msisdn' => '254703822480',
    'BillRefNumber' => 'KY001', // Test device ID
];

echo "🎯 API URL: {$url}\n";
echo "📦 Payload: " . json_encode($payload, JSON_PRETTY_PRINT) . "\n\n";

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

echo "📡 HTTP Code: {$httpCode}\n";
echo "📄 Response: {$response}\n\n";


$data = json_decode($response, true);

if ($httpCode == 200) {
    echo "🎉 SUCCESS: C2B payment simulation initiated!\n";
    echo "✅ This should trigger validation and confirmation calls to your endpoints\n\n";
    
    echo "📋 What happens next:\n";
    echo "   1. M-Pesa calls your validation endpoint\n";
    echo "   2. If validated, M-Pesa processes the payment\n";
    echo "   3. M-Pesa calls your confirmation endpoint\n";
    echo "   4. Check your Laravel logs to see the webhook calls\n\n";
    
    echo "🔍 Monitor logs with: tail -f storage/logs/laravel.log\n";
} else {
    echo "❌ FAILED: C2B simulation failed\n";
    echo "Error: " . ($data['errorMessage'] ?? 'Unknown error') . "\n";
}

echo "\n" . str_repeat("=", 50) . "\n";
echo "🎉 C2B simulation test completed!\n";