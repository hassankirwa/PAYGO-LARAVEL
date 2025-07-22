<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "🔍 Direct Database Query for API Base URL:\n";
echo "=========================================\n";

// Query all api settings directly from database
$apiSettings = DB::table('system_settings')
    ->where('category', 'api')
    ->where('is_active', true)
    ->get();

echo "All API settings in database:\n";
foreach ($apiSettings as $setting) {
    echo "  ID: {$setting->id}\n";
    echo "  Key: {$setting->key}\n";
    echo "  Value: {$setting->value}\n";
    echo "  Created: {$setting->created_at}\n";
    echo "  Updated: {$setting->updated_at}\n";
    echo "  ---\n";
}

echo "\nSpecific base_url query:\n";
$baseUrlSetting = DB::table('system_settings')
    ->where('category', 'api')
    ->where('key', 'base_url')
    ->where('is_active', true)
    ->first();

if ($baseUrlSetting) {
    echo "✅ Found: {$baseUrlSetting->value}\n";
    echo "   ID: {$baseUrlSetting->id}\n";
    echo "   Updated: {$baseUrlSetting->updated_at}\n";
} else {
    echo "❌ No active base_url setting found!\n";
} 