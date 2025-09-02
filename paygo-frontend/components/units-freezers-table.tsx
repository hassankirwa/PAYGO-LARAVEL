"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Power, 
  PowerOff, 
  Refrigerator, 
  Search, 
  Thermometer, 
  Battery, 
  RefreshCw,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye
} from "lucide-react"
import { authService } from "@/lib/auth"
import { AnalyticsCard } from "./analytics-card"
import { useToast } from "@/hooks/use-toast"

interface ApplianceData {
  id: number
  unit_id: string
  serial_number: string
  device_id: string
  status: "active" | "offline" | "maintenance" | "decommissioned"
  database_status: "active" | "offline" | "maintenance" | "decommissioned"
  is_online: boolean
  client: {
    id: number | null
    name: string
    phone: string | null
  }
  product: {
    id: number | null
    name: string
    model_code: string
    capacity_litres: number | null
  }
  installation_location: string
  installation_date: string
  installation_date_formatted: string
  current_temperature: string | null
  current_battery_voltage: string | null
  last_ping: string | null
  last_ping_formatted: string | null
  last_maintenance_date: string | null
  created_at: string
  updated_at: string
}

interface PaginationData {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export function UnitsFreezersTable() {
  const { toast } = useToast()
  
  // Data state
  const [appliances, setAppliances] = useState<ApplianceData[]>([])
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortColumn, setSortColumn] = useState<string>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  
  // Action states
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({})

  // Load appliances from API
  const fetchAppliances = async (resetPage = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const page = resetPage ? 1 : currentPage
      if (resetPage) setCurrentPage(1)
      
      const response = await authService.getAppliances({
        search: searchTerm || undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
        page,
        per_page: 20,
        sort_by: sortColumn,
        sort_direction: sortDirection,
      })
      
      if (response.success) {
        setAppliances(response.data)
        setPagination(response.pagination)
      } else {
        throw new Error(response.error || "Failed to fetch appliances")
      }
    } catch (err: any) {
      setError(err.message || "Failed to load appliances")
      toast({
        title: "Error",
        description: "Failed to load appliances. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchAppliances(true)
  }, [searchTerm, filterStatus, sortColumn, sortDirection])
  
  useEffect(() => {
    if (currentPage > 1) {
      fetchAppliances()
    }
  }, [currentPage])

  // Calculate stats from loaded data
  const stats = {
    totalUnits: pagination?.total || 0,
    activeUnits: appliances.filter(app => app.status === "active").length,
    offlineUnits: appliances.filter(app => app.status === "offline").length,
    maintenanceUnits: appliances.filter(app => app.status === "maintenance").length,
    onlineUnits: appliances.filter(app => app.is_online).length,
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <AnalyticsCard
          title="Total Units"
          value={stats.totalUnits.toLocaleString()}
          description="All registered appliances"
          icon={Refrigerator}
          gradient="from-blue-500 to-blue-700"
          trend={{ value: "+0", type: "neutral" }}
        />
        <AnalyticsCard
          title="Active Units"
          value={stats.activeUnits.toLocaleString()}
          description="Currently operational"
          icon={Power}
          gradient="from-green-500 to-green-700"
          trend={{ value: "+5", type: "up" }}
        />
        <AnalyticsCard
          title="Online Units"
          value={stats.onlineUnits.toLocaleString()}
          description="Connected to network"
          icon={CheckCircle}
          gradient="from-emerald-500 to-emerald-700"
          trend={{ value: `${Math.round((stats.onlineUnits / Math.max(stats.totalUnits, 1)) * 100)}%`, type: "up" }}
        />
        <AnalyticsCard
          title="Maintenance"
          value={stats.maintenanceUnits.toLocaleString()}
          description="Units under service"
          icon={Settings}
          gradient="from-orange-500 to-orange-700"
          trend={{ value: "-2", type: "down" }}
        />
      </div>

      {/* Main Management Interface */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-xl font-bold">Units & Freezers Management</CardTitle>
            <Button
              onClick={() => fetchAppliances()}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by unit ID, serial number, or client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="decommissioned">Decommissioned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error State */}
          {error && (
            <Alert className="mb-6" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : appliances.length === 0 ? (
            /* Empty State */
            <div className="text-center p-12">
              <Refrigerator className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {searchTerm || filterStatus !== "all" ? "No units found" : "No units registered yet"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterStatus !== "all" 
                  ? "Try adjusting your search terms or filters to find units."
                  : "Start by registering your first freezer unit to begin tracking."}
              </p>
              {searchTerm || filterStatus !== "all" ? (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("")
                    setFilterStatus("all")
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Register New Unit
                </Button>
              )}
            </div>
          ) : (
            /* Data Table */
            <div className="space-y-4">
              {/* Table Header */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg font-medium text-sm text-gray-600">
                <div className="col-span-2">Unit Info</div>
                <div className="col-span-2">Client</div>
                <div className="col-span-2">Product</div>
                <div className="col-span-2">Location</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Actions</div>
              </div>

              {/* Table Rows */}
              {appliances.map((appliance) => (
                <div key={appliance.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Unit Info */}
                    <div className="col-span-1 lg:col-span-2">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Refrigerator className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900">{appliance.unit_id}</p>
                          <p className="text-sm text-gray-500">{appliance.serial_number}</p>
                          <p className="text-xs text-gray-400">{appliance.device_id}</p>
                        </div>
                      </div>
                    </div>

                    {/* Client Info */}
                    <div className="col-span-1 lg:col-span-2">
                      <div className="lg:hidden font-medium text-gray-600 mb-1">Client:</div>
                      <p className="font-medium text-gray-900">{appliance.client.name}</p>
                      {appliance.client.phone && (
                        <p className="text-sm text-gray-500">{appliance.client.phone}</p>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="col-span-1 lg:col-span-2">
                      <div className="lg:hidden font-medium text-gray-600 mb-1">Product:</div>
                      <p className="font-medium text-gray-900">{appliance.product.name}</p>
                      <p className="text-sm text-gray-500">{appliance.product.model_code}</p>
                      {appliance.product.capacity_litres && (
                        <p className="text-xs text-gray-400">{appliance.product.capacity_litres}L</p>
                      )}
                    </div>

                    {/* Location */}
                    <div className="col-span-1 lg:col-span-2">
                      <div className="lg:hidden font-medium text-gray-600 mb-1">Location:</div>
                      <p className="text-sm text-gray-900">{appliance.installation_location}</p>
                      <p className="text-xs text-gray-500">Installed: {appliance.installation_date_formatted}</p>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 lg:col-span-2">
                      <div className="lg:hidden font-medium text-gray-600 mb-1">Status:</div>
                      <div className="flex flex-col space-y-2">
                        <Badge 
                          variant={appliance.status === "active" ? "default" : 
                                  appliance.status === "offline" ? "destructive" :
                                  appliance.status === "maintenance" ? "secondary" : "outline"}
                          className="w-fit"
                        >
                          {appliance.status === "active" && <Power className="h-3 w-3 mr-1" />}
                          {appliance.status === "offline" && <PowerOff className="h-3 w-3 mr-1" />}
                          {appliance.status === "maintenance" && <Settings className="h-3 w-3 mr-1" />}
                          {appliance.status.charAt(0).toUpperCase() + appliance.status.slice(1)}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          <div className={`h-2 w-2 rounded-full ${appliance.is_online ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-xs text-gray-500">
                            {appliance.is_online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        {appliance.current_temperature && (
                          <div className="flex items-center space-x-1">
                            <Thermometer className="h-3 w-3 text-blue-500" />
                            <span className="text-xs text-gray-600">{appliance.current_temperature}°C</span>
                          </div>
                        )}
                        {appliance.current_battery_voltage && (
                          <div className="flex items-center space-x-1">
                            <Battery className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-gray-600">{appliance.current_battery_voltage}V</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 lg:col-span-2">
                      <div className="lg:hidden font-medium text-gray-600 mb-1">Actions:</div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading[appliance.id]}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant={appliance.status === "active" ? "destructive" : "default"}
                          disabled={actionLoading[appliance.id]}
                        >
                          {appliance.status === "active" ? (
                            <>
                              <PowerOff className="h-3 w-3 mr-1" />
                              Disable
                            </>
                          ) : (
                            <>
                              <Power className="h-3 w-3 mr-1" />
                              Enable
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-600">
                    Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} units
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {[...Array(Math.min(5, pagination.last_page))].map((_, i) => {
                        const page = i + 1
                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === pagination.last_page}
                      onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 