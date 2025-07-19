<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Models\AdminUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class SettingsController extends Controller
{
    /**
     * Get all settings for a category or all categories
     */
    public function getSettings(Request $request, $category = null)
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $query = SystemSetting::where('is_active', true);
            
            if ($category) {
                $query->where('category', $category);
            }

            $settings = $query->get()->map(function ($setting) {
                return [
                    'id' => $setting->id,
                    'category' => $setting->category,
                    'key' => $setting->key,
                    'value' => $setting->is_encrypted ? '***hidden***' : $setting->value,
                    'actual_value' => $setting->value, // For admin use - will be sanitized
                    'description' => $setting->description,
                    'is_encrypted' => $setting->is_encrypted,
                    'updated_at' => $setting->updated_at,
                ];
            });

            if ($category) {
                $settingsArray = $settings->pluck('actual_value', 'key')->toArray();
                return response()->json([
                    'success' => true,
                    'category' => $category,
                    'data' => $settingsArray
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $settings->groupBy('category')
            ]);

        } catch (\Exception $e) {
            Log::error('Settings fetch error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch settings: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update M-Pesa configuration
     */
    public function updateMpesaSettings(Request $request)
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $validator = Validator::make($request->all(), [
                'environment' => 'required|string|in:sandbox,production',
                'shortcode' => 'required|string|min:4|max:20',
                'consumer_key' => 'required|string|min:10',
                'consumer_secret' => 'required|string|min:10',
                'passkey' => 'required|string|min:20',
                'callback_url' => 'sometimes|url',
                'confirmation_url' => 'sometimes|url',
                'validation_url' => 'sometimes|url',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $userId = $admin->id;

            // Define which fields should be encrypted
            $encryptedFields = ['consumer_key', 'consumer_secret', 'passkey'];

            // Update each setting
            $settings = [
                'environment' => ['value' => $request->environment, 'description' => 'M-Pesa API Environment (sandbox/production)', 'encrypted' => false],
                'shortcode' => ['value' => $request->shortcode, 'description' => 'M-Pesa Business Shortcode', 'encrypted' => false],
                'consumer_key' => ['value' => $request->consumer_key, 'description' => 'M-Pesa Consumer Key', 'encrypted' => true],
                'consumer_secret' => ['value' => $request->consumer_secret, 'description' => 'M-Pesa Consumer Secret', 'encrypted' => true],
                'passkey' => ['value' => $request->passkey, 'description' => 'M-Pesa STK Push Passkey', 'encrypted' => true],
            ];

            // Add optional URLs if provided
            if ($request->has('callback_url')) {
                $settings['callback_url'] = ['value' => $request->callback_url, 'description' => 'STK Push Callback URL', 'encrypted' => false];
            }
            if ($request->has('confirmation_url')) {
                $settings['confirmation_url'] = ['value' => $request->confirmation_url, 'description' => 'C2B Confirmation URL', 'encrypted' => false];
            }
            if ($request->has('validation_url')) {
                $settings['validation_url'] = ['value' => $request->validation_url, 'description' => 'C2B Validation URL', 'encrypted' => false];
            }

            foreach ($settings as $key => $config) {
                SystemSetting::set(
                    'mpesa',
                    $key,
                    $config['value'],
                    $config['description'],
                    $config['encrypted'],
                    $userId
                );
            }

            Log::info('M-Pesa settings updated by admin:', ['admin_id' => $userId, 'environment' => $request->environment]);

            return response()->json([
                'success' => true,
                'message' => 'M-Pesa settings updated successfully',
                'data' => [
                    'environment' => $request->environment,
                    'shortcode' => $request->shortcode,
                    'updated_by' => $admin->username,
                    'updated_at' => now()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('M-Pesa settings update error:', ['error' => $e->getMessage(), 'admin_id' => $admin->id ?? null]);
            return response()->json([
                'success' => false,
                'error' => 'Failed to update M-Pesa settings: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test M-Pesa connection with current settings
     */
    public function testMpesaConnection(Request $request)
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $config = SystemSetting::getMpesaConfig();

            // Test token generation
            $credentials = base64_encode("{$config['consumer_key']}:{$config['consumer_secret']}");
            $url = $config['environment'] === 'production'
                 ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
                 : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

            $curl = curl_init();
            curl_setopt_array($curl, [
                CURLOPT_URL            => $url,
                CURLOPT_HTTPHEADER     => ["Authorization: Basic {$credentials}"],
                CURLOPT_HEADER         => false,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => 30,
            ]);

            $response = curl_exec($curl);
            $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            curl_close($curl);

            $data = json_decode($response, true);

            if ($httpCode == 200 && isset($data['access_token'])) {
                return response()->json([
                    'success' => true,
                    'message' => 'M-Pesa connection successful!',
                    'data' => [
                        'environment' => $config['environment'],
                        'shortcode' => $config['shortcode'],
                        'token_type' => $data['token_type'] ?? 'Bearer',
                        'expires_in' => $data['expires_in'] ?? 3600,
                        'tested_at' => now()
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => 'M-Pesa connection failed',
                    'details' => $data['error_description'] ?? 'Invalid credentials or network error',
                    'http_code' => $httpCode
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('M-Pesa connection test error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'error' => 'Connection test failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get M-Pesa settings (with sensitive data masked for display)
     */
    public function getMpesaSettings()
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $config = SystemSetting::getMpesaConfig();

            // Mask sensitive data for display
            return response()->json([
                'success' => true,
                'data' => [
                    'environment' => $config['environment'],
                    'shortcode' => $config['shortcode'],
                    'consumer_key' => $config['consumer_key'] ? substr($config['consumer_key'], 0, 8) . '...' : '',
                    'consumer_secret' => $config['consumer_secret'] ? substr($config['consumer_secret'], 0, 8) . '...' : '',
                    'passkey' => $config['passkey'] ? substr($config['passkey'], 0, 12) . '...' : '',
                    'callback_url' => $config['callback_url'],
                    'confirmation_url' => $config['confirmation_url'],
                    'validation_url' => $config['validation_url'],
                ],
                'config_status' => [
                    'has_consumer_key' => !empty($config['consumer_key']),
                    'has_consumer_secret' => !empty($config['consumer_secret']),
                    'has_passkey' => !empty($config['passkey']),
                    'has_callback_url' => !empty($config['callback_url']),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('M-Pesa settings fetch error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch M-Pesa settings: ' . $e->getMessage()
            ], 500);
        }
    }
}
