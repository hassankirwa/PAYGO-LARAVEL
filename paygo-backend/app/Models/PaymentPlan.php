<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PaymentPlan extends Model
{
    use HasFactory;

    protected $table = 'payment_plans';

    protected $fillable = [
        'client_id',
        'appliance_id',
        'total_amount_usd',
        'down_payment_usd',
        'installment_amount_usd',
        'payment_frequency',
        'total_installments',
        'installments_completed',
        'total_paid_usd',
        'remaining_balance_usd',
        'start_date',
        'expected_completion_date',
        'next_payment_due_date',
        'grace_period_days',
        'late_fee_percentage',
        'status'
    ];

    protected $casts = [
        'total_amount_usd' => 'decimal:2',
        'down_payment_usd' => 'decimal:2',
        'installment_amount_usd' => 'decimal:2',
        'total_paid_usd' => 'decimal:2',
        'remaining_balance_usd' => 'decimal:2',
        'late_fee_percentage' => 'decimal:2',
        'start_date' => 'date',
        'expected_completion_date' => 'date',
        'next_payment_due_date' => 'date',
        'installments_completed' => 'integer',
        'total_installments' => 'integer',
        'grace_period_days' => 'integer'
    ];

    // Relationships
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function appliance()
    {
        return $this->belongsTo(Appliance::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    // Helper methods
    public function getProgressPercentageAttribute()
    {
        return $this->total_installments > 0 
            ? ($this->installments_completed / $this->total_installments) * 100 
            : 0;
    }

    public function isOverdue()
    {
        return $this->next_payment_due_date < now() && $this->status === 'active';
    }

    public function isCompleted()
    {
        return $this->status === 'completed' || $this->installments_completed >= $this->total_installments;
    }
} 