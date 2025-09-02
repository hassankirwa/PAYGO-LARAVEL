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
        Schema::table('clients', function (Blueprint $table) {
            // Personal Information (Story 3.2)
            $table->date('date_of_birth')->nullable();
            $table->string('national_id', 20)->nullable()->unique();
            $table->string('passport_number', 20)->nullable();
            $table->string('nationality', 50)->default('Kenyan');
            $table->decimal('address_latitude', 10, 8)->nullable();
            $table->decimal('address_longitude', 11, 8)->nullable();
            $table->string('occupation', 100)->nullable();
            $table->decimal('monthly_income', 12, 2)->nullable();
            $table->enum('income_source', ['salary', 'business', 'farming', 'other'])->nullable();
            $table->text('income_verification_notes')->nullable();
            
            // Business Information (Story 3.3) - if applicable
            $table->boolean('is_business_customer')->default(false);
            $table->string('business_name', 200)->nullable();
            $table->string('business_registration_number', 50)->nullable();
            $table->string('business_type', 100)->nullable();
            $table->string('business_industry', 100)->nullable();
            $table->text('business_address')->nullable();
            $table->integer('business_employees')->nullable();
            
            // Reference and Emergency Contacts (Story 3.4)
            $table->json('reference_contacts')->nullable(); // Store array of reference contacts
            $table->string('emergency_contact_name', 100)->nullable();
            $table->string('emergency_contact_phone', 20)->nullable();
            $table->string('emergency_contact_relationship', 50)->nullable();
            
            // Credit Assessment and Eligibility (Story 3.5)
            $table->enum('kyc_status', ['pending', 'under_review', 'approved', 'rejected', 'requires_documents'])->default('pending');
            $table->decimal('credit_score', 5, 2)->nullable();
            $table->decimal('paygo_limit', 12, 2)->nullable();
            $table->enum('eligibility_status', ['pending', 'eligible', 'not_eligible', 'conditional'])->default('pending');
            $table->text('eligibility_notes')->nullable();
            $table->timestamp('kyc_completed_at')->nullable();
            $table->timestamp('kyc_approved_at')->nullable();
            
            // Document Upload and Verification (Story 3.6)
            $table->string('id_document_front_path')->nullable();
            $table->string('id_document_back_path')->nullable();
            $table->string('proof_of_income_path')->nullable();
            $table->string('business_license_path')->nullable();
            $table->string('profile_photo_path')->nullable();
            $table->enum('document_verification_status', ['pending', 'verified', 'rejected', 'requires_resubmission'])->default('pending');
            $table->text('document_verification_notes')->nullable();
            $table->timestamp('documents_submitted_at')->nullable();
            $table->timestamp('documents_verified_at')->nullable();
            
            // Additional tracking fields
            $table->string('referred_by', 100)->nullable(); // How they heard about us
            $table->text('special_notes')->nullable(); // Any special circumstances
            $table->boolean('terms_accepted')->default(false);
            $table->timestamp('terms_accepted_at')->nullable();
            $table->string('registration_source', 50)->default('web'); // web, mobile, agent
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            // Drop all KYC fields in reverse order
            $table->dropColumn([
                'date_of_birth',
                'national_id',
                'passport_number',
                'nationality',
                'address_latitude',
                'address_longitude',
                'occupation',
                'monthly_income',
                'income_source',
                'income_verification_notes',
                'is_business_customer',
                'business_name',
                'business_registration_number',
                'business_type',
                'business_industry',
                'business_address',
                'business_employees',
                'reference_contacts',
                'emergency_contact_name',
                'emergency_contact_phone',
                'emergency_contact_relationship',
                'kyc_status',
                'credit_score',
                'paygo_limit',
                'eligibility_status',
                'eligibility_notes',
                'kyc_completed_at',
                'kyc_approved_at',
                'id_document_front_path',
                'id_document_back_path',
                'proof_of_income_path',
                'business_license_path',
                'profile_photo_path',
                'document_verification_status',
                'document_verification_notes',
                'documents_submitted_at',
                'documents_verified_at',
                'referred_by',
                'special_notes',
                'terms_accepted',
                'terms_accepted_at',
                'registration_source'
            ]);
        });
    }
};
