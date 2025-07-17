<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Appliance extends Model
{
    use HasFactory;

    protected $table = 'appliances';

    protected $fillable = [
        'unit_id',
        'serial_number',
        'client_id',
        'product_id',
        'installation_location',
        'installation_date',
        'status',
        'current_temperature',
        'current_battery_voltage',
        'last_ping',
        'last_maintenance_date',
        'warranty_expiry_date',
        'installation_notes'
    ];

    protected $casts = [
        'installation_date' => 'date',
        'last_ping' => 'datetime',
        'last_maintenance_date' => 'date',
        'warranty_expiry_date' => 'date'
    ];

    // Relationships
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function paymentPlans()
    {
        return $this->hasMany(PaymentPlan::class);
    }

    // Helper methods
    public function isOnline()
    {
        return $this->last_ping && $this->last_ping > now()->subMinutes(10);
    }

    public function isActive()
    {
        return $this->status === 'active';
    }
}
