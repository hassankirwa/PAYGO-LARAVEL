<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Payment extends Model
{
    use HasFactory;

    protected $table = 'payments';

    protected $fillable = [
        'payment_plan_id',
        'client_id',
        'amount_usd',
        'payment_date',
        'payment_method',
        'payment_reference',
        'status',
        'late_fee_usd',
        'notes',
        'processed_by'
    ];

    protected $casts = [
        'amount_usd' => 'decimal:2',
        'late_fee_usd' => 'decimal:2',
        'payment_date' => 'datetime',
        'processed_by' => 'integer'
    ];

    // Relationships
    public function paymentPlan()
    {
        return $this->belongsTo(PaymentPlan::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function processedBy()
    {
        return $this->belongsTo(AdminUser::class, 'processed_by');
    }

    // Helper methods
    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    public function isPending()
    {
        return $this->status === 'pending';
    }

    public function isFailed()
    {
        return $this->status === 'failed';
    }

    public function getTotalAmountAttribute()
    {
        return $this->amount_usd + $this->late_fee_usd;
    }
} 