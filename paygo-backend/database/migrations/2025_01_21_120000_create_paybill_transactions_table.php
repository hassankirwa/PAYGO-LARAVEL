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
        Schema::create('paybill_transactions', function (Blueprint $table) {
            $table->id();
            
            // M-Pesa Transaction Details
            $table->string('transaction_type')->default('Pay Bill');
            $table->string('trans_id')->unique(); // M-Pesa transaction ID
            $table->string('trans_time'); // M-Pesa transaction time (YYYYMMDDHHmmss)
            $table->decimal('trans_amount', 10, 2); // Transaction amount in KSh
            $table->string('business_short_code'); // PayGo business number
            $table->string('bill_ref_number'); // Device ID (account reference)
            $table->string('invoice_number')->nullable();
            $table->decimal('org_account_balance', 15, 2)->nullable();
            $table->string('third_party_trans_id')->nullable();
            $table->string('mpesa_receipt_number')->nullable(); // M-Pesa receipt
            
            // Customer Information
            $table->string('msisdn'); // Customer phone number
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            
            // PayGo Platform Details
            $table->string('device_id')->index(); // Device identifier
            $table->unsignedBigInteger('client_id')->nullable(); // Link to client
            $table->unsignedBigInteger('appliance_id')->nullable(); // Link to appliance
            $table->unsignedBigInteger('payment_order_id')->nullable(); // Link to payment order
            $table->unsignedBigInteger('payment_plan_id')->nullable(); // Link to payment plan
            
            // Payment Classification
            $table->enum('payment_type', ['down_payment', 'installment', 'advance_payment', 'late_payment'])->default('installment');
            $table->decimal('expected_amount', 10, 2)->nullable(); // What we expected
            $table->boolean('amount_matched')->default(false); // Did amount match exactly?
            
            // Processing Status
            $table->enum('status', ['pending', 'processed', 'failed'])->default('pending');
            $table->boolean('credited_to_account')->default(false); // Has payment been credited?
            $table->timestamp('processed_at')->nullable();
            $table->string('processed_by')->nullable(); // Admin/system that processed
            
            // Business Logic
            $table->text('processing_notes')->nullable();
            $table->json('validation_details')->nullable(); // Store validation results
            $table->json('raw_payload'); // Full M-Pesa callback data
            
            $table->timestamps();
            
            // Indexes for better performance
            $table->index(['device_id', 'created_at']);
            $table->index(['client_id', 'created_at']);
            $table->index(['status', 'created_at']);
            $table->index(['payment_type', 'created_at']);
            $table->index(['msisdn', 'created_at']);
            $table->index(['trans_id']);
            
            // Foreign key constraints
            $table->foreign('client_id')->references('id')->on('clients')->onDelete('set null');
            $table->foreign('appliance_id')->references('id')->on('appliances')->onDelete('set null');
            $table->foreign('payment_order_id')->references('id')->on('payment_orders')->onDelete('set null');
            $table->foreign('payment_plan_id')->references('id')->on('payment_plans')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('paybill_transactions');
    }
}; 