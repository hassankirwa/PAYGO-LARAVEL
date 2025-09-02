<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const USD_TO_KSH_RATE = 140; // Exchange rate for conversion

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Update Products table
        Schema::table('products', function (Blueprint $table) {
            // Add new KSh columns
            $table->decimal('price_ksh', 10, 2)->nullable()->after('price_usd');
            $table->decimal('weekly_installment_ksh', 10, 2)->nullable()->after('weekly_installment_usd');
            $table->decimal('monthly_installment_ksh', 10, 2)->nullable()->after('monthly_installment_usd');
        });

        // Convert existing USD data to KSh
        DB::table('products')->update([
            'price_ksh' => DB::raw('price_usd * ' . self::USD_TO_KSH_RATE),
            'weekly_installment_ksh' => DB::raw('weekly_installment_usd * ' . self::USD_TO_KSH_RATE),
            'monthly_installment_ksh' => DB::raw('COALESCE(monthly_installment_usd, 0) * ' . self::USD_TO_KSH_RATE),
        ]);

        Schema::table('products', function (Blueprint $table) {
            // Make KSh columns non-nullable and drop USD columns
            $table->decimal('price_ksh', 10, 2)->nullable(false)->change();
            $table->decimal('weekly_installment_ksh', 10, 2)->nullable(false)->change();
            $table->decimal('monthly_installment_ksh', 10, 2)->nullable()->change();
            
            $table->dropColumn(['price_usd', 'weekly_installment_usd', 'monthly_installment_usd']);
        });

        // 2. Update Payment Plans table
        Schema::table('payment_plans', function (Blueprint $table) {
            // Add new KSh columns
            $table->decimal('total_amount_ksh', 10, 2)->nullable()->after('total_amount_usd');
            $table->decimal('down_payment_ksh', 10, 2)->nullable()->after('down_payment_usd');
            $table->decimal('installment_amount_ksh', 10, 2)->nullable()->after('installment_amount_usd');
            $table->decimal('total_paid_ksh', 10, 2)->nullable()->after('total_paid_usd');
            $table->decimal('remaining_balance_ksh', 10, 2)->nullable()->after('remaining_balance_usd');
        });

        // Convert existing USD data to KSh
        DB::table('payment_plans')->update([
            'total_amount_ksh' => DB::raw('total_amount_usd * ' . self::USD_TO_KSH_RATE),
            'down_payment_ksh' => DB::raw('down_payment_usd * ' . self::USD_TO_KSH_RATE),
            'installment_amount_ksh' => DB::raw('installment_amount_usd * ' . self::USD_TO_KSH_RATE),
            'total_paid_ksh' => DB::raw('total_paid_usd * ' . self::USD_TO_KSH_RATE),
            'remaining_balance_ksh' => DB::raw('remaining_balance_usd * ' . self::USD_TO_KSH_RATE),
        ]);

        Schema::table('payment_plans', function (Blueprint $table) {
            // Make KSh columns non-nullable and drop USD columns
            $table->decimal('total_amount_ksh', 10, 2)->nullable(false)->change();
            $table->decimal('down_payment_ksh', 10, 2)->default(0)->change();
            $table->decimal('installment_amount_ksh', 10, 2)->nullable(false)->change();
            $table->decimal('total_paid_ksh', 10, 2)->default(0)->change();
            $table->decimal('remaining_balance_ksh', 10, 2)->nullable(false)->change();
            
            $table->dropColumn([
                'total_amount_usd', 
                'down_payment_usd', 
                'installment_amount_usd', 
                'total_paid_usd', 
                'remaining_balance_usd'
            ]);
        });

        // 3. Update Payments table
        Schema::table('payments', function (Blueprint $table) {
            // Add new KSh columns
            $table->decimal('amount_ksh', 10, 2)->nullable()->after('amount_usd');
            $table->decimal('late_fee_ksh', 10, 2)->nullable()->after('late_fee_usd');
        });

        // Convert existing USD data to KSh
        DB::table('payments')->update([
            'amount_ksh' => DB::raw('amount_usd * ' . self::USD_TO_KSH_RATE),
            'late_fee_ksh' => DB::raw('late_fee_usd * ' . self::USD_TO_KSH_RATE),
        ]);

        Schema::table('payments', function (Blueprint $table) {
            // Make KSh columns non-nullable and drop USD columns
            $table->decimal('amount_ksh', 10, 2)->nullable(false)->change();
            $table->decimal('late_fee_ksh', 10, 2)->default(0)->change();
            
            $table->dropColumn(['amount_usd', 'late_fee_usd']);
        });

        // 4. Update system settings to reflect KSh as default currency
        DB::table('system_settings')
            ->where('category', 'system')
            ->where('key', 'default_currency')
            ->update(['value' => 'KSH']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This is a destructive migration, so we'll recreate USD columns with converted data
        
        // 1. Revert Products table
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('price_usd', 10, 2)->nullable()->after('price_ksh');
            $table->decimal('weekly_installment_usd', 10, 2)->nullable()->after('weekly_installment_ksh');
            $table->decimal('monthly_installment_usd', 10, 2)->nullable()->after('monthly_installment_ksh');
        });

        DB::table('products')->update([
            'price_usd' => DB::raw('price_ksh / ' . self::USD_TO_KSH_RATE),
            'weekly_installment_usd' => DB::raw('weekly_installment_ksh / ' . self::USD_TO_KSH_RATE),
            'monthly_installment_usd' => DB::raw('COALESCE(monthly_installment_ksh, 0) / ' . self::USD_TO_KSH_RATE),
        ]);

        Schema::table('products', function (Blueprint $table) {
            $table->decimal('price_usd', 10, 2)->nullable(false)->change();
            $table->decimal('weekly_installment_usd', 10, 2)->nullable(false)->change();
            $table->dropColumn(['price_ksh', 'weekly_installment_ksh', 'monthly_installment_ksh']);
        });

        // 2. Revert Payment Plans table
        Schema::table('payment_plans', function (Blueprint $table) {
            $table->decimal('total_amount_usd', 10, 2)->nullable()->after('total_amount_ksh');
            $table->decimal('down_payment_usd', 10, 2)->nullable()->after('down_payment_ksh');
            $table->decimal('installment_amount_usd', 10, 2)->nullable()->after('installment_amount_ksh');
            $table->decimal('total_paid_usd', 10, 2)->nullable()->after('total_paid_ksh');
            $table->decimal('remaining_balance_usd', 10, 2)->nullable()->after('remaining_balance_ksh');
        });

        DB::table('payment_plans')->update([
            'total_amount_usd' => DB::raw('total_amount_ksh / ' . self::USD_TO_KSH_RATE),
            'down_payment_usd' => DB::raw('down_payment_ksh / ' . self::USD_TO_KSH_RATE),
            'installment_amount_usd' => DB::raw('installment_amount_ksh / ' . self::USD_TO_KSH_RATE),
            'total_paid_usd' => DB::raw('total_paid_ksh / ' . self::USD_TO_KSH_RATE),
            'remaining_balance_usd' => DB::raw('remaining_balance_ksh / ' . self::USD_TO_KSH_RATE),
        ]);

        Schema::table('payment_plans', function (Blueprint $table) {
            $table->decimal('total_amount_usd', 10, 2)->nullable(false)->change();
            $table->decimal('down_payment_usd', 10, 2)->default(0)->change();
            $table->decimal('installment_amount_usd', 10, 2)->nullable(false)->change();
            $table->decimal('total_paid_usd', 10, 2)->default(0)->change();
            $table->decimal('remaining_balance_usd', 10, 2)->nullable(false)->change();
            
            $table->dropColumn([
                'total_amount_ksh', 
                'down_payment_ksh', 
                'installment_amount_ksh', 
                'total_paid_ksh', 
                'remaining_balance_ksh'
            ]);
        });

        // 3. Revert Payments table
        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('amount_usd', 10, 2)->nullable()->after('amount_ksh');
            $table->decimal('late_fee_usd', 10, 2)->nullable()->after('late_fee_ksh');
        });

        DB::table('payments')->update([
            'amount_usd' => DB::raw('amount_ksh / ' . self::USD_TO_KSH_RATE),
            'late_fee_usd' => DB::raw('late_fee_ksh / ' . self::USD_TO_KSH_RATE),
        ]);

        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('amount_usd', 10, 2)->nullable(false)->change();
            $table->decimal('late_fee_usd', 10, 2)->default(0)->change();
            
            $table->dropColumn(['amount_ksh', 'late_fee_ksh']);
        });

        // 4. Revert system settings
        DB::table('system_settings')
            ->where('category', 'system')
            ->where('key', 'default_currency')
            ->update(['value' => 'USD']);
    }
};
