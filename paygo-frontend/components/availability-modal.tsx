"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Calendar,
  Clock, 
  CheckCircle, 
  AlertCircle,
  Truck,
  Phone,
  Loader2,
  MapIcon,
  DollarSign
} from 'lucide-react'
import { productApi, type AvailabilityCheck, type AvailabilityResponse } from '@/lib/api'

interface AvailabilityModalProps {
  productId: number
  productName: string
  children: React.ReactNode
}

export function AvailabilityModal({ productId, productName, children }: AvailabilityModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [location, setLocation] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AvailabilityResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheck = async () => {
    if (!location.trim()) {
      setError('Please enter your location')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const checkData: AvailabilityCheck = {
        location: location.trim(),
        postal_code: postalCode.trim() || undefined
      }

      const response = await productApi.checkAvailability(productId, checkData)
      
      if (response.success) {
        setResult(response.data)
      } else {
        setError('Failed to check availability. Please try again.')
      }
    } catch (err) {
      console.error('Availability check error:', err)
      setError('Unable to check availability at this time. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setLocation('')
    setPostalCode('')
    setResult(null)
    setError(null)
    setLoading(false)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      resetModal()
    }
  }

  const formatDeliveryTime = (days: number) => {
    if (days <= 1) return 'Next day'
    if (days <= 3) return `${days} days`
    if (days <= 7) return '1 week'
    return `${Math.ceil(days / 7)} weeks`
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-600" />
            Check Availability
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Checking availability for:</p>
            <p className="font-medium text-gray-900">{productName}</p>
          </div>

          {/* Location Form */}
          {!result && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="location">Location / City *</Label>
                <Input
                  id="location"
                  placeholder="e.g., Nairobi, Mombasa, Kisumu"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="postalCode">Postal Code (Optional)</Label>
                <Input
                  id="postalCode"
                  placeholder="e.g., 00100"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="mt-1"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button 
                onClick={handleCheck}
                disabled={loading || !location.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <MapIcon className="h-4 w-4 mr-2" />
                    Check Availability
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Availability Status */}
              <Card className={result.available ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    {result.available ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className={`font-semibold ${result.available ? 'text-green-900' : 'text-red-900'}`}>
                        {result.available ? 'Available in your area!' : 'Currently unavailable'}
                      </p>
                      <p className={`text-sm ${result.available ? 'text-green-700' : 'text-red-700'}`}>
                        {result.available 
                          ? `Delivery to ${location}` 
                          : 'We don\'t currently serve this area'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {result.available && (
                <>
                  {/* Delivery Information */}
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <h4 className="font-semibold text-gray-900">Delivery Information</h4>
                      
                      <div className="flex items-center gap-3">
                        <Truck className="h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="text-sm font-medium">Estimated Delivery</p>
                          <p className="text-sm text-gray-600">
                            {formatDeliveryTime(result.estimated_delivery_days)} 
                            ({result.estimated_delivery_days} business days)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="text-sm font-medium">Delivery Cost</p>
                          <p className="text-sm text-gray-600">
                            {result.delivery_cost_usd > 0 
                              ? `$${result.delivery_cost_usd}` 
                              : 'Free delivery'
                            }
                          </p>
                        </div>
                      </div>

                      {result.installation_available && (
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-emerald-600" />
                          <div>
                            <p className="text-sm font-medium">Installation</p>
                            <p className="text-sm text-gray-600">
                              Available - ${result.installation_cost_usd}
                              {result.installation_cost_usd === 0 && ' (Free)'}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Service Center */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Nearest Service Center</h4>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-emerald-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{result.nearest_service_center.name}</p>
                            <p className="text-sm text-gray-600">{result.nearest_service_center.address}</p>
                            <p className="text-sm text-gray-500">
                              {result.nearest_service_center.distance_km.toFixed(1)} km away
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-emerald-600" />
                          <p className="text-sm text-gray-600">{result.nearest_service_center.phone}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Installation Slots */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Available Installation Slots</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {['Mon-Fri 9-12', 'Mon-Fri 2-5', 'Sat 9-12', 'Sat 2-5'].map((slot, idx) => (
                          <Badge key={idx} variant="outline" className="justify-center">
                            {slot}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Installation typically takes 1-2 hours
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={resetModal}
                  className="flex-1"
                >
                  Check Another Location
                </Button>
                {result.available && (
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => setIsOpen(false)}
                  >
                    Proceed to Order
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 