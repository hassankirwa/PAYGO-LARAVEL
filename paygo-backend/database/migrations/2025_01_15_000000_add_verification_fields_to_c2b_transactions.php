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
        Schema::table('c2b_transactions', function (Blueprint $table) {
            // Payment verification fields
            $table->enum('verification_status', ['pending', 'verified', 'failed', 'rejected'])->default('pending')->after('processed');
            $table->decimal('expected_amount', 10, 2)->nullable()->after('verification_status');
            $table->boolean('amount_verified')->default(false)->after('expected_amount');
            $table->text('verification_details')->nullable()->after('amount_verified');
            $table->timestamp('verified_at')->nullable()->after('verification_details');
            $table->string('verification_method')->nullable()->after('verified_at');
            $table->string('payment_order_id')->nullable()->after('verification_method');
            $table->enum('payment_status', ['received', 'verified', 'rejected', 'refund_requested'])->default('received')->after('payment_order_id');
            
            // Rejection/refund fields
            $table->text('rejection_reason')->nullable()->after('payment_status');
            $table->boolean('refund_initiated')->default(false)->after('rejection_reason');
            $table->timestamp('refund_requested_at')->nullable()->after('refund_initiated');
            
            // Add indexes for better performance
            $table->index(['verification_status', 'created_at']);
            $table->index(['device_id', 'verification_status']);
            $table->index(['payment_order_id']);
            $table->index(['payment_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('c2b_transactions', function (Blueprint $table) {
            $table->dropIndex(['verification_status', 'created_at']);
            $table->dropIndex(['device_id', 'verification_status']);
            $table->dropIndex(['payment_order_id']);
            $table->dropIndex(['payment_status']);
            
            $table->dropColumn([
                'verification_status',
                'expected_amount',
                'amount_verified',
                'verification_details',
                'verified_at',
                'verification_method',
                'payment_order_id',
                'payment_status',
                'rejection_reason',
                'refund_initiated',
                'refund_requested_at'
            ]);
        });
    }
}; 