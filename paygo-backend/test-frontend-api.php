<?php

echo "🧪 Testing Frontend API Integration\n";
echo "===================================\n\n";

// Test the PayBill info endpoint using the ngrok URL from config
$configUrl = 'http://localhost:8000/api/config';

echo "📡 Step 1: Getting API base URL from config\n";

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
    $configResponse = file_get_contents($configUrl, false, $context);
    $configData = json_decode($configResponse, true);
    
    if (!$configData || !isset($configData['api_base_url'])) {
        echo "❌ Failed to get API base URL from config\n";
        exit(1);
    }
    
    $apiBaseUrl = $configData['api_base_url'];
    echo "✅ API Base URL: $apiBaseUrl\n\n";
    
    // Test PayBill info endpoint
    echo "📡 Step 2: Testing PayBill info endpoint\n";
    $paybillInfoUrl = $apiBaseUrl . '/paybill/info';
    echo "   URL: $paybillInfoUrl\n";
    
    $paybillContext = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                'Content-Type: application/json',
                'Accept: application/json',
                'ngrok-skip-browser-warning: true'
            ]
        ]
    ]);
    
    $paybillResponse = file_get_contents($paybillInfoUrl, false, $paybillContext);
    
    if ($paybillResponse === false) {
        echo "❌ Failed to connect to PayBill info endpoint\n";
        echo "   This is the error the frontend is experiencing\n";
    } else {
        echo "✅ PayBill Info Response:\n";
        echo $paybillResponse . "\n\n";
        
        $paybillData = json_decode($paybillResponse, true);
        if ($paybillData && isset($paybillData['success']) && $paybillData['success']) {
            echo "🎉 SUCCESS: PayBill info endpoint is working correctly!\n";
            echo "   Business Number: " . $paybillData['data']['paybill_number'] . "\n";
            echo "   Business Name: " . $paybillData['data']['business_name'] . "\n";
            echo "   Instructions: " . count($paybillData['data']['instructions']) . " steps\n";
        } else {
            echo "⚠️  PayBill endpoint returned error: " . ($paybillData['error'] ?? 'Unknown error') . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "💥 Error: " . $e->getMessage() . "\n";
}

echo "\n🔍 This test simulates exactly what the frontend is doing\n";
echo "   If this works, the frontend should work too\n"; 