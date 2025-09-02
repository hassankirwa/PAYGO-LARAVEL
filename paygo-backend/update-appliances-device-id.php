<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Appliance;
use App\Models\Client;
use App\Models\Product;
use App\Models\PaymentPlan;

echo "🔧 KOYO PayGo - Updating Appliances with Device IDs\n\n";

// Check if we have existing appliances
$existingAppliances = Appliance::all();
echo "📋 Found " . $existingAppliances->count() . " existing appliances\n";

if ($existingAppliances->count() > 0) {
    echo "🔄 Updating existing appliances with device IDs...\n";
    $counter = 1;
    foreach ($existingAppliances as $appliance) {
        if (empty($appliance->device_id)) {
            $deviceId = 'KY' . str_pad($counter, 3, '0', STR_PAD_LEFT);
            $appliance->update([
                'device_id' => $deviceId,
                'is_active' => true,
                'total_paid' => 2000.00,
                'remaining_balance' => 23000.00,
                'last_payment_date' => now()->subDays(7),
                'next_payment_due' => now()->addDays(7)
            ]);
            echo "   ✅ Updated appliance ID {$appliance->id}: device_id = {$deviceId}\n";
            $counter++;
        } else {
            echo "   ✅ Appliance ID {$appliance->id} already has device_id: {$appliance->device_id}\n";
        }
    }
} else {
    echo "📦 No existing appliances found. Creating test appliances...\n";
    
    // Get or create test client
    $testClient = Client::where('email', 'test@paygo.com')->first();
    if (!$testClient) {
        echo "❌ Test client not found. Please run setup-test-appliances.php first.\n";
        exit(1);
    }
    
    // Get or create test product
    $testProduct = Product::first();
    if (!$testProduct) {
        echo "❌ No products found. Please run setup-test-appliances.php first.\n";
        exit(1);
    }
    
    // Create test appliances
    $testDevices = ['KY001', 'KY002', 'KY003', 'TEST1', 'TEST2'];
    foreach ($testDevices as $deviceId) {
        $appliance = Appliance::create([
            'device_id' => $deviceId,
            'unit_id' => 'UNIT-' . $deviceId,
            'serial_number' => 'KOYO-REF-' . $deviceId,
            'product_id' => $testProduct->id,
            'client_id' => $testClient->id,
            'status' => 'active',
            'installation_date' => now(),
            'last_payment_date' => now()->subDays(7),
            'next_payment_due' => now()->addDays(7),
            'total_paid' => 2000.00,
            'remaining_balance' => 23000.00,
            'is_active' => true,
        ]);
        echo "   ✅ Created appliance: {$deviceId} (ID: {$appliance->id})\n";
    }
}

echo "\n📋 Current Appliances with Device IDs:\n";
$appliances = Appliance::whereNotNull('device_id')->get();
foreach ($appliances as $appliance) {
    echo "   • {$appliance->device_id} (ID: {$appliance->id}) - {$appliance->status}\n";
}

echo "\n🧪 Testing Device ID Lookup:\n";
$testDevice = Appliance::where('device_id', 'KY001')->first();
if ($testDevice) {
    echo "   ✅ Found KY001: Appliance ID {$testDevice->id}\n";
    echo "   • Client: " . ($testDevice->client ? $testDevice->client->first_name . ' ' . $testDevice->client->last_name : 'No client') . "\n";
    echo "   • Product: " . ($testDevice->product ? $testDevice->product->name : 'No product') . "\n";
    echo "   • Status: {$testDevice->status}\n";
} else {
    echo "   ❌ KY001 not found\n";
}

echo "\n✅ Appliance setup complete!\n";
echo "🚀 Ready for PayBill testing with device IDs.\n"; 