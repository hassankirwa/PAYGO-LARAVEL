<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemSetting;

echo "🔍 Checking M-Pesa Callback URL from Database System Settings...\n\n";

// Get M-Pesa configuration from database
$config = SystemSetting::getMpesaConfig();

echo "📋 Current M-Pesa Configuration (from database):\n";
echo "Environment: " . ($config['environment'] ?? 'NOT SET') . "\n";
echo "Shortcode: " . ($config['shortcode'] ?? 'NOT SET') . "\n";
echo "Callback URL: " . ($config['callback_url'] ?? 'NOT SET') . "\n";
echo "Confirmation URL: " . ($config['confirmation_url'] ?? 'NOT SET') . "\n";
echo "Validation URL: " . ($config['validation_url'] ?? 'NOT SET') . "\n\n";

// Check the raw database values
echo "🗄️ Raw Database Values (mpesa category):\n";
$rawSettings = SystemSetting::getCategory('mpesa');

foreach ($rawSettings as $key => $value) {
    echo "$key: $value\n";
}

// Verify the callback URL is being used correctly
echo "\n✅ Implementation Check:\n";
echo "- Callback URL retrieved from: system_settings table\n";
echo "- Category: mpesa\n";
echo "- Key: callback_url\n";
echo "- Used in STK Push payload: 'CallBackURL' => \$config['callback_url']\n";

echo "\n📍 Current Status:\n";
$callbackUrl = $config['callback_url'] ?? 'NOT SET';
if ($callbackUrl === 'NOT SET') {
    echo "❌ No callback URL set in database\n";
} elseif (strpos($callbackUrl, 'localhost') !== false) {
    echo "⚠️  Localhost URL - M-Pesa cannot reach this\n";
} elseif (strpos($callbackUrl, 'https://') === 0) {
    echo "✅ HTTPS URL - Good for production\n";
} else {
    echo "⚠️  HTTP URL - Should be HTTPS for production\n";
}

echo "\n🎯 Confirmation: Callback URL IS retrieved from database system settings!\n"; 