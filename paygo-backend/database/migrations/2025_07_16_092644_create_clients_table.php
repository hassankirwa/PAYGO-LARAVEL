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
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('client_code', 20)->unique();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('email')->unique();
            $table->string('phone', 20);
            $table->string('password_hash');
            $table->text('address')->nullable();
            $table->string('location')->nullable();
            $table->enum('payment_plan', ['weekly', 'monthly']);
            $table->enum('status', ['active', 'suspended', 'completed', 'defaulted'])->default('active');
            $table->enum('payment_status', ['current', 'overdue', 'completed'])->default('current');
            $table->boolean('is_active')->default(true);
            $table->timestamp('registration_date')->useCurrent();
            $table->timestamp('last_login')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
