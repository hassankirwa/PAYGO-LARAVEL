<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Log;

function generateAccessToken()
{
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

    echo "🔗 URL: {$url}\n";
    echo "🔑 Credentials: Basic {$credentials}\n";

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

    echo "📡 HTTP Code: {$httpCode}\n";
    echo "📄 Raw Response: {$response}\n";

    $body = json_decode($response);
    $token = $body->access_token ?? null;
    
    if ($token) {
        echo "✅ Access Token: {$token}\n";
        echo "📏 Token Length: " . strlen($token) . " characters\n";
    } else {
        echo "❌ Failed to extract access token\n";
    }
    
    return $token;
}

echo "🚀 Testing M-Pesa Access Token Generation\n";
echo "==========================================\n";

generateAccessToken();