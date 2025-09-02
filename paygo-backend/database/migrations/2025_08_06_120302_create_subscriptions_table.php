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
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            
            // Foreign key relationships
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('appliance_id')->constrained('appliances')->onDelete('cascade');
            $table->foreignId('payment_plan_id')->nullable()->constrained('payment_plans')->onDelete('set null');
            $table->foreignId('activation_payment_id')->nullable()->constrained('payments')->onDelete('set null');
            
            // Device information
            $table->string('device_id')->index(); // e.g., KY123456
            
            // Subscription details
            $table->enum('subscription_type', ['paygo', 'full_purchase', 'trial', 'maintenance'])->default('paygo');
            $table->enum('status', ['active', 'expired', 'suspended', 'cancelled', 'maintenance'])->default('active');
            
            // Time tracking
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->timestamp('suspended_at')->nullable();
            $table->timestamp('reactivated_at')->nullable();
            
            // Suspension details
            $table->string('suspension_reason')->nullable(); // 'payment_overdue', 'subscription_expired', etc.
            $table->text('suspension_notes')->nullable();
            
            // Administrative info
            $table->unsignedBigInteger('created_by')->nullable(); // Admin who created
            $table->unsignedBigInteger('suspended_by')->nullable(); // Admin who suspended
            $table->unsignedBigInteger('reactivated_by')->nullable(); // Admin who reactivated
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['device_id', 'status']);
            $table->index(['client_id', 'status']);
            $table->index(['appliance_id', 'status']);
            $table->index(['start_date', 'end_date']);
            $table->index('status');
            
            // Foreign key constraints for admin users
            $table->foreign('created_by')->references('id')->on('admin_users')->onDelete('set null');
            $table->foreign('suspended_by')->references('id')->on('admin_users')->onDelete('set null');
            $table->foreign('reactivated_by')->references('id')->on('admin_users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
