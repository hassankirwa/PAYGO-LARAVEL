<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\Client;
use App\Models\Appliance;
use App\Models\PaymentPlan;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    /**
     * Get comprehensive dashboard statistics
     */
    public function getDashboardStats()
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $stats = [
                'clients' => $this->getClientStats(),
                'revenue' => $this->getRevenueStats(),
                'appliances' => $this->getApplianceStats(),
                'payments' => $this->getPaymentStats(),
                'recent_activity' => $this->getRecentActivity()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get client statistics
     */
    private function getClientStats()
    {
        $now = Carbon::now();
        $lastMonth = $now->copy()->subMonth();
        $twoMonthsAgo = $now->copy()->subMonths(2);

        // Total clients
        $totalClients = Client::count();

        // This month's registrations
        $thisMonthClients = Client::whereMonth('registration_date', $now->month)
            ->whereYear('registration_date', $now->year)
            ->count();

        // Last month's registrations
        $lastMonthClients = Client::whereMonth('registration_date', $lastMonth->month)
            ->whereYear('registration_date', $lastMonth->year)
            ->count();

        // Calculate percentage change
        $percentageChange = 0;
        if ($lastMonthClients > 0) {
            $percentageChange = (($thisMonthClients - $lastMonthClients) / $lastMonthClients) * 100;
        } elseif ($thisMonthClients > 0) {
            $percentageChange = 100; // First month with clients
        }

        // Active clients (have active payment plans)
        $activeClients = Client::whereHas('paymentPlans', function($query) {
            $query->where('status', 'active');
        })->count();

        // New clients this week
        $weekStart = $now->copy()->startOfWeek();
        $newThisWeek = Client::where('registration_date', '>=', $weekStart)->count();

        return [
            'total_clients' => $totalClients,
            'this_month_registrations' => $thisMonthClients,
            'last_month_registrations' => $lastMonthClients,
            'percentage_change' => round($percentageChange, 2),
            'active_clients' => $activeClients,
            'new_this_week' => $newThisWeek,
            'trend' => $percentageChange >= 0 ? 'up' : 'down'
        ];
    }

    /**
     * Get revenue statistics
     */
    private function getRevenueStats()
    {
        $now = Carbon::now();
        $thisMonth = $now->copy()->startOfMonth();
        $lastMonth = $now->copy()->subMonth()->startOfMonth();
        $lastMonthEnd = $now->copy()->subMonth()->endOfMonth();

        // This month's revenue
        $thisMonthRevenue = Payment::where('status', 'completed')
            ->where('payment_date', '>=', $thisMonth)
            ->sum('amount_ksh');

        // Last month's revenue
        $lastMonthRevenue = Payment::where('status', 'completed')
            ->whereBetween('payment_date', [$lastMonth, $lastMonthEnd])
            ->sum('amount_ksh');

        // Calculate percentage change
        $revenueChange = 0;
        if ($lastMonthRevenue > 0) {
            $revenueChange = (($thisMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100;
        } elseif ($thisMonthRevenue > 0) {
            $revenueChange = 100;
        }

        // Total revenue all time
        $totalRevenue = Payment::where('status', 'completed')->sum('amount_ksh');

        // Average monthly revenue (last 6 months)
        $sixMonthsAgo = $now->copy()->subMonths(6);
        $avgMonthlyRevenue = Payment::where('status', 'completed')
            ->where('payment_date', '>=', $sixMonthsAgo)
            ->sum('amount_ksh') / 6;

        // Outstanding revenue (pending payments)
        $outstandingRevenue = PaymentPlan::where('status', 'active')
            ->sum('remaining_balance_ksh');

        return [
            'this_month_revenue' => round($thisMonthRevenue, 2),
            'last_month_revenue' => round($lastMonthRevenue, 2),
            'percentage_change' => round($revenueChange, 2),
            'total_revenue' => round($totalRevenue, 2),
            'average_monthly_revenue' => round($avgMonthlyRevenue, 2),
            'outstanding_revenue' => round($outstandingRevenue, 2),
            'trend' => $revenueChange >= 0 ? 'up' : 'down'
        ];
    }

    /**
     * Get appliance statistics (with dummy data for IoT features)
     */
    private function getApplianceStats()
    {
        $totalAppliances = Appliance::count();
        
        // For now, we'll use dummy data for IoT connectivity
        // In production, this would check actual device connectivity
        $onlinePercentage = rand(75, 95); // 75-95% online
        $appliancesOnline = round(($totalAppliances * $onlinePercentage) / 100);
        $appliancesOffline = $totalAppliances - $appliancesOnline;
        
        // Dummy data for maintenance
        $underMaintenance = rand(2, 8); // 2-8 units under maintenance
        
        // Appliances by status from database
        $statusCounts = Appliance::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Recent installations (last 30 days)
        $recentInstallations = Appliance::where('installation_date', '>=', Carbon::now()->subDays(30))
            ->count();

        // Appliances needing maintenance (last maintenance > 90 days ago)
        $needsMaintenance = Appliance::where('last_maintenance_date', '<', Carbon::now()->subDays(90))
            ->orWhereNull('last_maintenance_date')
            ->count();

        return [
            'total_appliances' => $totalAppliances,
            'appliances_online' => $appliancesOnline,
            'appliances_offline' => $appliancesOffline,
            'under_maintenance' => $underMaintenance,
            'online_percentage' => $onlinePercentage,
            'status_breakdown' => $statusCounts,
            'recent_installations' => $recentInstallations,
            'needs_maintenance' => $needsMaintenance,
            'connectivity_trend' => 'stable' // Would be calculated from historical data
        ];
    }

    /**
     * Get payment and renewal statistics
     */
    private function getPaymentStats()
    {
        $now = Carbon::now();
        $next30Days = $now->copy()->addDays(30);
        $next7Days = $now->copy()->addDays(7);

        // Renewals due in next 30 days
        $renewalsDue30 = PaymentPlan::where('status', 'active')
            ->where('next_payment_due_date', '<=', $next30Days)
            ->where('next_payment_due_date', '>=', $now)
            ->count();

        // Renewals due in next 7 days (urgent)
        $renewalsDue7 = PaymentPlan::where('status', 'active')
            ->where('next_payment_due_date', '<=', $next7Days)
            ->where('next_payment_due_date', '>=', $now)
            ->count();

        // Overdue payments
        $overduePayments = PaymentPlan::where('status', 'active')
            ->where('next_payment_due_date', '<', $now)
            ->count();

        // Payment success rate this month
        $thisMonth = $now->copy()->startOfMonth();
        $totalPaymentsThisMonth = Payment::where('payment_date', '>=', $thisMonth)->count();
        $successfulPaymentsThisMonth = Payment::where('payment_date', '>=', $thisMonth)
            ->where('status', 'completed')
            ->count();
        
        $paymentSuccessRate = $totalPaymentsThisMonth > 0 
            ? ($successfulPaymentsThisMonth / $totalPaymentsThisMonth) * 100 
            : 0;

        // Average payment amount
        $avgPaymentAmount = Payment::where('status', 'completed')
            ->where('payment_date', '>=', $thisMonth)
            ->avg('amount_ksh');

        return [
            'renewals_due_30_days' => $renewalsDue30,
            'renewals_due_7_days' => $renewalsDue7,
            'overdue_payments' => $overduePayments,
            'payment_success_rate' => round($paymentSuccessRate, 2),
            'average_payment_amount' => round($avgPaymentAmount ?? 0, 2),
            'total_payments_this_month' => $totalPaymentsThisMonth,
            'successful_payments_this_month' => $successfulPaymentsThisMonth
        ];
    }

    /**
     * Get recent activity
     */
    private function getRecentActivity()
    {
        // Recent client registrations
        $recentClients = Client::orderBy('registration_date', 'desc')
            ->limit(5)
            ->select('first_name', 'last_name', 'email', 'registration_date', 'status')
            ->get();

        // Recent payments
        $recentPayments = Payment::with(['client:id,first_name,last_name', 'paymentPlan'])
            ->orderBy('payment_date', 'desc')
            ->limit(5)
            ->get();

        // Recent appliance installations
        $recentInstallations = Appliance::with(['client:id,first_name,last_name', 'product:id,name'])
            ->orderBy('installation_date', 'desc')
            ->limit(5)
            ->get();

        return [
            'recent_clients' => $recentClients,
            'recent_payments' => $recentPayments,
            'recent_installations' => $recentInstallations
        ];
    }

    /**
     * Get specific client statistics
     */
    public function getClientStatistics()
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $stats = $this->getClientStats();
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch client statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get specific revenue statistics
     */
    public function getRevenueStatistics()
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $stats = $this->getRevenueStats();
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch revenue statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get specific appliance statistics
     */
    public function getApplianceStatistics()
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $stats = $this->getApplianceStats();
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch appliance statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all appliances with filtering, search, and pagination
     */
    public function getAppliances(Request $request)
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $query = Appliance::with(['client', 'product']);

            // Search functionality
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('unit_id', 'like', "%{$search}%")
                      ->orWhere('serial_number', 'like', "%{$search}%")
                      ->orWhereHas('client', function($clientQuery) use ($search) {
                          $clientQuery->where('first_name', 'like', "%{$search}%")
                                     ->orWhere('last_name', 'like', "%{$search}%")
                                     ->orWhere('phone', 'like', "%{$search}%");
                      })
                      ->orWhereHas('product', function($productQuery) use ($search) {
                          $productQuery->where('name', 'like', "%{$search}%")
                                      ->orWhere('model_code', 'like', "%{$search}%");
                      })
                      ->orWhere('installation_location', 'like', "%{$search}%");
                });
            }

            // Status filter
            if ($request->has('status') && !empty($request->status) && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Location filter
            if ($request->has('location') && !empty($request->location)) {
                $query->where('installation_location', 'like', "%{$request->location}%");
            }

            // Sorting
            $sortColumn = $request->get('sort_by', 'created_at');
            $sortDirection = $request->get('sort_direction', 'desc');
            
            // Validate sort column to prevent SQL injection
            $allowedSortColumns = ['unit_id', 'status', 'installation_date', 'last_ping', 'created_at'];
            if (in_array($sortColumn, $allowedSortColumns)) {
                $query->orderBy($sortColumn, $sortDirection);
            } else {
                $query->orderBy('created_at', 'desc');
            }

            // Pagination
            $perPage = $request->get('per_page', 20);
            $appliances = $query->paginate($perPage);

            // Transform the data for frontend consumption
            $appliances->getCollection()->transform(function ($appliance) {
                // Determine online/offline status based on last_ping
                $isOnline = $appliance->last_ping && $appliance->last_ping > Carbon::now()->subMinutes(15);
                $effectiveStatus = $appliance->status;
                
                if ($appliance->status === 'active' && !$isOnline) {
                    $effectiveStatus = 'offline';
                }

                return [
                    'id' => $appliance->id,
                    'unit_id' => $appliance->unit_id,
                    'serial_number' => $appliance->serial_number,
                    'device_id' => $appliance->device_id,
                    'status' => $effectiveStatus,
                    'database_status' => $appliance->status,
                    'is_online' => $isOnline,
                    'client' => [
                        'id' => $appliance->client->id ?? null,
                        'name' => $appliance->client ? 
                            trim($appliance->client->first_name . ' ' . $appliance->client->last_name) : 
                            'Unassigned',
                        'phone' => $appliance->client->phone ?? null,
                    ],
                    'product' => [
                        'id' => $appliance->product->id ?? null,
                        'name' => $appliance->product->name ?? 'Unknown Product',
                        'model_code' => $appliance->product->model_code ?? 'N/A',
                        'capacity_litres' => $appliance->product->capacity_litres ?? null,
                    ],
                    'installation_location' => $appliance->installation_location,
                    'installation_date' => $appliance->installation_date?->format('Y-m-d'),
                    'installation_date_formatted' => $appliance->installation_date?->format('M j, Y'),
                    'current_temperature' => $appliance->current_temperature,
                    'current_battery_voltage' => $appliance->current_battery_voltage,
                    'last_ping' => $appliance->last_ping?->format('Y-m-d H:i:s'),
                    'last_ping_formatted' => $appliance->last_ping?->format('M j, Y g:i A'),
                    'last_maintenance_date' => $appliance->last_maintenance_date?->format('Y-m-d'),
                    'created_at' => $appliance->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $appliance->updated_at->format('Y-m-d H:i:s'),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $appliances->items(),
                'pagination' => [
                    'current_page' => $appliances->currentPage(),
                    'last_page' => $appliances->lastPage(),
                    'per_page' => $appliances->perPage(),
                    'total' => $appliances->total(),
                    'from' => $appliances->firstItem(),
                    'to' => $appliances->lastItem(),
                ],
                'filters' => [
                    'search' => $request->search,
                    'status' => $request->status,
                    'location' => $request->location,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch appliances: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a single appliance by ID
     */
    public function getAppliance($id)
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $appliance = Appliance::with(['client', 'product', 'paymentPlans'])
                ->findOrFail($id);

            $isOnline = $appliance->last_ping && $appliance->last_ping > Carbon::now()->subMinutes(15);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $appliance->id,
                    'unit_id' => $appliance->unit_id,
                    'serial_number' => $appliance->serial_number,
                    'device_id' => $appliance->device_id,
                    'status' => $appliance->status,
                    'is_online' => $isOnline,
                    'client' => $appliance->client ? [
                        'id' => $appliance->client->id,
                        'name' => trim($appliance->client->first_name . ' ' . $appliance->client->last_name),
                        'phone' => $appliance->client->phone,
                        'email' => $appliance->client->email,
                    ] : null,
                    'product' => $appliance->product ? [
                        'id' => $appliance->product->id,
                        'name' => $appliance->product->name,
                        'model_code' => $appliance->product->model_code,
                        'capacity_litres' => $appliance->product->capacity_litres,
                        'power_consumption_watts' => $appliance->product->power_consumption_watts,
                    ] : null,
                    'installation_location' => $appliance->installation_location,
                    'installation_date' => $appliance->installation_date?->format('Y-m-d'),
                    'current_temperature' => $appliance->current_temperature,
                    'current_battery_voltage' => $appliance->current_battery_voltage,
                    'last_ping' => $appliance->last_ping?->format('Y-m-d H:i:s'),
                    'last_maintenance_date' => $appliance->last_maintenance_date?->format('Y-m-d'),
                    'warranty_expiry_date' => $appliance->warranty_expiry_date?->format('Y-m-d'),
                    'installation_notes' => $appliance->installation_notes,
                    'payment_plans' => $appliance->paymentPlans->map(function($plan) {
                        return [
                            'id' => $plan->id,
                            'status' => $plan->status,
                            'total_amount_ksh' => $plan->total_amount_ksh,
                            'remaining_balance_ksh' => $plan->remaining_balance_ksh,
                            'next_payment_due_date' => $plan->next_payment_due_date?->format('Y-m-d'),
                        ];
                    }),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch appliance: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update appliance status
     */
    public function updateApplianceStatus(Request $request, $id)
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $request->validate([
                'status' => 'required|in:active,offline,maintenance,decommissioned',
                'notes' => 'nullable|string|max:500'
            ]);

            $appliance = Appliance::findOrFail($id);
            $oldStatus = $appliance->status;
            
            $appliance->update([
                'status' => $request->status,
                'last_maintenance_date' => $request->status === 'maintenance' ? now() : $appliance->last_maintenance_date,
            ]);

            // Log the status change
            \Log::info("Appliance status changed", [
                'appliance_id' => $appliance->id,
                'unit_id' => $appliance->unit_id,
                'old_status' => $oldStatus,
                'new_status' => $request->status,
                'admin_id' => $admin->id,
                'notes' => $request->notes,
                'timestamp' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Appliance status updated successfully',
                'data' => [
                    'id' => $appliance->id,
                    'unit_id' => $appliance->unit_id,
                    'old_status' => $oldStatus,
                    'new_status' => $appliance->status,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to update appliance status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle appliance power (IoT control) 
     */
    public function toggleAppliancePower(Request $request, $id)
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $appliance = Appliance::findOrFail($id);
            
            // For now, this is a placeholder for IoT integration
            // In a real implementation, this would send MQTT commands to the device
            $newPowerState = $request->input('power_on', true);
            $action = $newPowerState ? 'turned on' : 'turned off';

            // Log the power toggle action
            \Log::info("Appliance power toggled", [
                'appliance_id' => $appliance->id,
                'unit_id' => $appliance->unit_id,
                'device_id' => $appliance->device_id,
                'action' => $action,
                'admin_id' => $admin->id,
                'timestamp' => now()
            ]);

            // TODO: Implement actual MQTT command sending here
            // MqttService::sendPowerCommand($appliance->device_id, $newPowerState);

            return response()->json([
                'success' => true,
                'message' => "Appliance {$appliance->unit_id} {$action} successfully",
                'data' => [
                    'unit_id' => $appliance->unit_id,
                    'device_id' => $appliance->device_id,
                    'action' => $action,
                    'power_on' => $newPowerState,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to toggle appliance power: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sync appliance status with IoT device
     */
    public function syncApplianceStatus($id)
    {
        try {
            $admin = Auth::guard('sanctum')->user();
            
            if (!$admin || !$admin instanceof AdminUser) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $appliance = Appliance::findOrFail($id);
            
            // For now, this simulates syncing with IoT device
            // In a real implementation, this would query the device via MQTT
            $currentTime = now();
            
            // Simulate device response with random but realistic data
            $simulatedData = [
                'temperature' => rand(-25, 10) . '°C',
                'battery_voltage' => (rand(110, 130) / 10) . 'V',
                'last_ping' => $currentTime,
                'status' => $appliance->status, // Keep current status
            ];

            $appliance->update([
                'current_temperature' => $simulatedData['temperature'],
                'current_battery_voltage' => $simulatedData['battery_voltage'],
                'last_ping' => $simulatedData['last_ping'],
            ]);

            \Log::info("Appliance status synced", [
                'appliance_id' => $appliance->id,
                'unit_id' => $appliance->unit_id,
                'synced_data' => $simulatedData,
                'admin_id' => $admin->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Appliance {$appliance->unit_id} status synced successfully",
                'data' => [
                    'unit_id' => $appliance->unit_id,
                    'temperature' => $simulatedData['temperature'],
                    'battery_voltage' => $simulatedData['battery_voltage'],
                    'last_ping' => $simulatedData['last_ping']->format('Y-m-d H:i:s'),
                    'is_online' => true,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to sync appliance status: ' . $e->getMessage()
            ], 500);
        }
    }
} 