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
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('category')->index(); // e.g., 'mpesa', 'pesapal', 'system', 'email'
            $table->string('key')->index(); // e.g., 'environment', 'consumer_key', 'shortcode'
            $table->text('value')->nullable(); // The setting value (encrypted for sensitive data)
            $table->text('description')->nullable(); // Human readable description
            $table->boolean('is_encrypted')->default(false); // Whether value is encrypted
            $table->boolean('is_active')->default(true); // Whether setting is active
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            // Composite unique index to prevent duplicate category+key combinations
            $table->unique(['category', 'key']);
            
            // Foreign key constraints for audit trail
            $table->foreign('created_by')->references('id')->on('admin_users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('admin_users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
