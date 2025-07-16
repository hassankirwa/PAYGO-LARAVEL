<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Client extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'client_code',
        'first_name',
        'last_name',
        'email',
        'phone',
        'password_hash',
        'address',
        'location',
        'payment_plan',
        'status',
        'payment_status',
        'is_active',
        'notes'
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected $casts = [
        'registration_date' => 'datetime',
        'last_login' => 'datetime',
        'is_active' => 'boolean',
    ];

    // Override password attribute name for authentication
    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    // Override the password field name for Sanctum
    public function getAuthPasswordName()
    {
        return 'password_hash';
    }

    // Add password attribute accessor for Laravel Auth
    public function getPasswordAttribute()
    {
        return $this->password_hash;
    }

    // Relationships
    public function appliances()
    {
        return $this->hasMany(Appliance::class);
    }

    public function paymentPlans()
    {
        return $this->hasMany(PaymentPlan::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    // Helper methods
    public function getFullNameAttribute()
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    // Generate unique client code
    public static function generateClientCode()
    {
        $lastClient = self::orderBy('id', 'desc')->first();
        $nextNumber = $lastClient ? (int) substr($lastClient->client_code, 2) + 1 : 1;
        return 'CL' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }
}
