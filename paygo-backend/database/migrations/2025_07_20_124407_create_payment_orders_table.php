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
        Schema::create('payment_orders', function (Blueprint $table) {
            $table->id();
            
            // Order Details
            $table->string('order_reference')->unique(); // e.g., ORD-2024-001234
            $table->string('quote_id')->nullable(); // Link to frontend plan session
            $table->enum('payment_type', ['down_payment', 'full_payment', 'installment'])->default('down_payment');
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled'])->default('pending');
            
            // Customer Details
            $table->unsignedBigInteger('client_id')->nullable(); // Link to clients table if user is registered
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone');
            
            // Product Details
            $table->unsignedBigInteger('product_id');
            $table->string('product_name');
            $table->decimal('product_price', 10, 2);
            
            // Payment Plan Details
            $table->string('plan_type')->nullable(); // 'weekly', 'monthly', 'cash'
            $table->decimal('down_payment_amount', 10, 2)->nullable();
            $table->decimal('installment_amount', 10, 2)->nullable();
            $table->integer('total_installments')->nullable();
            $table->string('plan_duration')->nullable(); // '1 year', '2 years'
            
            // Payment Details
            $table->decimal('paid_amount', 10, 2);
            $table->string('payment_method'); // 'mpesa_stk', 'mpesa_till', 'card', 'bank'
            $table->string('mpesa_phone_number')->nullable();
            $table->string('checkout_request_id')->nullable(); // Link to M-Pesa transaction
            $table->string('mpesa_receipt_number')->nullable();
            $table->timestamp('payment_completed_at')->nullable();
            
            // Delivery Details
            $table->text('delivery_address')->nullable();
            $table->string('delivery_county')->nullable();
            $table->decimal('delivery_latitude', 10, 8)->nullable();
            $table->decimal('delivery_longitude', 11, 8)->nullable();
            
            // Additional Info
            $table->json('additional_data')->nullable(); // Store any extra order details
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['client_id', 'status']);
            $table->index(['checkout_request_id']);
            $table->index(['order_reference']);
            $table->index(['customer_phone']);
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_orders');
    }
};
