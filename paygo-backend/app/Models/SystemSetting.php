<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'category',
        'key',
        'value',
        'description',
        'is_encrypted',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_encrypted' => 'boolean',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Automatically encrypt sensitive values
    public function setValueAttribute($value)
    {
        if ($this->is_encrypted && $value) {
            $this->attributes['value'] = Crypt::encryptString($value);
        } else {
            $this->attributes['value'] = $value;
        }
    }

    // Automatically decrypt sensitive values
    public function getValueAttribute($value)
    {
        if ($this->is_encrypted && $value) {
            try {
                return Crypt::decryptString($value);
            } catch (\Exception $e) {
                return $value; // Return original if decryption fails
            }
        }
        return $value;
    }

    // Get decrypted value explicitly
    public function getDecryptedValue()
    {
        return $this->value;
    }

    // Static method to get a setting value
    public static function get($category, $key, $default = null)
    {
        $setting = self::where('category', $category)
                      ->where('key', $key)
                      ->where('is_active', true)
                      ->first();
        
        return $setting ? $setting->value : $default;
    }

    // Static method to set a setting value
    public static function set($category, $key, $value, $description = null, $isEncrypted = false, $userId = null)
    {
        return self::updateOrCreate(
            ['category' => $category, 'key' => $key],
            [
                'value' => $value,
                'description' => $description,
                'is_encrypted' => $isEncrypted,
                'is_active' => true,
                'updated_by' => $userId,
                'created_by' => $userId ?? self::where('category', $category)->where('key', $key)->value('created_by'),
            ]
        );
    }

    // Get all settings for a category
    public static function getCategory($category)
    {
        return self::where('category', $category)
                  ->where('is_active', true)
                  ->pluck('value', 'key')
                  ->toArray();
    }

    // Get M-Pesa configuration
    public static function getMpesaConfig()
    {
        $settings = self::getCategory('mpesa');
        
        return [
            'environment' => $settings['environment'] ?? 'sandbox',
            'consumer_key' => $settings['consumer_key'] ?? env('CONSUMER_KEY'),
            'consumer_secret' => $settings['consumer_secret'] ?? env('CONSUMER_SECRET'),
            'passkey' => $settings['passkey'] ?? env('PASS_KEY'),
            'shortcode' => $settings['shortcode'] ?? env('BUSINESS_SHORTCODE', '174379'),
            'callback_url' => $settings['callback_url'] ?? env('STK_CALLBACK_URL'),
            'confirmation_url' => $settings['confirmation_url'] ?? env('CONFIRMATION_URL'),
            'validation_url' => $settings['validation_url'] ?? env('VALIDATION_URL'),
        ];
    }

    // Get API configuration
    public static function getApiConfig()
    {
        $settings = self::getCategory('api');
        
        return [
            'base_url' => $settings['base_url'] ?? url('/api'),
            'timeout' => $settings['timeout'] ?? 30,
            'rate_limit' => $settings['rate_limit'] ?? 1000,
            'environment' => app()->environment(),
        ];
    }

    // Relationships
    public function creator()
    {
        return $this->belongsTo(AdminUser::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(AdminUser::class, 'updated_by');
    }
}
