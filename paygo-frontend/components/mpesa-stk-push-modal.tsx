"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Smartphone, Loader2, CheckCircle, XCircle } from "lucide-react"

interface MpesaStkPushModalProps {
  isOpen: boolean
  onClose: () => void
  productName: string
  paymentAmount: number
  paymentType: string
}

export function MpesaStkPushModal({
  isOpen,
  onClose,
  productName,
  paymentAmount,
  paymentType,
}: MpesaStkPushModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState("")
  const [checkoutRequestId, setCheckoutRequestId] = useState("")

  const formatPhoneNumber = (phone: string) => {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '')
    
    // Remove leading zero if present
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1)
    }
    
    // Add country code if not present
    if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned
    }
    
    return cleaned
  }

  const generateAccountReference = () => {
    return `KOYO_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  }

  const handleStkPush = async () => {
    if (!phoneNumber) {
      setStatusMessage("Please enter your M-Pesa phone number")
      setPaymentStatus('error')
      return
    }

    const formattedPhone = formatPhoneNumber(phoneNumber)
    
    if (formattedPhone.length !== 12) {
      setStatusMessage("Please enter a valid Kenyan phone number")
      setPaymentStatus('error')
      return
    }

    setIsProcessing(true)
    setPaymentStatus('processing')
    setStatusMessage("Initiating M-Pesa payment...")

    try {
      const accountReference = generateAccountReference()
      
      const response = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: formattedPhone,
          amount: paymentAmount,
          account_reference: accountReference,
          transaction_desc: `${paymentType} - ${productName}`
        })
      })

      const data = await response.json()

      if (data.success) {
        setCheckoutRequestId(data.data.checkout_request_id)
        setStatusMessage("STK Push sent! Please check your phone and enter your M-Pesa PIN.")
        setPaymentStatus('processing')
        
        // Start polling for payment status
        pollPaymentStatus(data.data.checkout_request_id)
      } else {
        setStatusMessage(data.error || "Payment initiation failed")
        setPaymentStatus('error')
      }
    } catch (error) {
      console.error('STK Push error:', error)
      setStatusMessage("Network error. Please try again.")
      setPaymentStatus('error')
    } finally {
      setIsProcessing(false)
    }
  }

  const pollPaymentStatus = async (checkoutId: string) => {
    let attempts = 0
    const maxAttempts = 30 // Poll for 5 minutes (30 * 10 seconds)
    
    const poll = async () => {
      try {
        const response = await fetch('/api/mpesa/stk-query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            checkout_request_id: checkoutId
          })
        })

        const data = await response.json()
        
        if (data.success && data.data.ResultCode !== undefined) {
          if (data.data.ResultCode === "0") {
            // Payment successful
            setStatusMessage("Payment successful! Thank you.")
            setPaymentStatus('success')
            
            // Auto-close modal after 3 seconds
            setTimeout(() => {
              onClose()
              // Reset state
              setPaymentStatus('idle')
              setStatusMessage("")
              setPhoneNumber("")
              setCheckoutRequestId("")
            }, 3000)
          } else {
            // Payment failed or cancelled
            setStatusMessage(data.data.ResultDesc || "Payment was cancelled or failed")
            setPaymentStatus('error')
          }
        } else {
          // Still processing, continue polling
          attempts++
          if (attempts < maxAttempts) {
            setTimeout(poll, 10000) // Poll every 10 seconds
          } else {
            setStatusMessage("Payment status check timed out. Please verify manually.")
            setPaymentStatus('error')
          }
        }
      } catch (error) {
        console.error('Status check error:', error)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000)
        } else {
          setStatusMessage("Unable to verify payment status")
          setPaymentStatus('error')
        }
      }
    }

    // Start polling after 5 seconds (give time for payment to be processed)
    setTimeout(poll, 5000)
  }

  const handleClose = () => {
    setPaymentStatus('idle')
    setStatusMessage("")
    setPhoneNumber("")
    setCheckoutRequestId("")
    setIsProcessing(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Smartphone className="h-6 w-6 text-emerald-600" /> M-Pesa STK Push
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 mb-6 text-center">
          <p className="text-xl font-semibold">Payment: KSh {paymentAmount.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">
            {productName} - {paymentType}
          </p>
        </div>

        {paymentStatus !== 'idle' && (
          <Alert className={`mb-4 ${
            paymentStatus === 'success' ? 'border-green-200 bg-green-50' :
            paymentStatus === 'error' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            <div className="flex items-center gap-2">
              {paymentStatus === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
              {paymentStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {paymentStatus === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
              <AlertDescription className={
                paymentStatus === 'success' ? 'text-green-800' :
                paymentStatus === 'error' ? 'text-red-800' :
                'text-blue-800'
              }>
                {statusMessage}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="mpesa-phone">M-Pesa Phone Number</Label>
            <Input
              id="mpesa-phone"
              type="tel"
              placeholder="0712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isProcessing || paymentStatus === 'success'}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the phone number registered with M-Pesa
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <Button 
              onClick={handleStkPush} 
              disabled={isProcessing || paymentStatus === 'success' || !phoneNumber}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : paymentStatus === 'success' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Payment Successful
                </>
              ) : (
                <>
                  <Smartphone className="h-4 w-4 mr-2" />
                  Pay KSh {paymentAmount.toLocaleString()}
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isProcessing}
              className="w-full"
            >
              {paymentStatus === 'success' ? 'Close' : 'Cancel'}
            </Button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">How it works:</h4>
          <ol className="text-xs text-gray-600 space-y-1">
            <li>1. Enter your M-Pesa registered phone number</li>
            <li>2. Click "Pay" to initiate the payment</li>
            <li>3. You'll receive an STK Push on your phone</li>
            <li>4. Enter your M-Pesa PIN to complete payment</li>
            <li>5. You'll receive a confirmation SMS from M-Pesa</li>
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  )
}
