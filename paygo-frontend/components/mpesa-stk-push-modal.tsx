"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Smartphone, Loader2, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth"
import { getApiUrl } from "@/lib/api-config"

interface MpesaStkPushModalProps {
  isOpen: boolean
  onClose: () => void
  productName: string
  paymentAmount: number
  paymentType: string
  // Enhanced props for payment order
  quoteId?: string
  productId?: number
  productPrice?: number
  planType?: string
  downPaymentAmount?: number
  installmentAmount?: number
  totalInstallments?: number
  planDuration?: string
}

export function MpesaStkPushModal({
  isOpen,
  onClose,
  productName,
  paymentAmount,
  paymentType,
  quoteId = '',
  productId = 0,
  productPrice = 0,
  planType = '',
  downPaymentAmount = 0,
  installmentAmount = 0,
  totalInstallments = 0,
  planDuration = '',
}: MpesaStkPushModalProps) {
  const { toast } = useToast()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState("")
  const [checkoutRequestId, setCheckoutRequestId] = useState("")
  const [orderReference, setOrderReference] = useState("")
  const [paymentDetails, setPaymentDetails] = useState<{
    receipt: string;
    amount: number;
    orderRef: string;
    customerName: string;
    productName: string;
    paymentType: string;
    planType?: string;
    installmentAmount?: number;
    nextPaymentDate?: string;
  } | null>(null)

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

  const createPaymentOrder = async (checkoutRequestId: string, customerPhone: string) => {
    try {
      
      // Get current user data if authenticated
      let customerName = 'Guest Customer'
      let customerEmail = 'guest@example.com'
      
      try {
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser()
          if (currentUser) {
            customerName = currentUser.first_name && currentUser.last_name 
              ? `${currentUser.first_name} ${currentUser.last_name}`
              : currentUser.name || 'Registered Customer'
            customerEmail = currentUser.email
          }
        }
      } catch (userError) {
        console.log('Could not get user data, using defaults')
      }

      const paymentOrderData = {
        quote_id: quoteId || `QUOTE_${Date.now()}`,
        checkout_request_id: checkoutRequestId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        mpesa_phone_number: customerPhone,
        product_id: productId,
        product_name: productName,
        product_price: productPrice || paymentAmount,
        payment_type: paymentType === 'Down Payment' ? 'down_payment' : 
                     paymentType === 'Full Payment' ? 'full_payment' : 'installment',
        paid_amount: paymentAmount,
        plan_type: planType,
        down_payment_amount: downPaymentAmount,
        installment_amount: installmentAmount,
        total_installments: totalInstallments,
        plan_duration: planDuration,
      }

      console.log('📝 Creating payment order:', paymentOrderData)

      let createOrderUrl: string;
      try {
        createOrderUrl = await getApiUrl('/mpesa/create-payment-order');
      } catch (error) {
        console.error('❌ Failed to get API URL:', error);
        setError('Failed to load API configuration. Please check your connection and try again.');
        setIsLoading(false);
        return;
      }

      const response = await fetch(createOrderUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          ...(authService.isAuthenticated() ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {})
        },
        body: JSON.stringify(paymentOrderData)
      })

      const data = await response.json()
      
      if (data.success) {
        setOrderReference(data.data.order_reference)
        console.log('✅ Payment order created:', data.data)
      } else {
        console.error('❌ Failed to create payment order:', data)
      }
      
    } catch (error) {
      console.error('❌ Error creating payment order:', error)
    }
  }

  const handleStkPush = async () => {
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your M-Pesa phone number",
        variant: "destructive",
      })
      return
    }

    const formattedPhone = formatPhoneNumber(phoneNumber)
    
    if (formattedPhone.length !== 12) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Kenyan phone number",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setPaymentStatus('processing')
    setStatusMessage("Checking M-Pesa configuration...")

    try {
      // First, check M-Pesa configuration status
      console.log('🔧 Checking M-Pesa Configuration...')
      const configUrl = await getApiUrl('/mpesa/config-status')
      const configResponse = await fetch(configUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      })

      const configData = await configResponse.json()
      console.log('🔧 M-Pesa Configuration Status:', configData)

      if (!configData.success || !configData.data.configuration_complete) {
        console.error('❌ M-Pesa Configuration Incomplete:', configData)
        setStatusMessage("M-Pesa is not properly configured")
        setPaymentStatus('error')
        toast({
          title: "Payment System Not Ready",
          description: "M-Pesa payment system is not properly configured. Please contact support.",
          variant: "destructive",
        })
        return
      }

      if (configData.data.access_token_test !== 'success') {
        console.error('❌ M-Pesa Access Token Test Failed:', configData)
        setStatusMessage("Failed to connect to M-Pesa")
        setPaymentStatus('error')
        toast({
          title: "M-Pesa Connection Error",
          description: "Cannot connect to M-Pesa services. Please try again later.",
          variant: "destructive",
        })
        return
      }

      console.log('✅ M-Pesa Configuration Verified - Proceeding with payment')
      setStatusMessage("Initiating M-Pesa payment...")

      const accountReference = generateAccountReference()
      
      // Ensure amount is a whole number (M-Pesa doesn't accept decimals)
      const wholeAmount = Math.round(paymentAmount)
      
      let stkPushUrl: string;
      try {
        stkPushUrl = await getApiUrl('/mpesa/stk-push');
      } catch (error) {
        console.error('❌ Failed to get STK Push URL:', error);
        setError('Failed to load API configuration. Please check your connection and try again.');
        setIsLoading(false);
        return;
      }
      
      console.log('🔄 Initiating M-Pesa STK Push:', {
        phone_number: formattedPhone,
        amount: wholeAmount,
        account_reference: accountReference,
        api_url: stkPushUrl
      })
      
      const response = await fetch(stkPushUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          phone_number: formattedPhone,
          amount: wholeAmount,
          account_reference: accountReference,
          transaction_desc: `${paymentType} - ${productName}`
        })
      })

      const data = await response.json()
      
      console.log('📡 M-Pesa STK Push API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      })

      // Check if the request failed completely (success: false)
      if (data.success === false) {
        console.error('❌ STK Push Request Failed:', data)
        const errorMessage = data.error || "Payment request failed"
        setStatusMessage(errorMessage)
        setPaymentStatus('error')
        toast({
          title: "Payment Request Failed",
          description: errorMessage,
          variant: "destructive",
        })
        return
      }

      // Validate we have the expected successful response structure
      if (!data.success || !data.data || !data.data.response_code) {
        console.error('❌ Invalid STK Push response structure:', data)
        setStatusMessage("Invalid response from payment service")
        setPaymentStatus('error')
        toast({
          title: "Payment System Error", 
          description: "Received invalid response from payment service",
          variant: "destructive",
        })
        return
      }

      // Log the M-Pesa immediate response details for debugging
      console.log('🔍 M-Pesa STK Push Immediate Response:', {
        merchant_request_id: data.data.merchant_request_id,
        checkout_request_id: data.data.checkout_request_id,
        response_code: data.data.response_code,
        response_description: data.data.response_description,
        customer_message: data.data.customer_message
      })
      
      // Show response structure to user for transparency
      console.log('📋 Expected M-Pesa Response Structure:', {
        example: {
          "MerchantRequestID": "6c18-4011-b59a-13f0511045e611589",
          "CheckoutRequestID": "ws_CO_21072025160920038708374149", 
          "ResponseCode": "0",
          "ResponseDescription": "Success. Request accepted for processing",
          "CustomerMessage": "Success. Request accepted for processing"
        }
      })

      // Check M-Pesa ResponseCode from immediate response
      if (data.data.response_code === "0") {
        // ✅ STK Push accepted by M-Pesa (ResponseCode = "0")
        setCheckoutRequestId(data.data.checkout_request_id)
        setStatusMessage("✅ Request accepted! M-Pesa prompt sent to your phone...")
        setPaymentStatus('processing')
        
        console.log('✅ M-Pesa STK Push Accepted - Full Response:', {
          merchant_request_id: data.data.merchant_request_id,
          checkout_request_id: data.data.checkout_request_id,
          response_code: data.data.response_code,
          response_description: data.data.response_description,
          customer_message: data.data.customer_message
        })
        
        // Show success feedback with M-Pesa's exact message
        toast({
          title: "✅ STK Push Sent Successfully!",
          description: data.data.customer_message || data.data.response_description,
          variant: "default",
        })
        
        // Create payment order
        await createPaymentOrder(data.data.checkout_request_id, formattedPhone)
        
        // Now wait for user to complete payment (M-Pesa callback will come later)
        setTimeout(() => {
          setStatusMessage("Waiting for you to complete payment on your phone...")
          waitForCallback(data.data.checkout_request_id)
        }, 2000) // Give user 2 seconds to see the success message
        
      } else {
        // ❌ STK Push rejected by M-Pesa (ResponseCode ≠ "0")
        // When STK Push fails, M-Pesa still returns the same structure but with different ResponseCode
        // Example failed response:
        // {
        //   "MerchantRequestID": "...",
        //   "CheckoutRequestID": "...", 
        //   "ResponseCode": "1", // or other error code
        //   "ResponseDescription": "Insufficient funds",
        //   "CustomerMessage": "Insufficient funds in account"
        // }
        
        console.error('❌ M-Pesa STK Push Rejected - Full Response:', {
          merchant_request_id: data.data.merchant_request_id,
          checkout_request_id: data.data.checkout_request_id,
          response_code: data.data.response_code,
          response_description: data.data.response_description,
          customer_message: data.data.customer_message
        })
        
        const errorMessage = data.data.response_description || data.data.customer_message || "M-Pesa rejected the payment request"
        setStatusMessage(`❌ Request rejected: ${errorMessage}`)
        setPaymentStatus('error')
        
        toast({
          title: "❌ M-Pesa Request Rejected",
          description: `${errorMessage} (Code: ${data.data.response_code})`,
          variant: "destructive",
        })
        
        // No callback expected when STK Push is rejected (ResponseCode ≠ "0")
      }
    } catch (error) {
      console.error('❌ STK Push network error:', error)
      setStatusMessage("Network error. Please check your connection and try again.")
      setPaymentStatus('error')
      
      toast({
        title: "Network Error",
        description: "Unable to connect to payment service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const waitForCallback = async (checkoutId: string) => {
    console.log('⏳ STEP 2: STK Push was accepted (ResponseCode=0), now waiting for payment completion callback:', checkoutId)
    console.log('📱 User should now see M-Pesa prompt on their phone and enter PIN...')
    
    // STEP 1 ✅ COMPLETED: STK Push response processed (ResponseCode=0)
    // STEP 2 🔄 IN PROGRESS: Waiting for user to complete payment and M-Pesa callback
    let attempts = 0
    const maxAttempts = 12 // Check for 2 minutes (12 * 10 seconds)
    
    const checkCallbackResult = async () => {
      try {
        let orderStatusUrl: string;
        try {
          orderStatusUrl = await getApiUrl('/mpesa/payment-order-status');
        } catch (error) {
          console.error('❌ Failed to get order status URL:', error);
          setError('Failed to load API configuration. Please check your connection and try again.');
          setIsLoading(false);
          return;
        }
        
        console.log('🔍 Checking M-Pesa callback result:', {
          checkout_request_id: checkoutId,
          attempt: attempts + 1
        })
        
        const response = await fetch(orderStatusUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({
            checkout_request_id: checkoutId
          })
        })

        const result = await response.json()
        
        if (result.success && result.payment_confirmed && result.data.transaction) {
          const transaction = result.data.transaction
          const order = result.data.order
          
          if (transaction.result_code === 0) {
            // Payment successful - callback received
            const nextPaymentDate = paymentType === 'Down Payment' && installmentAmount > 0 
              ? new Date(Date.now() + (planType === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000)
              : null
            
            setPaymentDetails({
              receipt: transaction.mpesa_receipt_number,
              amount: transaction.amount || paymentAmount,
              orderRef: order?.order_reference || `KOYO-${Date.now()}`,
              customerName: order?.customer_name || 'Customer',
              productName: order?.product_name || productName,
              paymentType: paymentType,
              planType: planType,
              installmentAmount: installmentAmount,
              nextPaymentDate: nextPaymentDate?.toLocaleDateString('en-GB') || undefined
            })
            
            setStatusMessage(`Payment successful! M-Pesa callback confirmed.`)
            setPaymentStatus('success')
            
            toast({
              title: "Payment Confirmed! 🎉",
              description: `Receipt: ${transaction.mpesa_receipt_number}`,
              variant: "default",
            })
            
            return // Success - stop checking
            
          } else {
            // Payment failed - callback received with error
            setStatusMessage(transaction.result_desc || "Payment failed")
            setPaymentStatus('error')
            
            toast({
              title: "Payment Failed",
              description: transaction.result_desc || "Payment was not successful",
              variant: "destructive",
            })
            
            return // Failed - stop checking
          }
        }
        
        // No callback yet - continue waiting (STK was sent successfully, ResponseCode=0)
        attempts++
        if (attempts < maxAttempts) {
          setStatusMessage(`Waiting for payment completion... Please enter M-Pesa PIN on your phone (${attempts}/${maxAttempts})`)
          setTimeout(checkCallbackResult, 10000) // Check every 10 seconds
        } else {
          // Timeout - but payment might still be processing
          setStatusMessage("No payment confirmation received. Check your M-Pesa messages or contact support.")
          setPaymentStatus('error')
          
          toast({
            title: "Payment Confirmation Timeout",
            description: "We didn't receive payment confirmation from M-Pesa. Check your messages or contact support if payment was made.",
            variant: "destructive",
          })
        }
        
      } catch (error) {
        console.error('Callback check error:', error)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkCallbackResult, 10000)
        } else {
          setStatusMessage("Unable to check payment status. Please verify with M-Pesa.")
          setPaymentStatus('error')
        }
      }
    }

    // Start checking for callback result
    setTimeout(checkCallbackResult, 5000) // Wait 5 seconds before first check
  }

  const handleClose = () => {
    if (!isProcessing) {
      onClose()
      // Reset all state
      setPaymentStatus('idle')
      setStatusMessage("")
      setPhoneNumber("")
      setCheckoutRequestId("")
      setOrderReference("")
      setPaymentDetails(null)
    }
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
          <p className="text-xl font-semibold">Payment: KSh {Math.round(paymentAmount).toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">
            {productName} - {paymentType}
          </p>
        </div>

        {(statusMessage || paymentStatus !== 'idle') && (
          <Alert className={`
            ${paymentStatus === 'success' ? 'border-green-500 bg-green-50' : 
              paymentStatus === 'error' ? 'border-red-500 bg-red-50' : 
              'border-blue-500 bg-blue-50'}
          `}>
            {paymentStatus === 'success' && paymentDetails ? (
              // Comprehensive Payment Success Display
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="font-semibold text-green-800 text-lg">Payment Successful!</div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="text-green-800 font-medium mb-2">
                    Your {paymentDetails.paymentType.toLowerCase()} of KSh {Math.round(paymentDetails.amount).toLocaleString()} has been processed successfully.
                  </div>
                  
                  <div className="space-y-3 mt-4">
                    <div className="font-semibold text-gray-800 mb-2">What happens next?</div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                        <span>Your KOYO fridge will be delivered within 3-5 business days</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                        <span>Our technician will install and activate your device</span>
                      </li>
                      {paymentDetails.paymentType === 'Down Payment' && paymentDetails.installmentAmount && paymentDetails.nextPaymentDate && (
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                          <span>Your first monthly payment of KSh {Math.round(paymentDetails.installmentAmount).toLocaleString()} is due on {paymentDetails.nextPaymentDate}</span>
                        </li>
                      )}
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                        <span>You'll receive SMS reminders before each payment</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Receipt:</span>
                        <div className="font-mono font-medium">{paymentDetails.receipt}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Order Ref:</span>
                        <div className="font-mono font-medium">{paymentDetails.orderRef}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Standard status message for processing/error states
              <div className="flex items-center gap-2">
                {paymentStatus === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
                {paymentStatus === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                <AlertDescription className={
                  paymentStatus === 'error' ? 'text-red-800' : 'text-blue-800'
                }>
                  {statusMessage}
                </AlertDescription>
              </div>
            )}
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
                  Pay KSh {Math.round(paymentAmount).toLocaleString()}
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
