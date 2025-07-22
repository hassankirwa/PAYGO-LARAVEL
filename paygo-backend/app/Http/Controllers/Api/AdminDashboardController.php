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
} 