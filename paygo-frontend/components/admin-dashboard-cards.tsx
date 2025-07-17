"use client"

import { useState, useEffect } from "react"
import { authService } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Users, 
  DollarSign, 
  Refrigerator, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Power,
  PowerOff,
  Wrench,
  CalendarCheck,
  AlertTriangle,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function AdminDashboardCards() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await authService.getDashboardStats()
      if (response.success) {
        setDashboardData(response.data)
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (percentage: number) => {
    const isPositive = percentage >= 0
    return (
      <span className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(percentage).toFixed(1)}%
      </span>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchDashboardData} variant="outline" className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const clientStats = dashboardData?.clients || {}
  const revenueStats = dashboardData?.revenue || {}
  const applianceStats = dashboardData?.appliances || {}
  const paymentStats = dashboardData?.payments || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
        <Button onClick={fetchDashboardData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Clients */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 opacity-90 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-white/90 uppercase tracking-wide">Total Clients</CardTitle>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-white mb-2">{clientStats.total_clients?.toLocaleString() || 0}</div>
            <p className="text-sm text-white/80 mb-4">{clientStats.this_month_registrations || 0} this month</p>
            <div className="flex items-center gap-2 mt-3">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                (clientStats.percentage_change || 0) >= 0 ? "bg-green-500/20 text-green-100" : "bg-red-500/20 text-red-100"
              }`}>
                {(clientStats.percentage_change || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{Math.abs(clientStats.percentage_change || 0).toFixed(1)}%</span>
              </div>
              <span className="text-xs text-white/70">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-700 opacity-90 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-white/90 uppercase tracking-wide">Monthly Revenue</CardTitle>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-white mb-2">{formatCurrency(revenueStats.this_month_revenue || 0)}</div>
            <p className="text-sm text-white/80 mb-4">vs {formatCurrency(revenueStats.last_month_revenue || 0)} last month</p>
            <div className="flex items-center gap-2 mt-3">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                (revenueStats.percentage_change || 0) >= 0 ? "bg-green-500/20 text-green-100" : "bg-red-500/20 text-red-100"
              }`}>
                {(revenueStats.percentage_change || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{Math.abs(revenueStats.percentage_change || 0).toFixed(1)}%</span>
              </div>
              <span className="text-xs text-white/70">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Appliances Online */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-700 opacity-90 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-white/90 uppercase tracking-wide">Appliances Online</CardTitle>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Power className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-white mb-2">{applianceStats.appliances_online || 0}</div>
            <p className="text-sm text-white/80 mb-4">{applianceStats.online_percentage || 0}% online rate</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                <Activity className="h-3 w-3" />
                <span>{applianceStats.connectivity_trend || 'stable'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Renewals Due */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-700 opacity-90 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-white/90 uppercase tracking-wide">Renewals Due</CardTitle>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <CalendarCheck className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-white mb-2">{paymentStats.renewals_due_30_days || 0}</div>
            <p className="text-sm text-white/80 mb-4">{paymentStats.renewals_due_7_days || 0} urgent</p>
            {paymentStats.overdue_payments > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-100">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{paymentStats.overdue_payments} overdue</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Active Clients */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-cyan-700 opacity-90 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-white/90 uppercase tracking-wide">Active Clients</CardTitle>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Activity className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-white mb-2">{clientStats.active_clients || 0}</div>
            <p className="text-sm text-white/80">{clientStats.new_this_week || 0} new this week</p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-teal-700 opacity-90 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-white/90 uppercase tracking-wide">Total Revenue</CardTitle>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-white mb-2">{formatCurrency(revenueStats.total_revenue || 0)}</div>
            <p className="text-sm text-white/80">Avg: {formatCurrency(revenueStats.average_monthly_revenue || 0)}/month</p>
          </CardContent>
        </Card>

        {/* Offline Units */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-700 opacity-90 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-white/90 uppercase tracking-wide">Offline Units</CardTitle>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <PowerOff className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-white mb-2">{applianceStats.appliances_offline || 0}</div>
            <p className="text-sm text-white/80">{applianceStats.total_appliances || 0} total units</p>
          </CardContent>
        </Card>

        {/* Under Maintenance */}
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-700 opacity-90 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-white/90 uppercase tracking-wide">Under Maintenance</CardTitle>
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Wrench className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-white mb-2">{applianceStats.under_maintenance || 0}</div>
            <p className="text-sm text-white/80">{applianceStats.needs_maintenance || 0} need service</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Performance */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle>Payment Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Success Rate</p>
              <div className="text-2xl font-bold text-green-600">
                {paymentStats.payment_success_rate || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {paymentStats.successful_payments_this_month || 0} of {paymentStats.total_payments_this_month || 0} payments
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Average Payment</p>
              <div className="text-2xl font-bold">
                {formatCurrency(paymentStats.average_payment_amount || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                This month average
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Outstanding</p>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(revenueStats.outstanding_revenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Pending payments
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Summary */}
      {dashboardData?.recent_activity && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-sm">Recent Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboardData.recent_activity.recent_clients?.slice(0, 3).map((client: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>{client.first_name} {client.last_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {client.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-sm">Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboardData.recent_activity.recent_payments?.slice(0, 3).map((payment: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>{formatCurrency(payment.amount_usd)}</span>
                    <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                      {payment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-sm">Recent Installations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboardData.recent_activity.recent_installations?.slice(0, 3).map((installation: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>{installation.product?.name || 'Appliance'}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(installation.installation_date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 