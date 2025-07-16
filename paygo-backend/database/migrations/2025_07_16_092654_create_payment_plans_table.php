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
        Schema::create('payment_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->onDelete('restrict');
            $table->foreignId('appliance_id')->constrained('appliances')->onDelete('restrict');
            $table->decimal('total_amount_usd', 10, 2);
            $table->decimal('down_payment_usd', 10, 2)->default(0);
            $table->decimal('installment_amount_usd', 10, 2);
            $table->enum('payment_frequency', ['weekly', 'monthly']);
            $table->integer('total_installments');
            $table->integer('installments_completed')->default(0);
            $table->decimal('total_paid_usd', 10, 2)->default(0);
            $table->decimal('remaining_balance_usd', 10, 2);
            $table->date('start_date');
            $table->date('expected_completion_date');
            $table->date('next_payment_due_date');
            $table->integer('grace_period_days')->default(3);
            $table->decimal('late_fee_percentage', 5, 2)->default(0);
            $table->enum('status', ['active', 'completed', 'defaulted', 'suspended'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_plans');
    }
};
