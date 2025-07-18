<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MpesaTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'merchant_request_id',
        'checkout_request_id',
        'result_code',
        'result_desc',
        'amount',
        'mpesa_receipt_number',
        'balance',
        'transaction_date',
        'phone_number',
        'raw_payload',
    ];

    protected $casts = [
        'transaction_date' => 'datetime',
        'raw_payload'      => 'array',
        'amount' => 'decimal:2',
        'balance' => 'decimal:2',
    ];

    // Helper methods
    public function isSuccessful()
    {
        return $this->result_code === 0;
    }

    public function isFailed()
    {
        return $this->result_code !== 0;
    }

    public function getFormattedAmountAttribute()
    {
        return 'KSh ' . number_format($this->amount, 2);
    }

    // Relationships - can be added later when integrating with PaymentPlan
    public function paymentPlan()
    {
        // return $this->belongsTo(PaymentPlan::class, 'account_reference', 'reference_code');
    }
} 