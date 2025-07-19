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
import { 
  Settings, 
  Save, 
  CreditCard, 
  Smartphone, 
  Refrigerator, 
  Bell, 
  Shield, 
  BarChart3, 
  Zap, 
  DollarSign,
  Users,
  Mail,
  MessageSquare,
  Key,
  Database,
  Globe,
  Building2,
  Phone,
  AlertTriangle,
  CheckCircle,
  Copy,
  Eye,
  EyeOff
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SettingsSection() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("payment")
  const [showApiKeys, setShowApiKeys] = useState(false)
  const [showMpesaKeys, setShowMpesaKeys] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)

  // M-Pesa Settings State
  const [mpesaSettings, setMpesaSettings] = useState({
    environment: "sandbox",
    shortcode: "174379",
    consumer_key: "",
    consumer_secret: "",
    passkey: "",
    callback_url: "",
  })

  // Load M-Pesa settings on component mount
  useEffect(() => {
    loadMpesaSettings()
  }, [])

  const loadMpesaSettings = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) return

      const response = await fetch('/api/admin/settings/mpesa/config', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMpesaSettings(prev => ({
            ...prev,
            ...data.data
          }))
        }
      }
    } catch (error) {
      console.log('Failed to load M-Pesa settings:', error)
    }
  }

  const handleSaveMpesaSettings = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive",
        })
        return
      }

      const response = await fetch('/api/admin/settings/mpesa/config', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mpesaSettings),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "M-Pesa Settings Saved! ✅",
          description: `M-Pesa configuration updated for ${mpesaSettings.environment} environment`,
          variant: "default",
        })
      } else {
        throw new Error(data.error || 'Failed to save settings')
      }
    } catch (error) {
      toast({
        title: "Save Failed ❌",
        description: error instanceof Error ? error.message : "Failed to save M-Pesa settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestMpesaConnection = async () => {
    setTestingConnection(true)
    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive",
        })
        return
      }

      const response = await fetch('/api/admin/settings/mpesa/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Connection Successful! 🎉",
          description: `M-Pesa API connection verified for ${data.data.environment} environment`,
          variant: "default",
        })
      } else {
        throw new Error(data.error || data.details || 'Connection test failed')
      }
    } catch (error) {
      toast({
        title: "Connection Failed ❌",
        description: error instanceof Error ? error.message : "Failed to connect to M-Pesa API",
        variant: "destructive",
      })
    } finally {
      setTestingConnection(false)
    }
  }

  const handleSaveSettings = (category: string) => {
    if (category === "M-Pesa") {
      handleSaveMpesaSettings()
    } else {
      toast({
        title: "Settings Saved! ⚙️",
        description: `${category} settings saved successfully!`,
        variant: "default",
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied! 📋",
      description: "Copied to clipboard!",
      variant: "default",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Settings</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Configure your platform settings and integrations</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <Settings className="h-4 w-4 mr-1" />
          System Configuration
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <TabsTrigger value="payment" className="flex items-center gap-1 text-xs">
            <CreditCard className="h-3 w-3" />
            <span className="hidden sm:inline">Payment</span>
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-1 text-xs">
            <Refrigerator className="h-3 w-3" />
            <span className="hidden sm:inline">Devices</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-1 text-xs">
            <Settings className="h-3 w-3" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center gap-1 text-xs">
            <MessageSquare className="h-3 w-3" />
            <span className="hidden sm:inline">Comms</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1 text-xs">
            <Shield className="h-3 w-3" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1 text-xs">
            <BarChart3 className="h-3 w-3" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-1 text-xs">
            <Zap className="h-3 w-3" />
            <span className="hidden sm:inline">API</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-1 text-xs">
            <DollarSign className="h-3 w-3" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
        </TabsList>

        {/* Payment Gateway Settings */}
        <TabsContent value="payment" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* M-Pesa Configuration */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Smartphone className="h-5 w-5" />
                  M-Pesa API Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="mpesa-env">Environment</Label>
                    <Select 
                      value={mpesaSettings.environment} 
                      onValueChange={(value) => setMpesaSettings(prev => ({ ...prev, environment: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="mpesa-shortcode">Business Shortcode</Label>
                    <Input 
                      id="mpesa-shortcode" 
                      value={mpesaSettings.shortcode}
                      onChange={(e) => setMpesaSettings(prev => ({ ...prev, shortcode: e.target.value }))}
                      placeholder="174379"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mpesa-consumer-key">Consumer Key</Label>
                    <div className="relative">
                      <Input 
                        id="mpesa-consumer-key" 
                        type={showMpesaKeys ? "text" : "password"}
                        value={mpesaSettings.consumer_key}
                        onChange={(e) => setMpesaSettings(prev => ({ ...prev, consumer_key: e.target.value }))}
                        placeholder="Enter your M-Pesa consumer key"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowMpesaKeys(!showMpesaKeys)}
                      >
                        {showMpesaKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="mpesa-consumer-secret">Consumer Secret</Label>
                    <div className="relative">
                      <Input 
                        id="mpesa-consumer-secret" 
                        type={showMpesaKeys ? "text" : "password"}
                        value={mpesaSettings.consumer_secret}
                        onChange={(e) => setMpesaSettings(prev => ({ ...prev, consumer_secret: e.target.value }))}
                        placeholder="Enter your M-Pesa consumer secret"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="mpesa-passkey">STK Push Passkey</Label>
                    <Input 
                      id="mpesa-passkey" 
                      type="password" 
                      value={mpesaSettings.passkey}
                      onChange={(e) => setMpesaSettings(prev => ({ ...prev, passkey: e.target.value }))}
                      placeholder="Enter your STK Push passkey"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mpesa-callback">Callback URL</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="mpesa-callback" 
                        value={mpesaSettings.callback_url}
                        onChange={(e) => setMpesaSettings(prev => ({ ...prev, callback_url: e.target.value }))}
                        placeholder="https://yourapp.com/api/mpesa/stk-callback"
                      />
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(mpesaSettings.callback_url || "https://yourapp.com/api/mpesa/stk-callback")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleSaveSettings("M-Pesa")} 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Saving..." : "Save M-Pesa Settings"}
                  </Button>
                  <Button 
                    onClick={handleTestMpesaConnection}
                    variant="outline"
                    disabled={testingConnection || !mpesaSettings.consumer_key || !mpesaSettings.consumer_secret}
                  >
                    {testingConnection ? "Testing..." : "Test Connection"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pesapal Bank Configuration */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <CreditCard className="h-5 w-5" />
                  Pesapal Bank Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="pesapal-env">Environment</Label>
                    <Select defaultValue="demo">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="demo">Demo</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="pesapal-consumer-key">Consumer Key</Label>
                    <Input id="pesapal-consumer-key" type="password" defaultValue="xxxxxxxxxxxxxxxxxxxxx" />
                  </div>
                  <div>
                    <Label htmlFor="pesapal-consumer-secret">Consumer Secret</Label>
                    <Input id="pesapal-consumer-secret" type="password" defaultValue="xxxxxxxxxxxxxxxxxxxxx" />
                  </div>
                  <div>
                    <Label htmlFor="pesapal-ipn">IPN URL</Label>
                    <div className="flex gap-2">
                      <Input id="pesapal-ipn" defaultValue="https://yourapp.com/pesapal/ipn" />
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard("https://yourapp.com/pesapal/ipn")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="pesapal-callback">Callback URL</Label>
                    <Input id="pesapal-callback" defaultValue="https://yourapp.com/pesapal/callback" />
                  </div>
                </div>
                <Button onClick={() => handleSaveSettings("Pesapal")} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Pesapal Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Payment Configuration */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gray-600" />
                Payment Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="default-currency">Default Currency</Label>
                  <Select defaultValue="KES">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">KES (Kenyan Shilling)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="payment-reminder-days">Payment Reminder (Days Before)</Label>
                  <Input id="payment-reminder-days" type="number" defaultValue="3" />
                </div>
                <div>
                  <Label htmlFor="grace-period">Grace Period (Days)</Label>
                  <Input id="grace-period" type="number" defaultValue="5" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="auto-suspend" defaultChecked />
                <Label htmlFor="auto-suspend">Auto-suspend devices for overdue payments</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="payment-confirmations" defaultChecked />
                <Label htmlFor="payment-confirmations">Send payment confirmation SMS</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Device Management */}
        <TabsContent value="devices" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Device Registration */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                  <Refrigerator className="h-5 w-5" />
                  Device Registration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="device-serial">Serial Number</Label>
                  <Input id="device-serial" placeholder="Enter device serial number" />
                </div>
                <div>
                  <Label htmlFor="device-model">Device Model</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select device model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KOYO BC-90DC">KOYO BC-90DC Fridge</SelectItem>
                      <SelectItem value="KOYO BC-50DC">KOYO BC-50DC Fridge</SelectItem>
                      <SelectItem value="KOYO BC-118DC">KOYO BC-118DC Freezer</SelectItem>
                      <SelectItem value="KOYO LC-218DC">KOYO LC-218DC Fridge</SelectItem>
                      <SelectItem value="KOYO BC-268DC">KOYO BC-268DC Freezer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="device-location">Installation Location</Label>
                  <Input id="device-location" placeholder="Enter installation location" />
                </div>
                <div>
                  <Label htmlFor="device-notes">Notes</Label>
                  <Textarea id="device-notes" placeholder="Additional device information" />
                </div>
                <Button onClick={() => handleSaveSettings("Device Registration")} className="w-full bg-purple-600 hover:bg-purple-700">
                  <Refrigerator className="h-4 w-4 mr-2" />
                  Register Device
                </Button>
              </CardContent>
            </Card>

            {/* Client Assignment */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                  <Users className="h-5 w-5" />
                  Assign Device to Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="assign-device">Select Device</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose unassigned device" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNIT-008">UNIT-008 - KOYO BC-90DC</SelectItem>
                      <SelectItem value="UNIT-009">UNIT-009 - KOYO BC-50DC</SelectItem>
                      <SelectItem value="UNIT-010">UNIT-010 - KOYO BC-118DC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assign-client">Select Client</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">John Doe - john@example.com</SelectItem>
                      <SelectItem value="2">Jane Smith - jane@example.com</SelectItem>
                      <SelectItem value="3">Mike Johnson - mike@example.com</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="payment-plan">Payment Plan</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly - KSh 25</SelectItem>
                      <SelectItem value="monthly">Monthly - KSh 100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assignment-date">Assignment Date</Label>
                  <Input id="assignment-date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <Button onClick={() => handleSaveSettings("Device Assignment")} className="w-full bg-orange-600 hover:bg-orange-700">
                  <Users className="h-4 w-4 mr-2" />
                  Assign Device
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Device Configuration */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                Device Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="heartbeat-interval">Heartbeat Interval (minutes)</Label>
                  <Input id="heartbeat-interval" type="number" defaultValue="15" />
                </div>
                <div>
                  <Label htmlFor="temperature-threshold">Temperature Alert Threshold (°C)</Label>
                  <Input id="temperature-threshold" type="number" defaultValue="8" />
                </div>
                <div>
                  <Label htmlFor="battery-threshold">Low Battery Alert (%)</Label>
                  <Input id="battery-threshold" type="number" defaultValue="20" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="remote-control" defaultChecked />
                  <Label htmlFor="remote-control">Enable remote device control</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="auto-diagnostics" defaultChecked />
                  <Label htmlFor="auto-diagnostics">Enable automatic diagnostics</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="maintenance-alerts" defaultChecked />
                  <Label htmlFor="maintenance-alerts">Send maintenance alerts</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Configuration */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid gap-6">
            {/* Company Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-600" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" defaultValue="KOYO PayGo Ltd" />
                  </div>
                  <div>
                    <Label htmlFor="company-email">Company Email</Label>
                    <Input id="company-email" type="email" defaultValue="admin@koyo.com" />
                  </div>
                  <div>
                    <Label htmlFor="company-phone">Phone Number</Label>
                    <Input id="company-phone" defaultValue="+254 700 000 000" />
                  </div>
                  <div>
                    <Label htmlFor="support-email">Support Email</Label>
                    <Input id="support-email" type="email" defaultValue="support@koyo.com" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="company-address">Company Address</Label>
                  <Textarea id="company-address" defaultValue="123 Business Street, Nairobi, Kenya" />
                </div>
                <Button onClick={() => handleSaveSettings("Company Information")} className="bg-gray-800 hover:bg-gray-900">
                  <Save className="h-4 w-4 mr-2" />
                  Save Company Settings
                </Button>
              </CardContent>
            </Card>

            {/* System Preferences */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  System Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="timezone">Default Timezone</Label>
                    <Select defaultValue="Africa/Nairobi">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date-format">Date Format</Label>
                    <Select defaultValue="DD/MM/YYYY">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="maintenance-mode" />
                    <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="debug-mode" />
                    <Label htmlFor="debug-mode">Debug Mode</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="auto-backups" defaultChecked />
                    <Label htmlFor="auto-backups">Automatic Daily Backups</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Communication Settings */}
        <TabsContent value="communication" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* SMS Configuration */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <MessageSquare className="h-5 w-5" />
                  SMS Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sms-provider">SMS Provider</Label>
                  <Select defaultValue="africastalking">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="africastalking">Africa's Talking</SelectItem>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="textmagic">TextMagic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sms-api-key">API Key</Label>
                  <Input id="sms-api-key" type="password" defaultValue="xxxxxxxxxxxxxxxxxxxxx" />
                </div>
                <div>
                  <Label htmlFor="sms-username">Username</Label>
                  <Input id="sms-username" defaultValue="koyo_paygo" />
                </div>
                <div>
                  <Label htmlFor="sms-sender-id">Sender ID</Label>
                  <Input id="sms-sender-id" defaultValue="KOYO" />
                </div>
                <Button onClick={() => handleSaveSettings("SMS")} className="w-full bg-blue-600 hover:bg-blue-700">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Save SMS Settings
                </Button>
              </CardContent>
            </Card>

            {/* Email Configuration */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-green-50 dark:from-teal-950/20 dark:to-green-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
                  <Mail className="h-5 w-5" />
                  Email Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input id="smtp-host" defaultValue="smtp.gmail.com" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="smtp-port">SMTP Port</Label>
                    <Input id="smtp-port" type="number" defaultValue="587" />
                  </div>
                  <div>
                    <Label htmlFor="smtp-encryption">Encryption</Label>
                    <Select defaultValue="tls">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="smtp-username">Email Username</Label>
                  <Input id="smtp-username" type="email" defaultValue="noreply@koyo.com" />
                </div>
                <div>
                  <Label htmlFor="smtp-password">Email Password</Label>
                  <Input id="smtp-password" type="password" defaultValue="xxxxxxxxxxxxxxxxxxxxx" />
                </div>
                <Button onClick={() => handleSaveSettings("Email")} className="w-full bg-teal-600 hover:bg-teal-700">
                  <Mail className="h-4 w-4 mr-2" />
                  Save Email Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Notification Templates */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-gray-600" />
                Notification Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="payment-reminder-template">Payment Reminder SMS Template</Label>
                <Textarea 
                  id="payment-reminder-template" 
                  defaultValue="Hi {client_name}, your payment of KSh {amount} is due in {days} days. Pay now to keep your {appliance} running. Ref: {ref_number}"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="payment-received-template">Payment Received SMS Template</Label>
                <Textarea 
                  id="payment-received-template" 
                  defaultValue="Payment received! Thank you {client_name}. Your {appliance} is active until {next_payment_date}. Ref: {transaction_id}"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="device-suspended-template">Device Suspended SMS Template</Label>
                <Textarea 
                  id="device-suspended-template" 
                  defaultValue="Hi {client_name}, your {appliance} has been suspended due to overdue payment. Pay KSh {amount} to reactivate. Support: {support_phone}"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6">
            {/* Authentication Settings */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-gray-600" />
                  Authentication & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Input id="session-timeout" type="number" defaultValue="30" />
                  </div>
                  <div>
                    <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                    <Input id="max-login-attempts" type="number" defaultValue="5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="two-factor-auth" />
                    <Label htmlFor="two-factor-auth">Require Two-Factor Authentication</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="password-complexity" defaultChecked />
                    <Label htmlFor="password-complexity">Enforce Password Complexity</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="login-notifications" defaultChecked />
                    <Label htmlFor="login-notifications">Send Login Notifications</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Security */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-gray-600" />
                  API Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="api-rate-limit">API Rate Limit (requests/minute)</Label>
                  <Input id="api-rate-limit" type="number" defaultValue="100" />
                </div>
                <div>
                  <Label htmlFor="webhook-secret">Webhook Secret Key</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="webhook-secret" 
                      type={showApiKeys ? "text" : "password"}
                      defaultValue="wh_sec_xxxxxxxxxxxxxxxxxxxxx" 
                    />
                    <Button variant="outline" size="sm" onClick={() => setShowApiKeys(!showApiKeys)}>
                      {showApiKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard("wh_sec_xxxxxxxxxxxxxxxxxxxxx")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="api-logging" defaultChecked />
                    <Label htmlFor="api-logging">Enable API Request Logging</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="ip-whitelist" />
                    <Label htmlFor="ip-whitelist">Enable IP Whitelisting</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Settings */}
        <TabsContent value="analytics" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                Analytics & Reporting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="data-retention">Data Retention Period (months)</Label>
                  <Input id="data-retention" type="number" defaultValue="24" />
                </div>
                <div>
                  <Label htmlFor="report-frequency">Auto Report Frequency</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="google-analytics" />
                  <Label htmlFor="google-analytics">Enable Google Analytics</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="performance-monitoring" defaultChecked />
                  <Label htmlFor="performance-monitoring">Performance Monitoring</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="error-tracking" defaultChecked />
                  <Label htmlFor="error-tracking">Error Tracking</Label>
                </div>
              </div>
              <div>
                <Label htmlFor="analytics-webhook">Analytics Webhook URL</Label>
                <Input id="analytics-webhook" placeholder="https://your-analytics-endpoint.com/webhook" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API & Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-gray-600" />
                API Keys & Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="public-api-key">Public API Key</Label>
                <div className="flex gap-2">
                  <Input 
                    id="public-api-key" 
                    type={showApiKeys ? "text" : "password"}
                    defaultValue="pk_live_xxxxxxxxxxxxxxxxxxxxx" 
                    readOnly
                  />
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard("pk_live_xxxxxxxxxxxxxxxxxxxxx")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="secret-api-key">Secret API Key</Label>
                <div className="flex gap-2">
                  <Input 
                    id="secret-api-key" 
                    type={showApiKeys ? "text" : "password"}
                    defaultValue="sk_live_xxxxxxxxxxxxxxxxxxxxx" 
                    readOnly
                  />
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard("sk_live_xxxxxxxxxxxxxxxxxxxxx")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold">Third-party Integrations</h4>
                <div className="flex items-center space-x-2">
                  <Switch id="slack-integration" />
                  <Label htmlFor="slack-integration">Slack Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="whatsapp-business" />
                  <Label htmlFor="whatsapp-business">WhatsApp Business API</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="salesforce-sync" />
                  <Label htmlFor="salesforce-sync">Salesforce CRM Sync</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing & Pricing */}
        <TabsContent value="billing" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gray-600" />
                Billing & Pricing Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="transaction-fee">Transaction Fee (%)</Label>
                  <Input id="transaction-fee" type="number" step="0.1" defaultValue="2.5" />
                </div>
                <div>
                  <Label htmlFor="late-payment-fee">Late Payment Fee (KSh)</Label>
                  <Input id="late-payment-fee" type="number" defaultValue="50" />
                </div>
                <div>
                  <Label htmlFor="reconnection-fee">Reconnection Fee (KSh)</Label>
                  <Input id="reconnection-fee" type="number" defaultValue="100" />
                </div>
                <div>
                  <Label htmlFor="service-fee">Monthly Service Fee (KSh)</Label>
                  <Input id="service-fee" type="number" defaultValue="20" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="auto-invoice" defaultChecked />
                  <Label htmlFor="auto-invoice">Generate Automatic Invoices</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="tax-calculation" />
                  <Label htmlFor="tax-calculation">Include VAT in Calculations</Label>
                </div>
              </div>
              <div>
                <Label htmlFor="invoice-template">Invoice Template</Label>
                <Select defaultValue="standard">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Template</SelectItem>
                    <SelectItem value="modern">Modern Template</SelectItem>
                    <SelectItem value="minimal">Minimal Template</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
