<?php

namespace App\Http\Controllers;

use App\Services\SubscriptionManagementService;
use App\Models\Appliance;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DeviceController extends Controller
{
    protected $subscriptionService;

    public function __construct(SubscriptionManagementService $subscriptionService)
    {
        $this->subscriptionService = $subscriptionService;
    }

    public function getOverview(Request $request)
    {
        try {
            // Fetch device statistics
            $deviceStats = [
                'total' => Appliance::count(),
                'active' => Appliance::where('is_active', true)->count(),
                'suspended' => Appliance::where('status', 'suspended')->count(),
                'pending' => Appliance::where('status', 'pending_activation')->count(),
            ];

            // Fetch subscription statistics
            $subscriptionStats = [
                'active' => Subscription::where('status', 'active')->count(),
                'expired' => Subscription::where('status', 'expired')->count(),
                'suspended' => Subscription::where('status', 'suspended')->count(),
            ];

            // Fetch recent devices (example: last 5 devices)
            $recentDevices = Appliance::with(['client', 'product'])
                ->latest()
                ->take(5)
                ->get()
                ->map(function ($appliance) {
                    return [
                        'id' => $appliance->id,
                        'device_id' => $appliance->device_id,
                        'client_name' => $appliance->client ? $appliance->client->name : 'N/A',
                        'product_name' => $appliance->product ? $appliance->product->name : 'N/A',
                        'status' => $appliance->status,
                        'last_ping' => $appliance->last_ping ?? null,
                        'created_at' => $appliance->created_at->toISOString(),
                    ];
                });

            // Mock MQTT connection status (adjust based on your MQTT setup)
            $mqttStatus = [
                'enabled' => true,
                'host' => config('mqtt.host', 'localhost'),
                'port' => config('mqtt.port', '1883'),
                'has_auth' => !empty(config('mqtt.username')),
                'ssl_enabled' => config('mqtt.ssl_enabled', false),
                'client_id' => config('mqtt.client_id', 'laravel_client'),
                'topic_prefix' => config('mqtt.topic_prefix', 'devices/'),
            ];

            return response()->json([
                'success' => true,
                'overview' => [
                    'device_stats' => $deviceStats,
                    'subscription_stats' => $subscriptionStats,
                    'recent_devices' => $recentDevices,
                ],
                'mqtt_status' => $mqttStatus,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch device overview', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch device overview',
            ], 500);
        }
    }
}