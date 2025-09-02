<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class C2BTransaction extends Model
{
    use HasFactory;

    protected $table = 'c2b_transactions';

    protected $fillable = [
        'transaction_type',
        'trans_id',
        'trans_time',
        'trans_amount',
        'business_short_code',
        'bill_ref_number', // KOYO device ID
        'invoice_number',
        'org_account_balance',
        'third_party_trans_id',
        'msisdn',
        'first_name',
        'middle_name',
        'last_name',
        'raw_payload',
        'processed',
        'device_id', // KOYO device identifier
        'payment_type', // 'installment', 'late_payment', 'advance_payment'
        'notes',
        // New verification fields
        'verification_status',
        'expected_amount',
        'amount_verified',
        'verification_details',
        'verified_at',
        'verification_method',
        'payment_order_id',
        'payment_status',
        'rejection_reason',
        'refund_initiated',
        'refund_requested_at',
    ];

    protected $casts = [
        'trans_amount' => 'decimal:2',
        'expected_amount' => 'decimal:2',
        'org_account_balance' => 'decimal:2',
        'raw_payload' => 'array',
        'processed' => 'boolean',
        'amount_verified' => 'boolean',
        'refund_initiated' => 'boolean',
        'trans_time' => 'datetime',
        'verified_at' => 'datetime',
        'refund_requested_at' => 'datetime',
    ];

    // Helper methods
    public function getFormattedAmountAttribute()
    {
        return 'KSh ' . number_format($this->trans_amount, 2);
    }

    public function getFormattedExpectedAmountAttribute()
    {
        return $this->expected_amount ? 'KSh ' . number_format($this->expected_amount, 2) : 'N/A';
    }

    public function getCustomerNameAttribute()
    {
        return trim("{$this->first_name} {$this->middle_name} {$this->last_name}");
    }

    public function isProcessed()
    {
        return $this->processed;
    }

    // Verification status helpers
    public function isPendingVerification()
    {
        return $this->verification_status === 'pending';
    }

    public function isVerified()
    {
        return $this->verification_status === 'verified';
    }

    public function isVerificationFailed()
    {
        return $this->verification_status === 'failed';
    }

    public function isRejected()
    {
        return $this->verification_status === 'rejected';
    }

    // Payment status helpers
    public function isPaymentReceived()
    {
        return $this->payment_status === 'received';
    }

    public function isPaymentVerified()
    {
        return $this->payment_status === 'verified';
    }

    public function isPaymentRejected()
    {
        return $this->payment_status === 'rejected';
    }

    public function isRefundRequested()
    {
        return $this->payment_status === 'refund_requested';
    }

    // Amount verification helpers
    public function isAmountSufficient()
    {
        if (!$this->expected_amount) {
            return true; // If no expected amount, consider sufficient
        }
        
        return $this->trans_amount >= $this->expected_amount;
    }

    public function getAmountShortfallAttribute()
    {
        if (!$this->expected_amount || $this->trans_amount >= $this->expected_amount) {
            return 0;
        }
        
        return $this->expected_amount - $this->trans_amount;
    }

    public function getAmountExcessAttribute()
    {
        if (!$this->expected_amount || $this->trans_amount <= $this->expected_amount) {
            return 0;
        }
        
        return $this->trans_amount - $this->expected_amount;
    }

    // Mark verification methods
    public function markAsVerified($verificationMethod = null, $verificationDetails = null)
    {
        $this->update([
            'verification_status' => 'verified',
            'payment_status' => 'verified',
            'verified_at' => now(),
            'verification_method' => $verificationMethod,
            'verification_details' => $verificationDetails,
            'amount_verified' => $this->isAmountSufficient(),
        ]);
    }

    public function markAsRejected($reason)
    {
        $this->update([
            'verification_status' => 'rejected',
            'payment_status' => 'rejected',
            'rejection_reason' => $reason,
        ]);
    }

    public function markVerificationFailed($details = null)
    {
        $this->update([
            'verification_status' => 'failed',
            'verification_details' => $details,
        ]);
    }

    public function requestRefund($reason = null)
    {
        $this->update([
            'payment_status' => 'refund_requested',
            'refund_initiated' => true,
            'refund_requested_at' => now(),
            'rejection_reason' => $reason,
        ]);
    }

    // Relationships
    public function paymentOrder()
    {
        return $this->belongsTo(PaymentOrder::class, 'payment_order_id');
    }

    public function paymentPlan()
    {
        // Future: Link to customer's payment plan via device_id
        // return $this->belongsTo(PaymentPlan::class, 'device_id', 'device_id');
    }

    public function iotDevice()
    {
        // Future: Link to IoT device
        // return $this->belongsTo(IoTDevice::class, 'device_id', 'device_id');
    }

    // Scopes
    public function scopePendingVerification($query)
    {
        return $query->where('verification_status', 'pending');
    }

    public function scopeVerified($query)
    {
        return $query->where('verification_status', 'verified');
    }

    public function scopeRejected($query)
    {
        return $query->where('verification_status', 'rejected');
    }

    public function scopeForDevice($query, $deviceId)
    {
        return $query->where('device_id', $deviceId);
    }

    public function scopeInsufficientAmount($query)
    {
        return $query->whereColumn('trans_amount', '<', 'expected_amount');
    }
} 