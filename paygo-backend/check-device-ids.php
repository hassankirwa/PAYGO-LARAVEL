<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\Appliance;

// Load Laravel environment
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "📋 Available Device IDs in Database:\n";
echo "====================================\n\n";

try {
    $appliances = Appliance::select('device_id', 'product_name', 'serial_number')
        ->limit(10)
        ->get();
    
    if ($appliances->count() > 0) {
        foreach ($appliances as $appliance) {
            echo "- {$appliance->device_id} ({$appliance->product_name})\n";
        }
        
        echo "\n✅ Found {$appliances->count()} appliances\n";
        echo "Use any of these device IDs for valid payment testing.\n";
    } else {
        echo "⚠️ No appliances found in database\n";
        echo "Run setup scripts to create test appliances first.\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
} 