"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Search, Eye, TrendingUp, Settings } from "lucide-react"
import { locations } from "@/lib/locations"
import { useToast } from "@/hooks/use-toast"

export function LocationsTable() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleAction = (county: string, action: string) => {
    toast({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Action`,
      description: `Performing "${action}" action for ${county} county.`,
      variant: "default",
    })
    // In a real app, you'd call an API here
  }

  const filteredAndSortedLocations = locations
    .filter((location) => location.county.toLowerCase().includes(searchTerm.toLowerCase()))
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
      // Handle growth percentage string sorting
      if (sortColumn === "growth") {
        const parseGrowth = (growthStr: string) => Number.parseFloat(growthStr.replace("%", ""))
        const aGrowth = parseGrowth(aValue)
        const bGrowth = parseGrowth(bValue)
        return sortDirection === "asc" ? aGrowth - bGrowth : bGrowth - aGrowth
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-emerald-600" />
          Locations Overview
        </CardTitle>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search counties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 cursor-pointer" onClick={() => handleSort("county")}>
                  County {sortColumn === "county" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th className="py-2 px-4 cursor-pointer" onClick={() => handleSort("activeUnits")}>
                  Active Units {sortColumn === "activeUnits" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th className="py-2 px-4 cursor-pointer" onClick={() => handleSort("subscribers")}>
                  Subscribers {sortColumn === "subscribers" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th className="py-2 px-4 cursor-pointer" onClick={() => handleSort("monthlyRevenue")}>
                  Monthly Revenue {sortColumn === "monthlyRevenue" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th className="py-2 px-4 cursor-pointer" onClick={() => handleSort("growth")}>
                  Growth {sortColumn === "growth" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedLocations.map((location, index) => (
                <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="py-3 px-4 font-semibold text-gray-900">{location.county}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{location.activeUnits}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{location.subscribers}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">KSh {location.monthlyRevenue.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-green-600 font-medium flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" /> {location.growth}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-transparent"
                        onClick={() => handleAction(location.county, "view-details")}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-transparent"
                        onClick={() => handleAction(location.county, "manage")}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
