<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Models\AdminUser;
use App\Models\Appliance;
use App\Models\Subscription;
use App\Services\MqttService;
use App\Jobs\ManualStartDeviceJob;
use App\Jobs\ManualStopDeviceJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Models\Product;
use App\Models\Client;

class MqttController extends Controller
{
    protected $mqttService;

    public function __construct()
    {
        $this->mqttService = new MqttService();
    }

    /**
     * Get MQTT configuration settings
     */
    public function getConfig(Request $request)
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $mqttSettings = SystemSetting::where('category', 'mqtt')
                                        ->where('is_active', true)
                                        ->get()
                                        ->map(function ($setting) {
                                            return [
                                                'key' => $setting->key,
                                                'value' => $setting->is_encrypted ? '***hidden***' : $setting->value,
                                                'actual_value' => $setting->value, // For form editing
                                                'description' => $setting->description,
                                                'is_encrypted' => $setting->is_encrypted,
                                            ];
                                        })
                                        ->keyBy('key');

            // Get connection status
            $connectionStatus = $this->mqttService->getConnectionStatus();

            return response()->json([
                'success' => true,
                'settings' => $mqttSettings,
                'connection_status' => $connectionStatus,
                'categories' => $this->getSettingCategories(),
            ]);

        } catch (\Exception $e) {
            Log::error('MQTT Config Error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch MQTT configuration'
            ], 500);
        }
    }

    /**
     * Update MQTT configuration settings
     */
    public function updateConfig(Request $request)
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $validator = Validator::make($request->all(), [
                'settings' => 'required|array',
                'settings.*.key' => 'required|string',
                'settings.*.value' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Validation failed',
                    'details' => $validator->errors()
                ], 422);
            }

            $updatedSettings = [];
            
            foreach ($request->settings as $settingData) {
                $setting = SystemSetting::where('category', 'mqtt')
                                       ->where('key', $settingData['key'])
                                       ->first();

                if ($setting) {
                    $setting->update([
                        'value' => $settingData['value'] ?? '',
                        'updated_by' => $admin->id,
                    ]);

                    $updatedSettings[] = [
                        'key' => $setting->key,
                        'value' => $setting->is_encrypted ? '***hidden***' : $setting->value,
                        'description' => $setting->description,
                    ];
                }
            }

            Log::info('MQTT settings updated by admin', [
                'admin_id' => $admin->id,
                'settings_count' => count($updatedSettings)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'MQTT settings updated successfully',
                'updated_settings' => $updatedSettings,
            ]);

        } catch (\Exception $e) {
            Log::error('MQTT Update Config Error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'error' => 'Failed to update MQTT configuration'
            ], 500);
        }
    }

    /**
     * Test MQTT connection
     */
    public function testConnection(Request $request)
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $testResult = $this->mqttService->testConnection();

            Log::info('MQTT connection test performed', [
                'admin_id' => $admin->id,
                'success' => $testResult['success'],
                'timestamp' => $testResult['timestamp']
            ]);

            return response()->json([
                'success' => true,
                'test_result' => $testResult,
            ]);

        } catch (\Exception $e) {
            Log::error('MQTT Test Connection Error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'error' => 'Connection test failed',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get device management overview
     */
    public function getDeviceOverview(Request $request)
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get device statistics
            $totalDevices = Appliance::count();
            $activeDevices = Appliance::where('status', 'active')->count();
            $suspendedDevices = Appliance::where('status', 'suspended')->count();
            $pendingDevices = Appliance::where('status', 'pending_activation')->count();

            // Get subscription statistics
            $activeSubscriptions = Subscription::active()->count();
            $expiredSubscriptions = Subscription::expired()->count();
            $suspendedSubscriptions = Subscription::suspended()->count();

            // Get recent devices (last 10)
            $recentDevices = Appliance::with(['client', 'product'])
                                    ->orderBy('created_at', 'desc')
                                    ->take(10)
                                    ->get()
                                    ->map(function ($appliance) {
                                        return [
                                            'id' => $appliance->id,
                                            'device_id' => $appliance->device_id,
                                            'client_name' => $appliance->client ? ($appliance->client->first_name . ' ' . $appliance->client->last_name) : 'N/A',
                                            'product_name' => $appliance->product->name ?? 'N/A',
                                            'status' => $appliance->status,
                                            'last_ping' => $appliance->last_ping,
                                            'created_at' => $appliance->created_at,
                                        ];
                                    });

            return response()->json([
                'success' => true,
                'overview' => [
                    'device_stats' => [
                        'total' => $totalDevices,
                        'active' => $activeDevices,
                        'suspended' => $suspendedDevices,
                        'pending' => $pendingDevices,
                    ],
                    'subscription_stats' => [
                        'active' => $activeSubscriptions,
                        'expired' => $expiredSubscriptions,
                        'suspended' => $suspendedSubscriptions,
                    ],
                    'recent_devices' => $recentDevices,
                ],
                'mqtt_status' => $this->mqttService->getConnectionStatus(),
            ]);

        } catch (\Exception $e) {
            Log::error('MQTT Device Overview Error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch device overview'
            ], 500);
        }
    }

    /**
     * Manual device control - Start device
     */
    public function startDevice(Request $request)
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $validator = Validator::make($request->all(), [
                'device_id' => 'required|string',
                'reason' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Validation failed',
                    'details' => $validator->errors()
                ], 422);
            }

            $deviceId = $request->device_id;
            $reason = $request->reason ?? 'manual_activation';

            // Find appliance
            $appliance = Appliance::where('device_id', $deviceId)->first();
            
            if (!$appliance) {
                return response()->json([
                    'success' => false,
                    'error' => 'Device not found'
                ], 404);
            }

            // Dispatch manual start device job (no subscription creation)
            ManualStartDeviceJob::dispatch($deviceId, $reason, ['admin_id' => $admin->id])
                         ->delay(now()->addSeconds(5));

            Log::info('Manual device start requested', [
                'device_id' => $deviceId,
                'admin_id' => $admin->id,
                'reason' => $reason
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Device start command sent successfully',
                'device_id' => $deviceId,
            ]);

        } catch (\Exception $e) {
            Log::error('MQTT Start Device Error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'error' => 'Failed to start device',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Manual device control - Stop device
     */
    public function stopDevice(Request $request)
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $validator = Validator::make($request->all(), [
                'device_id' => 'required|string',
                'reason' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Validation failed',
                    'details' => $validator->errors()
                ], 422);
            }

            $deviceId = $request->device_id;
            $reason = $request->reason ?? 'manual_stop';

            // Find appliance
            $appliance = Appliance::where('device_id', $deviceId)->first();
            
            if (!$appliance) {
                return response()->json([
                    'success' => false,
                    'error' => 'Device not found'
                ], 404);
            }

            // Dispatch manual stop device job
            ManualStopDeviceJob::dispatch($deviceId, $reason, ['admin_id' => $admin->id])
                        ->delay(now()->addSeconds(5));

            Log::info('Manual device stop requested', [
                'device_id' => $deviceId,
                'admin_id' => $admin->id,
                'reason' => $reason
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Device stop command sent successfully',
                'device_id' => $deviceId,
            ]);

        } catch (\Exception $e) {
            Log::error('MQTT Stop Device Error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'error' => 'Failed to stop device',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check device status
     */
    public function checkDeviceStatus(Request $request)
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $validator = Validator::make($request->all(), [
                'device_id' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Validation failed',
                    'details' => $validator->errors()
                ], 422);
            }

            $deviceId = $request->device_id;

            // Get device info from database
            $appliance = Appliance::with(['client', 'product'])->where('device_id', $deviceId)->first();
            
            if (!$appliance) {
                return response()->json([
                    'success' => false,
                    'error' => 'Device not found'
                ], 404);
            }

            // Get active subscription
            $subscription = Subscription::where('appliance_id', $appliance->id)
                                      ->where('status', 'active')
                                      ->first();

            // Check MQTT status
            $mqttStatus = $this->mqttService->checkDeviceStatus($deviceId);

            return response()->json([
                'success' => true,
                'device' => [
                    'id' => $appliance->id,
                    'device_id' => $appliance->device_id,
                    'status' => $appliance->status,
                    'last_ping' => $appliance->last_ping,
                    'client_name' => $appliance->client->name ?? 'N/A',
                    'product_name' => $appliance->product->name ?? 'N/A',
                    'created_at' => $appliance->created_at,
                ],
                'subscription' => $subscription ? [
                    'id' => $subscription->id,
                    'status' => $subscription->status,
                    'start_date' => $subscription->start_date,
                    'end_date' => $subscription->end_date,
                    'days_remaining' => $subscription->days_remaining,
                    'subscription_type' => $subscription->subscription_type,
                ] : null,
                'mqtt_status' => $mqttStatus,
            ]);

        } catch (\Exception $e) {
            Log::error('MQTT Check Device Status Error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'error' => 'Failed to check device status',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create/Register a new appliance device
     */
    public function createDevice(Request $request)
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $validator = Validator::make($request->all(), [
                'device_id' => 'required|string|max:50|unique:appliances,device_id',
                'serial_number' => 'required|string|max:100|unique:appliances,serial_number',
                'product_id' => 'required|integer|exists:products,id',
                'client_id' => 'nullable|integer|exists:clients,id',
                'installation_location' => 'nullable|string|max:255',
                'installation_notes' => 'nullable|string',
                'status' => 'required|in:pending_activation,active,suspended,maintenance',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Validation failed',
                    'details' => $validator->errors()
                ], 422);
            }

            // Create the appliance record
            $appliance = Appliance::create([
                'device_id' => $request->device_id,
                'serial_number' => $request->serial_number,
                'product_id' => $request->product_id,
                'client_id' => $request->client_id,
                'installation_location' => $request->installation_location ?? 'Not specified',
                'installation_notes' => $request->installation_notes,
                'status' => $request->status,
                'installation_date' => $request->client_id ? now() : null,
                'is_active' => false, // Devices start inactive until subscription
                'unit_id' => 'UNIT-' . $request->device_id,
            ]);

            Log::info('New device created by admin', [
                'device_id' => $appliance->device_id,
                'admin_id' => $admin->id,
                'appliance_id' => $appliance->id
            ]);

            // Load relationships for response
            $appliance->load(['client', 'product']);

            return response()->json([
                'success' => true,
                'message' => 'Device created successfully',
                'device' => [
                    'id' => $appliance->id,
                    'device_id' => $appliance->device_id,
                    'serial_number' => $appliance->serial_number,
                    'product_name' => $appliance->product->name ?? 'N/A',
                    'client_name' => $appliance->client ? ($appliance->client->first_name . ' ' . $appliance->client->last_name) : 'Unassigned',
                    'status' => $appliance->status,
                    'installation_location' => $appliance->installation_location,
                    'created_at' => $appliance->created_at,
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Failed to create device', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to create device',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get products list for device creation
     */
    public function getProductsForDevice(Request $request)
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $products = Product::where('is_active', true)
                              ->select('id', 'name', 'model_code', 'category_id')
                              ->with('category:id,name')
                              ->get();

            return response()->json([
                'success' => true,
                'products' => $products
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get products for device creation', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to load products'
            ], 500);
        }
    }

    /**
     * Get clients list for device assignment
     */
    public function getClientsForDevice(Request $request)
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $clients = Client::where('status', 'active')
                           ->select('id', 'first_name', 'last_name', 'phone', 'email', 'location')
                           ->get()
                           ->map(function ($client) {
                               return [
                                   'id' => $client->id,
                                   'name' => $client->first_name . ' ' . $client->last_name,
                                   'phone' => $client->phone,
                                   'email' => $client->email,
                                   'location' => $client->location,
                               ];
                           });

            return response()->json([
                'success' => true,
                'clients' => $clients
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get clients for device assignment', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to load clients'
            ], 500);
        }
    }

    /**
     * Get setting categories for UI organization
     */
    private function getSettingCategories()
    {
        return [
            'basic' => [
                'title' => 'Basic Configuration',
                'description' => 'Essential MQTT broker connection settings',
                'settings' => ['is_enabled', 'host', 'port', 'username', 'password', 'use_ssl']
            ],
            'advanced' => [
                'title' => 'Advanced Settings',
                'description' => 'Advanced MQTT connection and session settings',
                'settings' => ['client_id', 'topic_prefix', 'keep_alive', 'clean_session', 'qos_level']
            ],
            'topics' => [
                'title' => 'Topic Configuration',
                'description' => 'MQTT topic structure and naming',
                'settings' => ['control_topic_suffix', 'status_topic_suffix', 'telemetry_topic_suffix']
            ],
            'performance' => [
                'title' => 'Performance & Timeouts',
                'description' => 'Connection timeouts and performance settings',
                'settings' => ['connection_timeout', 'publish_timeout', 'retry_attempts']
            ],
            'monitoring' => [
                'title' => 'Monitoring & Logging',
                'description' => 'Device monitoring and logging configuration',
                'settings' => ['enable_debug_logging', 'log_level', 'device_heartbeat_interval', 'device_offline_threshold']
            ],
            'emergency' => [
                'title' => 'Emergency & Safety',
                'description' => 'Emergency stop and safety features',
                'settings' => ['emergency_stop_topic', 'maintenance_mode_topic']
            ]
        ];
    }
}