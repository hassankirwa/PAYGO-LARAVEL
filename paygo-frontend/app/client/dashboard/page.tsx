"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CreditCard,
  Refrigerator,
  Calendar,
  Bell,
  Power,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  User,
  LogOut,
  Thermometer,
  BatteryCharging,
  MapPin,
  RefreshCw,
  Clock,
  Smartphone,
  TrendingUp,
  Activity,
  Loader2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { PaymentModal } from "@/components/payment-modal"
import { OngoingPaymentModal } from "@/components/ongoing-payment-modal"
import { authService, User as AuthUser } from "@/lib/auth"
import { ProfileSettingsModal } from "@/components/profile-settings-modal"
import { PreferencesModal } from "@/components/preferences-modal"
import { ClientSubscriptionStatus } from "@/components/client-subscription-status"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  dashboardApi, 
  DashboardStats, 
  MpesaTransactionData, 
  RenewalOption,
  PaymentDataResponse 
} from "@/lib/api"

export default function ClientDashboard() {
  const router = useRouter()
  const { toast } = useToast()

  // Authentication state
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Dashboard data state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentDataResponse | null>(null)
  const [renewalOptions, setRenewalOptions] = useState<RenewalOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isOngoingPaymentModalOpen, setIsOngoingPaymentModalOpen] = useState(false)
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await authService.isAuthenticated()
        setIsAuthenticated(isAuth)
        
        if (isAuth) {
          const userData = authService.getCurrentUser()
          setUser(userData)
        } else {
          router.push('/auth/login')
          return
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/login')
      }
    }

    checkAuth()
  }, [router])

  // Load dashboard data
  const loadDashboardData = async () => {
    if (!isAuthenticated) return

    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Loading dashboard data...')

      // Load all dashboard data in parallel
      const [statsResponse, paymentsResponse, renewalResponse] = await Promise.allSettled([
        dashboardApi.getStats(),
        dashboardApi.getPayments(),
        dashboardApi.getRenewalOptions(),
      ])

      // Handle stats response
      if (statsResponse.status === 'fulfilled') {
        setDashboardStats(statsResponse.value.stats)
        console.log('✅ Dashboard stats loaded')
      } else {
        console.error('❌ Failed to load stats:', statsResponse.reason)
      }

      // Handle payments response
      if (paymentsResponse.status === 'fulfilled') {
        setPaymentData(paymentsResponse.value.payments)
        console.log('✅ Payment data loaded')
      } else {
        console.error('❌ Failed to load payments:', paymentsResponse.reason)
      }

      // Handle renewal options response
      if (renewalResponse.status === 'fulfilled') {
        setRenewalOptions(renewalResponse.value.renewal_options)
        console.log('✅ Renewal options loaded')
      } else {
        console.error('❌ Failed to load renewal options:', renewalResponse.reason)
      }

      setLastUpdated(new Date())
      
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data')
      
      toast({
        title: "Error Loading Data",
        description: "Failed to load dashboard information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount and when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData()
    }
  }, [isAuthenticated])

  // Remove auto-refresh to prevent continuous API calls
  // Only refresh manually when needed
  useEffect(() => {
    // No automatic refresh interval - only manual refresh when needed
    // This prevents unnecessary backend load and improves performance
  }, [isAuthenticated])

  const handleLogout = async () => {
    try {
      await authService.logout()
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout failed:', error)
      toast({
        title: "Logout Error",
        description: "Failed to logout properly. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleMakePayment = () => {
    setIsPaymentModalOpen(true)
  }

  const handleRefreshData = () => {
    loadDashboardData()
    toast({
      title: "Refreshing Data",
      description: "Loading latest dashboard information...",
    })
  }

  // Loading state
  if (loading && !dashboardStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !dashboardStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefreshData} className="mb-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Refrigerator className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">KOYO PayGo Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Refresh Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefreshData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              {/* Last Updated */}
              <span className="text-sm text-gray-500">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={user?.name || 'User'} />
                      <AvatarFallback>
                        {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user?.name || 'User'}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsProfileSettingsOpen(true)}>
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsPreferencesOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Preferences
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {dashboardStats?.client_info?.name || user?.name || 'Valued Customer'}!
          </h2>
          <p className="text-gray-600">
            Here's an overview of your KOYO appliances and payment status.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dashboardStats?.summary.active_subscriptions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total: {dashboardStats?.summary.total_subscriptions || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {dashboardStats?.summary.formatted_total_paid || 'KSh 0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Total Payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {dashboardStats?.summary.formatted_total_balance || 'KSh 0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                across all plans
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Appliances</CardTitle>
              <Refrigerator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {dashboardStats?.summary.total_appliances || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                KOYO devices
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Status */}
        <div className="mb-8">
          <ClientSubscriptionStatus />
        </div>

        {/* Appliances Grid */}
        {dashboardStats?.appliances && dashboardStats.appliances.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Appliances</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardStats.appliances.map((appliance) => (
                <Card key={appliance.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{appliance.product_name}</span>
                      <Badge variant={appliance.status === 'active' ? 'default' : 'secondary'}>
                        {appliance.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Power className="h-4 w-4 mr-2" />
                      Device ID: {appliance.device_id}
                    </div>
                    
                    {appliance.temperature && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Thermometer className="h-4 w-4 mr-2" />
                        Temperature: {appliance.temperature}
                      </div>
                    )}
                    
                    {appliance.battery_voltage && (
                      <div className="flex items-center text-sm text-gray-600">
                        <BatteryCharging className="h-4 w-4 mr-2" />
                        Battery: {appliance.battery_voltage}
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Installed: {appliance.installation_date}
                    </div>
                    
                    {appliance.last_ping && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Activity className="h-4 w-4 mr-2" />
                        Last seen: {appliance.last_ping}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Payment Plans */}
        {dashboardStats?.payment_plans && dashboardStats.payment_plans.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Payment Plans</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dashboardStats.payment_plans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{plan.plan_name}</span>
                      <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                        {plan.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{plan.completed_installments}/{plan.total_installments} payments</span>
                      </div>
                      <Progress value={plan.progress_percentage} className="h-2" />
                      <div className="text-xs text-gray-500">
                        {plan.progress_percentage}% complete
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Next Payment:</span>
                        <div className="font-medium">KSh {plan.installment_amount.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Due Date:</span>
                        <div className="font-medium">{plan.next_payment_due}</div>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-gray-600">Remaining Balance:</span>
                      <div className="font-medium text-lg">KSh {plan.remaining_balance.toLocaleString()}</div>
                    </div>

                    {plan.status === 'active' && (
                      <Button 
                        onClick={handleMakePayment} 
                        className="w-full"
                        size="sm"
                      >
                        <Smartphone className="h-4 w-4 mr-2" />
                        Pay via M-Pesa STK Push
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Payments */}
        {dashboardStats?.recent_payments && dashboardStats.recent_payments.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Payments</h3>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {dashboardStats.recent_payments.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">{payment.formatted_amount}</div>
                          <div className="text-sm text-gray-500">
                            {payment.method} • {payment.receipt_number}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.date}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Renewal Options */}
        {renewalOptions.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Subscription Renewals</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renewalOptions.map((option) => (
                <Card key={option.subscription_id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{option.product_name}</span>
                      <Badge variant={option.current_status === 'active' ? 'default' : 'secondary'}>
                        {option.current_status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Device ID:</span>
                        <div className="font-medium">{option.device_id}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Next Amount:</span>
                        <div className="font-medium">{option.formatted_amount}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Due Date:</span>
                        <div className="font-medium">{option.formatted_due_date}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Days Left:</span>
                        <div className="font-medium">
                          {option.days_remaining !== null ? `${option.days_remaining} days` : 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-gray-600">Remaining Balance:</span>
                      <div className="font-medium text-lg">{option.formatted_balance}</div>
                    </div>

                    {option.can_renew && (
                      <Button 
                        onClick={handleMakePayment} 
                        className="w-full"
                        variant={option.days_remaining !== null && option.days_remaining <= 7 ? "default" : "outline"}
                      >
                        <Smartphone className="h-4 w-4 mr-2" />
                        Renew via M-Pesa STK Push
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal Components */}
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
      />

      <PreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentInitiated={() => {
          setIsPaymentModalOpen(false)
          setIsOngoingPaymentModalOpen(true)
        }}
      />

      <OngoingPaymentModal
        isOpen={isOngoingPaymentModalOpen}
        onClose={() => setIsOngoingPaymentModalOpen(false)}
        onPaymentCompleted={() => {
          setIsOngoingPaymentModalOpen(false)
          // Refresh dashboard data after payment completion
          loadDashboardData()
          toast({
            title: "Payment Completed",
            description: "Your payment has been processed successfully!",
          })
        }}
      />
    </div>
  )
}
