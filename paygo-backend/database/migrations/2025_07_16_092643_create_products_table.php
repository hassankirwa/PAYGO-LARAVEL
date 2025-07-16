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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('product_categories')->onDelete('restrict');
            $table->string('name');
            $table->string('model_code', 50);
            $table->text('description_text')->nullable();
            $table->text('long_description')->nullable();
            $table->integer('capacity_litres')->nullable();
            $table->integer('power_consumption_watts')->nullable();
            $table->string('color', 50)->nullable();
            $table->enum('defrost_type', ['Manual', 'Automatic'])->default('Manual');
            $table->integer('cash_warranty_months')->default(12);
            $table->integer('paygo_warranty_months')->default(24);
            $table->decimal('price_usd', 10, 2);
            $table->decimal('weekly_installment_usd', 10, 2);
            $table->decimal('monthly_installment_usd', 10, 2)->nullable();
            $table->json('features')->nullable();
            $table->json('images')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
