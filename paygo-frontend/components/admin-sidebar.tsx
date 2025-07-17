"use client"

import { SidebarSeparator } from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Refrigerator, MapPin, MessageSquare, Mail, Settings, Zap } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function AdminSidebar() {
  const pathname = usePathname()

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard?view=dashboard",
      icon: LayoutDashboard,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      title: "Units/Freezers",
      href: "/admin/dashboard?view=units",
      icon: Refrigerator,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20"
    },
    {
      title: "Locations",
      href: "/admin/dashboard?view=locations",
      icon: MapPin,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20"
    },
    {
      title: "Bulk SMS",
      href: "/admin/dashboard?view=bulk-sms",
      icon: MessageSquare,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20"
    },
    {
      title: "Email Marketing",
      href: "/admin/dashboard?view=email-marketing",
      icon: Mail,
      color: "text-teal-500",
      bgColor: "bg-teal-50 dark:bg-teal-950/20"
    },
    {
      title: "Settings",
      href: "/admin/dashboard?view=settings",
      icon: Settings,
      color: "text-gray-500",
      bgColor: "bg-gray-50 dark:bg-gray-950/20"
    },
  ]

  const isActive = (href: string) => {
    const [path, query] = href.split("?")
    return pathname.includes(path) && pathname.includes(query)
  }

  return (
    <Sidebar className="border-r-0 shadow-xl bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <SidebarHeader className="p-6 bg-gradient-to-r from-emerald-600 to-blue-600">
        <Link href="/admin/dashboard" className="flex items-center gap-3 text-white group">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-colors">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold">KOYO</span>
            <p className="text-xs text-white/80 -mt-1">Admin Portal</p>
          </div>
        </Link>
        <SidebarTrigger className="absolute top-4 right-4 h-8 w-8 text-white hover:bg-white/20 rounded-lg transition-colors" />
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`
                        relative group rounded-xl p-3 transition-all duration-200 hover:shadow-md
                        ${active 
                          ? `${item.bgColor} shadow-sm border border-${item.color.split('-')[1]}-200 dark:border-${item.color.split('-')[1]}-800` 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }
                      `}
                    >
                      <Link href={item.href} className="flex items-center gap-3 w-full">
                        <div className={`
                          w-9 h-9 rounded-lg flex items-center justify-center transition-colors
                          ${active 
                            ? `${item.color} bg-white dark:bg-gray-800 shadow-sm` 
                            : `${item.color} group-hover:bg-white dark:group-hover:bg-gray-800 group-hover:shadow-sm`
                          }
                        `}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <span className={`
                          font-medium transition-colors
                          ${active 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                          }
                        `}>
                          {item.title}
                        </span>
                        {active && (
                          <div className="absolute right-3 w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Quick Stats Section */}
        <div className="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Stats</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Active Units</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">24</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Clients</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">156</span>
            </div>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
