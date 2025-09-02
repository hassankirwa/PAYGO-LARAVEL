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
        Schema::create('c2b_transactions', function (Blueprint $table) {
            $table->id();
            
            // M-Pesa C2B fields
            $table->string('transaction_type')->default('Pay Bill'); // Always "Pay Bill" for Paybill
            $table->string('trans_id')->unique(); // M-Pesa transaction ID
            $table->string('trans_time'); // M-Pesa transaction time (YYYYMMDDHHmmss)
            $table->decimal('trans_amount', 10, 2); // Transaction amount
            $table->string('business_short_code'); // KOYO Paybill number
            $table->string('bill_ref_number'); // KOYO device ID (account reference)
            $table->string('invoice_number')->nullable(); // M-Pesa invoice number
            $table->decimal('org_account_balance', 15, 2)->nullable(); // Organization balance
            $table->string('third_party_trans_id')->nullable(); // Third party transaction ID
            
            // Customer information
            $table->string('msisdn'); // Customer M-Pesa phone number
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            
            // KOYO specific fields
            $table->string('device_id')->index(); // KOYO device identifier (same as bill_ref_number)
            $table->enum('payment_type', ['installment', 'late_payment', 'advance_payment'])->default('installment');
            $table->boolean('processed')->default(false); // Whether payment has been processed
            $table->text('notes')->nullable(); // Processing notes
            
            // Raw data storage
            $table->json('raw_payload'); // Full M-Pesa callback payload
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['device_id', 'created_at']);
            $table->index(['msisdn', 'created_at']);
            $table->index(['processed', 'created_at']);
            $table->index('trans_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('c2b_transactions');
    }
};
