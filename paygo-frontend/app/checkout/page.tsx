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
import { PaybillPaymentModal } from "@/components/paybill-payment-modal"
import { VisaCardModal } from "@/components/visa-card-modal"
import { formatKshPrice, Product, PayGoPlan, productApi, convertLaravelProduct } from "@/lib/api"

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

interface PlanSession {
  quote_id: string
  product_id: number
  product_name: string
  product_price: number
  selected_plan: PayGoPlan
  created_at: string
  expires_at: string
}

type PaymentMethod = 'stk-push' | 'paybill' | 'visa-card' | 'cash'

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan')
  
  const [plan, setPlan] = useState<PaymentPlan | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // State for payment methods
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stk-push')
  const [showStkModal, setShowStkModal] = useState(false)
  const [showPaybillModal, setShowPaybillModal] = useState(false)
  const [showVisaModal, setShowVisaModal] = useState(false)
  const [customerDeviceId, setCustomerDeviceId] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Load real plan data from session storage and fetch current product price
  useEffect(() => {
    const loadPlanData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check for plan session data
        let planSession: PlanSession | null = null
        
        // Try to get from session storage first
        if (typeof window !== 'undefined') {
          const sessionData = sessionStorage.getItem('paygo_plan_session')
          if (sessionData) {
            try {
              planSession = JSON.parse(sessionData)
            } catch (e) {
              console.error('Failed to parse session data:', e)
            }
          }
          
          // If not in session, try localStorage as backup
          if (!planSession) {
            const localData = localStorage.getItem('pending_paygo_purchase')
            if (localData) {
              try {
                planSession = JSON.parse(localData)
              } catch (e) {
                console.error('Failed to parse localStorage data:', e)
              }
            }
          }
        }

        // If no session data and we have a planId, try to reconstruct from product
        if (!planSession && planId) {
          const productId = searchParams.get('product')
          if (productId) {
            const productResponse = await productApi.getProduct(parseInt(productId))
            if (productResponse.success) {
              const productData = convertLaravelProduct(productResponse.data)
              
              // Create a default plan (10% down payment, 12 months monthly)
              const defaultDownPayment = productData.price_ksh * 0.10
              const financingAmount = productData.price_ksh - defaultDownPayment
              const monthlyInstallment = financingAmount / 12
              
              planSession = {
                quote_id: planId,
                product_id: productData.id,
                product_name: productData.name,
                product_price: productData.price_ksh,
                selected_plan: {
                  product_id: productData.id,
                  frequency: 'monthly' as const,
                  duration_months: 12,
                  base_price: productData.price_ksh,
                  down_payment: defaultDownPayment,
                  financing_amount: financingAmount,
                  installment_amount: monthlyInstallment,
                  total_installments: 12,
                  total_installment_cost: financingAmount,
                  total_cost: productData.price_ksh,
                  total_interest: 0,
                  interest_rate_annual: 0,
                  savings_vs_cash: 0,
                  payment_schedule: [],
                  grace_period_days: 3,
                  late_fee_percentage: 5.0,
                  early_payment_discount: 0.02
                },
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
              }
            }
          }
        }

        if (!planSession) {
          setError("No payment plan found. Please select a plan first.")
          setLoading(false)
          return
        }

        // Check if plan has expired
        if (new Date() > new Date(planSession.expires_at)) {
          setError("Your payment plan has expired. Please select a new plan.")
          setLoading(false)
          return
        }

        // Fetch current product price to ensure accuracy
        try {
          const productResponse = await productApi.getProduct(planSession.product_id)
          if (productResponse.success) {
            const currentProduct = convertLaravelProduct(productResponse.data)
            setProduct(currentProduct)
            
            // Use current product price if different from session (price might have been updated)
            const currentPrice = currentProduct.price_ksh
            const sessionPrice = planSession.product_price
            
            if (Math.abs(currentPrice - sessionPrice) > 0.01) {
              console.warn(`Price mismatch: Session=${sessionPrice}, Current=${currentPrice}. Using current price.`)
              
              // Recalculate plan with current price
              const selectedPlan = planSession.selected_plan
              const newDownPayment = currentPrice * (selectedPlan.down_payment / selectedPlan.base_price)
              const newFinancingAmount = currentPrice - newDownPayment
              const newInstallmentAmount = newFinancingAmount / selectedPlan.total_installments
              
              planSession.product_price = currentPrice
              planSession.selected_plan.base_price = currentPrice
              planSession.selected_plan.down_payment = newDownPayment
              planSession.selected_plan.financing_amount = newFinancingAmount
              planSession.selected_plan.installment_amount = newInstallmentAmount
              planSession.selected_plan.total_cost = currentPrice
              planSession.selected_plan.total_installment_cost = newFinancingAmount
            }
          }
        } catch (productError) {
          console.error('Failed to fetch current product price:', productError)
          // Continue with session data if product fetch fails
        }

        // Convert to PaymentPlan format
        const paymentPlan: PaymentPlan = {
          id: planSession.quote_id,
          productId: planSession.product_id,
          productName: planSession.product_name,
          productPrice: planSession.product_price,
          frequency: planSession.selected_plan.frequency,
          installmentAmount: planSession.selected_plan.installment_amount,
          downPayment: planSession.selected_plan.down_payment,
          planDuration: `${planSession.selected_plan.duration_months} months`,
          totalInstallments: planSession.selected_plan.total_installments,
          totalCost: planSession.selected_plan.total_cost
        }

        setPlan(paymentPlan)
        setLoading(false)

      } catch (error) {
        console.error('Error loading plan data:', error)
        setError("Failed to load payment plan. Please try again.")
        setLoading(false)
      }
    }

    loadPlanData()
  }, [planId, searchParams])

  // Generate customer device ID when component mounts
  useEffect(() => {
    if (!customerDeviceId) {
      // Generate M-Pesa compatible device ID (8 characters max)
      const random = Math.floor(Math.random() * 999999) + 1
      const generatedId = `KY${random.toString().padStart(6, '0')}`
      setCustomerDeviceId(generatedId)
    }
  }, [customerDeviceId])

  const handleStkPushPayment = () => {
    setShowStkModal(true)
  }

  const handlePaybillPayment = () => {
    if (!customerDeviceId) {
      alert('Error generating device ID. Please refresh the page.')
      return
    }
    setShowPaybillModal(true)
  }

  const handleVisaCardPayment = () => {
    setShowVisaModal(true)
  }

  const handleCashPayment = () => {
    // Simulate cash payment processing
    setTimeout(() => {
      // Redirect to success page or show success message
      router.push('/checkout/success?method=cash&device_id=' + customerDeviceId)
    }, 2000)
  }

  // Handle M-Pesa modal close - only close modal, don't simulate success
  const handleMpesaClose = () => {
    setShowStkModal(false)
    // Real success will be handled by the M-Pesa modal component via callback
  }

  const handlePaybillSuccess = () => {
    // Handle successful PayBill payment
    console.log('PayBill payment successful!')
    
    // Redirect to success page or show success message
    router.push('/checkout/success?method=paybill&device_id=' + customerDeviceId)
  }

  const handlePaybillError = (error: string) => {
    // Handle PayBill payment error
    console.error('PayBill payment error:', error)
    
    // Show error message to user
    alert('Payment failed: ' + error)
  }

  const getPaymentAmount = () => {
    return paymentMethod === 'cash' ? plan?.productPrice : plan?.downPayment
  }

  const isFormValid = () => {
    switch (paymentMethod) {
      case 'stk-push':
        return true
      case 'paybill':
        return true
      case 'visa-card':
        return true
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
      case 'paybill':
        handlePaybillPayment()
        break
      case 'visa-card':
        handleVisaCardPayment()
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center space-y-4 pt-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">Plan Not Found</h2>
            <p className="text-gray-600">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/products">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Browse Products
                </Button>
              </Link>
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center space-y-4 pt-6">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">No Plan Selected</h2>
            <p className="text-gray-600">Please select a PayGo plan to continue with checkout.</p>
            <Link href="/products">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Select a Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl text-emerald-600">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Your {paymentMethod === 'cash' ? 'full' : 'down'} payment of <strong>{formatKshPrice(getPaymentAmount() || 0)}</strong> has been processed successfully.
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h4 className="font-semibold text-emerald-800 mb-2">What happens next?</h4>
              <ul className="text-sm text-emerald-700 space-y-1 text-left">
                <li>• Your KOYO fridge will be delivered within 3-5 business days</li>
                <li>• Our technician will install and activate your device</li>
                {paymentMethod !== 'cash' && (
                  <>
                    <li>• Your first monthly payment of {formatKshPrice(plan.installmentAmount)} is due on {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</li>
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

                  {/* M-Pesa Paybill */}
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'paybill' 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('paybill')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Hash className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">M-Pesa Paybill</h4>
                        <p className="text-sm text-gray-600">Pay with KOYO device ID</p>
                      </div>
                    </div>
                    {paymentMethod === 'paybill' && (
                      <div className="mt-3 pt-3 border-t border-emerald-200">
                        <div className="flex items-center gap-2 text-sm text-emerald-700">
                          <Hash className="h-4 w-4" />
                          <span>Use your device ID as account number</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Visa/Mastercard Payment */}
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'visa-card' 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('visa-card')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Visa/Mastercard</h4>
                        <p className="text-sm text-gray-600">Debit & Credit cards</p>
                      </div>
                    </div>
                    {paymentMethod === 'visa-card' && (
                      <div className="mt-3 pt-3 border-t border-emerald-200">
                        <div className="flex items-center gap-2 text-sm text-emerald-700">
                          <ShieldCheck className="h-4 w-4" />
                          <span>Secure card processing</span>
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

                {/* Payment Method Info */}
                {paymentMethod === 'paybill' && (
                  <Alert>
                    <Hash className="h-4 w-4" />
                    <AlertDescription>
                      Click "Proceed to Payment" to get your KOYO device ID and detailed Paybill payment instructions.
                    </AlertDescription>
                  </Alert>
                )}

                {paymentMethod === 'visa-card' && (
                  <Alert>
                    <CreditCard className="h-4 w-4" />
                    <AlertDescription>
                      Click "Proceed to Payment" to securely enter your card details and complete your payment.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Payment Action */}
                <div className="mt-6">
                  <Button 
                    onClick={handlePayment}
                    disabled={isProcessingPayment || !isFormValid()}
                    className={`w-full ${
                      paymentMethod === 'stk-push' ? 'bg-emerald-600 hover:bg-emerald-700' :
                      paymentMethod === 'paybill' ? 'bg-green-600 hover:bg-green-700' :
                      paymentMethod === 'visa-card' ? 'bg-blue-600 hover:bg-blue-700' :
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
                        {paymentMethod === 'paybill' && <Hash className="h-4 w-4 mr-2" />}
                        {paymentMethod === 'visa-card' && <CreditCard className="h-4 w-4 mr-2" />}
                        {paymentMethod === 'cash' && <Building2 className="h-4 w-4 mr-2" />}
                        
                        {paymentMethod === 'stk-push' && `Pay via STK Push (${formatKshPrice(getPaymentAmount() || 0)})`}
                        {paymentMethod === 'paybill' && `Proceed to Paybill Payment (${formatKshPrice(getPaymentAmount() || 0)})`}
                        {paymentMethod === 'visa-card' && `Pay with Card (${formatKshPrice(getPaymentAmount() || 0)})`}
                        {paymentMethod === 'cash' && `Pay Full Amount (${formatKshPrice(plan?.productPrice || 0)})`}
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
                      <span>{formatKshPrice(plan.productPrice)}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      12-month standard warranty
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Product Price:</span>
                      <span>{formatKshPrice(plan.productPrice)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Down Payment:</span>
                      <span className="font-semibold">{formatKshPrice(plan.downPayment)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Remaining Amount:</span>
                      <span>{formatKshPrice(plan.productPrice - plan.downPayment)}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Payment Frequency:</span>
                        <span className="capitalize">{plan.frequency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Installment Amount:</span>
                        <span>{formatKshPrice(plan.installmentAmount)}</span>
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
                      <span>{formatKshPrice(plan.totalCost)}</span>
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

      {/* Payment Modals */}
      {showStkModal && (
        <MpesaStkPushModal
          isOpen={showStkModal}
          onClose={handleMpesaClose}
          productName={plan.productName}
          paymentAmount={getPaymentAmount() || 0}
          paymentType={paymentMethod === 'cash' ? 'Full Payment' : 'Down Payment'}
          quoteId={plan.id}
          productId={plan.productId}
          productPrice={plan.productPrice}
          planType={plan.frequency}
          downPaymentAmount={plan.downPayment}
          installmentAmount={plan.installmentAmount}
          totalInstallments={plan.totalInstallments}
          planDuration={plan.planDuration}
        />
      )}

      {showPaybillModal && (
        <PaybillPaymentModal
          isOpen={showPaybillModal}
          onClose={() => setShowPaybillModal(false)}
          productName={plan.productName}
          paymentAmount={getPaymentAmount() || 0}
          paymentType={paymentMethod === 'cash' ? 'down_payment' : 'down_payment'}
          customerDeviceId={customerDeviceId}
          customerOrderId={plan.id}
          customerPlanId={null}
          onPaymentSuccess={handlePaybillSuccess}
          onPaymentError={handlePaybillError}
        />
      )}

      {showVisaModal && (
        <VisaCardModal
          isOpen={showVisaModal}
          onClose={() => setShowVisaModal(false)}
          productName={plan.productName}
          paymentAmount={getPaymentAmount() || 0}
          paymentType={paymentMethod === 'cash' ? 'Full Payment' : 'Down Payment'}
          orderReference={plan.id}
          customerEmail=""
          customerPhone=""
        />
      )}
    </div>
  )
} 