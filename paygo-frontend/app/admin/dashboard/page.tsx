"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Shield, LogOut, Eye, Settings, Bell, User } from "lucide-react"
import { authService, User as AuthUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, Refrigerator, TrendingUp, Search, Power, PowerOff } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin-sidebar"
import { UnitsFreezersTable } from "@/components/units-freezers-table"
import { LocationsTable } from "@/components/locations-table"
import { BulkSmsSection } from "@/components/bulk-sms-section"
import { EmailMarketingSection } from "@/components/email-marketing-section"
import { SettingsSection } from "@/components/settings-section"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { clients } from "@/lib/clients" // Import clients data
import { appliances } from "@/lib/appliances" // Import appliances data
import { AnalyticsDashboardSection } from "@/components/analytics-dashboard-section"
import { AddClientModal } from "@/components/add-client-modal"
import { RegisterApplianceModal } from "@/components/register-appliance-modal"
import GenerateReportModal from "@/components/generate-report-modal"
import { ProfileSettingsModal } from "@/components/profile-settings-modal"
import { PreferencesModal } from "@/components/preferences-modal"
import { AdminDashboardCards } from "@/components/admin-dashboard-cards"

export default function AdminDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentView = searchParams.get("view") || "dashboard"

  // State for client table search, filter, and sort
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "suspended">("all")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Modal states
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false)
  const [isRegisterApplianceModalOpen, setIsRegisterApplianceModalOpen] = useState(false)
  const [isGenerateReportModalOpen, setIsGenerateReportModalOpen] = useState(false)
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
          router.push("/login")
          return
        }

        // Check if user type is admin
        const userType = authService.getUserType()
        if (userType !== "admin") {
          router.push("/login")
          return
        }

        // Get current user data
        const currentUser = await authService.getCurrentUser()
        if (!currentUser) {
          router.push("/login")
          return
        }

        setUser(currentUser)
      } catch (error) {
        console.error("Authentication error:", error)
        router.push("/login")
      } finally {
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

  const getViewTitle = (view: string) => {
    switch (view) {
      case "dashboard":
        return "Dashboard Overview"
      case "units":
        return "Units & Freezers"
      case "locations":
        return "Locations Management"
      case "bulk-sms":
        return "Bulk SMS"
      case "email-marketing":
        return "Email Marketing"
      case "settings":
        return "Settings"
      default:
        return "Dashboard"
    }
  }

  const getViewDescription = (view: string) => {
    switch (view) {
      case "dashboard":
        return "Monitor your system performance and key metrics"
      case "units":
        return "Manage and monitor your appliance inventory"
      case "locations":
        return "Oversee all deployment locations"
      case "bulk-sms":
        return "Send bulk SMS notifications to clients"
      case "email-marketing":
        return "Manage email campaigns and marketing"
      case "settings":
        return "Configure system settings and preferences"
      default:
        return "Welcome to your admin dashboard"
    }
  }

  const handleToggleAppliance = (clientId: number, currentStatus: string) => {
    const action = currentStatus === "active" ? "suspend" : "activate"
    if (confirm(`Are you sure you want to ${action} this appliance?`)) {
      alert(`Appliance ${action}d successfully!`)
    }
  }

  const filteredAndSortedClients = clients
    .filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.applianceModel.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterStatus === "all" || client.status === filterStatus
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      if (!sortColumn) return 0
      const aValue = (a as any)[sortColumn]
      const bValue = (b as any)[sortColumn]

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }
      return 0
    })

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  // Dummy admin stats (using imported data for counts)
  const adminStats = {
    totalClients: clients.length,
    activeAppliances: appliances.filter((app) => app.status === "active").length,
    monthlyRevenue: 45680, // Placeholder, could be calculated from client payments
    renewalsDue: clients.filter((client) => client.paymentStatus === "overdue").length, // Example: clients with overdue payments
  }

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
      </div>
    </div>
  )

  if (!user) return null

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        {/* Responsive Modern Header */}
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
          <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-6">
            <SidebarTrigger className="-ml-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" />
            <Separator orientation="vertical" className="mr-2 h-4 sm:h-6" />
            
            {/* Responsive Breadcrumb */}
            <Breadcrumb className="flex-1">
              <BreadcrumbList>
                <BreadcrumbItem className="hidden sm:block">
                  <BreadcrumbLink href="/admin/dashboard?view=dashboard" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                    Admin
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-gray-900 dark:text-gray-100 font-medium text-sm sm:text-base">
                    {getViewTitle(currentView)}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Responsive Header Actions */}
            <div className="flex items-center gap-1 sm:gap-3">
              {/* Notifications - Hidden on very small screens */}
              <Button variant="ghost" size="sm" className="relative hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 hidden xs:block">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
                <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full text-xs" />
              </Button>

              {/* Responsive User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 sm:gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-2 sm:px-3 py-1 sm:py-2">
                    <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                      <AvatarImage src="/placeholder-avatar.jpg" />
                      <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xs sm:text-sm font-medium">
                        {user.name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 sm:w-56">
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
        </header>

        {/* Responsive Page Content */}
        <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen">
          {/* Responsive Page Title Section */}
          <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
            <div className="px-3 sm:px-6 py-4 sm:py-6 lg:py-8">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                  {getViewTitle(currentView)}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {getViewDescription(currentView)}
                </p>
              </div>
            </div>
          </div>

          {/* Responsive Main Content */}
          <div className="p-3 sm:p-4 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
              {currentView === "dashboard" && (
                <>
                  {/* Analytics Section */}
                  <AdminDashboardCards />

                  {/* Responsive Client Management Table */}
                  <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
                    <CardHeader className="border-b border-gray-100 dark:border-gray-800 p-4 sm:p-6">
                      <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="hidden sm:inline">Client Management</span>
                        <span className="sm:hidden">Clients</span>
                      </CardTitle>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 text-sm border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700"
                          />
                        </div>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "suspended")}
                          className="px-4 py-2 w-full sm:w-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value="all">All Status</option>
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th className="py-3 px-3 sm:px-4 lg:px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort("name")}>
                                Client Name {sortColumn === "name" && (sortDirection === "asc" ? "▲" : "▼")}
                              </th>
                              <th className="hidden md:table-cell py-3 px-3 sm:px-4 lg:px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                              <th className="hidden lg:table-cell py-3 px-3 sm:px-4 lg:px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort("applianceModel")}>
                                Product {sortColumn === "applianceModel" && (sortDirection === "asc" ? "▲" : "▼")}
                              </th>
                              <th className="hidden sm:table-cell py-3 px-3 sm:px-4 lg:px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment Plan</th>
                              <th className="py-3 px-3 sm:px-4 lg:px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort("status")}>
                                Status {sortColumn === "status" && (sortDirection === "asc" ? "▲" : "▼")}
                              </th>
                              <th className="py-3 px-3 sm:px-4 lg:px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredAndSortedClients.map((client) => (
                              <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <td className="py-3 px-3 sm:px-4 lg:px-6">
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm">
                                      {client.name.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{client.name}</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400 md:hidden">{client.phone}</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400 lg:hidden">{client.applianceModel}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="hidden md:table-cell py-3 px-3 sm:px-4 lg:px-6 text-sm text-gray-700 dark:text-gray-300">{client.phone}</td>
                                <td className="hidden lg:table-cell py-3 px-3 sm:px-4 lg:px-6 text-sm text-gray-700 dark:text-gray-300">{client.applianceModel}</td>
                                <td className="hidden sm:table-cell py-3 px-3 sm:px-4 lg:px-6 text-sm text-gray-700 dark:text-gray-300">
                                  {client.paymentPlan === "weekly" && `$${client.weeklyInstallment}/week`}
                                  {client.paymentPlan === "monthly" && `$${client.monthlyInstallment}/month`}
                                </td>
                                <td className="py-3 px-3 sm:px-4 lg:px-6">
                                  <Badge
                                    className={
                                      client.status === "active" 
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                                        : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                    }
                                  >
                                    {client.status}
                                  </Badge>
                                </td>
                                <td className="py-3 px-3 sm:px-4 lg:px-6">
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400 p-1.5 sm:p-2">
                                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className={`p-1.5 sm:p-2 ${
                                        client.status === "active"
                                          ? "hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400"
                                          : "hover:bg-green-50 dark:hover:bg-green-950/20 text-green-600 dark:text-green-400"
                                      }`}
                                      onClick={() => handleToggleAppliance(client.id, client.status)}
                                    >
                                      {client.status === "active" ? <PowerOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Power className="h-3 w-3 sm:h-4 sm:w-4" />}
                                    </Button>
                                    <Button size="sm" variant="ghost" className="hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 p-1.5 sm:p-2">
                                      <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="px-3 sm:px-4 lg:px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Showing {filteredAndSortedClients.length} clients
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Responsive Quick Actions */}
                  <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Button 
                          className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-sm"
                          onClick={() => setIsAddClientModalOpen(true)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Add New Client
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-sm"
                          onClick={() => setIsRegisterApplianceModalOpen(true)}
                        >
                          <Refrigerator className="h-4 w-4 mr-2" />
                          Register Appliance
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-sm"
                          onClick={() => setIsGenerateReportModalOpen(true)}
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Generate Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
              {currentView === "units" && <UnitsFreezersTable />}
              {currentView === "locations" && <LocationsTable />}
              {currentView === "bulk-sms" && <BulkSmsSection />}
              {currentView === "email-marketing" && <EmailMarketingSection />}
              {currentView === "settings" && <SettingsSection />}
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Modal Components */}
      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
      />
      <RegisterApplianceModal
        isOpen={isRegisterApplianceModalOpen}
        onClose={() => setIsRegisterApplianceModalOpen(false)}
      />
      <GenerateReportModal
        isOpen={isGenerateReportModalOpen}
        onClose={() => setIsGenerateReportModalOpen(false)}
      />
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        userType="admin"
      />
      <PreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        userType="admin"
      />
    </SidebarProvider>
  )
}
