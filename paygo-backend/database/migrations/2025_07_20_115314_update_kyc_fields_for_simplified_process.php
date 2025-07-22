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
            // Add KRA PIN field for business customers
            $table->string('kra_pin', 20)->nullable()->after('business_employees');
            
            // Remove proof of income path as it's no longer required
            $table->dropColumn('proof_of_income_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            // Drop KRA PIN field
            $table->dropColumn('kra_pin');
            
            // Re-add proof of income path
            $table->string('proof_of_income_path')->nullable()->after('id_document_back_path');
        });
    }
};
