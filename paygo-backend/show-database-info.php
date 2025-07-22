<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

echo "🗄️  Database Information:\n";
echo "========================\n";

// Get database configuration
$dbConfig = Config::get('database.connections.' . Config::get('database.default'));

echo "Database Type: " . $dbConfig['driver'] . "\n";
echo "Database Host: " . $dbConfig['host'] . "\n";
echo "Database Port: " . $dbConfig['port'] . "\n";
echo "Database Name: " . $dbConfig['database'] . "\n";
echo "Database User: " . $dbConfig['username'] . "\n";

// Test connection and show current database
try {
    $currentDb = DB::select('SELECT DATABASE() as current_db')[0]->current_db;
    echo "✅ Connected to database: " . $currentDb . "\n";
} catch (Exception $e) {
    echo "❌ Database connection error: " . $e->getMessage() . "\n";
}

echo "\n📋 System Settings Table Information:\n";
echo "=====================================\n";

// Show table structure
try {
    $tableExists = DB::select("SHOW TABLES LIKE 'system_settings'");
    if (!empty($tableExists)) {
        echo "✅ Table 'system_settings' exists\n";
        
        // Show table structure
        $columns = DB::select("DESCRIBE system_settings");
        echo "\nTable Structure:\n";
        foreach ($columns as $column) {
            echo "  - {$column->Field} ({$column->Type})" . 
                 ($column->Key === 'PRI' ? ' [PRIMARY KEY]' : '') . 
                 ($column->Null === 'NO' ? ' [NOT NULL]' : '') . "\n";
        }
        
        // Show current API settings
        echo "\n📊 Current API Settings in system_settings table:\n";
        $apiSettings = DB::table('system_settings')
            ->where('category', 'api')
            ->select('id', 'key', 'value', 'is_active', 'created_at', 'updated_at')
            ->get();
            
        if ($apiSettings->isNotEmpty()) {
            foreach ($apiSettings as $setting) {
                echo "  ID: {$setting->id}\n";
                echo "  Key: {$setting->key}\n";
                echo "  Value: {$setting->value}\n";
                echo "  Active: " . ($setting->is_active ? 'Yes' : 'No') . "\n";
                echo "  Created: {$setting->created_at}\n";
                echo "  Updated: {$setting->updated_at}\n";
                echo "  ---\n";
            }
        } else {
            echo "  ❌ No API settings found\n";
        }
        
    } else {
        echo "❌ Table 'system_settings' does not exist\n";
    }
} catch (Exception $e) {
    echo "❌ Error checking table: " . $e->getMessage() . "\n";
} 