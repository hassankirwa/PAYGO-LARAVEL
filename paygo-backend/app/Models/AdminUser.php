<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class AdminUser extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'email',
        'password_hash',
        'first_name',
        'last_name',
        'role',
        'is_active'
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected $casts = [
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

    // Scope for active users
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Helper methods
    public function getFullNameAttribute()
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    public function isSuperAdmin()
    {
        return $this->role === 'super_admin';
    }

    public function isAdmin()
    {
        return in_array($this->role, ['super_admin', 'admin']);
    }
}
