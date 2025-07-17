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
        'price_usd',
        'weekly_installment_usd',
        'monthly_installment_usd',
        'features',
        'images',
        'is_active'
    ];

    protected $casts = [
        'price_usd' => 'decimal:2',
        'weekly_installment_usd' => 'decimal:2',
        'monthly_installment_usd' => 'decimal:2',
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
        return '$' . number_format($this->price_usd, 2);
    }

    public function getWeeklyInstallmentAttribute()
    {
        return '$' . number_format($this->weekly_installment_usd, 2);
    }
}
