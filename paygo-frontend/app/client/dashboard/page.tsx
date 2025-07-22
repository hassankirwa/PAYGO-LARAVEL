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
} from "lucide-react"
import { useRouter } from "next/navigation"
import { PaymentModal } from "@/components/payment-modal" // Import the new PaymentModal
import { authService, User as AuthUser } from "@/lib/auth"
import { ProfileSettingsModal } from "@/components/profile-settings-modal"
import { PreferencesModal } from "@/components/preferences-modal"
import { PaybillTransactions } from "@/components/client-dashboard/paybill-transactions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Settings } from "lucide-react"

// Dummy data
const clientData = {
  name: "John Doe",
  email: "client@example.com",
  phone: "+254 700 123 456",
  appliance: {
    model: "KOYO BC-90DC FRIDGE",
    capacity: "90 litres",
    serialNumber: "KY90-2024-001",
    installDate: "2024-01-15",
    status: "active",
    temperature: "3°C", // Added
    batteryVoltage: "12.8V", // Added
    location: "Nairobi, Kenya", // Added
  },
  paymentPlan: {
    totalAmount: 1290,
    paidAmount: 645,
    remainingAmount: 645,
    weeklyAmount: 25,
    nextPaymentDate: "2024-01-28",
    paymentsCompleted: 26,
    totalPayments: 52,
  },
  paymentHistory: [
    { date: "2024-01-21", amount: 25, status: "paid", method: "M-Pesa" },
    { date: "2024-01-14", amount: 25, status: "paid", method: "M-Pesa" },
    { date: "2024-01-07", amount: 25, status: "paid", method: "M-Pesa" },
    { date: "2023-12-31", amount: 25, status: "paid", method: "M-Pesa" },
    { date: "2023-12-24", amount: 25, status: "paid", method: "M-Pesa" },
  ],
  notifications: [
    { id: 1, message: "Payment reminder: Next payment due in 3 days", type: "reminder", date: "2024-01-25" },
    { id: 2, message: "Payment received successfully", type: "success", date: "2024-01-21" },
    { id: 3, message: "Monthly service report available", type: "info", date: "2024-01-20" },
  ],
}

export default function ClientDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Client Dashboard: Starting auth check...')
      
      try {
        // Check if user is authenticated
        const isAuth = authService.isAuthenticated()
        console.log('🔐 Is authenticated:', isAuth)
        
        if (!isAuth) {
          console.log('❌ Not authenticated, redirecting to login...')
          router.push("/login")
          return
        }

        // Check if user type is client
        const userType = authService.getUserType()
        console.log('👤 User type:', userType)
        
        if (userType !== "client") {
          console.log('❌ Wrong user type, redirecting to login...')
          router.push("/login")
          return
        }

        // Get current user data
        console.log('📡 Fetching current user data...')
        const currentUser = await authService.getCurrentUser()
        
        if (!currentUser) {
          console.log('❌ No current user, redirecting to login...')
          router.push("/login")
          return
        }

        console.log('✅ User authenticated successfully:', currentUser)
        setUser(currentUser)
      } catch (error) {
        console.error("❌ Authentication error:", error)
        router.push("/login")
      } finally {
        console.log('🏁 Auth check complete, setting loading to false')
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      await authService.logout()
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/login")
    }
  }

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your dashboard...</p>
      </div>
    </div>
  )

  if (!user) return null

  const progressPercentage = (clientData.paymentPlan.paidAmount / clientData.paymentPlan.totalAmount) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Refrigerator className="h-8 w-8 text-emerald-600" />
              <h1 className="text-2xl font-bold text-gray-900">KOYO Client Portal</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3 hover:bg-gray-100 rounded-lg px-3 py-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="/placeholder-avatar.jpg" />
                      <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-sm font-medium">
                        {user.first_name?.charAt(0) || user.name?.charAt(0) || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden md:block">
                      <p className="text-sm font-medium text-gray-900">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user.name || user.email
                        }
                      </p>
                      <p className="text-xs text-gray-500">Client</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setIsProfileSettingsOpen(true)}
                  >
                    <User className="h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setIsPreferencesOpen(true)}
                  >
                    <Settings className="h-4 w-4" />
                    Preferences
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600 cursor-pointer">
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Power className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Appliance Status</p>
                  <p className="text-2xl font-bold text-gray-900">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount Paid</p>
                  <p className="text-2xl font-bold text-gray-900">${clientData.paymentPlan.paidAmount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Next Payment</p>
                  <p className="text-2xl font-bold text-gray-900">${clientData.paymentPlan.weeklyAmount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(progressPercentage)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                Payment Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Ownership Progress</span>
                  <span className="text-sm font-semibold">{Math.round(progressPercentage)}</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600">${clientData.paymentPlan.paidAmount}</p>
                  <p className="text-sm text-gray-600">Paid</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">${clientData.paymentPlan.remainingAmount}</p>
                  <p className="text-sm text-gray-600">Remaining</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Next Payment</span>
                  <Badge className="bg-blue-100 text-blue-800">Due Soon</Badge>
                </div>
                <p className="text-xl font-bold text-blue-600">${clientData.paymentPlan.weeklyAmount}</p>
                <p className="text-sm text-gray-600">Due: {clientData.paymentPlan.nextPaymentDate}</p>
                <PaymentModal
                  triggerButtonText="Pay Now"
                  productName={clientData.appliance.model}
                  paymentAmount={clientData.paymentPlan.weeklyAmount}
                  paymentType="Weekly Installment"
                />
              </div>
            </CardContent>
          </Card>

          {/* Appliance Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Refrigerator className="h-5 w-5 text-emerald-600" />
                My Appliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Power className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">Status: Active</p>
                    <p className="text-sm text-green-600">Running normally</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Online</Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Model:</span>
                  <span className="font-semibold">{clientData.appliance.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-semibold">{clientData.appliance.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Serial Number:</span>
                  <span className="font-semibold">{clientData.appliance.serialNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Install Date:</span>
                  <span className="font-semibold">{clientData.appliance.installDate}</span>
                </div>
                {/* New fields */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Thermometer className="h-4 w-4" /> Temperature:
                  </span>
                  <span className="font-semibold">{clientData.appliance.temperature}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-1">
                    <BatteryCharging className="h-4 w-4" /> Battery Voltage:
                  </span>
                  <span className="font-semibold">{clientData.appliance.batteryVoltage}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> Location:
                  </span>
                  <span className="font-semibold">{clientData.appliance.location}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment History & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Recent Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clientData.paymentHistory.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">${payment.amount}</p>
                        <p className="text-sm text-gray-600">{payment.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-800">{payment.method}</Badge>
                      <p className="text-xs text-gray-500 mt-1">Completed</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-600" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clientData.notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mt-1">
                      {notification.type === "reminder" && (
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                      )}
                      {notification.type === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {notification.type === "info" && <Bell className="h-5 w-5 text-blue-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PayBill Transactions Section */}
        <div className="mt-8">
          <PaybillTransactions />
        </div>
      </main>

      {/* Modal Components */}
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        userType="client"
      />
      <PreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        userType="client"
      />
    </div>
  )
}
