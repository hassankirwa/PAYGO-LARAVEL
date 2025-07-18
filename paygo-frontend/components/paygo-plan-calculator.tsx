'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calculator, CreditCard, Calendar, DollarSign, Percent, AlertCircle } from 'lucide-react'
import { 
  Product, 
  PayGoPlan, 
  PayGoSettings, 
  CustomPlanRequest,
  paygoApi, 
  formatPrice, 
  formatInstallment, 
  formatDuration,
  calculateDownPaymentRange 
} from '@/lib/api'
import PlanSelectionModal from './plan-selection-modal'

interface PayGoPlanCalculatorProps {
  product: Product
  onPlanSelect?: (plan: PayGoPlan) => void
  className?: string
}

export default function PayGoPlanCalculator({ product, onPlanSelect, className }: PayGoPlanCalculatorProps) {
  const [settings, setSettings] = useState<PayGoSettings['data'] | null>(null)
  const [calculatedPlan, setCalculatedPlan] = useState<PayGoPlan | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form state
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly')
  const [duration, setDuration] = useState(12)
  const [downPayment, setDownPayment] = useState(0)

  // Load PayGo settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsResponse = await paygoApi.getSettings()
        if (settingsResponse.success) {
          setSettings(settingsResponse.data)
          // Set default down payment to minimum
          const minDownPayment = product.price * (settingsResponse.data.down_payment_constraints.min_percentage / 100)
          setDownPayment(minDownPayment)
        }
      } catch (err) {
        setError('Failed to load PayGo settings')
        console.error('PayGo settings error:', err)
      }
    }

    loadSettings()
  }, [product.price])

  // Calculate down payment range
  const downPaymentRange = useMemo(() => {
    if (!settings) return { min: 0, max: 0 }
    return calculateDownPaymentRange(
      product.price,
      settings.down_payment_constraints.min_percentage,
      settings.down_payment_constraints.max_percentage
    )
  }, [product.price, settings])

  // Calculate plan when inputs change
  useEffect(() => {
    if (!settings || downPayment < downPaymentRange.min) return

    const calculatePlan = async () => {
      setIsCalculating(true)
      setError(null)

      try {
        const planData: CustomPlanRequest = {
          frequency,
          duration_months: duration,
          down_payment: downPayment
        }

        const response = await paygoApi.calculateCustomPlan(product.id, planData)
        if (response.success) {
          setCalculatedPlan(response.data.custom_plan)
        }
      } catch (err) {
        setError('Failed to calculate payment plan')
        console.error('Plan calculation error:', err)
      } finally {
        setIsCalculating(false)
      }
    }

    const debounceTimer = setTimeout(calculatePlan, 300)
    return () => clearTimeout(debounceTimer)
  }, [frequency, duration, downPayment, product.id, settings, downPaymentRange.min])

  if (!settings) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 animate-spin" />
            <span>Loading PayGo Calculator...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calculator className="h-5 w-5" />
          <span>PayGo Plan Calculator</span>
        </CardTitle>
        <CardDescription>
          Customize your payment plan for {product.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Product Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Product Price</span>
            <span className="text-xl font-bold text-green-600">{formatPrice(product.price)}</span>
          </div>
        </div>

        {/* Payment Frequency */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Payment Frequency</span>
          </Label>
          <Select value={frequency} onValueChange={(value: 'weekly' | 'monthly' | 'quarterly') => setFrequency(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {settings.available_frequencies.map((freq) => (
                <SelectItem key={freq} value={freq}>
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Plan Duration */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Plan Duration: {formatDuration(duration)}</span>
          </Label>
          <div className="space-y-2">
            <Slider
              value={[duration]}
              onValueChange={(value) => setDuration(value[0])}
              min={Math.min(...settings.available_durations)}
              max={Math.max(...settings.available_durations)}
              step={6}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              {settings.available_durations.map((months) => (
                <span key={months}>{formatDuration(months)}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Down Payment */}
        <div className="space-y-2">
          <Label className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Down Payment: {formatPrice(downPayment)}</span>
            </span>
            <Badge variant="outline">
              {((downPayment / product.price) * 100).toFixed(1)}%
            </Badge>
          </Label>
          <div className="space-y-2">
            <Slider
              value={[downPayment]}
              onValueChange={(value) => setDownPayment(value[0])}
              min={downPaymentRange.min}
              max={downPaymentRange.max}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{formatPrice(downPaymentRange.min)} (min)</span>
              <span>{formatPrice(downPaymentRange.max)} (max)</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {/* Calculation Results */}
        {calculatedPlan && (
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatInstallment(calculatedPlan.installment_amount, frequency)}
                  </div>
                  <div className="text-sm text-blue-700">Installment Amount</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatPrice(calculatedPlan.total_cost)}
                  </div>
                  <div className="text-sm text-green-700">Total Cost</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Product Price</span>
                  <span className="font-medium">{formatPrice(calculatedPlan.base_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Down Payment</span>
                  <span className="font-medium">{formatPrice(calculatedPlan.down_payment)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Financing Amount</span>
                  <span className="font-medium">{formatPrice(calculatedPlan.financing_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Installments</span>
                  <span className="font-medium">{calculatedPlan.total_installments}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Interest Rate</span>
                  <span className="font-medium text-green-600">{calculatedPlan.interest_rate_annual}% (No Interest!)</span>
                </div>
              </div>

              <Button 
                onClick={() => setIsModalOpen(true)} 
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Select This Plan
              </Button>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <div className="max-h-64 overflow-y-auto space-y-2">
                {calculatedPlan.payment_schedule.slice(0, 6).map((payment) => (
                  <div key={payment.installment_number} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">
                      Payment #{payment.installment_number}
                    </span>
                    <div className="text-right">
                      <div className="font-medium">{formatPrice(payment.amount)}</div>
                      <div className="text-xs text-gray-500">
                        Due: {new Date(payment.due_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {calculatedPlan.payment_schedule.length > 6 && (
                  <div className="text-center text-sm text-gray-500 py-2">
                    ... and {calculatedPlan.payment_schedule.length - 6} more payments
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Loading State */}
        {isCalculating && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 animate-spin" />
              <span>Calculating your plan...</span>
            </div>
          </div>
        )}

        {/* Plan Selection Modal */}
        {calculatedPlan && (
          <PlanSelectionModal
            plan={calculatedPlan}
            product={product}
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
          />
        )}
      </CardContent>
    </Card>
  )
} 