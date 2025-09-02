<?php

echo "🔧 Testing CORS Headers\n";
echo "======================\n\n";

$testOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://fb8f95b65e4d.ngrok-free.app',
];

$testUrl = 'https://fb8f95b65e4d.ngrok-free.app/api/paybill/info';

foreach ($testOrigins as $origin) {
    echo "📡 Testing Origin: $origin\n";
    echo "   URL: $testUrl\n";
    
    // Test preflight OPTIONS request
    echo "   Testing OPTIONS (preflight) request...\n";
    $optionsContext = stream_context_create([
        'http' => [
            'method' => 'OPTIONS',
            'header' => [
                'Origin: ' . $origin,
                'Access-Control-Request-Method: GET',
                'Access-Control-Request-Headers: Content-Type, Accept, ngrok-skip-browser-warning',
                'ngrok-skip-browser-warning: true'
            ]
        ]
    ]);
    
    try {
        $optionsResponse = file_get_contents($testUrl, false, $optionsContext);
        
        if (isset($http_response_header)) {
            echo "   ✅ OPTIONS Response Headers:\n";
            foreach ($http_response_header as $header) {
                if (stripos($header, 'access-control') !== false || stripos($header, 'HTTP/') === 0) {
                    echo "      $header\n";
                }
            }
        }
    } catch (Exception $e) {
        echo "   ❌ OPTIONS request failed: " . $e->getMessage() . "\n";
    }
    
    // Test actual GET request
    echo "   Testing GET request...\n";
    $getContext = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                'Origin: ' . $origin,
                'Content-Type: application/json',
                'Accept: application/json',
                'ngrok-skip-browser-warning: true'
            ]
        ]
    ]);
    
    try {
        $getResponse = file_get_contents($testUrl, false, $getContext);
        
        if (isset($http_response_header)) {
            echo "   ✅ GET Response Headers:\n";
            foreach ($http_response_header as $header) {
                if (stripos($header, 'access-control') !== false || stripos($header, 'HTTP/') === 0) {
                    echo "      $header\n";
                }
            }
            
            if ($getResponse) {
                $data = json_decode($getResponse, true);
                if ($data && isset($data['success'])) {
                    echo "   ✅ API Response: " . ($data['success'] ? 'Success' : 'Failed') . "\n";
                }
            }
        }
    } catch (Exception $e) {
        echo "   ❌ GET request failed: " . $e->getMessage() . "\n";
    }
    
    echo "\n" . str_repeat("-", 50) . "\n\n";
}

echo "🔍 Check the Laravel logs for CORS debugging information:\n";
echo "   tail -f storage/logs/laravel.log | grep 'CORS Debug'\n"; 