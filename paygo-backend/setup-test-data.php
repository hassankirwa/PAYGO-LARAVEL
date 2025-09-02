<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Client;
use App\Models\Appliance;
use App\Models\PaymentOrder;

echo "🔧 Setting up test data for PayBill validation...\n\n";

// Create test client
$client = Client::create([
    'name' => 'Test Customer',
    'email' => 'test@example.com', 
    'phone' => '254700000000',
    'address' => 'Test Address',
    'id_number' => '12345678'
]);

echo "✅ Test Client created: ID={$client->id}, Name={$client->name}\n";

// Create test appliance
$appliance = Appliance::create([
    'client_id' => $client->id,
    'unit_id' => 'KY000001',
    'serial_number' => 'SN000001', 
    'model' => 'Test Fridge',
    'status' => 'pending',
    'product_name' => 'KOYO Test Fridge'
]);

echo "✅ Test Appliance created: ID={$appliance->id}, Unit ID={$appliance->unit_id}\n";

// Create test payment order
$order = PaymentOrder::create([
    'client_id' => $client->id,
    'appliance_id' => $appliance->id,
    'order_reference' => 'ORD_' . time(),
    'product_name' => 'KOYO Test Fridge',
    'customer_name' => 'Test Customer',
    'customer_phone' => '254700000000',
    'customer_email' => 'test@example.com',
    'paid_amount' => 2500.00,
    'down_payment_amount' => 2500.00,
    'status' => 'pending',
    'payment_method' => 'paybill'
]);

echo "✅ Test Payment Order created: ID={$order->id}, Amount=KSh {$order->paid_amount}\n";

echo "\n🎯 Test Data Summary:\n";
echo "Device ID: {$appliance->unit_id}\n";
echo "Expected Amount: KSh {$order->down_payment_amount}\n";
echo "Customer Phone: {$client->phone}\n";
echo "Status: Ready for PayBill testing\n";

echo "\n🚀 Ready to test PayBill validation with device ID: {$appliance->unit_id}\n"; 