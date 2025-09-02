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
        Schema::create('payment_receipts', function (Blueprint $table) {
            $table->id();
            
            // Receipt identification
            $table->string('receipt_number')->unique(); // RCP-YYYYMMDDHHMMSS-XXXX
            
            // Related records
            $table->foreignId('payment_order_id')->constrained('payment_orders')->onDelete('cascade');
            $table->foreignId('transaction_id')->nullable()->constrained('mpesa_transactions')->onDelete('set null');
            
            // Customer information
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone');
            
            // Payment details
            $table->string('product_name');
            $table->decimal('payment_amount', 10, 2);
            $table->string('payment_method')->default('M-Pesa');
            $table->string('mpesa_receipt_number')->nullable();
            $table->timestamp('payment_date');
            $table->string('payment_type'); // down_payment, installment, etc.
            $table->string('plan_type')->nullable(); // weekly, monthly, etc.
            $table->string('order_reference');
            
            // Receipt data and metadata
            $table->json('receipt_data'); // Structured receipt content
            $table->enum('status', ['generated', 'sent', 'viewed', 'downloaded'])->default('generated');
            $table->timestamp('generated_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('viewed_at')->nullable();
            $table->timestamp('downloaded_at')->nullable();
            
            $table->timestamps();
            
            // Indexes for better performance
            $table->index(['customer_phone', 'payment_date']);
            $table->index(['customer_email', 'payment_date']);
            $table->index(['payment_order_id']);
            $table->index(['mpesa_receipt_number']);
            $table->index(['status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_receipts');
    }
};
