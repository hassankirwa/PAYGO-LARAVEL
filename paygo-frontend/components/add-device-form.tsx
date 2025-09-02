"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, AlertCircle, CheckCircle, Refrigerator } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { deviceManagementApi } from "@/lib/mqtt-api"

interface Product {
  id: number;
  name: string;
  model_code: string;
  category: { id: number; name: string };
}

interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  location: string;
}

interface AddDeviceFormProps {
  onDeviceAdded: () => void;
}

export function AddDeviceForm({ onDeviceAdded }: AddDeviceFormProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    device_id: '',
    serial_number: '',
    product_id: '',
    client_id: '',
    installation_location: '',
    installation_notes: '',
    status: 'pending_activation'
  })
  
  // Dropdown data
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<Client[]>([])
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load products and clients when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadFormData()
    }
  }, [isOpen])

  const loadFormData = async () => {
    setIsLoadingData(true)
    try {
      const [productsResponse, clientsResponse] = await Promise.all([
        deviceManagementApi.getProductsForDevice(),
        deviceManagementApi.getClientsForDevice()
      ])

      if (productsResponse.success) {
        setProducts(productsResponse.products)
      }

      if (clientsResponse.success) {
        setClients(clientsResponse.clients)
      }
    } catch (error) {
      console.error('Failed to load form data:', error)
      toast({
        title: "Load Error",
        description: "Failed to load products and clients",
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.device_id.trim()) {
      newErrors.device_id = 'Device ID is required'
    } else if (!/^[A-Z0-9]{3,10}$/.test(formData.device_id)) {
      newErrors.device_id = 'Device ID should be 3-10 characters, letters and numbers only'
    }

    if (!formData.serial_number.trim()) {
      newErrors.serial_number = 'Serial number is required'
    }

    if (!formData.product_id) {
      newErrors.product_id = 'Product selection is required'
    }

    if (!formData.status) {
      newErrors.status = 'Status is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      const deviceData = {
        device_id: formData.device_id.trim().toUpperCase(),
        serial_number: formData.serial_number.trim(),
        product_id: parseInt(formData.product_id),
        client_id: formData.client_id ? parseInt(formData.client_id) : undefined,
        installation_location: formData.installation_location.trim() || undefined,
        installation_notes: formData.installation_notes.trim() || undefined,
        status: formData.status
      }

      const response = await deviceManagementApi.createDevice(deviceData)
      
      if (response.success) {
        toast({
          title: "Device Created",
          description: `Device ${deviceData.device_id} has been successfully created`,
        })
        
        // Reset form
        setFormData({
          device_id: '',
          serial_number: '',
          product_id: '',
          client_id: '',
          installation_location: '',
          installation_notes: '',
          status: 'pending_activation'
        })
        
        setIsOpen(false)
        onDeviceAdded()
      } else {
        throw new Error(response.message || 'Failed to create device')
      }
    } catch (error: any) {
      console.error('Failed to create device:', error)
      toast({
        title: "Creation Error",
        description: error.message || "Failed to create device",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateDeviceId = () => {
    const prefix = 'KY'
    const randomNum = Math.floor(Math.random() * 900) + 100 // 3 digit number
    const suggestion = `${prefix}${randomNum}`
    handleInputChange('device_id', suggestion)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Device
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Refrigerator className="h-5 w-5" />
            Add New IoT Device
          </DialogTitle>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading form data...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Device Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Device Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="device_id">Device ID *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="device_id"
                      placeholder="e.g., KY001"
                      value={formData.device_id}
                      onChange={(e) => handleInputChange('device_id', e.target.value.toUpperCase())}
                      className={errors.device_id ? 'border-red-500' : ''}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={generateDeviceId}
                    >
                      Generate
                    </Button>
                  </div>
                  {errors.device_id && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.device_id}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serial_number">Serial Number *</Label>
                  <Input
                    id="serial_number"
                    placeholder="e.g., KOYO-REF-001-001"
                    value={formData.serial_number}
                    onChange={(e) => handleInputChange('serial_number', e.target.value)}
                    className={errors.serial_number ? 'border-red-500' : ''}
                  />
                  {errors.serial_number && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.serial_number}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_id">Product *</Label>
                  <Select value={formData.product_id} onValueChange={(value) => handleInputChange('product_id', value)}>
                    <SelectTrigger className={errors.product_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} ({product.model_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.product_id && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.product_id}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending_activation">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Pending Activation</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500">Active</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="suspended">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">Suspended</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="maintenance">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-orange-500">Maintenance</Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.status}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Assignment & Installation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Assignment & Installation</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_id">Assign to Client (Optional)</Label>
                  <Select value={formData.client_id || 'unassigned'} onValueChange={(value) => handleInputChange('client_id', value === 'unassigned' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client or leave unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name} ({client.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="installation_location">Installation Location</Label>
                  <Input
                    id="installation_location"
                    placeholder="e.g., Nairobi, Kenya"
                    value={formData.installation_location}
                    onChange={(e) => handleInputChange('installation_location', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="installation_notes">Installation Notes</Label>
                <Textarea
                  id="installation_notes"
                  placeholder="Any special notes about installation, setup, or configuration..."
                  value={formData.installation_notes}
                  onChange={(e) => handleInputChange('installation_notes', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Info Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                New devices will be created in an inactive state. They will be activated automatically when a customer starts a subscription, or you can manually activate them later.
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {isLoading ? 'Creating...' : 'Create Device'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 