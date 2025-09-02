"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Copy, CheckCircle, AlertCircle, Loader2, Smartphone, Building2, X, Info } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { paybillApi } from "@/lib/api"

const formatKshAmount = (amount: number) => {
  return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface PaybillPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  productName: string
  paymentAmount: number
  paymentType: 'down_payment' | 'installment'
  customerDeviceId: string
  customerOrderId?: string | null
  customerPlanId?: string | null
  onPaymentSuccess?: () => void
  onPaymentError?: (error: string) => void
}

// PayBill payment statuses - similar to STK Push
type PaymentStatus = 'idle' | 'processing' | 'success' | 'error'

interface PaymentDetails {
  receipt: string
  amount: number
  deviceId: string
  transactionId: string
}

// Static business info (same as config/mpesa.php -> business_info)
const BUSINESS_INFO = {
  business_name: "KOYO PayGo Platform",
  paybill_number: "174379",
  account_reference_format: "Device ID (e.g., KY123456)",
  minimum_amount: 1,
  maximum_amount: 500000,
  instructions: [
    "Go to M-Pesa menu on your phone",
    "Select Lipa na M-Pesa",
    "Select Pay Bill",
    "Enter Business Number: 174379",
    "Enter Account Number: Your Device ID",
    "Enter Amount and confirm payment"
  ],
  description: "PayGo appliance installment payments",
  contact_email: "payments@koyo.co.ke",
  contact_phone: "+254700000000"
}

export function PaybillPaymentModal({
  isOpen,
  onClose,
  productName,
  paymentAmount,
  paymentType,
  customerDeviceId,
  customerOrderId = null,
  customerPlanId = null,
  onPaymentSuccess,
  onPaymentError
}: PaybillPaymentModalProps) {

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [pollTimeoutId, setPollTimeoutId] = useState<NodeJS.Timeout | null>(null)

  // Real-time C2B payment monitoring
  const startPaymentMonitoring = async (deviceId: string, amount: number) => {
    setIsPolling(true)
    setPaymentStatus('processing')
    setStatusMessage("Waiting for your M-Pesa payment...")

    const maxAttempts = 120 // 10 minutes (5 second intervals)
    let attempts = 0
    const startTime = new Date().toISOString()

    const pollForPayment = async (): Promise<void> => {
      try {
        attempts++
        console.log(`🔍 Polling for payment (attempt ${attempts}/${maxAttempts})...`)

        // Check C2B transactions first (direct from Safaricom)
        const c2bResponse = await paybillApi.checkC2BTransaction(deviceId, amount, startTime)
        
        if (c2bResponse.success && c2bResponse.found && c2bResponse.transaction) {
          console.log('💰 C2B Payment found!', c2bResponse.transaction)
          
          setPaymentDetails({
            receipt: c2bResponse.transaction.trans_id || `C2B_${Date.now()}`,
            amount: c2bResponse.transaction.amount,
            deviceId: deviceId,
            transactionId: c2bResponse.transaction.trans_id || `C2B_${Date.now()}`
          })
          
          setStatusMessage("Payment confirmed via M-Pesa!")
          setPaymentStatus('success')
          
          toast({
            title: "Payment Confirmed! 🎉",
            description: `M-Pesa Receipt: ${c2bResponse.transaction.trans_id}`,
            variant: "default",
          })
          
          // Stop polling and call success callback
          setIsPolling(false)
          if (pollTimeoutId) {
            clearTimeout(pollTimeoutId)
            setPollTimeoutId(null)
          }
          
          // Call success callback and close modal after a delay
          setTimeout(() => {
            onPaymentSuccess?.()
            onClose()
          }, 3000)
          return
        }

        // Fallback: Check paybill transactions
        const paybillResponse = await paybillApi.checkPaymentStatus(deviceId)
        if (paybillResponse.success && paybillResponse.data.latest_payment) {
          const payment = paybillResponse.data.latest_payment
          
          // Check if payment amount matches and is recent
          const amountMatches = Math.abs(payment.trans_amount - amount) < 0.01
          const isRecent = new Date(payment.created_at) > new Date(startTime)
          
          if (amountMatches && isRecent && payment.status === 'processed') {
            console.log('💰 Paybill Payment found!', payment)
            
            setPaymentDetails({
              receipt: payment.mpesa_receipt_number || `PAY_${Date.now()}`,
              amount: payment.trans_amount,
              deviceId: deviceId,
              transactionId: payment.trans_id || `PAY_${Date.now()}`
            })
            
            setStatusMessage("Payment confirmed via PayBill!")
            setPaymentStatus('success')
            
            toast({
              title: "Payment Confirmed! 🎉",
              description: `Receipt: ${payment.mpesa_receipt_number}`,
              variant: "default",
            })
            
            // Stop polling and call success callback
            setIsPolling(false)
            if (pollTimeoutId) {
              clearTimeout(pollTimeoutId)
              setPollTimeoutId(null)
            }
            
            // Call success callback and close modal after a delay
            setTimeout(() => {
              onPaymentSuccess?.()
              onClose()
            }, 3000)
            return
          }
        }

        // Continue polling if no payment found and within max attempts
        if (attempts < maxAttempts && isPolling) {
          const timeoutId = setTimeout(pollForPayment, 5000) // Poll every 5 seconds
          setPollTimeoutId(timeoutId)
        } else if (attempts >= maxAttempts) {
          setIsPolling(false)
          if (pollTimeoutId) {
            clearTimeout(pollTimeoutId)
            setPollTimeoutId(null)
          }
          
          setStatusMessage("Payment monitoring timeout. Please verify manually.")
          setPaymentStatus('error')
          
          toast({
            title: "Monitoring Timeout",
            description: "Payment not detected within 10 minutes. Please check manually.",
            variant: "destructive",
          })
        }

      } catch (error) {
        console.error('Payment monitoring error:', error)
        
        if (attempts < maxAttempts && isPolling) {
          // Retry on error with longer interval
          const timeoutId = setTimeout(pollForPayment, 10000)
          setPollTimeoutId(timeoutId)
        } else {
          setIsPolling(false)
          if (pollTimeoutId) {
            clearTimeout(pollTimeoutId)
            setPollTimeoutId(null)
          }
          
          setStatusMessage("Error checking payment status")
          setPaymentStatus('error')
          
          toast({
            title: "Error",
            description: "Failed to check payment status",
            variant: "destructive",
          })
        }
      }
    }

    // Start polling
    pollForPayment()
  }

  // Start monitoring when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaymentStatus('idle')
      setStatusMessage('Complete your M-Pesa payment using the details below')
      setPaymentDetails(null)
      setIsPolling(false)
      setPollTimeoutId(null)
      
      // Start monitoring for payment after a brief delay
      const timer = setTimeout(() => {
        startPaymentMonitoring(customerDeviceId, paymentAmount)
      }, 3000) // Give user time to see the instructions

      // Cleanup timer if modal closes before timeout
      return () => {
        clearTimeout(timer)
        setIsPolling(false)
        if (pollTimeoutId) {
          clearTimeout(pollTimeoutId)
          setPollTimeoutId(null)
        }
      }
    } else {
      // Modal is closing, stop polling
      setIsPolling(false)
      if (pollTimeoutId) {
        clearTimeout(pollTimeoutId)
        setPollTimeoutId(null)
      }
    }
  }, [isOpen, customerDeviceId, paymentAmount, pollTimeoutId])

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: `${label} copied successfully`,
      })
    }).catch(() => {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive",
      })
    })
  }, [])

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Smartphone className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadgeVariant = () => {
    switch (paymentStatus) {
      case 'processing':
        return 'secondary'
      case 'success':
        return 'default'
      case 'error':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-6 w-6 text-green-600" />
            Pay with M-Pesa PayBill
          </DialogTitle>
          <DialogDescription className="text-base">
            Make your payment using M-Pesa PayBill. The system will automatically detect your payment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Amount Display */}
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">Payment: {formatKshAmount(paymentAmount)}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {productName} - {paymentType === 'down_payment' ? 'Down Payment' : 'Installment'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Business Name</Label>
                  <p className="font-semibold">{BUSINESS_INFO.business_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">PayBill Number</Label>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-2xl text-green-600">{BUSINESS_INFO.paybill_number}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(BUSINESS_INFO.paybill_number, 'PayBill Number')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Number (Device ID) - Read Only */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-purple-600" />
                Account Number (Device ID)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label htmlFor="deviceId">Your Device ID</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="deviceId"
                    value={customerDeviceId}
                    readOnly
                    className="font-mono bg-gray-50"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(customerDeviceId, 'Device ID')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  ℹ️ Use this exact Device ID as the Account Number when making your M-Pesa payment
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-green-600" />
                M-Pesa Payment Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="space-y-2">
                  {[
                    "Go to M-Pesa menu on your phone",
                    "Select 'Lipa na M-Pesa'", 
                    "Select 'Pay Bill'",
                    `Enter Business Number: ${BUSINESS_INFO.paybill_number}`,
                    `Enter Account Number: ${customerDeviceId}`,
                    `Enter Amount: ${formatKshAmount(paymentAmount)}`,
                    "Enter your M-Pesa PIN",
                    "Confirm the payment details", 
                    "Press OK to send",
                    "Wait for confirmation SMS from M-Pesa"
                  ].map((instruction, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-sm">{instruction}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800">
                  PayBill Number: <span className="font-bold text-lg">{BUSINESS_INFO.paybill_number}</span>
                </p>
                <p className="text-sm font-medium text-blue-800">
                  Account Number: <span className="font-mono">{customerDeviceId}</span>
                </p>
                <p className="text-sm font-medium text-blue-800">
                  Amount: <span className="font-bold">{formatKshAmount(paymentAmount)}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Payment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className="font-medium">{statusMessage}</span>
                </div>
                <Badge variant={getStatusBadgeVariant()}>
                  {paymentStatus.toUpperCase()}
                </Badge>
              </div>

              {paymentDetails && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">Payment Confirmed!</h4>
                  <div className="space-y-1 text-sm text-green-700">
                    <p><strong>Receipt:</strong> {paymentDetails.receipt}</p>
                    <p><strong>Amount:</strong> {formatKshAmount(paymentDetails.amount)}</p>
                    <p><strong>Device ID:</strong> {paymentDetails.deviceId}</p>
                    <p><strong>Transaction ID:</strong> {paymentDetails.transactionId}</p>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <Info className="h-4 w-4 inline mr-1" />
                  Complete your M-Pesa payment and wait for automatic confirmation. The system is actively monitoring for your payment.
                </p>
                {isPolling && (
                  <p className="text-xs text-blue-600 mt-1">
                    🔍 Monitoring M-Pesa transactions every 5 seconds...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PaybillPaymentModal 