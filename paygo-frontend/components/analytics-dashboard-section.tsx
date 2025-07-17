"use client"

import { Users, Refrigerator, DollarSign, CalendarCheck } from "lucide-react"
import { AnalyticsCard } from "./analytics-card"
import { clients } from "@/lib/clients"
import { appliances } from "@/lib/appliances"

export function AnalyticsDashboardSection() {
  // Calculate dynamic stats
  const totalClients = clients.length
  const activeAppliances = appliances.filter((app) => app.status === "active").length
  const offlineAppliances = appliances.filter((app) => app.status === "offline").length
  const maintenanceAppliances = appliances.filter((app) => app.status === "maintenance").length
  const renewalsDue = clients.filter((client) => client.paymentStatus === "overdue").length

  // Dummy monthly revenue for demonstration
  const monthlyRevenue = 45680

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <AnalyticsCard
        title="Total Clients"
        value={totalClients.toLocaleString()}
        description="Registered users in the system"
        icon={Users}
        gradient="from-blue-500 to-blue-700"
        trend={{ value: "+15", type: "up" }}
      />
      <AnalyticsCard
        title="Active Units"
        value={activeAppliances.toLocaleString()}
        description="Appliances currently online"
        icon={Refrigerator}
        gradient="from-emerald-500 to-emerald-700"
      />
      <AnalyticsCard
        title="Monthly Revenue"
        value={`$${monthlyRevenue.toLocaleString()}`}
        description="Revenue this month"
        icon={DollarSign}
        gradient="from-green-500 to-green-700"
        trend={{ value: "+8.2", type: "up" }}
      />
      <AnalyticsCard
        title="Renewals Due"
        value={renewalsDue.toLocaleString()}
        description="Payments requiring attention"
        icon={CalendarCheck}
        gradient="from-purple-500 to-purple-700"
        trend={{ value: "-3", type: "down" }}
      />
      
      {/* Additional Analytics Row */}
      <AnalyticsCard
        title="Offline Units"
        value={offlineAppliances.toLocaleString()}
        description="Appliances currently offline"
        icon={Refrigerator}
        gradient="from-red-500 to-red-700"
      />
      <AnalyticsCard
        title="Under Maintenance"
        value={maintenanceAppliances.toLocaleString()}
        description="Appliances requiring service"
        icon={Refrigerator}
        gradient="from-orange-500 to-orange-700"
      />
    </div>
  )
}
