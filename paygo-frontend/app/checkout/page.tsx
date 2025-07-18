"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  CheckCircle, 
  Loader2, 
  CreditCard, 
  Smartphone,
  ShieldCheck,
  Clock,
  AlertCircle,
  Building2,
  Hash
} from "lucide-react"
import Link from "next/link"
import { MpesaStkPushModal } from "@/components/mpesa-stk-push-modal"

interface PaymentPlan {
  id: string
  productId: number
  productName: string
  productPrice: number
  frequency: string
  installmentAmount: number
  downPayment: number
  planDuration: string
  totalInstallments: number
  totalCost: number
}

type PaymentMethod = 'stk-push' | 'till-number' | 'card' | 'cash'

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan')
  
  const [plan, setPlan] = useState<PaymentPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stk-push')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [showMpesaModal, setShowMpesaModal] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  
  // Payment form states
  const [tillNumber, setTillNumber] = useState("5174379") // Default KOYO till number
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: ""
  })
  
  // Mock plan data - in real app, this would come from API
  useEffect(() => {
    if (planId) {
      // Simulate API call to get plan details
      setTimeout(() => {
        setPlan({
          id: planId,
          productId: 1,
          productName: "KOYO BC-50DC FRIDGE, SINGLE DOOR WITH FREEZER CHAMBER",
          productPrice: 805.00,
          frequency: "monthly",
          installmentAmount: 60.38,
          downPayment: 80.50,
          planDuration: "1 year",
          totalInstallments: 12,
          totalCost: 805.00
        })
        setLoading(false)
      }, 1000)
    } else {
      setError("No payment plan found")
      setLoading(false)
    }
  }, [planId])

  const handleStkPushPayment = () => {
    setShowMpesaModal(true)
  }

  const handleTillNumberPayment = () => {
    setIsProcessingPayment(true)
    // Simulate till number payment processing
    setTimeout(() => {
      setIsProcessingPayment(false)
      setPaymentSuccess(true)
    }, 3000)
  }

  const handleCardPayment = () => {
    setIsProcessingPayment(true)
    // Simulate card payment processing
    setTimeout(() => {
      setIsProcessingPayment(false)
      setPaymentSuccess(true)
    }, 4000)
  }

  const handleCashPayment = () => {
    setIsProcessingPayment(true)
    // Simulate cash payment processing
    setTimeout(() => {
      setIsProcessingPayment(false)
      setPaymentSuccess(true)
    }, 2000)
  }

  // Handle M-Pesa modal close and simulate payment success for demo
  const handleMpesaClose = () => {
    setShowMpesaModal(false)
    // For demo purposes, simulate successful payment after modal closes
    setTimeout(() => {
      setPaymentSuccess(true)
    }, 1000)
  }

  const getPaymentAmount = () => {
    return paymentMethod === 'cash' ? plan?.productPrice : plan?.downPayment
  }

  const isFormValid = () => {
    switch (paymentMethod) {
      case 'stk-push':
        return true
      case 'till-number':
        return tillNumber.length > 0
      case 'card':
        return cardDetails.number.length >= 16 && 
               cardDetails.expiry.length >= 5 && 
               cardDetails.cvv.length >= 3 && 
               cardDetails.name.length > 0
      case 'cash':
        return true
      default:
        return false
    }
  }

  const handlePayment = () => {
    switch (paymentMethod) {
      case 'stk-push':
        handleStkPushPayment()
        break
      case 'till-number':
        handleTillNumberPayment()
        break
      case 'card':
        handleCardPayment()
        break
      case 'cash':
        handleCashPayment()
        break
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h1>
          <p className="text-gray-600 mb-4">{error || "Payment plan not found"}</p>
          <Link href="/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-4">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Your {paymentMethod === 'cash' ? 'full' : 'down'} payment of <strong>${getPaymentAmount()}</strong> has been processed successfully.
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h4 className="font-semibold text-emerald-800 mb-2">What happens next?</h4>
              <ul className="text-sm text-emerald-700 space-y-1 text-left">
                <li>• Your KOYO fridge will be delivered within 3-5 business days</li>
                <li>• Our technician will install and activate your device</li>
                {paymentMethod !== 'cash' && (
                  <>
                    <li>• Your first monthly payment of ${plan.installmentAmount} is due on {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</li>
                    <li>• You'll receive SMS reminders before each payment</li>
                  </>
                )}
                {paymentMethod === 'cash' && (
                  <li>• Your appliance is fully paid - no monthly payments required!</li>
                )}
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/client">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  View My Dashboard
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline">Browse More Products</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/products" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Products</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Methods */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* M-Pesa STK Push */}
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'stk-push' 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('stk-push')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Smartphone className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">M-Pesa STK Push</h4>
                        <p className="text-sm text-gray-600">Instant push notification</p>
                      </div>
                    </div>
                    {paymentMethod === 'stk-push' && (
                      <div className="mt-3 pt-3 border-t border-emerald-200">
                        <div className="flex items-center gap-2 text-sm text-emerald-700">
                          <ShieldCheck className="h-4 w-4" />
                          <span>Most convenient & secure</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lipa na M-Pesa (Till Number) */}
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'till-number' 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('till-number')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Hash className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Lipa na M-Pesa</h4>
                        <p className="text-sm text-gray-600">Pay via Till Number</p>
                      </div>
                    </div>
                    {paymentMethod === 'till-number' && (
                      <div className="mt-3 pt-3 border-t border-emerald-200">
                        <div className="flex items-center gap-2 text-sm text-emerald-700">
                          <Hash className="h-4 w-4" />
                          <span>Manual M-Pesa payment</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bank Card Payment */}
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'card' 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Debit/Credit Card</h4>
                        <p className="text-sm text-gray-600">Visa, Mastercard accepted</p>
                      </div>
                    </div>
                    {paymentMethod === 'card' && (
                      <div className="mt-3 pt-3 border-t border-emerald-200">
                        <div className="flex items-center gap-2 text-sm text-emerald-700">
                          <ShieldCheck className="h-4 w-4" />
                          <span>International cards accepted</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cash Payment */}
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'cash' 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Full Cash Payment</h4>
                        <p className="text-sm text-gray-600">Pay the full amount</p>
                      </div>
                    </div>
                    {paymentMethod === 'cash' && (
                      <div className="mt-3 pt-3 border-t border-emerald-200">
                        <div className="flex items-center gap-2 text-sm text-emerald-700">
                          <Clock className="h-4 w-4" />
                          <span>12-month warranty</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Details Form */}
                {paymentMethod === 'till-number' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold">M-Pesa Till Payment Instructions</h4>
                    <div className="space-y-3">
                      <div>
                        <Label>KOYO Till Number</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={tillNumber}
                            onChange={(e) => setTillNumber(e.target.value)}
                            className="font-mono text-lg"
                            readOnly
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(tillNumber)}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Instructions:</strong></p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Go to M-Pesa menu on your phone</li>
                          <li>Select "Lipa na M-Pesa" → "Buy Goods and Services"</li>
                          <li>Enter Till Number: <strong>{tillNumber}</strong></li>
                          <li>Enter Amount: <strong>KSh {(getPaymentAmount() || 0) * 135}</strong></li>
                          <li>Enter your M-Pesa PIN to complete</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold">Card Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label>Cardholder Name</Label>
                        <Input
                          placeholder="John Doe"
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Card Number</Label>
                        <Input
                          placeholder="1234 5678 9012 3456"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails({...cardDetails, number: e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()})}
                          maxLength={19}
                        />
                      </div>
                      <div>
                        <Label>Expiry Date</Label>
                        <Input
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '')
                            if (value.length >= 2) {
                              value = value.substring(0, 2) + '/' + value.substring(2, 4)
                            }
                            setCardDetails({...cardDetails, expiry: value})
                          }}
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <Label>CVV</Label>
                        <Input
                          placeholder="123"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value.replace(/\D/g, '')})}
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Action */}
                <div className="mt-6">
                  <Button 
                    onClick={handlePayment}
                    disabled={isProcessingPayment || !isFormValid()}
                    className={`w-full ${
                      paymentMethod === 'stk-push' ? 'bg-emerald-600 hover:bg-emerald-700' :
                      paymentMethod === 'till-number' ? 'bg-green-600 hover:bg-green-700' :
                      paymentMethod === 'card' ? 'bg-blue-600 hover:bg-blue-700' :
                      'bg-purple-600 hover:bg-purple-700'
                    }`}
                    size="lg"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {paymentMethod === 'stk-push' && <Smartphone className="h-4 w-4 mr-2" />}
                        {paymentMethod === 'till-number' && <Hash className="h-4 w-4 mr-2" />}
                        {paymentMethod === 'card' && <CreditCard className="h-4 w-4 mr-2" />}
                        {paymentMethod === 'cash' && <Building2 className="h-4 w-4 mr-2" />}
                        
                        {paymentMethod === 'stk-push' && `Pay via STK Push ($${getPaymentAmount()})`}
                        {paymentMethod === 'till-number' && `I've Paid via Till Number ($${getPaymentAmount()})`}
                        {paymentMethod === 'card' && `Pay with Card ($${getPaymentAmount()})`}
                        {paymentMethod === 'cash' && `Pay Full Amount ($${plan.productPrice})`}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription>
                Your payment is secured with bank-level encryption. We never store your payment information.
              </AlertDescription>
            </Alert>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">{plan.productName}</h4>
                  <p className="text-sm text-gray-600">Model: BC-50DC</p>
                </div>

                <Separator />

                {paymentMethod === 'cash' ? (
                  <div className="space-y-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Full Payment:</span>
                      <span>${plan.productPrice}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      12-month standard warranty
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Product Price:</span>
                      <span>${plan.productPrice}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Down Payment:</span>
                      <span className="font-semibold">${plan.downPayment}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Remaining Amount:</span>
                      <span>${(plan.productPrice - plan.downPayment).toFixed(2)}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Payment Frequency:</span>
                        <span className="capitalize">{plan.frequency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Installment Amount:</span>
                        <span>${plan.installmentAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Plan Duration:</span>
                        <span>{plan.planDuration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Payments:</span>
                        <span>{plan.totalInstallments}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between font-semibold">
                      <span>Total Cost:</span>
                      <span>${plan.totalCost}</span>
                    </div>

                    <div className="text-xs text-gray-500">
                      0% interest • 24-month PayGo warranty
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Plan Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quote Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Quote ID:</span>
                    <span className="font-mono text-xs">{plan.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expires:</span>
                    <span>24 hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* M-Pesa Modal */}
      {showMpesaModal && (
        <MpesaStkPushModal
          isOpen={showMpesaModal}
          onClose={handleMpesaClose}
          productName={plan.productName}
          paymentAmount={plan.downPayment}
          paymentType="Down Payment"
        />
      )}
    </div>
  )
} 