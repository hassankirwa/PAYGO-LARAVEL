<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;

class PaymentOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_reference',
        'quote_id',
        'payment_type',
        'status',
        'client_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'product_id',
        'product_name',
        'product_price',
        'plan_type',
        'down_payment_amount',
        'installment_amount',
        'total_installments',
        'plan_duration',
        'paid_amount',
        'payment_method',
        'mpesa_phone_number',
        'checkout_request_id',
        'mpesa_receipt_number',
        'payment_completed_at',
        'delivery_address',
        'delivery_county',
        'delivery_latitude',
        'delivery_longitude',
        'additional_data',
        'notes',
    ];

    protected $casts = [
        'product_price' => 'decimal:2',
        'down_payment_amount' => 'decimal:2',
        'installment_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'delivery_latitude' => 'decimal:8',
        'delivery_longitude' => 'decimal:8',
        'additional_data' => 'array',
        'payment_completed_at' => 'datetime',
    ];

    // Generate unique order reference
    public static function generateOrderReference()
    {
        $timestamp = now()->format('YmdHis');
        $random = strtoupper(substr(md5(uniqid()), 0, 4));
        return "ORD-{$timestamp}-{$random}";
    }

    // Status helper methods
    public function isPending()
    {
        return $this->status === 'pending';
    }

    public function isProcessing()
    {
        return $this->status === 'processing';
    }

    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    public function isFailed()
    {
        return $this->status === 'failed';
    }

    public function markAsCompleted()
    {
        $this->update([
            'status' => 'completed',
            'payment_completed_at' => now(),
        ]);
    }

    public function markAsFailed()
    {
        $this->update(['status' => 'failed']);
    }

    // Formatted amount getters
    public function getFormattedPaidAmountAttribute()
    {
        return 'KSh ' . number_format($this->paid_amount, 2);
    }

    public function getFormattedProductPriceAttribute()
    {
        return 'KSh ' . number_format($this->product_price, 2);
    }

    // Relationships
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function mpesaTransaction()
    {
        return $this->hasOne(MpesaTransaction::class, 'checkout_request_id', 'checkout_request_id');
    }

    // Scopes
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeForClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    public function scopeByPhone($query, $phone)
    {
        return $query->where('customer_phone', $phone)
                    ->orWhere('mpesa_phone_number', $phone);
    }
}
