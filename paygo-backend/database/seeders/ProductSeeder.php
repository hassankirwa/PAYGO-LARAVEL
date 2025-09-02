<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create product categories
        $categories = [
            [
                'name' => 'Fridge',
                'description' => 'Single and double door refrigerators',
                'is_active' => true,
            ],
            [
                'name' => 'Freezer', 
                'description' => 'Deep freezers for frozen storage',
                'is_active' => true,
            ],
            [
                'name' => 'Display Cooler',
                'description' => 'Glass door display refrigerators',
                'is_active' => true,
            ],
        ];

        foreach ($categories as $categoryData) {
            ProductCategory::updateOrCreate(
                ['name' => $categoryData['name']], 
                $categoryData
            );
        }

        // Get category IDs
        $fridgeCategory = ProductCategory::where('name', 'Fridge')->first();
        $freezerCategory = ProductCategory::where('name', 'Freezer')->first();
        $displayCategory = ProductCategory::where('name', 'Display Cooler')->first();

        // Create sample products
        $products = [
            [
                'category_id' => $fridgeCategory->id,
                'name' => 'KOYO BC-50DC FRIDGE, SINGLE DOOR WITH FREEZER CHAMBER',
                'model_code' => 'BC-50DC',
                'description_text' => 'A compact and efficient single-door fridge with a dedicated freezer chamber, perfect for small spaces or as a secondary refrigeration unit.',
                'long_description' => 'The KOYO BC-50DC FRIDGE is a solar-powered refrigeration solution designed to cater to the diverse needs of households, small businesses, and agricultural operations. Engineered for reliable cooling in areas with unstable electricity access, this 50-litre model integrates advanced technology with sustainable energy sources to deliver exceptional performance and efficiency. It operates primarily on solar energy, reducing reliance on conventional power sources and lowering energy costs. It includes a robust battery system capable of storing energy for up to 15 hours, ensuring uninterrupted cooling even during cloudy periods or at night.',
                'capacity_litres' => 50,
                'power_consumption_watts' => 45,
                'color' => 'Grey',
                'defrost_type' => 'Manual',
                'cash_warranty_months' => 12,
                'paygo_warranty_months' => 24,
                'price_ksh' => 112700.00, // Converted from $805
                'weekly_installment_ksh' => 2100.00, // Converted from $15
                'monthly_installment_ksh' => 9100.00, // Converted from $65
                'features' => json_encode(['Single Door', 'Freezer Chamber', 'Compact Design', 'Energy Efficient', 'Solar Powered', 'Dual Power']),
                'images' => json_encode(['/images/koyo-50l-1.jpg', '/images/koyo-50l-2.jpg']),
                'is_active' => true,
            ],
            [
                'category_id' => $fridgeCategory->id,
                'name' => 'KOYO BC-75DC FRIDGE, COMPACT SINGLE DOOR',
                'model_code' => 'BC-75DC',
                'description_text' => 'Mid-range capacity fridge perfect for small to medium families.',
                'long_description' => 'The KOYO BC-75DC strikes the perfect balance between size and capacity. With 75 litres of storage, it\'s ideal for small to medium families who need reliable refrigeration without taking up too much space. Features efficient cooling and durable construction.',
                'capacity_litres' => 75,
                'power_consumption_watts' => 55,
                'color' => 'Grey',
                'defrost_type' => 'Manual',
                'cash_warranty_months' => 12,
                'paygo_warranty_months' => 24,
                'price_ksh' => 147000.00, // Converted from $1050
                'weekly_installment_ksh' => 2800.00, // Converted from $20
                'monthly_installment_ksh' => 12180.00, // Converted from $87
                'features' => json_encode(['Single Door', 'Compact Design', 'Medium Capacity', 'Energy Efficient', 'Solar Powered', 'Reliable']),
                'images' => json_encode(['/images/koyo-75l-1.jpg', '/images/koyo-75l-2.jpg']),
                'is_active' => true,
            ],
            [
                'category_id' => $fridgeCategory->id,
                'name' => 'KOYO BC-100DC FRIDGE, DOUBLE DOOR',
                'model_code' => 'BC-100DC',
                'description_text' => 'Large capacity double-door fridge for bigger families and small businesses.',
                'long_description' => 'The KOYO BC-100DC is our flagship model, designed for families and small businesses that need substantial refrigeration capacity. With 100 litres of storage and separate freezer compartment, it provides excellent organization and cooling performance.',
                'capacity_litres' => 100,
                'power_consumption_watts' => 75,
                'color' => 'Silver',
                'defrost_type' => 'Manual',
                'cash_warranty_months' => 12,
                'paygo_warranty_months' => 24,
                'price_ksh' => 210000.00,
                'weekly_installment_ksh' => 4200.00,
                'monthly_installment_ksh' => 18200.00,
                'features' => json_encode(['Double Door', 'Large Capacity', 'Separate Freezer', 'Energy Efficient', 'Solar Powered', 'Business Ready']),
                'images' => json_encode(['/images/koyo-100l-1.jpg', '/images/koyo-100l-2.jpg']),
                'is_active' => true,
            ],
            [
                'category_id' => $freezerCategory->id,
                'name' => 'KOYO CHEST FREEZER 150L',
                'model_code' => 'CF-150DC',
                'description_text' => 'Deep chest freezer for bulk storage and commercial use.',
                'long_description' => 'Perfect for storing large quantities of frozen goods. Ideal for restaurants, shops, and households that need extra freezing capacity.',
                'capacity_litres' => 150,
                'power_consumption_watts' => 95,
                'color' => 'White',
                'defrost_type' => 'Manual',
                'cash_warranty_months' => 12,
                'paygo_warranty_months' => 24,
                'price_ksh' => 168000.00,
                'weekly_installment_ksh' => 3500.00,
                'monthly_installment_ksh' => 15200.00,
                'features' => json_encode(['Chest Design', 'Large Capacity', 'Deep Freezing', 'Energy Efficient', 'Commercial Grade']),
                'images' => json_encode(['/images/koyo-freezer-150l.jpg']),
                'is_active' => true,
            ],
            [
                'category_id' => $displayCategory->id,
                'name' => 'KOYO DISPLAY COOLER 200L',
                'model_code' => 'DC-200',
                'description_text' => 'Glass door display cooler for retail and commercial use.',
                'long_description' => 'Perfect for shops, restaurants, and businesses that need to display chilled products while keeping them at optimal temperatures.',
                'capacity_litres' => 200,
                'power_consumption_watts' => 120,
                'color' => 'Black',
                'defrost_type' => 'Automatic',
                'cash_warranty_months' => 12,
                'paygo_warranty_months' => 24,
                'price_ksh' => 245000.00,
                'weekly_installment_ksh' => 4900.00,
                'monthly_installment_ksh' => 21200.00,
                'features' => json_encode(['Glass Door', 'LED Lighting', 'Temperature Display', 'Auto Defrost', 'Commercial Use']),
                'images' => json_encode(['/images/koyo-display-cooler.jpg']),
                'is_active' => true,
            ],
            // TEST PRODUCT - KSh 1 for payment testing
            [
                'category_id' => $fridgeCategory->id,
                'name' => 'TEST PRODUCT - KOYO MINI FRIDGE (TESTING ONLY)',
                'model_code' => 'TEST-001',
                'description_text' => 'This is a test product for payment system testing. Price: KSh 1',
                'long_description' => 'This product is created specifically for testing the payment system. It costs only KSh 1 to allow easy testing of M-Pesa payments and other payment methods without using large amounts.',
                'capacity_litres' => 1,
                'power_consumption_watts' => 1,
                'color' => 'Test',
                'defrost_type' => 'Manual',
                'cash_warranty_months' => 1,
                'paygo_warranty_months' => 1,
                'price_ksh' => 1.00, // KSh 1 for testing
                'weekly_installment_ksh' => 0.25, // 25 cents weekly
                'monthly_installment_ksh' => 1.00, // KSh 1 monthly
                'features' => json_encode(['Test Product', 'Payment Testing', 'Demo Only', 'KSh 1 Price']),
                'images' => json_encode(['/images/test-product.jpg']),
                'is_active' => true,
            ],
        ];

        foreach ($products as $productData) {
            Product::updateOrCreate(
                ['model_code' => $productData['model_code']], 
                $productData
            );
        }

        $this->command->info('Product categories and products seeded successfully!');
    }
}
