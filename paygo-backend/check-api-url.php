<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemSetting;

echo "🔍 Current API Configuration in Database:\n";
echo "==========================================\n";

// Get current API config
$config = SystemSetting::getApiConfig();

echo "API Base URL: " . $config['base_url'] . "\n";
echo "Environment: " . $config['environment'] . "\n";
echo "Timeout: " . $config['timeout'] . "s\n";
echo "Rate Limit: " . $config['rate_limit'] . " requests\n";

// Check if it's using fallback or database value
$dbValue = SystemSetting::get('api', 'base_url');
if ($dbValue) {
    echo "✅ Using database value: " . $dbValue . "\n";
} else {
    echo "⚠️  Using Laravel default: " . url('/api') . "\n";
}

echo "\n📝 To update with your new ngrok URL, run:\n";
echo "php update-api-url.php https://your-new-ngrok-url.ngrok-free.app\n"; 