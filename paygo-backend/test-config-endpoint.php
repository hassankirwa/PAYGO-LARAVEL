<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemSetting;

echo "🧪 Testing API Config Endpoint Response:\n";
echo "========================================\n";

// Test what SystemSetting::getApiConfig() returns
$config = SystemSetting::getApiConfig();

echo "Raw SystemSetting::getApiConfig():\n";
echo "  base_url: {$config['base_url']}\n";
echo "  environment: {$config['environment']}\n";
echo "  timeout: {$config['timeout']}\n";
echo "  rate_limit: {$config['rate_limit']}\n\n";

// Test what the API endpoint logic does
$baseUrl = rtrim($config['base_url'], '/');
if (!str_ends_with($baseUrl, '/api')) {
    $baseUrl .= '/api';
}

echo "After endpoint processing:\n";
echo "  api_base_url: {$baseUrl}\n\n";

// Test actual HTTP request to the endpoint
echo "Testing HTTP request to /api/config:\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/api/config');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Content-Type: application/json'
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✅ HTTP 200 Response:\n";
    $data = json_decode($response, true);
    echo "  api_base_url: {$data['api_base_url']}\n";
    echo "  environment: {$data['config']['environment']}\n";
} else {
    echo "❌ HTTP {$httpCode}\n";
    echo "Response: {$response}\n";
} 