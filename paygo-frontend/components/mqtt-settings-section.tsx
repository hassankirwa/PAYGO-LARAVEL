"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Settings, 
  Save, 
  Wifi, 
  Server, 
  Shield, 
  Zap, 
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Info,
  Activity,
  Clock,
  Database,
  Globe
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { mqttConfigApi, type MqttSettings, type MqttConnectionStatus, type MqttTestResult } from "@/lib/mqtt-api"

interface MqttConfigState {
  [key: string]: string;
}

export function MqttSettingsSection() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("basic")
  const [isLoading, setIsLoading] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  
  // MQTT Configuration State
  const [mqttSettings, setMqttSettings] = useState<MqttConfigState>({})
  const [originalSettings, setOriginalSettings] = useState<MqttConfigState>({})
  const [connectionStatus, setConnectionStatus] = useState<MqttConnectionStatus | null>(null)
  const [testResult, setTestResult] = useState<MqttTestResult | null>(null)
  const [categories, setCategories] = useState<Record<string, any>>({})

  // Load MQTT settings on component mount
  useEffect(() => {
    loadMqttSettings()
  }, [])

  const loadMqttSettings = async () => {
    setIsLoading(true)
    try {
      const response = await mqttConfigApi.getConfig()
      
      if (response.success) {
        // Convert settings to simple key-value pairs
        const settingsState: MqttConfigState = {}
        const originalState: MqttConfigState = {}
        
        Object.entries(response.settings).forEach(([key, setting]) => {
          settingsState[key] = setting.actual_value
          originalState[key] = setting.actual_value
        })
        
        setMqttSettings(settingsState)
        setOriginalSettings(originalState)
        setConnectionStatus(response.connection_status)
        setCategories(response.categories)
      }
    } catch (error) {
      console.error('Failed to load MQTT settings:', error)
      toast({
        title: "Load Error",
        description: "Failed to load MQTT settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSettingChange = (key: string, value: string) => {
    setMqttSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      // Only send changed settings
      const changedSettings = Object.entries(mqttSettings)
        .filter(([key, value]) => value !== originalSettings[key])
        .map(([key, value]) => ({ key, value }))

      if (changedSettings.length === 0) {
        toast({
          title: "No Changes",
          description: "No settings have been modified",
        })
        setIsLoading(false)
        return
      }

      const response = await mqttConfigApi.updateConfig(changedSettings)
      
      if (response.success) {
        setOriginalSettings({ ...mqttSettings })
        toast({
          title: "Settings Saved",
          description: `Updated ${changedSettings.length} MQTT settings successfully`,
        })
        
        // Reload to get updated status
        await loadMqttSettings()
      }
    } catch (error) {
      console.error('Failed to save MQTT settings:', error)
      toast({
        title: "Save Error",
        description: "Failed to save MQTT settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    setTestResult(null)
    
    try {
      const response = await mqttConfigApi.testConnection()
      setTestResult(response.test_result)
      
      if (response.test_result.success) {
        toast({
          title: "Connection Test Successful",
          description: "MQTT broker connection is working properly",
        })
      } else {
        toast({
          title: "Connection Test Failed",
          description: response.test_result.error || "Failed to connect to MQTT broker",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('MQTT connection test failed:', error)
      toast({
        title: "Test Error",
        description: "Failed to test MQTT connection",
        variant: "destructive",
      })
    } finally {
      setTestingConnection(false)
    }
  }

  const hasUnsavedChanges = () => {
    return Object.keys(mqttSettings).some(key => 
      mqttSettings[key] !== originalSettings[key]
    )
  }

  const renderConnectionStatus = () => {
    if (!connectionStatus) return null

    const statusColor = connectionStatus.enabled ? 'green' : 'gray'
    const StatusIcon = connectionStatus.enabled ? CheckCircle : XCircle

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            MQTT Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-4 w-4 text-${statusColor}-500`} />
              <span className="text-sm">
                {connectionStatus.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Host: </span>
              <span className="font-mono">{connectionStatus.host}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Port: </span>
              <span className="font-mono">{connectionStatus.port}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">SSL: </span>
              <Badge variant={connectionStatus.ssl_enabled ? "default" : "secondary"}>
                {connectionStatus.ssl_enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
          
          {testResult && (
            <div className="mt-4">
              <Alert className={testResult.success ? "border-green-200" : "border-red-200"}>
                <TestTube className="h-4 w-4" />
                <AlertTitle>Connection Test Result</AlertTitle>
                <AlertDescription>
                  {testResult.success ? (
                    <span className="text-green-600">
                      Successfully connected to MQTT broker at {testResult.config.host}:{testResult.config.port}
                    </span>
                  ) : (
                    <span className="text-red-600">
                      {testResult.error || 'Failed to connect to MQTT broker'}
                    </span>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    Tested at: {new Date(testResult.timestamp).toLocaleString()}
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderSettingInput = (key: string, label: string, description: string, isEncrypted = false) => {
    const value = mqttSettings[key] || ''
    const isPassword = isEncrypted || key.includes('password') || key.includes('secret') || key.includes('key')
    
    return (
      <div className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {label}
          {isEncrypted && <Shield className="inline h-3 w-3 ml-1" />}
        </Label>
        <div className="relative">
          <Input
            id={key}
            type={isPassword && !showPasswords ? "password" : "text"}
            value={value}
            onChange={(e) => handleSettingChange(key, e.target.value)}
            placeholder={description}
            className="pr-10"
          />
          {isPassword && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPasswords(!showPasswords)}
            >
              {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    )
  }

  const renderBooleanSetting = (key: string, label: string, description: string) => {
    const value = mqttSettings[key] === 'true' || mqttSettings[key] === '1'
    
    return (
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor={key} className="text-sm font-medium">
            {label}
          </Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Switch
          id={key}
          checked={value}
          onCheckedChange={(checked) => handleSettingChange(key, checked ? 'true' : 'false')}
        />
      </div>
    )
  }

  const renderSelectSetting = (key: string, label: string, description: string, options: Array<{value: string, label: string}>) => {
    const value = mqttSettings[key] || ''
    
    return (
      <div className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {label}
        </Label>
        <Select value={value} onValueChange={(value) => handleSettingChange(key, value)}>
          <SelectTrigger>
            <SelectValue placeholder={description} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    )
  }

  if (isLoading && !connectionStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading MQTT settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wifi className="h-6 w-6" />
            MQTT & IoT Settings
          </h2>
          <p className="text-muted-foreground">
            Configure MQTT broker connection and IoT device management
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={testingConnection}
          >
            {testingConnection ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <TestTube className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>
          <Button 
            onClick={handleSaveSettings}
            disabled={isLoading || !hasUnsavedChanges()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      {renderConnectionStatus()}

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges() && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unsaved Changes</AlertTitle>
          <AlertDescription>
            You have unsaved changes. Click "Save Settings" to apply them.
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>

        {/* Basic Configuration */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Basic MQTT Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderBooleanSetting('is_enabled', 'Enable MQTT', 'Enable/disable MQTT functionality for IoT device control')}
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSettingInput('host', 'MQTT Broker Host', 'MQTT broker hostname or IP address')}
                {renderSettingInput('port', 'MQTT Broker Port', 'MQTT broker port (1883 for non-SSL, 8883 for SSL)')}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSettingInput('username', 'Username', 'MQTT broker username (leave empty if no authentication)')}
                {renderSettingInput('password', 'Password', 'MQTT broker password', true)}
              </div>
              
              {renderBooleanSetting('use_ssl', 'Use SSL/TLS', 'Use SSL/TLS encryption for MQTT connection')}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Configuration */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced MQTT Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSettingInput('client_id', 'Client ID', 'MQTT client identifier for the PayGo platform')}
                {renderSettingInput('topic_prefix', 'Topic Prefix', 'Base topic prefix for all device communication')}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderSettingInput('keep_alive', 'Keep Alive (seconds)', 'MQTT keep-alive interval in seconds')}
                {renderBooleanSetting('clean_session', 'Clean Session', 'Use clean session for MQTT connection')}
                {renderSelectSetting('qos_level', 'QoS Level', 'Quality of Service level', [
                  { value: '0', label: 'QoS 0 (At most once)' },
                  { value: '1', label: 'QoS 1 (At least once)' },
                  { value: '2', label: 'QoS 2 (Exactly once)' },
                ])}
              </div>
              
              {renderBooleanSetting('retain_messages', 'Retain Messages', 'Retain messages on MQTT broker')}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                HTTP Bridge (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderBooleanSetting('http_bridge_enabled', 'Enable HTTP Bridge', 'Enable HTTP bridge for MQTT publishing')}
              {renderSettingInput('http_bridge_url', 'HTTP Bridge URL', 'HTTP bridge URL for MQTT publishing (optional)')}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topics Configuration */}
        <TabsContent value="topics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                MQTT Topic Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderSettingInput('control_topic_suffix', 'Control Topic Suffix', 'Topic suffix for device control commands')}
                {renderSettingInput('status_topic_suffix', 'Status Topic Suffix', 'Topic suffix for device status updates')}
                {renderSettingInput('telemetry_topic_suffix', 'Telemetry Topic Suffix', 'Topic suffix for device telemetry data')}
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Topic Structure</AlertTitle>
                <AlertDescription>
                  Topics will be structured as: <code>{mqttSettings.topic_prefix || 'koyo/devices'}/[device_id]{mqttSettings.control_topic_suffix || '/control'}</code>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Configuration */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance & Timeouts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderSettingInput('connection_timeout', 'Connection Timeout (seconds)', 'Connection timeout in seconds')}
                {renderSettingInput('publish_timeout', 'Publish Timeout (seconds)', 'Message publish timeout in seconds')}
                {renderSettingInput('retry_attempts', 'Retry Attempts', 'Number of retry attempts for failed operations')}
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSettingInput('max_concurrent_connections', 'Max Concurrent Connections', 'Maximum concurrent MQTT connections')}
                {renderSettingInput('message_queue_size', 'Message Queue Size', 'Maximum message queue size')}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Configuration */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Monitoring & Logging
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderBooleanSetting('enable_debug_logging', 'Enable Debug Logging', 'Enable detailed MQTT debug logging')}
              
              {renderSelectSetting('log_level', 'Log Level', 'MQTT logging level', [
                { value: 'debug', label: 'Debug' },
                { value: 'info', label: 'Info' },
                { value: 'warning', label: 'Warning' },
                { value: 'error', label: 'Error' },
              ])}
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSettingInput('device_heartbeat_interval', 'Device Heartbeat Interval (seconds)', 'Expected device heartbeat interval in seconds')}
                {renderSettingInput('device_offline_threshold', 'Device Offline Threshold (seconds)', 'Time in seconds before marking device as offline')}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Configuration */}
        <TabsContent value="emergency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Emergency & Safety
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderSettingInput('emergency_stop_topic', 'Emergency Stop Topic', 'Emergency stop topic for all devices')}
              {renderSettingInput('maintenance_mode_topic', 'Maintenance Mode Topic', 'Maintenance mode topic for system-wide maintenance')}
              
              <Alert className="border-orange-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Emergency Controls</AlertTitle>
                <AlertDescription>
                  These topics can be used to send emergency stop or maintenance mode commands to all devices simultaneously.
                  Use with caution as this will affect all connected devices.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 