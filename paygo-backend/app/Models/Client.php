<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Hash;

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
        'notes',
        
        // Personal Information (Story 3.2)
        'date_of_birth',
        'national_id',
        'passport_number',
        'nationality',
        'address_latitude',
        'address_longitude',
        'occupation',
        'monthly_income',
        'income_source',
        'income_verification_notes',
        
        // Business Information (Story 3.3)
        'is_business_customer',
        'business_name',
        'business_registration_number',
        'business_type',
        'business_industry',
        'business_address',
        'business_employees',
        
        // Reference and Emergency Contacts (Story 3.4)
        'reference_contacts',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',
        
        // Credit Assessment and Eligibility (Story 3.5)
        'kyc_status',
        'credit_score',
        'paygo_limit',
        'eligibility_status',
        'eligibility_notes',
        'kyc_completed_at',
        'kyc_approved_at',
        
        // Document Upload and Verification (Story 3.6)
        'id_document_front_path',
        'id_document_back_path',
        'proof_of_income_path',
        'business_license_path',
        'profile_photo_path',
        'document_verification_status',
        'document_verification_notes',
        'documents_submitted_at',
        'documents_verified_at',
        
        // Additional tracking fields
        'referred_by',
        'special_notes',
        'terms_accepted',
        'terms_accepted_at',
        'registration_source'
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected $casts = [
        'registration_date' => 'datetime',
        'last_login' => 'datetime',
        'is_active' => 'boolean',
        'date_of_birth' => 'date',
        'is_business_customer' => 'boolean',
        'reference_contacts' => 'array',
        'monthly_income' => 'decimal:2',
        'credit_score' => 'decimal:2',
        'paygo_limit' => 'decimal:2',
        'kyc_completed_at' => 'datetime',
        'kyc_approved_at' => 'datetime',
        'documents_submitted_at' => 'datetime',
        'documents_verified_at' => 'datetime',
        'terms_accepted' => 'boolean',
        'terms_accepted_at' => 'datetime',
        'address_latitude' => 'decimal:8',
        'address_longitude' => 'decimal:8',
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

    // Mutator for password hashing
    public function setPasswordHashAttribute($value)
    {
        $this->attributes['password_hash'] = Hash::make($value);
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

    // KYC Status Helper Methods
    public function isKycPending()
    {
        return $this->kyc_status === 'pending';
    }

    public function isKycApproved()
    {
        return $this->kyc_status === 'approved';
    }

    public function isKycRejected()
    {
        return $this->kyc_status === 'rejected';
    }

    public function isEligibleForPaygo()
    {
        return $this->eligibility_status === 'eligible' && $this->isKycApproved();
    }

    public function getKycCompletionPercentage()
    {
        $requiredFields = [
            'first_name', 'last_name', 'email', 'phone', 'date_of_birth',
            'national_id', 'address', 'occupation', 'monthly_income'
        ];
        
        $completedFields = 0;
        foreach ($requiredFields as $field) {
            if (!empty($this->$field)) {
                $completedFields++;
            }
        }
        
        return round(($completedFields / count($requiredFields)) * 100);
    }

    public function hasRequiredDocuments()
    {
        return !empty($this->id_document_front_path) && 
               !empty($this->id_document_back_path);
    }

    public function documentsAreVerified()
    {
        return $this->document_verification_status === 'verified';
    }

    // GPS Coordinates Helper
    public function hasGpsCoordinates()
    {
        return !empty($this->address_latitude) && !empty($this->address_longitude);
    }

    public function getCoordinatesAttribute()
    {
        if ($this->hasGpsCoordinates()) {
            return [
                'latitude' => $this->address_latitude,
                'longitude' => $this->address_longitude
            ];
        }
        return null;
    }

    // Business Customer Helper
    public function isBusinessCustomer()
    {
        return $this->is_business_customer === true;
    }

    // Generate unique client code
    public static function generateClientCode()
    {
        $lastClient = self::orderBy('id', 'desc')->first();
        $nextNumber = $lastClient ? (int) substr($lastClient->client_code, 2) + 1 : 1;
        return 'CL' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }

    // Scope for KYC status
    public function scopeKycApproved($query)
    {
        return $query->where('kyc_status', 'approved');
    }

    public function scopeKycPending($query)
    {
        return $query->where('kyc_status', 'pending');
    }

    public function scopeEligible($query)
    {
        return $query->where('eligibility_status', 'eligible');
    }
}
