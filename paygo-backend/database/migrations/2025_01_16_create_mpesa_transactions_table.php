<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('mpesa_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('merchant_request_id');
            $table->string('checkout_request_id');
            $table->integer('result_code');
            $table->string('result_desc');
            $table->decimal('amount', 18, 2)->nullable();
            $table->string('mpesa_receipt_number')->nullable();
            $table->decimal('balance', 18, 2)->nullable();
            $table->dateTime('transaction_date');
            $table->string('phone_number')->nullable();
            $table->json('raw_payload');
            $table->timestamps();
            
            // Add indexes for better performance
            $table->index('merchant_request_id');
            $table->index('checkout_request_id');
            $table->index('mpesa_receipt_number');
            $table->index('result_code');
        });
    }

    public function down()
    {
        Schema::dropIfExists('mpesa_transactions');
    }
}; 