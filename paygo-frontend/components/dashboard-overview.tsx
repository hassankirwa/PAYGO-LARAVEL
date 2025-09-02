"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, Refrigerator, DollarSign, Search, Power, PowerOff, Eye, Settings, CalendarCheck, TrendingUp, Activity, AlertTriangle } from "lucide-react"
import { clients } from "@/lib/clients"
import { appliances } from "@/lib/appliances"
import { AnalyticsCard } from "./analytics-card"
import { AddClientModal } from "@/components/add-client-modal"
import { RegisterApplianceModal } from "@/components/register-appliance-modal"
import GenerateReportModal from "@/components/generate-report-modal"
import { useToast } from "@/hooks/use-toast"

// Enhanced admin stats with more detailed metrics
const adminStats = {
  totalClients: clients.length,
  activeAppliances: appliances.filter((app) => app.status === "active").length,
  monthlyRevenue: 45680,
  renewalsDue: 15,
  totalRevenue: 245680,
  avgMonthlyGrowth: 12.5,
}

export function DashboardOverview() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Modal states
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false)
  const [isRegisterApplianceModalOpen, setIsRegisterApplianceModalOpen] = useState(false)
  const [isGenerateReportModalOpen, setIsGenerateReportModalOpen] = useState(false)

  const handleToggleAppliance = (clientId: number, currentStatus: string) => {
    const action = currentStatus === "active" ? "suspend" : "activate"
    if (confirm(`Are you sure you want to ${action} this appliance?`)) {
      toast({
        title: `Appliance ${action.charAt(0).toUpperCase() + action.slice(1)}! 🔌`,
        description: `Appliance ${action}d successfully!`,
        variant: "default",
      })
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

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Enhanced Stats Overview - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <AnalyticsCard
          title="Total Clients"
          value={adminStats.totalClients.toLocaleString()}
          description="Active registered users"
          icon={Users}
          gradient="from-blue-500 to-blue-700"
          trend={{ value: "+15", type: "up" }}
        />
        <AnalyticsCard
          title="Active Units"
          value={adminStats.activeAppliances.toLocaleString()}
          description="Appliances currently online"
          icon={Refrigerator}
          gradient="from-emerald-500 to-emerald-700"
        />
        <AnalyticsCard
          title="Monthly Revenue"
          value={`$${adminStats.monthlyRevenue.toLocaleString()}`}
          description="Revenue this month"
          icon={DollarSign}
          gradient="from-green-500 to-green-700"
          trend={{ value: "+8.2", type: "up" }}
        />
        <AnalyticsCard
          title="Renewals Due"
          value={adminStats.renewalsDue.toLocaleString()}
          description="Payments requiring attention"
          icon={CalendarCheck}
          gradient="from-purple-500 to-purple-700"
          trend={{ value: "-3", type: "down" }}
        />
      </div>

      {/* Secondary Metrics - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  ${adminStats.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All-time earnings</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Growth Rate</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {adminStats.avgMonthlyGrowth.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Monthly average</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Issues</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {adminStats.renewalsDue}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Requiring attention</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Responsive Client Management Table */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
        <CardHeader className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                Client Management
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage and monitor your client accounts
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-[250px]"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="py-3 px-4 lg:px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort("name")}>
                    Client Name
                  </th>
                  <th className="py-3 px-4 lg:px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort("email")}>
                    Email
                  </th>
                  <th className="py-3 px-4 lg:px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort("applianceModel")}>
                    Appliance
                  </th>
                  <th className="py-3 px-4 lg:px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort("paymentStatus")}>
                    Payment
                  </th>
                  <th className="py-3 px-4 lg:px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort("status")}>
                    Status
                  </th>
                  <th className="py-3 px-4 lg:px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="py-3 px-4 lg:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{client.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{client.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 lg:px-6 text-sm text-gray-900 dark:text-gray-100">{client.email}</td>
                    <td className="py-3 px-4 lg:px-6 text-sm text-gray-900 dark:text-gray-100">{client.applianceModel}</td>
                    <td className="py-3 px-4 lg:px-6">
                      <Badge 
                        className={
                          client.paymentStatus === "current" 
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                            : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                        }
                      >
                        {client.paymentStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 lg:px-6">
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
                    <td className="py-3 px-4 lg:px-6">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400 p-2">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`p-2 ${
                            client.status === "active"
                              ? "hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400"
                              : "hover:bg-green-50 dark:hover:bg-green-950/20 text-green-600 dark:text-green-400"
                          }`}
                          onClick={() => handleToggleAppliance(client.id, client.status)}
                        >
                          {client.status === "active" ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                        </Button>
                        <Button size="sm" variant="ghost" className="hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 p-2">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedClients.slice(0, 10).map((client) => (
              <div key={client.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{client.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{client.email}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400 p-1.5">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`p-1.5 ${
                        client.status === "active"
                          ? "hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400"
                          : "hover:bg-green-50 dark:hover:bg-green-950/20 text-green-600 dark:text-green-400"
                      }`}
                      onClick={() => handleToggleAppliance(client.id, client.status)}
                    >
                      {client.status === "active" ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 dark:text-gray-400">{client.applianceModel}</span>
                  <div className="flex gap-2">
                    <Badge 
                      className={
                        client.paymentStatus === "current" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }
                    >
                      {client.paymentStatus}
                    </Badge>
                    <Badge
                      className={
                        client.status === "active" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }
                    >
                      {client.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
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
    </div>
  )
}
