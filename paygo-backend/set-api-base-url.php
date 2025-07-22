<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemSetting;
use App\Models\AdminUser;

$ngrokUrl = 'https://b2858d950083.ngrok-free.app';

// Get the first admin user or use null
$adminUser = AdminUser::first();
$adminId = $adminUser ? $adminUser->id : null;

echo "🔧 Setting API base URL in system settings...\n";
echo "Admin User ID: " . ($adminId ?? 'null') . "\n";
echo "API Base URL: " . $ngrokUrl . "\n\n";

// Set the API base URL
SystemSetting::set('api', 'base_url', $ngrokUrl, 'API Base URL for frontend requests', false, $adminId);

echo "✅ API base URL set successfully!\n";
echo "Frontend will now fetch: " . $ngrokUrl . "/api\n";

// Verify the setting
$config = SystemSetting::where('category', 'api')
                      ->where('key', 'base_url')
                      ->where('is_active', true)
                      ->value('value');

echo "\n📋 Verified Configuration:\n";
echo "API Base URL: " . ($config ?? 'Not set') . "\n";
echo "Full API URL: " . ($config ? rtrim($config, '/') . '/api' : 'Default Laravel URL') . "\n"; 