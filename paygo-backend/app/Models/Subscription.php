<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'appliance_id',
        'payment_plan_id',
        'activation_payment_id',
        'device_id',
        'subscription_type',
        'status',
        'start_date',
        'end_date',
        'suspended_at',
        'reactivated_at',
        'suspension_reason',
        'suspension_notes',
        'created_by',
        'suspended_by',
        'reactivated_by',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'suspended_at' => 'datetime',
        'reactivated_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
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

    public function paymentPlan()
    {
        return $this->belongsTo(PaymentPlan::class);
    }

    public function activationPayment()
    {
        return $this->belongsTo(Payment::class, 'activation_payment_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(AdminUser::class, 'created_by');
    }

    public function suspendedBy()
    {
        return $this->belongsTo(AdminUser::class, 'suspended_by');
    }

    public function reactivatedBy()
    {
        return $this->belongsTo(AdminUser::class, 'reactivated_by');
    }

    // Helper methods
    public function isActive()
    {
        return $this->status === 'active' && $this->end_date > now();
    }

    public function isExpired()
    {
        return $this->end_date < now() || $this->status === 'expired';
    }

    public function isSuspended()
    {
        return $this->status === 'suspended';
    }

    public function getDaysRemainingAttribute()
    {
        if ($this->end_date <= now()) {
            return 0;
        }
        
        return now()->diffInDays($this->end_date);
    }

    public function getHoursRemainingAttribute()
    {
        if ($this->end_date <= now()) {
            return 0;
        }
        
        return now()->diffInHours($this->end_date);
    }

    public function getDurationInDaysAttribute()
    {
        return $this->start_date->diffInDays($this->end_date);
    }

    public function getProgressPercentageAttribute()
    {
        $totalDuration = $this->start_date->diffInSeconds($this->end_date);
        $elapsed = $this->start_date->diffInSeconds(now());
        
        if ($totalDuration <= 0) {
            return 100;
        }
        
        $percentage = ($elapsed / $totalDuration) * 100;
        return min(100, max(0, $percentage));
    }

    public function getStatusDisplayAttribute()
    {
        $statusMap = [
            'active' => 'Active',
            'expired' => 'Expired',
            'suspended' => 'Suspended',
            'cancelled' => 'Cancelled',
            'maintenance' => 'Maintenance',
        ];

        return $statusMap[$this->status] ?? ucfirst($this->status);
    }

    public function getSubscriptionTypeDisplayAttribute()
    {
        $typeMap = [
            'paygo' => 'PayGo',
            'full_purchase' => 'Full Purchase',
            'trial' => 'Trial',
            'maintenance' => 'Maintenance',
        ];

        return $typeMap[$this->subscription_type] ?? ucfirst($this->subscription_type);
    }

    // Scope methods
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
                    ->where('end_date', '>', now());
    }

    public function scopeExpired($query)
    {
        return $query->where('end_date', '<', now())
                    ->orWhere('status', 'expired');
    }

    public function scopeSuspended($query)
    {
        return $query->where('status', 'suspended');
    }

    public function scopeForDevice($query, $deviceId)
    {
        return $query->where('device_id', $deviceId);
    }

    public function scopeForClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    public function scopeExpiringIn($query, $hours = 24)
    {
        return $query->where('status', 'active')
                    ->where('end_date', '>', now())
                    ->where('end_date', '<=', now()->addHours($hours));
    }

    // Static helper methods
    public static function createForPayment($payment, $appliance, $duration = null)
    {
        $duration = $duration ?? 'P1M'; // Default 1 month (ISO 8601 format)
        $startDate = now();
        $endDate = $startDate->copy()->add(new \DateInterval($duration));

        return self::create([
            'client_id' => $appliance->client_id,
            'appliance_id' => $appliance->id,
            'payment_plan_id' => $appliance->paymentPlans()->where('status', 'active')->first()?->id,
            'activation_payment_id' => $payment->id,
            'device_id' => $appliance->device_id,
            'subscription_type' => 'paygo',
            'status' => 'active',
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);
    }

    public function suspend($reason, $notes = null, $adminId = null)
    {
        $this->update([
            'status' => 'suspended',
            'suspended_at' => now(),
            'suspension_reason' => $reason,
            'suspension_notes' => $notes,
            'suspended_by' => $adminId,
        ]);

        return $this;
    }

    public function reactivate($duration = null, $adminId = null)
    {
        $endDate = $duration ? now()->add(new \DateInterval($duration)) : $this->end_date;
        
        $this->update([
            'status' => 'active',
            'end_date' => $endDate,
            'reactivated_at' => now(),
            'reactivated_by' => $adminId,
        ]);

        return $this;
    }

    public function extend($duration)
    {
        $this->update([
            'end_date' => $this->end_date->add(new \DateInterval($duration))
        ]);

        return $this;
    }

    public function markExpired()
    {
        $this->update([
            'status' => 'expired'
        ]);

        return $this;
    }
}
