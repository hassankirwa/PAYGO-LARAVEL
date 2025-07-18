'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, ArrowLeft, CreditCard, DollarSign, User, Mail, Phone, Lock } from 'lucide-react'
import { formatPrice, formatInstallment, formatDuration } from '@/lib/api'
import Link from 'next/link'

interface PlanSession {
  quote_id: string
  product_id: number
  product_name: string
  product_price: number
  selected_plan: any
  created_at: string
  expires_at: string
}

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const planId = searchParams?.get('plan')
  const productId = searchParams?.get('product')
  
  const [planSession, setPlanSession] = useState<PlanSession | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load plan session if available
    if (planId) {
      const sessionData = sessionStorage.getItem('paygo_plan_session')
      if (sessionData) {
        try {
          const parsed = JSON.parse(sessionData)
          if (parsed.quote_id === planId) {
            setPlanSession(parsed)
          }
        } catch (err) {
          console.error('Error parsing plan session:', err)
        }
      }
    }
  }, [planId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password) {
      setError('Please fill in all required fields')
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      // TODO: Implement actual registration API call
      console.log('Registration data:', formData)
      console.log('Plan session:', planSession)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // For now, redirect to a success page or payment
      if (planSession) {
        router.push(`/checkout?plan=${planSession.quote_id}`)
      } else {
        router.push('/dashboard')
      }
      
    } catch (err) {
      setError('Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create Your KOYO Account</h1>
          <p className="text-gray-600 mt-2">
            {planSession ? 'Complete your registration to proceed with your PayGo plan' : 'Join thousands of satisfied customers'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Registration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
              <CardDescription>
                Create your account to manage your PayGo plan and appliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <Label htmlFor="email" className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Email Address *</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>Phone Number *</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+254 700 123 456"
                    required
                  />
                </div>

                {/* Password Fields */}
                <div>
                  <Label htmlFor="password" className="flex items-center space-x-2">
                    <Lock className="h-4 w-4" />
                    <span>Password *</span>
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a secure password"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    required
                  />
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </>
                  ) : (
                    planSession ? 'Create Account & Continue to Payment' : 'Create Account'
                  )}
                </Button>

                {/* Login Link */}
                <div className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link 
                    href={`/login${planSession ? `?plan=${planSession.quote_id}&product=${productId}` : ''}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Sign in here
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Plan Summary (if available) */}
          {planSession && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Your Selected Plan</span>
                </CardTitle>
                <CardDescription>
                  Plan will be activated after registration and payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quote ID */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Quote ID</span>
                    <Badge variant="outline">{planSession.quote_id}</Badge>
                  </div>
                </div>

                {/* Product Info */}
                <div>
                  <h4 className="font-semibold text-lg">{planSession.product_name}</h4>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(planSession.product_price)}</p>
                </div>

                <Separator />

                {/* Plan Details */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Payment Frequency</span>
                    <span className="font-medium capitalize">
                      {planSession.selected_plan.frequency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Installment Amount</span>
                    <span className="font-medium">
                      {formatInstallment(planSession.selected_plan.installment_amount, planSession.selected_plan.frequency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plan Duration</span>
                    <span className="font-medium">
                      {formatDuration(planSession.selected_plan.duration_months)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Down Payment</span>
                    <span className="font-medium">
                      {formatPrice(planSession.selected_plan.down_payment)}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Total Cost */}
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Cost</span>
                  <span className="text-green-600">
                    {formatPrice(planSession.selected_plan.total_cost)}
                  </span>
                </div>

                {/* Expiry Warning */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="text-orange-800">
                      This quote expires in 24 hours
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
