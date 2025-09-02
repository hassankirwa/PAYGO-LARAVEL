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

echo "🔧 KOYO PayGo - Setting up Test Appliances for PayBill\n\n";

// Create test client if not exists
$testClient = Client::where('email', 'test@paygo.com')->first();
if (!$testClient) {
    echo "👤 Creating test client...\n";
    $testClient = Client::create([
        'client_code' => 'CL001',
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
    echo "✅ Test client created: {$testClient->client_code}\n";
} else {
    echo "✅ Test client exists: {$testClient->client_code}\n";
}

// Create test product category if not exists
$category = ProductCategory::where('name', 'Refrigerators')->first();
if (!$category) {
    $category = ProductCategory::create([
        'name' => 'Refrigerators',
        'description' => 'Energy efficient refrigerators',
    ]);
    echo "✅ Product category created: {$category->name}\n";
} else {
    echo "✅ Product category exists: {$category->name}\n";
}

// Create test product if not exists
$testProduct = Product::where('model_code', 'REF-001')->first();
if (!$testProduct) {
    echo "📦 Creating test product...\n";
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
    echo "✅ Test product created: {$testProduct->model_code}\n";
} else {
    echo "✅ Test product exists: {$testProduct->model_code}\n";
}

// Create test appliances with short device IDs
$testDevices = [
    'KY001' => 'KOYO-REF-001-001',
    'KY002' => 'KOYO-REF-001-002', 
    'KY003' => 'KOYO-REF-001-003',
    'TEST1' => 'KOYO-REF-TEST-001',
    'TEST2' => 'KOYO-REF-TEST-002'
];

echo "\n🏠 Creating test appliances...\n";
foreach ($testDevices as $shortId => $serialNumber) {
    $appliance = Appliance::where('device_id', $shortId)->first();
    
    if (!$appliance) {
        $appliance = Appliance::create([
            'device_id' => $shortId,
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
        echo "✅ Appliance created: {$shortId} ({$serialNumber})\n";
    } else {
        echo "✅ Appliance exists: {$shortId} ({$appliance->serial_number})\n";
    }
}

// Create test payment plans
echo "\n💰 Creating test payment plans...\n";
foreach ($testDevices as $shortId => $serialNumber) {
    $appliance = Appliance::where('device_id', $shortId)->first();
    
    $paymentPlan = PaymentPlan::where('device_id', $shortId)->first();
    if (!$paymentPlan) {
        $paymentPlan = PaymentPlan::create([
            'device_id' => $shortId,
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
        echo "✅ Payment plan created for {$shortId}: Weekly KSh 500\n";
    } else {
        echo "✅ Payment plan exists for {$shortId}: {$paymentPlan->plan_type} KSh {$paymentPlan->installment_amount_ksh}\n";
    }
}

echo "\n📋 Test Appliances Summary:\n";
$appliances = Appliance::whereIn('device_id', array_keys($testDevices))->get();
foreach ($appliances as $appliance) {
    $plan = PaymentPlan::where('device_id', $appliance->device_id)->first();
    echo "   • {$appliance->device_id}: {$appliance->serial_number}\n";
    echo "     - Status: {$appliance->status}\n";
    echo "     - Client: {$appliance->client->first_name} {$appliance->client->last_name}\n";
    echo "     - Next Payment: KSh " . ($plan ? number_format($plan->installment_amount_ksh, 2) : '0.00') . "\n";
    echo "     - Due Date: " . ($plan ? $plan->next_payment_due->format('Y-m-d') : 'N/A') . "\n\n";
}

echo "🎯 PayBill Test Instructions:\n";
echo "   1. Use PayBill Number: 174379\n";
echo "   2. Test Device IDs: KY001, KY002, KY003, TEST1, TEST2\n";
echo "   3. Expected Amount: KSh 500.00 (weekly installment)\n";
echo "   4. Test Phone: +254712345678\n\n";

echo "✅ Test appliances setup complete!\n";
echo "🚀 Ready for PayBill testing with M-Pesa.\n"; 