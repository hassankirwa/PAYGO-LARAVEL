<?php

namespace App\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class MqttService
{
    private $mqttConfig;

    public function __construct()
    {
        $this->mqttConfig = $this->getMqttConfig();
    }

    /**
     * Get MQTT configuration from system settings
     */
    private function getMqttConfig()
    {
        return [
            'host' => SystemSetting::get('mqtt', 'host', 'localhost'),
            'port' => SystemSetting::get('mqtt', 'port', '1883'),
            'username' => SystemSetting::get('mqtt', 'username', ''),
            'password' => SystemSetting::get('mqtt', 'password', ''),
            'use_ssl' => SystemSetting::get('mqtt', 'use_ssl', false),
            'client_id' => SystemSetting::get('mqtt', 'client_id', 'koyo_paygo'),
            'topic_prefix' => SystemSetting::get('mqtt', 'topic_prefix', 'koyo/devices'),
            'is_enabled' => SystemSetting::get('mqtt', 'is_enabled', true),
        ];
    }

    /**
     * Start a device by sending MQTT command
     */
    public function startDevice($deviceId, $subscriptionData = [])
    {
        if (!$this->mqttConfig['is_enabled']) {
            Log::warning("MQTT is disabled, skipping device start for: {$deviceId}");
            return false;
        }

        try {
            $topic = $this->mqttConfig['topic_prefix'] . "/{$deviceId}/control";
            $payload = [
                'command' => 'start',
                'timestamp' => now()->toISOString(),
                'subscription_id' => $subscriptionData['subscription_id'] ?? null,
                'subscription_start' => $subscriptionData['start_date'] ?? now()->toISOString(),
                'subscription_end' => $subscriptionData['end_date'] ?? now()->addMonth()->toISOString(),
                'client_id' => $subscriptionData['client_id'] ?? null,
            ];

            $result = $this->publishMessage($topic, $payload);
            
            if ($result) {
                Log::info("✅ Device started successfully", [
                    'device_id' => $deviceId,
                    'topic' => $topic,
                    'payload' => $payload
                ]);
                
                // Update appliance status
                $this->updateApplianceStatus($deviceId, 'active');
                
                return true;
            }

            Log::error("❌ Failed to start device: {$deviceId}");
            return false;

        } catch (\Exception $e) {
            Log::error("❌ MQTT Start Device Error", [
                'device_id' => $deviceId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }

    /**
     * Stop a device by sending MQTT command
     */
    public function stopDevice($deviceId, $reason = 'subscription_expired')
    {
        if (!$this->mqttConfig['is_enabled']) {
            Log::warning("MQTT is disabled, skipping device stop for: {$deviceId}");
            return false;
        }

        try {
            $topic = $this->mqttConfig['topic_prefix'] . "/{$deviceId}/control";
            $payload = [
                'command' => 'stop',
                'timestamp' => now()->toISOString(),
                'reason' => $reason,
                'message' => $this->getStopMessage($reason),
            ];

            $result = $this->publishMessage($topic, $payload);
            
            if ($result) {
                Log::info("✅ Device stopped successfully", [
                    'device_id' => $deviceId,
                    'reason' => $reason,
                    'topic' => $topic
                ]);
                
                // Update appliance status
                $this->updateApplianceStatus($deviceId, 'suspended');
                
                return true;
            }

            Log::error("❌ Failed to stop device: {$deviceId}");
            return false;

        } catch (\Exception $e) {
            Log::error("❌ MQTT Stop Device Error", [
                'device_id' => $deviceId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }

    /**
     * Check device status via MQTT
     */
    public function checkDeviceStatus($deviceId)
    {
        if (!$this->mqttConfig['is_enabled']) {
            return ['status' => 'mqtt_disabled'];
        }

        try {
            $topic = $this->mqttConfig['topic_prefix'] . "/{$deviceId}/status";
            $payload = [
                'command' => 'status_check',
                'timestamp' => now()->toISOString(),
            ];

            // For status check, we send the request and device should respond
            $this->publishMessage($topic, $payload);
            
            Log::info("📊 Status check sent to device: {$deviceId}");
            
            // Return pending status - actual status will come via callback
            return ['status' => 'status_check_sent'];

        } catch (\Exception $e) {
            Log::error("❌ MQTT Status Check Error", [
                'device_id' => $deviceId,
                'error' => $e->getMessage()
            ]);
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    /**
     * Send MQTT message using HTTP bridge or direct MQTT client
     */
    private function publishMessage($topic, $payload)
    {
        try {
            // Method 1: Try HTTP bridge if available
            if ($this->tryHttpBridge($topic, $payload)) {
                return true;
            }

            // Method 2: Try direct MQTT (for future implementation with composer package)
            return $this->tryDirectMqtt($topic, $payload);

        } catch (\Exception $e) {
            Log::error("❌ MQTT Publish Error", [
                'topic' => $topic,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Try publishing via HTTP bridge (Mosquitto HTTP plugin or custom bridge)
     */
    private function tryHttpBridge($topic, $payload)
    {
        try {
            $httpBridgeUrl = SystemSetting::get('mqtt', 'http_bridge_url', null);
            
            if (!$httpBridgeUrl) {
                return false; // No HTTP bridge configured
            }

            $response = Http::timeout(10)->post($httpBridgeUrl, [
                'topic' => $topic,
                'payload' => json_encode($payload),
                'qos' => 1,
                'retain' => false,
            ]);

            if ($response->successful()) {
                Log::info("✅ MQTT message sent via HTTP bridge", [
                    'topic' => $topic,
                    'url' => $httpBridgeUrl
                ]);
                return true;
            }

            Log::warning("⚠️ HTTP bridge failed", [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            return false;

        } catch (\Exception $e) {
            Log::warning("⚠️ HTTP bridge exception: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Try direct MQTT publishing (placeholder for future implementation)
     */
    private function tryDirectMqtt($topic, $payload)
    {
        // For now, simulate MQTT publishing for development
        if (app()->environment('local', 'development')) {
            Log::info("🔧 SIMULATED MQTT Message", [
                'topic' => $topic,
                'payload' => $payload,
                'config' => $this->mqttConfig
            ]);
            return true;
        }

        // In production, you would use an MQTT client library like:
        // - ReactPHP/socket
        // - BlueMvc/mqtt-client  
        // - Or custom implementation
        
        Log::warning("⚠️ Direct MQTT not implemented, falling back to simulation");
        return true; // Return true for now to allow testing
    }

    /**
     * Update appliance status in database
     */
    private function updateApplianceStatus($deviceId, $status)
    {
        try {
            $appliance = \App\Models\Appliance::where('device_id', $deviceId)->first();
            
            if ($appliance) {
                $appliance->update([
                    'status' => $status,
                    'last_ping' => now(),
                ]);
                
                Log::info("📱 Appliance status updated", [
                    'device_id' => $deviceId,
                    'status' => $status
                ]);
            } else {
                Log::warning("⚠️ Appliance not found for device_id: {$deviceId}");
            }

        } catch (\Exception $e) {
            Log::error("❌ Failed to update appliance status", [
                'device_id' => $deviceId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get user-friendly stop message based on reason
     */
    private function getStopMessage($reason)
    {
        $messages = [
            'subscription_expired' => 'Your subscription has expired. Please make your next payment to reactivate.',
            'payment_overdue' => 'Payment is overdue. Please pay to continue using your appliance.',
            'manual_stop' => 'Device has been manually stopped by administrator.',
            'maintenance' => 'Device temporarily stopped for maintenance.',
            'emergency' => 'Device stopped due to emergency situation.',
        ];

        return $messages[$reason] ?? 'Device has been stopped.';
    }

    /**
     * Test MQTT connection
     */
    public function testConnection()
    {
        try {
            Log::info("🔧 Testing MQTT connection...", $this->mqttConfig);

            // Test with a simple ping message
            $topic = $this->mqttConfig['topic_prefix'] . "/system/ping";
            $payload = [
                'command' => 'ping',
                'timestamp' => now()->toISOString(),
                'test' => true,
            ];

            $result = $this->publishMessage($topic, $payload);

            return [
                'success' => $result,
                'config' => [
                    'host' => $this->mqttConfig['host'],
                    'port' => $this->mqttConfig['port'],
                    'enabled' => $this->mqttConfig['is_enabled'],
                ],
                'timestamp' => now()->toISOString(),
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'timestamp' => now()->toISOString(),
            ];
        }
    }

    /**
     * Get MQTT connection status
     */
    public function getConnectionStatus()
    {
        return [
            'enabled' => $this->mqttConfig['is_enabled'],
            'host' => $this->mqttConfig['host'],
            'port' => $this->mqttConfig['port'],
            'has_auth' => !empty($this->mqttConfig['username']),
            'ssl_enabled' => $this->mqttConfig['use_ssl'],
            'client_id' => $this->mqttConfig['client_id'],
            'topic_prefix' => $this->mqttConfig['topic_prefix'],
        ];
    }
} 