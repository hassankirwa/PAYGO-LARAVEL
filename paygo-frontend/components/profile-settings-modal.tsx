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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Lock, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useToast } from "@/hooks/use-toast"

interface ProfileSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  userType: 'admin' | 'client'
}

export function ProfileSettingsModal({ isOpen, onClose, userType }: ProfileSettingsModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  useEffect(() => {
    if (isOpen) {
      fetchProfileData()
    }
  }, [isOpen])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const response = await authService.getProfileDetails()
      if (response.success) {
        setProfileData(response.data)
        setFormData(response.data)
      }
    } catch (error: any) {
      toast({
        title: "Error Loading Profile",
        description: error.message || 'Failed to load profile data',
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async () => {
    try {
      setLoading(true)
      
      // Only send changed fields
      const changedFields: any = {}
      Object.keys(formData).forEach(key => {
        if (formData[key] !== profileData[key] && key !== 'id' && key !== 'created_at' && key !== 'preferences') {
          changedFields[key] = formData[key]
        }
      })

      if (Object.keys(changedFields).length === 0) {
        toast.info('No changes to save')
        return
      }

      const response = await authService.updateProfile(changedFields)
      if (response.success) {
        toast({
          title: "Profile Updated! ✅",
          description: "Profile updated successfully",
          variant: "default",
        })
        setProfileData(response.data)
        setFormData(response.data)
      }
    } catch (error: any) {
      toast({
        title: "Error Updating Profile",
        description: error.message || 'Failed to update profile',
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    try {
      setLoading(true)

      if (passwordData.new_password !== passwordData.new_password_confirmation) {
        toast({
          title: "Password Mismatch",
          description: "New passwords do not match",
          variant: "destructive",
        })
        return
      }

      if (passwordData.new_password.length < 8) {
        toast({
          title: "Password Too Short",
          description: "New password must be at least 8 characters long",
          variant: "destructive",
        })
        return
      }

      const response = await authService.changePassword(passwordData)
      if (response.success) {
        toast({
          title: "Password Changed! 🔒",
          description: "Password changed successfully",
          variant: "default",
        })
        setPasswordData({
          current_password: '',
          new_password: '',
          new_password_confirmation: ''
        })
      }
    } catch (error: any) {
      toast({
        title: "Error Changing Password",
        description: error.message || 'Failed to change password',
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }))
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  if (loading && !profileData) {
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
            <User className="h-5 w-5" />
            Profile Settings
          </DialogTitle>
          <DialogDescription>
            Manage your account information and security settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userType === 'admin' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={formData.username || ''}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          placeholder="Enter username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name || ''}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          placeholder="Enter full name"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="Enter email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={formData.department || ''}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        placeholder="Enter department"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          value={formData.first_name || ''}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                          placeholder="Enter first name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={formData.last_name || ''}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="Enter email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Enter address"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city || ''}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="Enter city"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="region">Region</Label>
                        <Input
                          id="region"
                          value={formData.region || ''}
                          onChange={(e) => handleInputChange('region', e.target.value)}
                          placeholder="Enter region"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={formData.country || ''}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          placeholder="Enter country"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="occupation">Occupation</Label>
                        <Input
                          id="occupation"
                          value={formData.occupation || ''}
                          onChange={(e) => handleInputChange('occupation', e.target.value)}
                          placeholder="Enter occupation"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="business_type">Business Type</Label>
                        <Input
                          id="business_type"
                          value={formData.business_type || ''}
                          onChange={(e) => handleInputChange('business_type', e.target.value)}
                          placeholder="Enter business type"
                        />
                      </div>
                    </div>
                  </>
                )}
                
                <div className="flex justify-end">
                  <Button onClick={handleProfileUpdate} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current_password"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.current_password}
                      onChange={(e) => handlePasswordInputChange('current_password', e.target.value)}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.new_password}
                      onChange={(e) => handlePasswordInputChange('new_password', e.target.value)}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('new')}
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new_password_confirmation">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="new_password_confirmation"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.new_password_confirmation}
                      onChange={(e) => handlePasswordInputChange('new_password_confirmation', e.target.value)}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handlePasswordChange} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 