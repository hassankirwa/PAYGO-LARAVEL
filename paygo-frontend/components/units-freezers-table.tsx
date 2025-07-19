"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Power, PowerOff, Refrigerator, Search, Filter, Thermometer, Battery } from "lucide-react"
import { appliances } from "@/lib/appliances"
import { AnalyticsCard } from "./analytics-card"
import { useToast } from "@/hooks/use-toast"

export function UnitsFreezersTable() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Calculate stats
  const totalUnits = appliances.length
  const activeUnits = appliances.filter((app) => app.status === "active").length
  const offlineUnits = appliances.filter((app) => app.status === "offline").length
  const maintenanceUnits = appliances.filter((app) => app.status === "maintenance").length

  const filteredAndSortedAppliances = appliances
    .filter((appliance) => {
      const matchesSearch =
        appliance.unitId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appliance.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appliance.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appliance.location.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterStatus === "all" || appliance.status === filterStatus
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

  const handleToggleUnit = (unitId: string, currentStatus: string) => {
    const action = currentStatus === "active" ? "turn off" : "turn on"
    if (confirm(`Are you sure you want to ${action} unit ${unitId}?`)) {
      toast({
      title: `Unit ${action === "turn off" ? "Turned Off" : "Turned On"}! 🔌`,
      description: `Unit ${unitId} ${action === "turn off" ? "turned off" : "turned on"} successfully!`,
      variant: "default",
    })
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "offline":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "maintenance":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getBatteryStatus = (voltage: string) => {
    const numVoltage = parseFloat(voltage.replace('V', ''))
    if (numVoltage >= 12) return { color: "text-green-600 dark:text-green-400", status: "Good" }
    if (numVoltage >= 11) return { color: "text-yellow-600 dark:text-yellow-400", status: "Low" }
    return { color: "text-red-600 dark:text-red-400", status: "Critical" }
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Enhanced Appliance Stats - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <AnalyticsCard
          title="Active Units"
          value={activeUnits.toLocaleString()}
          description="Currently operational"
          icon={Power}
          gradient="from-green-500 to-green-700"
          trend={{ value: "+5", type: "up" }}
        />
        <AnalyticsCard
          title="Offline Units"
          value={offlineUnits.toLocaleString()}
          description="Not responding"
          icon={PowerOff}
          gradient="from-red-500 to-red-700"
        />
        <AnalyticsCard
          title="Maintenance"
          value={maintenanceUnits.toLocaleString()}
          description="Under service"
          icon={Refrigerator}
          gradient="from-orange-500 to-orange-700"
        />
        <AnalyticsCard
          title="Total Units"
          value={totalUnits.toLocaleString()}
          description="All registered units"
          icon={Refrigerator}
          gradient="from-blue-500 to-blue-700"
          trend={{ value: "+12", type: "up" }}
        />
      </div>

      {/* Responsive Units/Freezers Table */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
        <CardHeader className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                Units & Freezers Management
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Monitor and control your appliance inventory
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search units..."
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
                <option value="offline">Offline</option>
                <option value="maintenance">Maintenance</option>
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
                  <th className="py-3 px-4 lg:px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort("unitId")}>
                    <div className="flex items-center gap-2">
                      <Refrigerator className="h-4 w-4" />
                      Unit ID
                    </div>
                  </th>
                  <th className="py-3 px-4 lg:px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort("model")}>
                    Model
                  </th>
                  <th className="py-3 px-4 lg:px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort("clientName")}>
                    Client
                  </th>
                  <th className="py-3 px-4 lg:px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort("location")}>
                    Location
                  </th>
                  <th className="py-3 px-4 lg:px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4" />
                      Temperature
                    </div>
                  </th>
                  <th className="py-3 px-4 lg:px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Battery className="h-4 w-4" />
                      Battery
                    </div>
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
                {filteredAndSortedAppliances.map((appliance) => {
                  const batteryStatus = getBatteryStatus(appliance.batteryVoltage)
                  return (
                    <tr key={appliance.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="py-3 px-4 lg:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                            {appliance.unitId.split('-')[1] || 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{appliance.unitId}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{appliance.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 lg:px-6 text-sm text-gray-900 dark:text-gray-100">{appliance.model}</td>
                      <td className="py-3 px-4 lg:px-6 text-sm text-gray-900 dark:text-gray-100">{appliance.clientName}</td>
                      <td className="py-3 px-4 lg:px-6 text-sm text-gray-900 dark:text-gray-100">{appliance.location}</td>
                      <td className="py-3 px-4 lg:px-6">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{appliance.temperature}</span>
                      </td>
                      <td className="py-3 px-4 lg:px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{appliance.batteryVoltage}</span>
                          <span className={`text-xs font-medium ${batteryStatus.color}`}>({batteryStatus.status})</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 lg:px-6">
                        <Badge className={getStatusBadgeClass(appliance.status)}>
                          {appliance.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 lg:px-6">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`p-2 ${
                              appliance.status === "active"
                                ? "hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400"
                                : "hover:bg-green-50 dark:hover:bg-green-950/20 text-green-600 dark:text-green-400"
                            }`}
                            onClick={() => handleToggleUnit(appliance.unitId, appliance.status)}
                          >
                            {appliance.status === "active" ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedAppliances.map((appliance) => {
              const batteryStatus = getBatteryStatus(appliance.batteryVoltage)
              return (
                <div key={appliance.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                        {appliance.unitId.split('-')[1] || 'U'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{appliance.unitId}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{appliance.model}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{appliance.clientName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusBadgeClass(appliance.status)}>
                        {appliance.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`p-2 ${
                          appliance.status === "active"
                            ? "hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400"
                            : "hover:bg-green-50 dark:hover:bg-green-950/20 text-green-600 dark:text-green-400"
                        }`}
                        onClick={() => handleToggleUnit(appliance.unitId, appliance.status)}
                      >
                        {appliance.status === "active" ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Location: </span>
                      <span className="text-gray-900 dark:text-gray-100">{appliance.location}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Temperature: </span>
                      <span className="text-gray-900 dark:text-gray-100">{appliance.temperature}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">Battery: </span>
                      <span className="text-gray-900 dark:text-gray-100">{appliance.batteryVoltage}</span>
                      <span className={`ml-1 ${batteryStatus.color}`}>({batteryStatus.status})</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Last ping: {appliance.lastPing}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-3 sm:px-4 lg:px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredAndSortedAppliances.length} units
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
