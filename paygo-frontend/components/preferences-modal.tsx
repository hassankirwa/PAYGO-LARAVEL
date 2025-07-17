"use client"

import { useState, useEffect } from "react"
import { authService } from "@/lib/auth"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Settings, Moon, Sun, Globe, Bell, Palette } from "lucide-react"
import { toast } from "sonner"

interface PreferencesModalProps {
  isOpen: boolean
  onClose: () => void
  userType: 'admin' | 'client'
}

export function PreferencesModal({ isOpen, onClose, userType }: PreferencesModalProps) {
  const [loading, setLoading] = useState(false)
  const [preferences, setPreferences] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchPreferences()
    }
  }, [isOpen])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await authService.getPreferences()
      if (response.success) {
        setPreferences(response.data)
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }

  const updatePreferences = async (newPreferences: any) => {
    try {
      setLoading(true)
      setError('')
      const response = await authService.updatePreferences(newPreferences)
      if (response.success) {
        setPreferences(response.data)
        toast.success('Preferences updated successfully')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update preferences')
    } finally {
      setLoading(false)
    }
  }

  const handlePreferenceChange = (key: string, value: any) => {
    const updatedPreferences = { ...preferences }
    
    // Handle nested objects like notifications
    if (key.includes('.')) {
      const [parent, child] = key.split('.')
      updatedPreferences[parent] = {
        ...updatedPreferences[parent],
        [child]: value
      }
    } else {
      updatedPreferences[key] = value
    }
    
    updatePreferences(updatedPreferences)
  }

  if (loading && !preferences) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Preferences
          </DialogTitle>
          <DialogDescription>
            Customize your application settings and preferences.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="theme">Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred color scheme
                  </p>
                </div>
                <Select
                  value={preferences?.theme || 'light'}
                  onValueChange={(value) => handlePreferenceChange('theme', value)}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="auto">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Auto
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {userType === 'admin' && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dashboard_layout">Dashboard Layout</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose how to display dashboard content
                    </p>
                  </div>
                  <Select
                    value={preferences?.dashboard_layout || 'grid'}
                    onValueChange={(value) => handlePreferenceChange('dashboard_layout', value)}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Localization Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Localization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="language">Language</Label>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred language
                  </p>
                </div>
                <Select
                  value={preferences?.language || 'en'}
                  onValueChange={(value) => handlePreferenceChange('language', value)}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="sw">Swahili</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="timezone">Timezone</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose your timezone
                  </p>
                </div>
                <Select
                  value={preferences?.timezone || 'UTC'}
                  onValueChange={(value) => handlePreferenceChange('timezone', value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="Africa/Nairobi">Africa/Nairobi</SelectItem>
                    <SelectItem value="Africa/Lagos">Africa/Lagos</SelectItem>
                    <SelectItem value="Africa/Cairo">Africa/Cairo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {userType === 'client' && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="currency_display">Currency Display</Label>
                    <p className="text-sm text-muted-foreground">
                      Preferred currency format
                    </p>
                  </div>
                  <Select
                    value={preferences?.currency_display || 'USD'}
                    onValueChange={(value) => handlePreferenceChange('currency_display', value)}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="KES">KES</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email_notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="email_notifications"
                  checked={preferences?.notifications?.email || false}
                  onCheckedChange={(checked) => handlePreferenceChange('notifications.email', checked)}
                />
              </div>

              {userType === 'admin' ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push_notifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications in browser
                      </p>
                    </div>
                    <Switch
                      id="push_notifications"
                      checked={preferences?.notifications?.push || false}
                      onCheckedChange={(checked) => handlePreferenceChange('notifications.push', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms_notifications">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive critical alerts via SMS
                      </p>
                    </div>
                    <Switch
                      id="sms_notifications"
                      checked={preferences?.notifications?.sms || false}
                      onCheckedChange={(checked) => handlePreferenceChange('notifications.sms', checked)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms_notifications">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive payment reminders via SMS
                      </p>
                    </div>
                    <Switch
                      id="sms_notifications"
                      checked={preferences?.notifications?.sms || false}
                      onCheckedChange={(checked) => handlePreferenceChange('notifications.sms', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="payment_reminders">Payment Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminded before payment due dates
                      </p>
                    </div>
                    <Switch
                      id="payment_reminders"
                      checked={preferences?.notifications?.payment_reminders || false}
                      onCheckedChange={(checked) => handlePreferenceChange('notifications.payment_reminders', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="reminder_days">Reminder Days</Label>
                      <p className="text-sm text-muted-foreground">
                        Days before due date to send reminder
                      </p>
                    </div>
                    <Select
                      value={preferences?.payment_reminder_days?.toString() || '3'}
                      onValueChange={(value) => handlePreferenceChange('payment_reminder_days', parseInt(value))}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 day</SelectItem>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Display Settings */}
          {userType === 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle>Display Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="items_per_page">Items Per Page</Label>
                    <p className="text-sm text-muted-foreground">
                      Number of items to show in tables
                    </p>
                  </div>
                  <Select
                    value={preferences?.items_per_page?.toString() || '25'}
                    onValueChange={(value) => handlePreferenceChange('items_per_page', parseInt(value))}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 