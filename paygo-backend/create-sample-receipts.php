<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\PaymentReceipt;
use App\Models\PaymentOrder;
use App\Models\MpesaTransaction;
use Carbon\Carbon;

echo "🧪 Creating Sample Payment Receipts for Testing\n";
echo "===============================================\n\n";

// Sample customer data
$customers = [
    ['name' => 'John Doe', 'email' => 'john.doe@example.com', 'phone' => '+254700123456'],
    ['name' => 'Jane Smith', 'email' => 'jane.smith@gmail.com', 'phone' => '+254701234567'],
    ['name' => 'Peter Mwangi', 'email' => 'peter.mwangi@yahoo.com', 'phone' => '+254702345678'],
    ['name' => 'Mary Wanjiku', 'email' => 'mary.wanjiku@outlook.com', 'phone' => '+254703456789'],
    ['name' => 'David Kamau', 'email' => 'david.kamau@example.com', 'phone' => '+254704567890'],
];

// Sample products
$products = [
    'KOYO Premium Refrigerator 200L',
    'KOYO Chest Freezer 300L',
    'KOYO Double Door Fridge 400L',
    'KOYO Mini Fridge 100L',
    'KOYO Commercial Freezer 500L',
];

// Payment types and statuses
$paymentTypes = ['down_payment', 'installment', 'full_payment'];
$statuses = ['generated', 'sent', 'viewed', 'downloaded'];

// Create 20 sample receipts
for ($i = 1; $i <= 20; $i++) {
    $customer = $customers[array_rand($customers)];
    $product = $products[array_rand($products)];
    $paymentType = $paymentTypes[array_rand($paymentTypes)];
    $status = $statuses[array_rand($statuses)];
    
    // Generate random receipt number
    $receiptNumber = 'RCP-' . date('YmdHis') . sprintf('%03d', $i) . '-' . strtoupper(substr(md5($i), 0, 4));
    
    // Generate random payment amount
    $baseAmount = rand(500, 5000);
    $paymentAmount = $baseAmount * 100; // Convert to cents format
    
    // Generate M-Pesa receipt number
    $mpesaReceipt = 'MP' . str_pad(rand(100000000, 999999999), 10, '0');
    
    // Random payment date within last 6 months
    $paymentDate = Carbon::now()->subDays(rand(0, 180));
    
    // Generate order reference
    $orderReference = 'ORD-' . date('Ymd', $paymentDate->timestamp) . '-' . sprintf('%04d', $i);
    
    // Receipt content
    $receiptData = [
        'company' => [
            'name' => 'KOYO PayGo',
            'address' => 'Nairobi, Kenya',
            'phone' => '+254700000000',
            'email' => 'support@koyo.com'
        ],
        'receipt_details' => [
            'receipt_number' => $receiptNumber,
            'payment_date' => $paymentDate->format('Y-m-d H:i:s'),
            'payment_method' => 'M-Pesa',
            'mpesa_receipt' => $mpesaReceipt
        ],
        'customer' => $customer,
        'payment' => [
            'product' => $product,
            'amount' => $paymentAmount,
            'type' => $paymentType,
            'order_reference' => $orderReference
        ]
    ];
    
    // Generate status timestamps
    $generatedAt = $paymentDate->copy()->addMinutes(1);
    $sentAt = null;
    $viewedAt = null;
    $downloadedAt = null;
    
    if (in_array($status, ['sent', 'viewed', 'downloaded'])) {
        $sentAt = $generatedAt->copy()->addMinutes(rand(5, 30));
    }
    
    if (in_array($status, ['viewed', 'downloaded'])) {
        $viewedAt = $sentAt ? $sentAt->copy()->addMinutes(rand(1, 60)) : $generatedAt->copy()->addMinutes(rand(10, 120));
    }
    
    if ($status === 'downloaded') {
        $downloadedAt = $viewedAt ? $viewedAt->copy()->addMinutes(rand(1, 30)) : $generatedAt->copy()->addMinutes(rand(30, 180));
    }
    
    try {
        PaymentReceipt::create([
            'receipt_number' => $receiptNumber,
            'payment_order_id' => 1, // Default to 1 for testing
            'transaction_id' => null,
            'customer_name' => $customer['name'],
            'customer_email' => $customer['email'],
            'customer_phone' => $customer['phone'],
            'product_name' => $product,
            'payment_amount' => $paymentAmount / 100, // Convert back to normal amount
            'payment_method' => 'M-Pesa',
            'mpesa_receipt_number' => $mpesaReceipt,
            'payment_date' => $paymentDate,
            'payment_type' => $paymentType,
            'plan_type' => $paymentType === 'installment' ? 'weekly' : null,
            'order_reference' => $orderReference,
            'receipt_data' => $receiptData,
            'status' => $status,
            'generated_at' => $generatedAt,
            'sent_at' => $sentAt,
            'viewed_at' => $viewedAt,
            'downloaded_at' => $downloadedAt,
            'created_at' => $paymentDate,
            'updated_at' => $downloadedAt ?? $viewedAt ?? $sentAt ?? $generatedAt,
        ]);
        
        echo "✅ Receipt {$i}/20: {$receiptNumber} - {$customer['name']} - KSh " . number_format($paymentAmount / 100, 2) . " ({$status})\n";
        
    } catch (Exception $e) {
        echo "❌ Failed to create receipt {$i}: " . $e->getMessage() . "\n";
    }
}

echo "\n🎉 Sample receipt creation complete!\n";
echo "📊 Summary:\n";
echo "   - Created 20 sample payment receipts\n";
echo "   - Various customers, products, and statuses\n";
echo "   - Payment dates spread over last 6 months\n";
echo "   - Ready for admin interface testing\n\n";

echo "🔗 Access admin receipts at: http://localhost:3000/admin/dashboard?view=receipts\n";
echo "🔑 Admin login: admin@koyo.com / admin123\n"; 