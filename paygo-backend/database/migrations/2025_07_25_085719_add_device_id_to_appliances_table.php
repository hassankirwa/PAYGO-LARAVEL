<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('appliances', function (Blueprint $table) {
            // Add device_id for PayBill integration
            $table->string('device_id')->nullable()->unique()->index()->after('unit_id');
            
            // Add payment tracking fields
            $table->timestamp('last_payment_date')->nullable()->after('warranty_expiry_date');
            $table->timestamp('next_payment_due')->nullable()->after('last_payment_date');
            $table->decimal('total_paid', 10, 2)->default(0)->after('next_payment_due');
            $table->decimal('remaining_balance', 10, 2)->default(0)->after('total_paid');
            $table->boolean('is_active')->default(true)->after('remaining_balance');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appliances', function (Blueprint $table) {
            $table->dropColumn([
                'device_id',
                'last_payment_date',
                'next_payment_due', 
                'total_paid',
                'remaining_balance',
                'is_active'
            ]);
        });
    }
};
