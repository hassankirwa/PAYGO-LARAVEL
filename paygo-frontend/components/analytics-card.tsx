import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react"

interface AnalyticsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  iconColor?: string
  trend?: {
    value: string // e.g., "+5%", "-2.3%"
    type: "up" | "down" | "neutral"
  }
  className?: string
  gradient?: string
}

export function AnalyticsCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = "text-white",
  trend,
  className,
  gradient = "from-blue-500 to-blue-600"
}: AnalyticsCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group",
      className
    )}>
      {/* Gradient Background */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90 group-hover:opacity-100 transition-opacity", gradient)} />
      
      {/* Decorative Pattern */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
      
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-white/90 uppercase tracking-wide">{title}</CardTitle>
        {Icon && (
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="relative">
        <div className="text-3xl font-bold text-white mb-2">{value}</div>
        {description && <p className="text-sm text-white/80 mb-4">{description}</p>}

        {trend && (
          <div className="flex items-center gap-2 mt-3">
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              trend.type === "up" ? "bg-green-500/20 text-green-100" : 
              trend.type === "down" ? "bg-red-500/20 text-red-100" : 
              "bg-white/20 text-white"
            )}>
              {trend.type === "up" && <TrendingUp className="h-3 w-3" />}
              {trend.type === "down" && <TrendingDown className="h-3 w-3" />}
              <span>{trend.value}</span>
            </div>
            <span className="text-xs text-white/70">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
