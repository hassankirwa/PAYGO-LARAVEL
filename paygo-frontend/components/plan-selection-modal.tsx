'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, Calendar, CreditCard, DollarSign, FileText, ShoppingCart } from 'lucide-react'
import { PayGoPlan, Product, formatPrice, formatInstallment, formatDuration } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from "@/hooks/use-toast"

interface PlanSelectionModalProps {
  plan: PayGoPlan
  product: Product
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export default function PlanSelectionModal({ plan, product, isOpen, onOpenChange }: PlanSelectionModalProps) {
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSaveForLater = () => {
    // Generate unique plan reference
    const planReference = `PL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    
    // Save plan to localStorage for later
    const savedPlan = {
      reference: planReference,
      product_id: product.id,
      product_name: product.name,
      plan: plan,
      saved_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    }
    
    const savedPlans = JSON.parse(localStorage.getItem('saved_paygo_plans') || '[]')
    savedPlans.push(savedPlan)
    localStorage.setItem('saved_paygo_plans', JSON.stringify(savedPlans))
    
    // Show success message
    toast({
      title: "Plan Saved! 💾",
      description: `Plan saved for later! Reference: ${planReference}\nValid for 7 days.`,
      variant: "default",
    })
    onOpenChange(false)
  }

  const handleProceedToPurchase = async () => {
    if (!acceptTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to proceed.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    
    try {
      // Generate unique plan reference/quote ID
      const quoteId = `QT-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
      
      // Create plan session data
      const planSession = {
        quote_id: quoteId,
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        selected_plan: plan,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }
      
      // Save to session storage (persists across navigation)
      sessionStorage.setItem('paygo_plan_session', JSON.stringify(planSession))
      
      // Also save to localStorage as backup
      localStorage.setItem('pending_paygo_purchase', JSON.stringify(planSession))
      
      // Navigate to registration/login with plan context
      router.push(`/register?plan=${quoteId}&product=${product.id}`)
      
    } catch (error) {
      console.error('Error initiating purchase:', error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Confirm Your PayGo Plan</span>
          </DialogTitle>
          <DialogDescription>
            Review your selected payment plan and proceed to purchase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">{product.name}</h4>
                  <p className="text-sm text-gray-600">Model: {product.model_code}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{formatPrice(product.price)}</p>
                  <p className="text-sm text-gray-500">Full Price</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Selected Payment Plan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Key Plan Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatInstallment(plan.installment_amount, plan.frequency)}
                  </div>
                  <div className="text-sm text-blue-700">
                    {plan.frequency.charAt(0).toUpperCase() + plan.frequency.slice(1)} Payment
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatDuration(plan.duration_months)}
                  </div>
                  <div className="text-sm text-green-700">Payment Period</div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Down Payment</span>
                  <span className="font-medium">{formatPrice(plan.down_payment)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Financing Amount</span>
                  <span className="font-medium">{formatPrice(plan.financing_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Installments</span>
                  <span className="font-medium">{plan.total_installments} payments</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total Cost</span>
                  <span className="text-green-600">{formatPrice(plan.total_cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Interest Rate</span>
                  <span className="text-green-600 font-medium">{plan.interest_rate_annual}% (No Interest!)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Schedule Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Payment Schedule Preview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {plan.payment_schedule.slice(0, 3).map((payment) => (
                  <div key={payment.installment_number} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">Payment #{payment.installment_number}</span>
                    <div className="text-right">
                      <div className="font-medium">{formatPrice(payment.amount)}</div>
                      <div className="text-xs text-gray-500">
                        Due: {new Date(payment.due_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {plan.payment_schedule.length > 3 && (
                  <div className="text-center text-sm text-gray-500 py-1">
                    ... and {plan.payment_schedule.length - 3} more payments
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Important Terms */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2 text-orange-800">
                <AlertCircle className="h-5 w-5" />
                <span>Important Terms</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-orange-800">
              <div className="flex justify-between">
                <span>Grace Period:</span>
                <span>{plan.grace_period_days} days</span>
              </div>
              <div className="flex justify-between">
                <span>Late Fee:</span>
                <span>{plan.late_fee_percentage}% of installment</span>
              </div>
              <div className="flex justify-between">
                <span>Early Payment Discount:</span>
                <span>{plan.early_payment_discount}% of remaining balance</span>
              </div>
              <div className="mt-3 p-3 bg-orange-100 rounded text-xs">
                <strong>IoT Control:</strong> Your appliance will be remotely monitored. Service may be suspended if payments become overdue beyond the grace period.
              </div>
            </CardContent>
          </Card>

          {/* Terms and Conditions Acceptance */}
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="accept-terms" 
              checked={acceptTerms} 
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
            />
            <div className="space-y-1">
              <label 
                htmlFor="accept-terms" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I accept the PayGo terms and conditions
              </label>
              <p className="text-xs text-gray-500">
                By checking this box, you agree to the payment schedule, IoT monitoring, and service terms. 
                <Link href="/terms-and-conditions" target="_blank" className="text-blue-600 hover:underline ml-1">
                  Read full terms & conditions
                </Link>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleSaveForLater}
              className="flex-1"
              disabled={isProcessing}
            >
              <FileText className="h-4 w-4 mr-2" />
              Save for Later
            </Button>
            <Button
              onClick={handleProceedToPurchase}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={!acceptTerms || isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Proceed to Purchase
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 