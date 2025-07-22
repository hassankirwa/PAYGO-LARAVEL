<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;

class PaybillTransaction extends Model
{
    use HasFactory;

    protected $table = 'paybill_transactions';

    protected $fillable = [
        'transaction_type',
        'trans_id',
        'trans_time',
        'trans_amount',
        'business_short_code',
        'bill_ref_number',
        'invoice_number',
        'org_account_balance',
        'third_party_trans_id',
        'mpesa_receipt_number',
        'msisdn',
        'first_name',
        'middle_name',
        'last_name',
        'device_id',
        'client_id',
        'appliance_id',
        'payment_order_id',
        'payment_plan_id',
        'payment_type',
        'expected_amount',
        'amount_matched',
        'status',
        'credited_to_account',
        'processed_at',
        'processed_by',
        'processing_notes',
        'validation_details',
        'raw_payload',
    ];

    protected $casts = [
        'trans_amount' => 'decimal:2',
        'expected_amount' => 'decimal:2',
        'org_account_balance' => 'decimal:2',
        'amount_matched' => 'boolean',
        'credited_to_account' => 'boolean',
        'processed_at' => 'datetime',
        'validation_details' => 'array',
        'raw_payload' => 'array',
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

    public function paymentOrder()
    {
        return $this->belongsTo(PaymentOrder::class);
    }

    public function paymentPlan()
    {
        return $this->belongsTo(PaymentPlan::class);
    }

    // Helper Methods
    public function getFormattedAmountAttribute()
    {
        return 'KSh ' . number_format($this->trans_amount, 2);
    }

    public function getFormattedExpectedAmountAttribute()
    {
        return $this->expected_amount ? 'KSh ' . number_format($this->expected_amount, 2) : 'N/A';
    }

    public function getCustomerFullNameAttribute()
    {
        return trim($this->first_name . ' ' . $this->middle_name . ' ' . $this->last_name);
    }

    public function getFormattedPhoneAttribute()
    {
        // Format phone number for display (254712345678 -> +254 712 345 678)
        if (strlen($this->msisdn) === 12 && str_starts_with($this->msisdn, '254')) {
            return '+254 ' . substr($this->msisdn, 3, 3) . ' ' . substr($this->msisdn, 6, 3) . ' ' . substr($this->msisdn, 9, 3);
        }
        return $this->msisdn;
    }

    public function getTransactionDateAttribute()
    {
        // Convert M-Pesa trans_time to readable format
        if ($this->trans_time && strlen($this->trans_time) === 14) {
            return Carbon::createFromFormat('YmdHis', $this->trans_time);
        }
        return $this->created_at;
    }

    public function getStatusBadgeAttribute()
    {
        return match($this->status) {
            'pending' => ['text' => 'Pending', 'class' => 'bg-yellow-100 text-yellow-800'],
            'processed' => ['text' => 'Processed', 'class' => 'bg-green-100 text-green-800'],
            'failed' => ['text' => 'Failed', 'class' => 'bg-red-100 text-red-800'],
            default => ['text' => 'Unknown', 'class' => 'bg-gray-100 text-gray-800']
        };
    }

    public function getPaymentTypeBadgeAttribute()
    {
        return match($this->payment_type) {
            'down_payment' => ['text' => 'Down Payment', 'class' => 'bg-blue-100 text-blue-800'],
            'installment' => ['text' => 'Installment', 'class' => 'bg-purple-100 text-purple-800'],
            'advance_payment' => ['text' => 'Advance Payment', 'class' => 'bg-indigo-100 text-indigo-800'],
            'late_payment' => ['text' => 'Late Payment', 'class' => 'bg-orange-100 text-orange-800'],
            default => ['text' => 'Other', 'class' => 'bg-gray-100 text-gray-800']
        };
    }

    // Status Methods
    public function isPending()
    {
        return $this->status === 'pending';
    }

    public function isProcessed()
    {
        return $this->status === 'processed';
    }

    public function isFailed()
    {
        return $this->status === 'failed';
    }

    public function amountMatched()
    {
        return $this->amount_matched;
    }

    public function isCredited()
    {
        return $this->credited_to_account;
    }

    // Processing Methods
    public function markAsProcessed($processedBy = null, $notes = null)
    {
        $this->update([
            'status' => 'processed',
            'credited_to_account' => true,
            'processed_at' => now(),
            'processed_by' => $processedBy,
            'processing_notes' => $notes
        ]);
    }

    public function markAsFailed($reason = null)
    {
        $this->update([
            'status' => 'failed',
            'processing_notes' => $reason
        ]);
    }

    // Scopes for querying
    public function scopeForClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    public function scopeForDevice($query, $deviceId)
    {
        return $query->where('device_id', $deviceId);
    }

    public function scopeProcessed($query)
    {
        return $query->where('status', 'processed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeRecent($query, $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    public function scopeByPaymentType($query, $type)
    {
        return $query->where('payment_type', $type);
    }

    // Static helper methods
    public static function getTotalForClient($clientId, $days = null)
    {
        $query = static::forClient($clientId)->processed();
        
        if ($days) {
            $query->recent($days);
        }
        
        return $query->sum('trans_amount');
    }

    public static function getCountForClient($clientId, $days = null)
    {
        $query = static::forClient($clientId)->processed();
        
        if ($days) {
            $query->recent($days);
        }
        
        return $query->count();
    }

    public static function getRecentTransactionsForClient($clientId, $limit = 10)
    {
        return static::forClient($clientId)
            ->with(['appliance', 'paymentOrder', 'paymentPlan'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
}
