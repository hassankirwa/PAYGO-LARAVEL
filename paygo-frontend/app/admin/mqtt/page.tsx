"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MqttSettingsSection } from "@/components/mqtt-settings-section"
import { DeviceManagementDashboard } from "@/components/device-management-dashboard"
import { 
  Settings, 
  Refrigerator,
  Activity,
  Wifi
} from "lucide-react"

export default function MqttAdminPage() {
  const [activeTab, setActiveTab] = useState("settings")

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Wifi className="h-8 w-8" />
          MQTT & IoT Management
        </h1>
        <p className="text-muted-foreground">
          Configure MQTT broker settings and manage IoT device subscriptions
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            MQTT Settings
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Refrigerator className="h-4 w-4" />
            Device Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <MqttSettingsSection />
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <DeviceManagementDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
} 