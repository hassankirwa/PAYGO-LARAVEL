<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SystemSetting;
use App\Models\AdminUser;

// Get new URL from command line argument
$newUrl = $argv[1] ?? null;

if (!$newUrl) {
    echo "❌ Please provide the new ngrok URL as an argument.\n";
    echo "Usage: php update-api-url.php https://your-new-ngrok-url.ngrok-free.app\n";
    exit(1);
}

// Validate URL format
if (!filter_var($newUrl, FILTER_VALIDATE_URL)) {
    echo "❌ Invalid URL format: $newUrl\n";
    echo "Please provide a valid URL like: https://abc123.ngrok-free.app\n";
    exit(1);
}

// Remove trailing slashes
$newUrl = rtrim($newUrl, '/');

echo "🔧 Updating API Base URL...\n";
echo "Old URL: " . (SystemSetting::get('api', 'base_url') ?: 'Not set') . "\n";
echo "New URL: $newUrl\n";

// Get admin user for audit trail
$adminUser = AdminUser::first();
$adminId = $adminUser ? $adminUser->id : null;

// Update the setting
SystemSetting::set('api', 'base_url', $newUrl, 'API Base URL for frontend requests', false, $adminId);

echo "✅ API Base URL updated successfully!\n";
echo "🌐 Frontend will now use: $newUrl/api\n";

// Note: No frontend fallback URLs to update (system is purely database-driven)
echo "\n💡 Note: Frontend now fetches API URL dynamically from database only\n";
echo "📝 No hardcoded fallback URLs in frontend - all configuration is database-driven\n";

echo "\n🧪 Testing new configuration...\n";
$config = SystemSetting::getApiConfig();
echo "✅ New API Base URL: " . $config['base_url'] . "\n";
echo "✅ Full API URL: " . $config['base_url'] . "/api\n";

echo "\n📋 Next steps:\n";
echo "1. Restart your Laravel backend: php artisan serve\n";
echo "2. Restart your Next.js frontend: npm run dev\n";
echo "3. Test the API config endpoint: curl " . $config['base_url'] . "/api/config\n"; 