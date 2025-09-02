"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { 
  Refrigerator,
  Play,
  Square,
  Search,
  Activity,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Settings,
  BarChart3,
  Zap,
  Timer,
  Calendar,
  Phone,
  User,
  Package
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  deviceManagementApi, 
  type DeviceOverview, 
  type DeviceStatus,
  type MqttConnectionStatus,
  mqttUtils 
} from "@/lib/mqtt-api"
import { AddDeviceForm } from "@/components/add-device-form"

interface DeviceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'start' | 'stop' | null;
  onConfirm: (deviceId: string, options: any) => void;
}

interface DeviceStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string | null;
  deviceStatus: DeviceStatus | null;
  isLoading: boolean;
}

export function DeviceManagementDashboard() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [overview, setOverview] = useState<DeviceOverview | null>(null)
  const [mqttStatus, setMqttStatus] = useState<MqttConnectionStatus | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  
  // Modal states
  const [controlModal, setControlModal] = useState<DeviceControlModalProps>({
    isOpen: false,
    onClose: () => setControlModal(prev => ({ ...prev, isOpen: false })),
    action: null,
    onConfirm: handleDeviceControl
  })
  
  const [statusModal, setStatusModal] = useState<DeviceStatusModalProps>({
    isOpen: false,
    onClose: () => setStatusModal(prev => ({ ...prev, isOpen: false })),
    deviceId: null,
    deviceStatus: null,
    isLoading: false
  })

  // Load device overview on component mount
  useEffect(() => {
    loadDeviceOverview()
    
    // Set up periodic refresh
    const interval = setInterval(loadDeviceOverview, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadDeviceOverview = async () => {
    if (!isLoading) setIsLoading(true)
    try {
      const response = await deviceManagementApi.getOverview()
      
      if (response.success) {
        setOverview(response.overview)
        setMqttStatus(response.mqtt_status)
      }
    } catch (error) {
      console.error('Failed to load device overview:', error)
      toast({
        title: "Load Error",
        description: "Failed to load device overview",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeviceControl(deviceId: string, options: any) {
    setIsLoading(true)
    try {
      let response;
      
      if (controlModal.action === 'start') {
        response = await deviceManagementApi.startDevice(
          deviceId, 
          options.duration, 
          options.reason
        )
      } else if (controlModal.action === 'stop') {
        response = await deviceManagementApi.stopDevice(
          deviceId, 
          options.reason
        )
      }
      
      if (response?.success) {
        toast({
          title: `Device ${controlModal.action === 'start' ? 'Started' : 'Stopped'}`,
          description: response.message,
        })
        
        // Refresh overview
        await loadDeviceOverview()
      }
    } catch (error) {
      console.error(`Failed to ${controlModal.action} device:`, error)
      toast({
        title: `${controlModal.action === 'start' ? 'Start' : 'Stop'} Error`,
        description: `Failed to ${controlModal.action} device`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setControlModal(prev => ({ ...prev, isOpen: false }))
    }
  }

  const handleCheckDeviceStatus = async (deviceId: string) => {
    setStatusModal(prev => ({
      ...prev,
      isOpen: true,
      deviceId,
      deviceStatus: null,
      isLoading: true
    }))
    
    try {
      const response = await deviceManagementApi.checkDeviceStatus(deviceId)
      
      if (response.success) {
        setStatusModal(prev => ({
          ...prev,
          deviceStatus: response,
          isLoading: false
        }))
      }
    } catch (error) {
      console.error('Failed to check device status:', error)
      toast({
        title: "Status Check Error",
        description: "Failed to check device status",
        variant: "destructive",
      })
      setStatusModal(prev => ({ ...prev, isLoading: false }))
    }
  }

  const renderOverviewStats = () => {
    if (!overview) return null

    const stats = [
      {
        title: "Total Devices",
        value: overview.device_stats.total,
        icon: Refrigerator,
        color: "blue"
      },
      {
        title: "Active Devices",
        value: overview.device_stats.active,
        icon: CheckCircle,
        color: "green"
      },
      {
        title: "Suspended Devices",
        value: overview.device_stats.suspended,
        icon: XCircle,
        color: "red"
      },
      {
        title: "Pending Devices",
        value: overview.device_stats.pending,
        icon: Clock,
        color: "yellow"
      },
      {
        title: "Active Subscriptions",
        value: overview.subscription_stats.active,
        icon: Activity,
        color: "green"
      },
      {
        title: "Expired Subscriptions",
        value: overview.subscription_stats.expired,
        icon: AlertTriangle,
        color: "red"
      }
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 text-${stat.color}-500`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderMqttStatus = () => {
    if (!mqttStatus) return null

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            MQTT Broker Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {mqttStatus.enabled ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">
                  {mqttStatus.enabled ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {mqttStatus.host}:{mqttStatus.port}
              </div>
              {mqttStatus.ssl_enabled && (
                <Badge variant="secondary">SSL</Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Client: {mqttStatus.client_id}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const filteredDevices = overview?.recent_devices.filter(device =>
    device.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Refrigerator className="h-6 w-6" />
            Device Management
          </h2>
          <p className="text-muted-foreground">
            Monitor and control IoT devices in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddDeviceForm onDeviceAdded={loadDeviceOverview} />
          <Button onClick={loadDeviceOverview} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* MQTT Status */}
      {renderMqttStatus()}

      {/* Overview Stats */}
      {renderOverviewStats()}

      {/* Device Control Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Device Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="device-search">Search Devices</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="device-search"
                  placeholder="Search by device ID, client name, or product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <DeviceControlModal
                trigger={
                  <Button 
                    variant="default"
                    disabled={!selectedDevice}
                    onClick={() => setControlModal(prev => ({ ...prev, isOpen: true, action: 'start' }))}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Device
                  </Button>
                }
                action="start"
                onConfirm={handleDeviceControl}
              />
              <DeviceControlModal
                trigger={
                  <Button 
                    variant="destructive"
                    disabled={!selectedDevice}
                    onClick={() => setControlModal(prev => ({ ...prev, isOpen: true, action: 'stop' }))}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop Device
                  </Button>
                }
                action="stop"
                onConfirm={handleDeviceControl}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Devices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDevices.length === 0 ? (
            <div className="text-center py-8">
              <Refrigerator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No devices found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDevices.map((device) => {
                const statusInfo = mqttUtils.formatDeviceStatus(device.status)
                const isSelected = selectedDevice === device.device_id
                
                return (
                  <div
                    key={device.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      isSelected ? 'border-primary bg-accent' : 'hover:bg-accent'
                    }`}
                    onClick={() => setSelectedDevice(device.device_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Refrigerator className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{device.device_id}</p>
                            <p className="text-sm text-muted-foreground">{device.product_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{device.client_name}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Badge 
                          variant="secondary" 
                          className={`text-${statusInfo.color}-600 bg-${statusInfo.color}-100`}
                        >
                          {statusInfo.label}
                        </Badge>
                        
                        {device.last_ping && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(device.last_ping).toLocaleString()}
                          </div>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCheckDeviceStatus(device.device_id)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Status
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device Status Modal */}
      <DeviceStatusModal
        isOpen={statusModal.isOpen}
        onClose={statusModal.onClose}
        deviceId={statusModal.deviceId}
        deviceStatus={statusModal.deviceStatus}
        isLoading={statusModal.isLoading}
      />
    </div>
  )
}

// Device Control Modal Component
function DeviceControlModal({ 
  trigger, 
  action, 
  onConfirm 
}: { 
  trigger: React.ReactNode; 
  action: 'start' | 'stop'; 
  onConfirm: (deviceId: string, options: any) => void;
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [deviceId, setDeviceId] = useState("")
  const [duration, setDuration] = useState("P1M")
  const [reason, setReason] = useState("")

  const handleSubmit = () => {
    if (!deviceId.trim()) return
    
    const options = action === 'start' 
      ? { duration, reason: reason || 'manual_activation' }
      : { reason: reason || 'manual_stop' }
    
    onConfirm(deviceId, options)
    setIsOpen(false)
    setDeviceId("")
    setDuration("P1M")
    setReason("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === 'start' ? 'Start Device' : 'Stop Device'}
          </DialogTitle>
          <DialogDescription>
            {action === 'start' 
              ? 'Manually activate a device and set subscription duration'
              : 'Manually suspend a device with reason'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="device-id">Device ID</Label>
            <Input
              id="device-id"
              placeholder="Enter device ID (e.g., KY123456)"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
            />
          </div>
          
          {action === 'start' && (
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mqttUtils.getDurationOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div>
            <Label htmlFor="reason">Reason (Optional)</Label>
            {action === 'stop' ? (
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {mqttUtils.getStopReasons().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="reason"
                placeholder="Enter reason for activation"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!deviceId.trim()}
              variant={action === 'start' ? 'default' : 'destructive'}
            >
              {action === 'start' ? 'Start Device' : 'Stop Device'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Device Status Modal Component  
function DeviceStatusModal({ 
  isOpen, 
  onClose, 
  deviceId, 
  deviceStatus, 
  isLoading 
}: DeviceStatusModalProps) {
  if (!deviceId) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Device Status: {deviceId}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading device status...</span>
          </div>
        ) : deviceStatus ? (
          <div className="space-y-6">
            {/* Device Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Device Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Device ID</Label>
                    <p className="font-mono">{deviceStatus.device.device_id}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {mqttUtils.formatDeviceStatus(deviceStatus.device.status).label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Client</Label>
                    <p>{deviceStatus.device.client_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Product</Label>
                    <p>{deviceStatus.device.product_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Last Ping</Label>
                    <p className="text-sm">
                      {deviceStatus.device.last_ping 
                        ? new Date(deviceStatus.device.last_ping).toLocaleString()
                        : 'Never'
                      }
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Created</Label>
                    <p className="text-sm">
                      {new Date(deviceStatus.device.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Information */}
            {deviceStatus.subscription ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Subscription Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Status</Label>
                      <Badge variant="secondary">
                        {mqttUtils.formatSubscriptionStatus(deviceStatus.subscription.status).label}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Type</Label>
                      <p>{deviceStatus.subscription.subscription_type}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Start Date</Label>
                      <p className="text-sm">
                        {new Date(deviceStatus.subscription.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">End Date</Label>
                      <p className="text-sm">
                        {new Date(deviceStatus.subscription.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Days Remaining</Label>
                      <p className="text-sm font-medium">
                        {deviceStatus.subscription.days_remaining > 0 
                          ? `${deviceStatus.subscription.days_remaining} days`
                          : 'Expired'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No Active Subscription</AlertTitle>
                <AlertDescription>
                  This device does not have an active subscription.
                </AlertDescription>
              </Alert>
            )}

            {/* MQTT Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">MQTT Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {deviceStatus.mqtt_status.status === 'status_check_sent' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span>{deviceStatus.mqtt_status.status.replace('_', ' ')}</span>
                </div>
                {deviceStatus.mqtt_status.message && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {deviceStatus.mqtt_status.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load device status information.
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  )
} 