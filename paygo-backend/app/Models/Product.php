<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'model_code',
        'description_text',
        'long_description',
        'capacity_litres',
        'power_consumption_watts',
        'color',
        'defrost_type',
        'cash_warranty_months',
        'paygo_warranty_months',
        'price_ksh',
        'weekly_installment_ksh',
        'monthly_installment_ksh',
        'features',
        'images',
        'is_active'
    ];

    protected $casts = [
        'price_ksh' => 'decimal:2',
        'weekly_installment_ksh' => 'decimal:2',
        'monthly_installment_ksh' => 'decimal:2',
        'features' => 'array',
        'images' => 'array',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function category()
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function appliances()
    {
        return $this->hasMany(Appliance::class);
    }

    // Helper methods
    public function getFormattedPriceAttribute()
    {
        return 'KSh ' . number_format($this->price_ksh, 0);
    }

    public function getFormattedWeeklyInstallmentAttribute()
    {
        return 'KSh ' . number_format($this->weekly_installment_ksh, 0);
    }

    public function getFormattedMonthlyInstallmentAttribute()
    {
        return 'KSh ' . number_format($this->monthly_installment_ksh, 0);
    }
}
