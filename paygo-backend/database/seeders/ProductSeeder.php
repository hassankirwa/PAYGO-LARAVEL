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
                'price_usd' => 805.00,
                'weekly_installment_usd' => 15.00,
                'monthly_installment_usd' => 65.00,
                'features' => json_encode(['Single Door', 'Freezer Chamber', 'Compact Design', 'Energy Efficient', 'Solar Powered', 'Dual Power']),
                'images' => json_encode(['/images/koyo-50l-1.jpg', '/images/koyo-50l-2.jpg']),
                'is_active' => true,
            ],
            [
                'category_id' => $fridgeCategory->id,
                'name' => 'KOYO BC-90DC FRIDGE, SINGLE DOOR WITH FREEZER CHAMBER',
                'model_code' => 'BC-90DC',
                'description_text' => 'This 90-litre single-door fridge offers ample storage for essentials with reliable cooling performance.',
                'long_description' => 'The KOYO BC-90DC is perfect for medium-sized families and small businesses. With 90 litres of storage capacity, it provides excellent cooling performance while maintaining energy efficiency. Features advanced insulation technology and durable construction for long-lasting performance in challenging environments.',
                'capacity_litres' => 90,
                'power_consumption_watts' => 65,
                'color' => 'Grey',
                'defrost_type' => 'Manual',
                'cash_warranty_months' => 12,
                'paygo_warranty_months' => 24,
                'price_usd' => 1290.00,
                'weekly_installment_usd' => 25.00,
                'monthly_installment_usd' => 108.00,
                'features' => json_encode(['Single Door', 'Freezer Chamber', 'Medium Capacity', 'Reliable Cooling', 'Solar Powered', 'Dual Power']),
                'images' => json_encode(['/images/koyo-90l-1.jpg', '/images/koyo-90l-2.jpg']),
                'is_active' => true,
            ],
            [
                'category_id' => $fridgeCategory->id,
                'name' => 'KOYO BC-120DC FRIDGE, SINGLE DOOR WITH FREEZER CHAMBER',
                'model_code' => 'BC-120DC',
                'description_text' => 'Large capacity 120-litre fridge with freezer chamber for families and small businesses.',
                'long_description' => 'The KOYO BC-120DC offers maximum storage capacity in our single-door range. Perfect for larger families and growing businesses, this 120-litre fridge provides excellent organization with multiple shelves and compartments. Built with advanced cooling technology for consistent temperature control.',
                'capacity_litres' => 120,
                'power_consumption_watts' => 85,
                'color' => 'White',
                'defrost_type' => 'Manual',
                'cash_warranty_months' => 12,
                'paygo_warranty_months' => 24,
                'price_usd' => 1590.00,
                'weekly_installment_usd' => 30.00,
                'monthly_installment_usd' => 130.00,
                'features' => json_encode(['Single Door', 'Freezer Chamber', 'Large Capacity', 'Multiple Shelves', 'Solar Powered', 'Dual Power']),
                'images' => json_encode(['/images/koyo-120l-1.jpg', '/images/koyo-120l-2.jpg']),
                'is_active' => true,
            ],
            [
                'category_id' => $freezerCategory->id,
                'name' => 'KOYO BC-200F CHEST FREEZER',
                'model_code' => 'BC-200F',
                'description_text' => 'Large capacity chest freezer perfect for bulk storage of frozen goods.',
                'long_description' => 'The KOYO BC-200F chest freezer provides 200 litres of frozen storage capacity. Ideal for restaurants, shops, and large families who need to store significant amounts of frozen food. Features excellent insulation and energy-efficient operation.',
                'capacity_litres' => 200,
                'power_consumption_watts' => 120,
                'color' => 'White',
                'defrost_type' => 'Manual',
                'cash_warranty_months' => 12,
                'paygo_warranty_months' => 24,
                'price_usd' => 1890.00,
                'weekly_installment_usd' => 35.00,
                'monthly_installment_usd' => 152.00,
                'features' => json_encode(['Chest Design', 'Large Capacity', 'Deep Freeze', 'Energy Efficient', 'Solar Powered', 'Commercial Grade']),
                'images' => json_encode(['/images/koyo-200f-1.jpg', '/images/koyo-200f-2.jpg']),
                'is_active' => true,
            ],
            [
                'category_id' => $displayCategory->id,
                'name' => 'KOYO BC-150G DISPLAY COOLER',
                'model_code' => 'BC-150G',
                'description_text' => 'Glass door display cooler perfect for shops and restaurants to showcase cold beverages and food.',
                'long_description' => 'The KOYO BC-150G display cooler combines functionality with visual appeal. Perfect for retail environments, restaurants, and cafes, this unit allows customers to see products while maintaining optimal cooling temperatures. Features LED lighting and clear glass doors.',
                'capacity_litres' => 150,
                'power_consumption_watts' => 95,
                'color' => 'Black',
                'defrost_type' => 'Automatic',
                'cash_warranty_months' => 12,
                'paygo_warranty_months' => 24,
                'price_usd' => 2190.00,
                'weekly_installment_usd' => 40.00,
                'monthly_installment_usd' => 173.00,
                'features' => json_encode(['Glass Door', 'LED Lighting', 'Display Design', 'Automatic Defrost', 'Solar Powered', 'Commercial Use']),
                'images' => json_encode(['/images/koyo-150g-1.jpg', '/images/koyo-150g-2.jpg']),
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
                'price_usd' => 1050.00,
                'weekly_installment_usd' => 20.00,
                'monthly_installment_usd' => 87.00,
                'features' => json_encode(['Single Door', 'Compact Design', 'Medium Capacity', 'Energy Efficient', 'Solar Powered', 'Reliable']),
                'images' => json_encode(['/images/koyo-75l-1.jpg', '/images/koyo-75l-2.jpg']),
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
