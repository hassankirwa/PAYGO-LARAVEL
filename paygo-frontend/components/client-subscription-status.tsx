"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Refrigerator,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  Timer,
  Zap,
  Bell,
  CreditCard,
  Wifi,
  WifiOff
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { subscriptionApi, mqttUtils } from "@/lib/mqtt-api"

interface SubscriptionData {
  id: number;
  device_id: string;
  subscription_type: string;
  status: string;
  start_date: string;
  end_date: string;
  days_remaining: number;
  hours_remaining: number;
  progress_percentage: number;
  appliance: {
    id: number;
    device_id: string;
    status: string;
    product: {
      name: string;
      model_code: string;
    };
  };
}

interface CountdownTimerProps {
  endDate: string;
  onExpired?: () => void;
}

function CountdownTimer({ endDate, onExpired }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const end = new Date(endDate).getTime()
      const difference = end - now

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true })
        onExpired?.()
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds, expired: false })
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [endDate, onExpired])

  if (timeLeft.expired) {
    return (
      <div className="text-center text-red-600">
        <XCircle className="h-8 w-8 mx-auto mb-2" />
        <p className="font-semibold">Subscription Expired</p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="flex justify-center gap-4 mb-2">
        <div className="text-center">
          <div className="text-2xl font-bold">{timeLeft.days}</div>
          <div className="text-xs text-muted-foreground">Days</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{timeLeft.hours}</div>
          <div className="text-xs text-muted-foreground">Hours</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{timeLeft.minutes}</div>
          <div className="text-xs text-muted-foreground">Minutes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{timeLeft.seconds}</div>
          <div className="text-xs text-muted-foreground">Seconds</div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Until subscription expires
      </p>
    </div>
  )
}

export function ClientSubscriptionStatus() {
  const { toast } = useToast()
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    loadSubscriptions()
    
    // Remove continuous polling to prevent unnecessary API calls
    // Only load once on component mount
    
    // No automatic refresh interval - only manual refresh when needed
  }, [])

  const loadSubscriptions = async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    
    try {
      console.log('Loading client subscriptions...')
      const response = await subscriptionApi.getClientSubscriptions()
      
      console.log('Subscription API response:', response)
      
      if (response.success) {
        setSubscriptions(response.subscriptions)
        setLastUpdate(new Date())
        console.log('Loaded subscriptions:', response.subscriptions.length)
      } else {
        console.error('API returned success: false', response)
        if (showLoading) {
          toast({
            title: "Load Error",
            description: response.message || "Failed to load subscription status",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error)
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('401')) {
        toast({
          title: "Authentication Error",
          description: "Please log in to view your subscriptions",
          variant: "destructive",
        })
      } else if (showLoading) {
        toast({
          title: "Load Error",
          description: "Failed to load subscription status. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }

  const handleSubscriptionExpired = () => {
    toast({
      title: "Subscription Expired",
      description: "Your subscription has expired. Please make a payment to reactivate your device.",
      variant: "destructive",
    })
    // Refresh to get updated status
    loadSubscriptions(false)
  }

  const getUrgencyLevel = (hoursRemaining: number) => {
    if (hoursRemaining <= 0) return 'expired'
    if (hoursRemaining <= 24) return 'critical'
    if (hoursRemaining <= 72) return 'warning'
    return 'normal'
  }

  const getProgressColor = (urgencyLevel: string) => {
    switch (urgencyLevel) {
      case 'expired': return 'bg-red-500'
      case 'critical': return 'bg-red-400'
      case 'warning': return 'bg-yellow-400'
      default: return 'bg-green-500'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading subscription status...</span>
      </div>
    )
  }

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Refrigerator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Subscriptions</h3>
          <p className="text-muted-foreground mb-4">
            You don't have any active device subscriptions yet.
          </p>
          <Button>
            <CreditCard className="h-4 w-4 mr-2" />
            Make a Payment
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6" />
            My Subscriptions
          </h2>
          <p className="text-muted-foreground">
            Track your device subscriptions and remaining time
          </p>
        </div>
        
        {/* Manual Refresh Button */}
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadSubscriptions(true)}
            disabled={isLoading}
          >
            <Activity className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Subscription Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {subscriptions.map((subscription) => {
          const urgencyLevel = getUrgencyLevel(subscription.hours_remaining)
          const deviceStatus = mqttUtils.formatDeviceStatus(subscription.appliance.status)
          const subscriptionStatus = mqttUtils.formatSubscriptionStatus(subscription.status)
          
          return (
            <Card key={subscription.id} className="relative overflow-hidden">
              {/* Urgency Indicator */}
              {urgencyLevel === 'critical' && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse" />
              )}
              {urgencyLevel === 'warning' && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500" />
              )}

              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Refrigerator className="h-5 w-5" />
                    <span>{subscription.appliance.product.name}</span>
                  </div>
                  <Badge 
                    variant="secondary"
                    className={`text-${subscriptionStatus.color}-600 bg-${subscriptionStatus.color}-100`}
                  >
                    {subscriptionStatus.label}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Device ID: {subscription.device_id}</span>
                  <div className="flex items-center gap-1">
                    {subscription.appliance.status === 'active' ? (
                      <Wifi className="h-3 w-3 text-green-500" />
                    ) : (
                      <WifiOff className="h-3 w-3 text-red-500" />
                    )}
                    <span>{deviceStatus.label}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Countdown Timer */}
                {subscription.status === 'active' && subscription.hours_remaining > 0 ? (
                  <CountdownTimer 
                    endDate={subscription.end_date}
                    onExpired={handleSubscriptionExpired}
                  />
                ) : (
                  <div className="text-center text-red-600">
                    <XCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-semibold">
                      {subscription.status === 'expired' ? 'Subscription Expired' : 'Subscription Inactive'}
                    </p>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subscription Progress</span>
                    <span>{Math.round(subscription.progress_percentage)}%</span>
                  </div>
                  <Progress 
                    value={subscription.progress_percentage} 
                    className="h-2"
                  />
                </div>

                {/* Subscription Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Started</Label>
                    <p className="font-medium">
                      {new Date(subscription.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Expires</Label>
                    <p className="font-medium">
                      {new Date(subscription.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Type</Label>
                    <p className="font-medium capitalize">
                      {subscription.subscription_type.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Days Left</Label>
                    <p className="font-medium">
                      {subscription.days_remaining > 0 ? subscription.days_remaining : 0} days
                    </p>
                  </div>
                </div>

                {/* Alerts */}
                {urgencyLevel === 'critical' && subscription.status === 'active' && (
                  <Alert className="border-red-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-red-600">Urgent: Payment Due Soon</AlertTitle>
                    <AlertDescription>
                      Your subscription expires in less than 24 hours. Make a payment now to avoid service interruption.
                    </AlertDescription>
                  </Alert>
                )}

                {urgencyLevel === 'warning' && subscription.status === 'active' && (
                  <Alert className="border-yellow-200">
                    <Bell className="h-4 w-4" />
                    <AlertTitle className="text-yellow-600">Payment Reminder</AlertTitle>
                    <AlertDescription>
                      Your subscription expires in {subscription.days_remaining} days. Consider making your next payment soon.
                    </AlertDescription>
                  </Alert>
                )}

                {subscription.status === 'expired' && (
                  <Alert className="border-red-200">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle className="text-red-600">Subscription Expired</AlertTitle>
                    <AlertDescription>
                      Your device has been suspended. Make a payment to reactivate your subscription.
                    </AlertDescription>
                  </Alert>
                )}

                {subscription.status === 'suspended' && (
                  <Alert className="border-orange-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-orange-600">Service Suspended</AlertTitle>
                    <AlertDescription>
                      Your device is currently suspended. Please contact support or make a payment to restore service.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Button */}
                <div className="flex gap-2">
                  {(subscription.status === 'expired' || subscription.status === 'suspended' || urgencyLevel === 'critical') && (
                    <Button className="flex-1">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Make Payment
                    </Button>
                  )}
                  
                  {subscription.status === 'active' && urgencyLevel === 'warning' && (
                    <Button variant="outline" className="flex-1">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay Early
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Subscription Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {subscriptions.filter(s => s.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">Active Subscriptions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {subscriptions.filter(s => getUrgencyLevel(s.hours_remaining) === 'warning').length}
              </div>
              <div className="text-sm text-muted-foreground">Expiring Soon</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {subscriptions.filter(s => getUrgencyLevel(s.hours_remaining) === 'critical').length}
              </div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {subscriptions.filter(s => s.status === 'expired' || s.status === 'suspended').length}
              </div>
              <div className="text-sm text-muted-foreground">Expired/Suspended</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={`text-xs font-medium ${className}`}>{children}</div>
} 