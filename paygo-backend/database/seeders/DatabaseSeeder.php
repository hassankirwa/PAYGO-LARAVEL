<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\AdminUser;
use App\Models\Client;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Delete existing demo users first to avoid conflicts
        AdminUser::where('email', 'admin@koyo.com')->delete();
        Client::where('email', 'client@example.com')->delete();
        
        // Create demo admin user: admin@koyo.com / admin123
        AdminUser::create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@koyo.com',
            'password_hash' => Hash::make('admin123'),
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        // Create demo client user: client@example.com / client123
        // Note: Client model has a mutator that auto-hashes password_hash
        Client::create([
            'client_code' => Client::generateClientCode(),
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'client@example.com',
            'phone' => '+254700123456',
            'password_hash' => 'client123', // Will be auto-hashed by model mutator
            'address' => '123 Demo Street, Nairobi',
            'location' => 'Nairobi, Kenya',
            'payment_plan' => 'weekly',
            'status' => 'active',
            'payment_status' => 'current',
            'is_active' => true,
            'kyc_status' => 'approved',
            'eligibility_status' => 'eligible',
            'terms_accepted' => true,
            'terms_accepted_at' => now(),
            'registration_source' => 'seeder',
            'date_of_birth' => '1990-01-01',
            'national_id' => '12345678',
            'nationality' => 'Kenyan',
        ]);

        // Seed products and categories
        $this->call([
            ProductSeeder::class,
            SystemSettingsSeeder::class,
        ]);

        $this->command->info('Demo users created successfully:');
        $this->command->info('Admin: admin@koyo.com / admin123');
        $this->command->info('Client: client@example.com / client123');
    }
}
