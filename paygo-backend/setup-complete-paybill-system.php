<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Client;
use App\Models\Product;
use App\Models\Appliance;
use App\Models\PaymentPlan;
use App\Models\ProductCategory;
use Illuminate\Support\Facades\Hash;

echo "🔧 KOYO PayGo - Complete PayBill System Setup\n\n";

// Step 1: Create or get test client
echo "👤 STEP 1: Setting up test client...\n";
$testClient = Client::where('email', 'test@paygo.com')->first();
if (!$testClient) {
    // Try with a different client code if CL001 exists
    $clientCode = 'CL001';
    $existingClient = Client::where('client_code', $clientCode)->first();
    if ($existingClient) {
        $clientCode = 'CL' . str_pad(rand(100, 999), 3, '0', STR_PAD_LEFT);
    }
    
    $testClient = Client::create([
        'client_code' => $clientCode,
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'test@paygo.com',
        'phone' => '+254712345678',
        'password_hash' => Hash::make('password123'),
        'payment_plan' => 'weekly',
        'address' => '123 Test Street',
        'location' => 'Nairobi, Kenya',
        'is_active' => true,
    ]);
    echo "   ✅ Created client: {$testClient->client_code} ({$testClient->email})\n";
} else {
    echo "   ✅ Client exists: {$testClient->client_code} ({$testClient->email})\n";
}

// Step 2: Create or get product category
echo "\n📦 STEP 2: Setting up product category...\n";
$category = ProductCategory::where('name', 'Refrigerators')->first();
if (!$category) {
    $category = ProductCategory::create([
        'name' => 'Refrigerators',
        'description' => 'Energy efficient refrigerators',
    ]);
    echo "   ✅ Created category: {$category->name}\n";
} else {
    echo "   ✅ Category exists: {$category->name}\n";
}

// Step 3: Create or get test product
echo "\n🏠 STEP 3: Setting up test product...\n";
$testProduct = Product::where('model_code', 'REF-001')->first();
if (!$testProduct) {
    $testProduct = Product::create([
        'name' => 'KOYO Eco Fridge 150L',
        'model_code' => 'REF-001',
        'category_id' => $category->id,
        'description' => 'Energy efficient 150L refrigerator',
        'price' => 25000.00,
        'capacity_liters' => 150,
        'energy_rating' => 'A++',
        'color' => 'White',
        'warranty_years' => 2,
        'is_available' => true,
        'is_featured' => true,
    ]);
    echo "   ✅ Created product: {$testProduct->model_code} ({$testProduct->name})\n";
} else {
    echo "   ✅ Product exists: {$testProduct->model_code} ({$testProduct->name})\n";
}

// Step 4: Create test appliances with device IDs
echo "\n🔧 STEP 4: Setting up test appliances...\n";
$testDevices = [
    'KY001' => 'KOYO-REF-001-001',
    'KY002' => 'KOYO-REF-001-002', 
    'KY003' => 'KOYO-REF-001-003',
    'TEST1' => 'KOYO-REF-TEST-001',
    'TEST2' => 'KOYO-REF-TEST-002'
];

foreach ($testDevices as $deviceId => $serialNumber) {
    $appliance = Appliance::where('device_id', $deviceId)->first();
    
    if (!$appliance) {
        $appliance = Appliance::create([
            'device_id' => $deviceId,
            'unit_id' => 'UNIT-' . $deviceId,
            'serial_number' => $serialNumber,
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
    } else {
        echo "   ✅ Appliance exists: {$deviceId} (ID: {$appliance->id})\n";
    }
}

// Step 5: Create payment plans
echo "\n💰 STEP 5: Setting up payment plans...\n";
foreach ($testDevices as $deviceId => $serialNumber) {
    $appliance = Appliance::where('device_id', $deviceId)->first();
    
    $paymentPlan = PaymentPlan::where('device_id', $deviceId)->first();
    if (!$paymentPlan) {
        $paymentPlan = PaymentPlan::create([
            'device_id' => $deviceId,
            'client_id' => $testClient->id,
            'appliance_id' => $appliance->id,
            'product_id' => $testProduct->id,
            'product_name' => $testProduct->name,
            'product_price' => $testProduct->price,
            'plan_type' => 'weekly',
            'plan_duration' => 52, // 52 weeks = 1 year
            'down_payment_ksh' => 2500.00,
            'installment_amount_ksh' => 500.00,
            'total_installments' => 45, // After down payment
            'total_amount_ksh' => 25000.00,
            'total_paid_ksh' => 2000.00,
            'remaining_balance_ksh' => 23000.00,
            'next_payment_due' => now()->addDays(7),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        echo "   ✅ Created payment plan for {$deviceId}: Weekly KSh 500\n";
    } else {
        echo "   ✅ Payment plan exists for {$deviceId}: {$paymentPlan->plan_type} KSh {$paymentPlan->installment_amount_ksh}\n";
    }
}

// Step 6: Verify setup
echo "\n🧪 STEP 6: Verifying PayBill setup...\n";

// Test database queries
echo "   • Testing device lookup: ";
$testDevice = Appliance::where('device_id', 'KY001')->first();
if ($testDevice) {
    echo "✅ KY001 found (ID: {$testDevice->id})\n";
} else {
    echo "❌ KY001 not found\n";
}

echo "   • Testing client relationship: ";
if ($testDevice && $testDevice->client) {
    echo "✅ Client: {$testDevice->client->first_name} {$testDevice->client->last_name}\n";
} else {
    echo "❌ Client relationship broken\n";
}

echo "   • Testing payment plan: ";
$testPlan = PaymentPlan::where('device_id', 'KY001')->first();
if ($testPlan) {
    echo "✅ Plan: KSh {$testPlan->installment_amount_ksh} {$testPlan->plan_type}\n";
} else {
    echo "❌ Payment plan not found\n";
}

echo "\n📋 PayBill Test Summary:\n";
$appliances = Appliance::whereNotNull('device_id')->get();
foreach ($appliances as $appliance) {
    $plan = PaymentPlan::where('device_id', $appliance->device_id)->first();
    echo "   • {$appliance->device_id}: {$appliance->status} - KSh " . ($plan ? number_format($plan->installment_amount_ksh, 2) : '0.00') . " expected\n";
}

echo "\n🎯 PayBill Instructions:\n";
echo "   1. PayBill Number: 174379\n";
echo "   2. Account Number: KY001, KY002, KY003, TEST1, or TEST2\n";
echo "   3. Amount: KSh 500.00\n";
echo "   4. Phone: +254712345678\n\n";

echo "✅ Complete PayBill system setup finished!\n";
echo "🚀 Ready for M-Pesa PayBill testing.\n"; 