"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Refrigerator, Save, X } from "lucide-react"

interface RegisterApplianceModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RegisterApplianceModal({ isOpen, onClose }: RegisterApplianceModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    serialNumber: "",
    unitId: "",
    model: "",
    type: "",
    location: "",
    installationDate: "",
    notes: ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const generateUnitId = () => {
    const timestamp = Date.now().toString().slice(-4)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const unitId = `UNIT-${timestamp}${random}`
    handleInputChange("unitId", unitId)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.serialNumber || !formData.unitId || !formData.model || !formData.type || !formData.location) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Simulate saving appliance
    toast({
      title: "Appliance Registered! 🔌",
      description: `Appliance ${formData.unitId} registered successfully!`,
      variant: "default",
    })
    
    // Reset form and close modal
    setFormData({
      serialNumber: "",
      unitId: "",
      model: "",
      type: "",
      location: "",
      installationDate: "",
      notes: ""
    })
    onClose()
  }

  const handleClose = () => {
    setFormData({
      serialNumber: "",
      unitId: "",
      model: "",
      type: "",
      location: "",
      installationDate: "",
      notes: ""
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Refrigerator className="h-6 w-6 text-purple-600" />
            Register New Appliance
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Device Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Device Information</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="serialNumber">Serial Number *</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => handleInputChange("serialNumber", e.target.value)}
                  placeholder="Enter device serial number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="unitId">Unit ID *</Label>
                <div className="flex gap-2">
                  <Input
                    id="unitId"
                    value={formData.unitId}
                    onChange={(e) => handleInputChange("unitId", e.target.value)}
                    placeholder="UNIT-001"
                    required
                  />
                  <Button type="button" variant="outline" onClick={generateUnitId}>
                    Generate
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="type">Device Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fridge">Fridge</SelectItem>
                    <SelectItem value="Freezer">Freezer</SelectItem>
                    <SelectItem value="Refrigerator">Refrigerator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="model">Device Model *</Label>
                <Select value={formData.model} onValueChange={(value) => handleInputChange("model", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KOYO BC-90DC">KOYO BC-90DC Fridge</SelectItem>
                    <SelectItem value="KOYO BC-50DC">KOYO BC-50DC Fridge</SelectItem>
                    <SelectItem value="KOYO BC-118DC">KOYO BC-118DC Freezer</SelectItem>
                    <SelectItem value="KOYO LC-218DC">KOYO LC-218DC Fridge</SelectItem>
                    <SelectItem value="KOYO BC-268DC">KOYO BC-268DC Freezer</SelectItem>
                    <SelectItem value="KOYO BC-308DC">KOYO BC-308DC Freezer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Installation Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Installation Information</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="location">Installation Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="e.g., Nairobi, Kenya"
                  required
                />
              </div>
              <div>
                <Label htmlFor="installationDate">Installation Date</Label>
                <Input
                  id="installationDate"
                  type="date"
                  value={formData.installationDate}
                  onChange={(e) => handleInputChange("installationDate", e.target.value)}
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Installation Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes about the installation or device"
                rows={3}
              />
            </div>
          </div>

          {/* Configuration Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Configuration Preview</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Device:</span>
                  <span className="font-medium">{formData.model || "Not selected"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unit ID:</span>
                  <span className="font-medium">{formData.unitId || "Not generated"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{formData.location || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-orange-600">Pending Activation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
              <Save className="h-4 w-4 mr-2" />
              Register Appliance
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 