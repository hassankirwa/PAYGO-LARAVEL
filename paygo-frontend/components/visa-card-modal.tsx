"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  CreditCard, 
  Lock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Shield,
  Info
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getApiUrl } from "@/lib/api-config"

interface VisaCardModalProps {
  isOpen: boolean
  onClose: () => void
  productName: string
  paymentAmount: number
  paymentType: string
  orderReference?: string
  customerEmail?: string
  customerPhone?: string
}

interface CardValidation {
  is_valid: boolean
  card_type: string
  is_valid_number: boolean
  is_expired: boolean
  is_valid_cvv: boolean
  masked_number: string
  expected_cvv_length: number
}

interface SupportedCards {
  supported_cards: string[]
  currencies: Record<string, string>
  test_cards: Array<{
    number: string
    type: string
    scenario: string
    description: string
  }>
  cvv_requirements: Record<string, string>
}

export function VisaCardModal({
  isOpen,
  onClose,
  productName,
  paymentAmount,
  paymentType,
  orderReference = '',
  customerEmail = '',
  customerPhone = '',
}: VisaCardModalProps) {
  const { toast } = useToast()
  
  // Card form state
  const [cardNumber, setCardNumber] = useState("")
  const [expiryMonth, setExpiryMonth] = useState("")
  const [expiryYear, setExpiryYear] = useState("")
  const [cvv, setCvv] = useState("")
  const [cardholderName, setCardholderName] = useState("")
  
  // Billing address state
  const [billingAddress, setBillingAddress] = useState({
    street: "",
    city: "",
    state: "",
    country: "KE",
    postal_code: ""
  })
  
  // UI state
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [cardValidation, setCardValidation] = useState<CardValidation | null>(null)
  const [supportedCards, setSupportedCards] = useState<SupportedCards | null>(null)
  const [paymentResult, setPaymentResult] = useState<any>(null)

  // Load supported cards information when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSupportedCards()
    }
  }, [isOpen])

  // Validate card in real-time
  useEffect(() => {
    if (cardNumber.length >= 13 && expiryMonth && expiryYear && cvv.length >= 3) {
      validateCard()
    } else {
      setCardValidation(null)
    }
  }, [cardNumber, expiryMonth, expiryYear, cvv])

  const loadSupportedCards = async () => {
    try {
      const url = await getApiUrl('/visa/supported-cards')
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      })

      const data = await response.json()
      
      if (data.success) {
        setSupportedCards(data.data)
      }
    } catch (error) {
      console.error('Error loading supported cards:', error)
    }
  }

  const validateCard = async () => {
    try {
      const url = await getApiUrl('/visa/validate-card')
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          card_number: cardNumber,
          expiry_month: expiryMonth,
          expiry_year: expiryYear,
          cvv: cvv,
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setCardValidation(data.data)
      }
    } catch (error) {
      console.error('Error validating card:', error)
    }
  }

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Add spaces every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ')
    
    return formatted.substring(0, 19) // Limit to 16 digits + 3 spaces
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    setCardNumber(formatted)
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 4)
    setCvv(value)
  }

  const processPayment = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setIsProcessing(true)
      setPaymentStatus('processing')

      const url = await getApiUrl('/visa/process-payment')
      
      const paymentData = {
        // Card details
        card_number: cardNumber.replace(/\s/g, ''),
        expiry_month: expiryMonth,
        expiry_year: expiryYear,
        cvv: cvv,
        cardholder_name: cardholderName,
        
        // Payment details
        amount: paymentAmount,
        currency: 'KES',
        description: `${paymentType} - ${productName}`,
        
        // Order details
        order_reference: orderReference || `ORD_${Date.now()}`,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        
        // Billing address
        billing_address: billingAddress,
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(paymentData)
      })

      const data = await response.json()
      
      if (data.success) {
        setPaymentStatus('success')
        setPaymentResult(data.data)
        
        toast({
          title: "Payment Successful! ✅",
          description: `Your ${paymentType.toLowerCase()} of ${formatKshAmount(paymentAmount)} has been processed successfully.`,
        })
      } else {
        setPaymentStatus('error')
        
        toast({
          title: "Payment Failed",
          description: data.error || 'Your payment could not be processed. Please try again.',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      setPaymentStatus('error')
      
      toast({
        title: "Payment Error",
        description: 'An error occurred while processing your payment. Please try again.',
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const validateForm = () => {
    if (!cardNumber || !expiryMonth || !expiryYear || !cvv || !cardholderName) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all card details",
        variant: "destructive",
      })
      return false
    }

    if (!billingAddress.street || !billingAddress.city || !billingAddress.state) {
      toast({
        title: "Billing Address Required",
        description: "Please fill in your billing address",
        variant: "destructive",
      })
      return false
    }

    if (cardValidation && !cardValidation.is_valid) {
      toast({
        title: "Invalid Card Details",
        description: "Please check your card information",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const formatKshAmount = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`
  }

  const getCardIcon = (cardType: string) => {
    switch (cardType) {
      case 'Visa':
        return '💳'
      case 'Mastercard':
        return '💳'
      case 'American Express':
        return '💳'
      default:
        return '💳'
    }
  }

  // Generate month and year options
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0')
    return { value: month, label: month }
  })

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 20 }, (_, i) => {
    const year = (currentYear + i).toString().slice(-2)
    return { value: year, label: `20${year}` }
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <CreditCard className="h-6 w-6 text-blue-600" />
            Pay with Card
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Payment Summary */}
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">{paymentType}</h3>
                <p className="text-sm text-gray-600 mb-2">{productName}</p>
                <p className="text-2xl font-bold text-blue-600">{formatKshAmount(paymentAmount)}</p>
              </div>
            </CardContent>
          </Card>

          {paymentStatus === 'success' && paymentResult ? (
            /* Success State */
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Payment Successful!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-gray-500">Transaction ID</Label>
                    <p className="font-mono">{paymentResult.transaction_id}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Card Type</Label>
                    <p>{paymentResult.card_type}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Amount</Label>
                    <p className="font-semibold">{formatKshAmount(paymentResult.amount)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Card</Label>
                    <p className="font-mono">{paymentResult.masked_card}</p>
                  </div>
                </div>
                
                <Alert className="border-green-300 bg-green-100">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your payment has been processed successfully. You will receive a confirmation email shortly.
                  </AlertDescription>
                </Alert>

                <Button onClick={onClose} className="w-full">
                  Continue
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Payment Form */
            <>
              {/* Card Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Card Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Card Number */}
                  <div>
                    <Label htmlFor="card-number">Card Number</Label>
                    <div className="relative">
                      <Input
                        id="card-number"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="pr-12"
                      />
                      {cardValidation && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                          <span className="text-sm">{getCardIcon(cardValidation.card_type)}</span>
                          {cardValidation.is_valid_number ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {cardValidation && (
                      <p className="text-xs mt-1 text-gray-600">
                        {cardValidation.card_type} • {cardValidation.masked_number}
                      </p>
                    )}
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <Label htmlFor="cardholder-name">Cardholder Name</Label>
                    <Input
                      id="cardholder-name"
                      placeholder="JOHN DOE"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                    />
                  </div>

                  {/* Expiry and CVV */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="expiry-month">Month</Label>
                      <Select value={expiryMonth} onValueChange={setExpiryMonth}>
                        <SelectTrigger>
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="expiry-year">Year</Label>
                      <Select value={expiryYear} onValueChange={setExpiryYear}>
                        <SelectTrigger>
                          <SelectValue placeholder="YY" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year.value} value={year.value}>
                              {year.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <div className="relative">
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={cvv}
                          onChange={handleCvvChange}
                          maxLength={4}
                        />
                        {cardValidation && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {cardValidation.is_valid_cvv ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                      {cardValidation && (
                        <p className="text-xs mt-1 text-gray-600">
                          {cardValidation.expected_cvv_length} digits required
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Billing Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      placeholder="123 Main Street"
                      value={billingAddress.street}
                      onChange={(e) => setBillingAddress(prev => ({ ...prev, street: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="Nairobi"
                        value={billingAddress.city}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">County/State</Label>
                      <Input
                        id="state"
                        placeholder="Nairobi County"
                        value={billingAddress.state}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, state: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select value={billingAddress.country} onValueChange={(value) => setBillingAddress(prev => ({ ...prev, country: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="KE">Kenya</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="postal-code">Postal Code</Label>
                      <Input
                        id="postal-code"
                        placeholder="00100"
                        value={billingAddress.postal_code}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Test Cards Info */}
              {supportedCards && supportedCards.test_cards && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Test Cards:</strong>
                    <ul className="mt-1 text-xs space-y-1">
                      {supportedCards.test_cards.slice(0, 2).map((card, index) => (
                        <li key={index}>
                          <code className="bg-gray-100 px-1 rounded">{card.number}</code> - {card.description}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Security Notice */}
              <Alert className="border-blue-200 bg-blue-50">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Secure Payment</strong>
                  <br />
                  Your payment is secured with bank-level encryption. We never store your card information.
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={processPayment}
                  disabled={isProcessing || (cardValidation && !cardValidation.is_valid)}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Pay {formatKshAmount(paymentAmount)}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 