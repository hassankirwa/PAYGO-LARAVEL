"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Hash, 
  Copy, 
  CheckCircle, 
  RefreshCw, 
  CreditCard, 
  Info,
  Clock,
  Building2,
  Search
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getApiUrl } from "@/lib/api-config"
import { PaymentVerificationModal } from "@/components/payment-verification-modal"

interface PaybillPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  productName: string
  paymentAmount: number
  paymentType: string
  // PayGo Plan Details
  quoteId?: string
  productId?: number
  productPrice?: number
  planType?: string
  downPaymentAmount?: number
  installmentAmount?: number
  totalInstallments?: number
  planDuration?: string
  // Customer/Device info (legacy props for backward compatibility)
  deviceId?: string
  customerName?: string
  customerPhone?: string
}

interface PaybillInfo {
  paybill_number: string
  business_name: string
  account_reference_format: string
  minimum_amount: number
  maximum_amount: number
  instructions: string[]
}

export function PaybillPaymentModal({
  isOpen,
  onClose,
  productName,
  paymentAmount,
  paymentType,
  quoteId,
  productId,
  productPrice,
  planType,
  downPaymentAmount,
  installmentAmount,
  totalInstallments,
  planDuration,
  deviceId = '',
  customerName = '',
  customerPhone = '',
}: PaybillPaymentModalProps) {
  const { toast } = useToast()
  const [paybillInfo, setPaybillInfo] = useState<PaybillInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [customerDeviceId, setCustomerDeviceId] = useState(deviceId || '')
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'confirmed' | 'failed'>('pending')
  const [showVerificationModal, setShowVerificationModal] = useState(false)

  // Load Paybill information when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPaybillInfo()
      // Generate device ID if not provided
      if (!deviceId) {
        setCustomerDeviceId(generateDeviceId())
      }
    }
  }, [isOpen, deviceId])

  const loadPaybillInfo = async () => {
    try {
      setLoading(true)
      const url = await getApiUrl('/paybill/info')
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      })

      const data = await response.json()
      
      if (data.success) {
        setPaybillInfo(data.data)
      } else {
        throw new Error(data.error || 'Failed to load Paybill information')
      }
    } catch (error) {
      console.error('Error loading Paybill info:', error)
      toast({
        title: "Error",
        description: "Failed to load payment information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateDeviceId = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    return `KOYO_${timestamp}_${random}`
  }

  const copyToClipboard = async (text: string, description: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${description} copied to clipboard`,
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy the text manually",
        variant: "destructive",
      })
    }
  }

  const checkPaymentStatus = async () => {
    if (!customerDeviceId) {
      toast({
        title: "Device ID Required",
        description: "Please enter your KOYO device ID",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCheckingPayment(true)
      setPaymentStatus('checking')

      const url = await getApiUrl(`/paybill/transactions?device_id=${customerDeviceId}&from_date=${new Date().toISOString().split('T')[0]}`)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      })

      const data = await response.json()
      
      if (data.success && data.data.length > 0) {
        // Check if there's a recent payment for this device
        const recentPayment = data.data.find((transaction: any) => 
          transaction.device_id === customerDeviceId &&
          transaction.trans_amount >= paymentAmount &&
          transaction.processed
        )

        if (recentPayment) {
          setPaymentStatus('confirmed')
          toast({
            title: "Payment Confirmed! ✅",
            description: `Payment of KSh ${recentPayment.trans_amount} received for device ${customerDeviceId}`,
          })
        } else {
          setPaymentStatus('pending')
          toast({
            title: "Payment Not Found",
            description: "No recent payment found. Please ensure you've completed the payment.",
            variant: "destructive",
          })
        }
      } else {
        setPaymentStatus('pending')
        toast({
          title: "Payment Not Found",
          description: "No payment found for this device ID. Please check your payment and try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
      setPaymentStatus('failed')
      toast({
        title: "Check Failed",
        description: "Failed to check payment status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCheckingPayment(false)
    }
  }

  const formatKshAmount = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading payment information...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Hash className="h-6 w-6 text-emerald-600" />
            Pay with M-Pesa Paybill
          </DialogTitle>
        </DialogHeader>

        {paybillInfo && (
          <div className="space-y-6 mt-4">
            {/* Payment Summary */}
            <Card className="border-emerald-200">
              <CardContent className="p-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">{paymentType}</h3>
                  <p className="text-sm text-gray-600 mb-2">{productName}</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatKshAmount(paymentAmount)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Device ID Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Your KOYO Device ID
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="device-id">Device ID (Account Number)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="device-id"
                      value={customerDeviceId}
                      onChange={(e) => setCustomerDeviceId(e.target.value)}
                      placeholder="KOYO_XXXXXXXXXX"
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(customerDeviceId, 'Device ID')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    This is your unique KOYO device identifier. Use this as the Account Number when making your payment.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Payment Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">M-Pesa Paybill Payment Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Paybill Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Business Number</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={paybillInfo.paybill_number}
                        readOnly
                        className="font-mono text-lg font-bold"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(paybillInfo.paybill_number, 'Paybill Number')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Account Number</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={customerDeviceId}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(customerDeviceId, 'Account Number')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Step by Step Instructions */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Step-by-step instructions:</h4>
                  <ol className="space-y-2 text-sm">
                    {paybillInfo.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="bg-emerald-100 text-emerald-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">
                          {index + 1}
                        </span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Amount reminder */}
                <Alert className="border-emerald-200 bg-emerald-50">
                  <CreditCard className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Amount to Pay: {formatKshAmount(paymentAmount)}</strong>
                    <br />
                    <span className="text-sm text-gray-600">
                      Minimum: {formatKshAmount(paybillInfo.minimum_amount)} | 
                      Maximum: {formatKshAmount(paybillInfo.maximum_amount)}
                    </span>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Payment Status Check */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Payment Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    After completing your M-Pesa payment, click the button below to check if your payment has been received.
                  </p>
                  
                  <Button
                    onClick={checkPaymentStatus}
                    disabled={isCheckingPayment || !customerDeviceId}
                    className="w-full"
                    variant={paymentStatus === 'confirmed' ? 'default' : 'outline'}
                  >
                    {isCheckingPayment ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Checking Payment...
                      </>
                    ) : paymentStatus === 'confirmed' ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Payment Confirmed!
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Check Payment Status
                      </>
                    )}
                  </Button>

                  {paymentStatus === 'confirmed' && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Payment Successful!</strong>
                        <br />
                        Your payment has been confirmed and your device will be activated shortly.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Verification Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Payment Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Check your payment verification status using your M-Pesa transaction ID.
                  </p>
                  
                  <Button
                    onClick={() => setShowVerificationModal(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Check Payment Verification Status
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Close Button */}
            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                {paymentStatus === 'confirmed' ? 'Continue' : 'Cancel'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Payment Verification Modal */}
      <PaymentVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
      />
    </Dialog>
  )
} 