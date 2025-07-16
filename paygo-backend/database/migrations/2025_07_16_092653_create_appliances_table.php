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
        Schema::create('appliances', function (Blueprint $table) {
            $table->id();
            $table->string('unit_id', 50)->unique();
            $table->string('serial_number', 100)->unique();
            $table->foreignId('client_id')->constrained('clients')->onDelete('restrict');
            $table->foreignId('product_id')->constrained('products')->onDelete('restrict');
            $table->string('installation_location');
            $table->date('installation_date');
            $table->enum('status', ['active', 'offline', 'maintenance', 'decommissioned'])->default('active');
            $table->string('current_temperature', 10)->nullable();
            $table->string('current_battery_voltage', 10)->nullable();
            $table->timestamp('last_ping')->nullable();
            $table->date('last_maintenance_date')->nullable();
            $table->date('warranty_expiry_date')->nullable();
            $table->text('installation_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appliances');
    }
};
