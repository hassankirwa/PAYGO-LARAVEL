<?php

echo "🔧 Testing API Config Endpoint\n";
echo "==============================\n\n";

// Test the API config endpoint
$url = 'http://localhost:8000/api/config';

echo "📡 Testing: $url\n";

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => [
            'Content-Type: application/json',
            'Accept: application/json',
            'ngrok-skip-browser-warning: true'
        ]
    ]
]);

try {
    $response = file_get_contents($url, false, $context);
    
    if ($response === false) {
        echo "❌ Failed to connect to API config endpoint\n";
        echo "   Make sure Laravel server is running on port 8000\n";
    } else {
        echo "✅ API Config Response:\n";
        echo $response . "\n\n";
        
        $data = json_decode($response, true);
        if ($data) {
            echo "📋 Parsed Response:\n";
            print_r($data);
        }
    }
} catch (Exception $e) {
    echo "💥 Error: " . $e->getMessage() . "\n";
}

echo "\n🔍 If this fails, run: php artisan serve --host=0.0.0.0 --port=8000\n"; 