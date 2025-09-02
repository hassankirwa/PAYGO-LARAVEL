<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PaymentReceipt extends Model
{
    use HasFactory;

    protected $fillable = [
        'receipt_number',
        'payment_order_id',
        'transaction_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'product_name',
        'payment_amount',
        'payment_method',
        'mpesa_receipt_number',
        'payment_date',
        'payment_type',
        'plan_type',
        'order_reference',
        'receipt_data',
        'status',
        'generated_at',
        'sent_at',
        'viewed_at',
        'downloaded_at',
    ];

    protected $casts = [
        'payment_amount' => 'decimal:2',
        'payment_date' => 'datetime',
        'receipt_data' => 'array',
        'generated_at' => 'datetime',
        'sent_at' => 'datetime',
        'viewed_at' => 'datetime',
        'downloaded_at' => 'datetime',
    ];

    // Relationships
    public function paymentOrder()
    {
        return $this->belongsTo(PaymentOrder::class);
    }

    public function transaction()
    {
        return $this->belongsTo(MpesaTransaction::class, 'transaction_id');
    }

    // Helper methods
    public function markAsViewed()
    {
        if (!$this->viewed_at) {
            $this->update([
                'viewed_at' => now(),
                'status' => 'viewed'
            ]);
        }
    }

    public function markAsDownloaded()
    {
        $this->update([
            'downloaded_at' => now(),
            'status' => 'downloaded'
        ]);
    }

    public function markAsSent()
    {
        if (!$this->sent_at) {
            $this->update([
                'sent_at' => now(),
                'status' => 'sent'
            ]);
        }
    }

    // Scopes
    public function scopeForCustomer($query, $phone = null, $email = null)
    {
        return $query->when($phone, function ($query, $phone) {
            return $query->where('customer_phone', $phone);
        })->when($email, function ($query, $email) {
            return $query->where('customer_email', $email);
        });
    }

    public function scopeRecent($query, $days = 30)
    {
        return $query->where('payment_date', '>=', now()->subDays($days));
    }

    // Accessors
    public function getFormattedAmountAttribute()
    {
        return 'KSh ' . number_format($this->payment_amount, 0);
    }

    public function getReceiptUrlAttribute()
    {
        return url("/api/receipts/{$this->receipt_number}");
    }

    public function getDownloadUrlAttribute()
    {
        return url("/api/receipts/{$this->receipt_number}/download");
    }
}
