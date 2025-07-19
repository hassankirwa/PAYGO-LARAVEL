'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, ArrowRight, User, Mail, Phone, Lock, FileText, MapPin, 
  Building, Users, Upload, Camera, CheckCircle, AlertCircle, Calendar, 
  CreditCard, DollarSign, CreditCard as IdentificationCard 
} from 'lucide-react'
import Link from 'next/link'

// Types
interface PlanSession {
  quote_id: string
  product_id: number
  product_name: string
  product_price: number
  selected_plan: any
  created_at: string
  expires_at: string
}

interface RegistrationData {
  // Step 1: Basic Registration
  first_name: string
  last_name: string
  email: string
  phone: string
  password: string
  password_confirmation: string
  terms_accepted: boolean
  
  // Step 2: Personal Information
  date_of_birth: string
  national_id: string
  nationality: string
  address: string
  occupation: string
  monthly_income: string
  income_source: string
  latitude?: number
  longitude?: number
  
  // Step 3: Business Information (optional)
  is_business_customer: boolean
  business_name?: string
  business_type?: string
  business_registration_number?: string
  
  // Step 4: Contact Information
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relationship: string
  reference_contacts: Array<{
    name: string
    phone: string
    relationship: string
    email?: string
  }>
}

interface DocumentFiles {
  id_document_front?: File
  id_document_back?: File
  proof_of_income?: File
  profile_photo?: File
  business_license?: File
}

const steps = [
  { id: 1, title: 'Account Setup', description: 'Basic account information' },
  { id: 2, title: 'Personal Info', description: 'Identity and personal details' },
  { id: 3, title: 'Contact Details', description: 'Emergency and reference contacts' },
  { id: 4, title: 'Documents', description: 'Upload required documents' },
  { id: 5, title: 'Review', description: 'Review and submit application' }
]

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const planId = searchParams?.get('plan')
  const productId = searchParams?.get('product')
  
  const [currentStep, setCurrentStep] = useState(1)
  const [planSession, setPlanSession] = useState<PlanSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useGPS, setUseGPS] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  
  // Form data state
  const [formData, setFormData] = useState<RegistrationData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    terms_accepted: false,
    date_of_birth: '',
    national_id: '',
    nationality: 'Kenyan',
    address: '',
    occupation: '',
    monthly_income: '',
    income_source: '',
    is_business_customer: false,
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    reference_contacts: [
      { name: '', phone: '', relationship: '', email: '' },
      { name: '', phone: '', relationship: '', email: '' }
    ]
  })
  
  const [documents, setDocuments] = useState<DocumentFiles>({})

  // Load plan session from storage
  useEffect(() => {
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

  // Form handlers
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleReferenceContactChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      reference_contacts: prev.reference_contacts.map((contact, i) => 
        i === index ? { ...contact, [field]: value } : contact
      )
    }))
  }

  const handleFileChange = (type: keyof DocumentFiles, file: File | null) => {
    setDocuments(prev => ({
      ...prev,
      [type]: file || undefined
    }))
  }

  // GPS location handler
  const getCurrentLocation = () => {
    setUseGPS(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }))
          setUseGPS(false)
        },
        (error) => {
          setError('Unable to get location. Please enter address manually.')
          setUseGPS(false)
        }
      )
    } else {
      setError('Geolocation is not supported by this browser.')
      setUseGPS(false)
    }
  }

  // Step validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.first_name && formData.last_name && formData.email && 
                  formData.phone && formData.password && formData.password_confirmation &&
                  formData.terms_accepted && formData.password === formData.password_confirmation)
      case 2:
        return !!(formData.date_of_birth && formData.national_id && formData.address && 
                  formData.occupation && formData.monthly_income && formData.income_source)
      case 3:
        return !!(formData.emergency_contact_name && formData.emergency_contact_phone &&
                  formData.emergency_contact_relationship &&
                  formData.reference_contacts[0].name && formData.reference_contacts[0].phone &&
                  formData.reference_contacts[1].name && formData.reference_contacts[1].phone)
      case 4:
        return !!(documents.id_document_front && documents.id_document_back)
      default:
        return true
    }
  }

  // Navigation handlers
  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < steps.length) {
      setCurrentStep(prev => prev + 1)
      setError(null)
    } else {
      setError('Please complete all required fields before proceeding.')
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      setError(null)
    }
  }

  // Submit registration
  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Step 1: Register basic account
      const registrationPayload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        terms_accepted: formData.terms_accepted,
        plan_id: planSession?.quote_id,
        product_id: productId
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      
      const registerResponse = await fetch(`${API_BASE_URL}/customer/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationPayload)
      })

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json()
        throw new Error(errorData.message || 'Registration failed')
      }

      const { data } = await registerResponse.json()
      const token = data.token

      // Step 2: Update personal information
      const personalInfoResponse = await fetch(`${API_BASE_URL}/customer/personal-info`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date_of_birth: formData.date_of_birth,
          national_id: formData.national_id,
          nationality: formData.nationality,
          address: formData.address,
          occupation: formData.occupation,
          monthly_income: parseFloat(formData.monthly_income),
          income_source: formData.income_source,
          latitude: formData.latitude,
          longitude: formData.longitude,
          is_business_customer: formData.is_business_customer,
          business_name: formData.business_name,
          business_type: formData.business_type,
          business_registration_number: formData.business_registration_number
        })
      })

      // Step 3: Update contact information
      const contactsResponse = await fetch(`${API_BASE_URL}/customer/contacts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          emergency_contact_relationship: formData.emergency_contact_relationship,
          reference_contacts: formData.reference_contacts.filter(contact => contact.name && contact.phone)
        })
      })

      // Step 4: Upload documents
      if (Object.keys(documents).length > 0) {
        const formDataForUpload = new FormData()
        
        Object.entries(documents).forEach(([key, file]) => {
          if (file) {
            formDataForUpload.append(key, file)
          }
        })

        const documentsResponse = await fetch(`${API_BASE_URL}/customer/documents`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataForUpload
        })
      }

      // Store token for future use
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_type', 'client')

      // Show success notification
      setRegistrationSuccess(true)
      toast({
        title: "Registration Successful! 🎉",
        description: "Your account has been created successfully. You can now proceed with payments or explore our products.",
        variant: "default",
      })

      // Optionally redirect to checkout if there's a plan session
      if (planSession) {
        setTimeout(() => {
          router.push(`/checkout?plan=${planSession.quote_id}`)
        }, 2000) // Wait 2 seconds before redirecting to checkout
      }

    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate progress
  const progress = (currentStep / steps.length) * 100

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Registration</h1>
          <p className="text-gray-600 mt-2">
            {planSession ? 'Register for your PayGo plan' : 'Join the KOYO community'}
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Step {currentStep} of {steps.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              {steps.map((step, index) => (
                <div 
                  key={step.id}
                  className={`text-center p-2 rounded-lg ${
                    currentStep === step.id 
                      ? 'bg-blue-100 text-blue-800' 
                      : currentStep > step.id 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <div className="text-xs font-medium">{step.title}</div>
                  <div className="text-xs opacity-75">{step.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {registrationSuccess ? (
          /* Success State */
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardContent className="p-8">
                <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Registration Successful!</h2>
                <p className="text-gray-600 mb-6">
                  Welcome to KOYO! Your account has been created successfully. 
                  {planSession 
                    ? " You'll be redirected to complete your payment shortly."
                    : " You can now explore our products and PayGo plans."
                  }
                </p>
                <div className="space-y-4">
                  {!planSession && (
                    <Button 
                      onClick={() => router.push('/')} 
                      className="w-full"
                    >
                      Explore Products
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/login')}
                    className="w-full"
                  >
                    Go to Login
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Main Form */}
            <div className="space-y-6">
            {/* Step 1: Basic Registration */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Account Setup</span>
                  </CardTitle>
                  <CardDescription>
                    Create your KOYO account with basic information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email Address *</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
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
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+254 700 123 456"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="password" className="flex items-center space-x-2">
                      <Lock className="h-4 w-4" />
                      <span>Password *</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Create a secure password"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="password_confirmation">Confirm Password *</Label>
                    <Input
                      id="password_confirmation"
                      type="password"
                      value={formData.password_confirmation}
                      onChange={(e) => handleInputChange('password_confirmation', e.target.value)}
                      placeholder="Confirm your password"
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.terms_accepted}
                      onCheckedChange={(checked) => handleInputChange('terms_accepted', checked as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the{' '}
                      <Link href="/terms-and-conditions" className="text-blue-600 hover:underline">
                        Terms and Conditions
                      </Link>
                    </Label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Personal Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <IdentificationCard className="h-5 w-5" />
                      <span>Personal Information</span>
                    </CardTitle>
                    <CardDescription>
                      Provide your personal details for KYC verification
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date_of_birth" className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Date of Birth *</span>
                        </Label>
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={formData.date_of_birth}
                          onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="national_id">National ID Number *</Label>
                        <Input
                          id="national_id"
                          value={formData.national_id}
                          onChange={(e) => handleInputChange('national_id', e.target.value)}
                          placeholder="12345678"
                          maxLength={8}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address" className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>Physical Address *</span>
                      </Label>
                      <div className="space-y-2">
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Enter your full address"
                          required
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={getCurrentLocation}
                          disabled={useGPS}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          {useGPS ? 'Getting location...' : 'Use Current Location'}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="occupation">Occupation *</Label>
                        <Input
                          id="occupation"
                          value={formData.occupation}
                          onChange={(e) => handleInputChange('occupation', e.target.value)}
                          placeholder="Your profession"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="income_source">Income Source *</Label>
                        <Select 
                          value={formData.income_source} 
                          onValueChange={(value) => handleInputChange('income_source', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select income source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="salary">Salary</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                            <SelectItem value="farming">Farming</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="monthly_income" className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" />
                        <span>Monthly Income (KES) *</span>
                      </Label>
                      <Input
                        id="monthly_income"
                        type="number"
                        value={formData.monthly_income}
                        onChange={(e) => handleInputChange('monthly_income', e.target.value)}
                        placeholder="25000"
                        min="0"
                        required
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Business Information (Optional) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Building className="h-5 w-5" />
                      <span>Business Information (Optional)</span>
                    </CardTitle>
                    <CardDescription>
                      Fill this section if you're registering as a business
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_business"
                        checked={formData.is_business_customer}
                        onCheckedChange={(checked) => handleInputChange('is_business_customer', checked as boolean)}
                      />
                      <Label htmlFor="is_business">This is a business registration</Label>
                    </div>

                    {formData.is_business_customer && (
                      <>
                        <div>
                          <Label htmlFor="business_name">Business Name *</Label>
                          <Input
                            id="business_name"
                            value={formData.business_name || ''}
                            onChange={(e) => handleInputChange('business_name', e.target.value)}
                            placeholder="Your business name"
                            required={formData.is_business_customer}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="business_type">Business Type *</Label>
                            <Input
                              id="business_type"
                              value={formData.business_type || ''}
                              onChange={(e) => handleInputChange('business_type', e.target.value)}
                              placeholder="e.g., Retail, Restaurant"
                              required={formData.is_business_customer}
                            />
                          </div>
                          <div>
                            <Label htmlFor="business_registration">Registration Number</Label>
                            <Input
                              id="business_registration"
                              value={formData.business_registration_number || ''}
                              onChange={(e) => handleInputChange('business_registration_number', e.target.value)}
                              placeholder="Business registration number"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Contact Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Emergency Contact</span>
                    </CardTitle>
                    <CardDescription>
                      Provide emergency contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emergency_name">Emergency Contact Name *</Label>
                        <Input
                          id="emergency_name"
                          value={formData.emergency_contact_name}
                          onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                          placeholder="Full name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergency_phone">Emergency Contact Phone *</Label>
                        <Input
                          id="emergency_phone"
                          value={formData.emergency_contact_phone}
                          onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                          placeholder="+254 700 123 456"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="emergency_relationship">Relationship *</Label>
                      <Select 
                        value={formData.emergency_contact_relationship} 
                        onValueChange={(value) => handleInputChange('emergency_contact_relationship', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="friend">Friend</SelectItem>
                          <SelectItem value="colleague">Colleague</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Reference Contacts</span>
                    </CardTitle>
                    <CardDescription>
                      Provide at least 2 reference contacts who can vouch for you
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {formData.reference_contacts.map((contact, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Reference Contact {index + 1}</h4>
                          <Badge variant="outline">Required</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`ref_name_${index}`}>Full Name *</Label>
                            <Input
                              id={`ref_name_${index}`}
                              value={contact.name}
                              onChange={(e) => handleReferenceContactChange(index, 'name', e.target.value)}
                              placeholder="Full name"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor={`ref_phone_${index}`}>Phone Number *</Label>
                            <Input
                              id={`ref_phone_${index}`}
                              value={contact.phone}
                              onChange={(e) => handleReferenceContactChange(index, 'phone', e.target.value)}
                              placeholder="+254 700 123 456"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`ref_relationship_${index}`}>Relationship *</Label>
                            <Input
                              id={`ref_relationship_${index}`}
                              value={contact.relationship}
                              onChange={(e) => handleReferenceContactChange(index, 'relationship', e.target.value)}
                              placeholder="e.g., Friend, Colleague"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor={`ref_email_${index}`}>Email (Optional)</Label>
                            <Input
                              id={`ref_email_${index}`}
                              type="email"
                              value={contact.email || ''}
                              onChange={(e) => handleReferenceContactChange(index, 'email', e.target.value)}
                              placeholder="email@example.com"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 4: Document Upload */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Upload className="h-5 w-5" />
                      <span>Identity Documents</span>
                    </CardTitle>
                    <CardDescription>
                      Upload clear photos of your ID documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="id_front">ID Document (Front) *</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <input
                            type="file"
                            id="id_front"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange('id_document_front', e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <Label htmlFor="id_front" className="cursor-pointer flex flex-col items-center space-y-2">
                            <Camera className="h-8 w-8 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {documents.id_document_front ? documents.id_document_front.name : 'Click to upload or take photo'}
                            </span>
                          </Label>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="id_back">ID Document (Back) *</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <input
                            type="file"
                            id="id_back"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange('id_document_back', e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <Label htmlFor="id_back" className="cursor-pointer flex flex-col items-center space-y-2">
                            <Camera className="h-8 w-8 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {documents.id_document_back ? documents.id_document_back.name : 'Click to upload or take photo'}
                            </span>
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">📸 Photo Tips:</h4>
                      <ul className="text-xs text-blue-600 space-y-1">
                        <li>• Ensure document is clearly visible and readable</li>
                        <li>• Use good lighting and avoid shadows</li>
                        <li>• Keep camera steady and focus properly</li>
                        <li>• File size should be under 5MB</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Additional Documents</span>
                    </CardTitle>
                    <CardDescription>
                      Upload supporting documents (optional but recommended)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="profile_photo">Profile Photo</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <input
                          type="file"
                          id="profile_photo"
                          accept="image/*"
                          onChange={(e) => handleFileChange('profile_photo', e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <Label htmlFor="profile_photo" className="cursor-pointer flex flex-col items-center space-y-2">
                          <User className="h-8 w-8 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {documents.profile_photo ? documents.profile_photo.name : 'Upload profile photo'}
                          </span>
                        </Label>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="proof_income">Proof of Income</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <input
                          type="file"
                          id="proof_income"
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={(e) => handleFileChange('proof_of_income', e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <Label htmlFor="proof_income" className="cursor-pointer flex flex-col items-center space-y-2">
                          <FileText className="h-8 w-8 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {documents.proof_of_income ? documents.proof_of_income.name : 'Upload salary slip, bank statement, etc.'}
                          </span>
                        </Label>
                      </div>
                    </div>

                    {formData.is_business_customer && (
                      <div>
                        <Label htmlFor="business_license">Business License</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <input
                            type="file"
                            id="business_license"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange('business_license', e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <Label htmlFor="business_license" className="cursor-pointer flex flex-col items-center space-y-2">
                            <Building className="h-8 w-8 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {documents.business_license ? documents.business_license.name : 'Upload business license'}
                            </span>
                          </Label>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 5: Review and Submit */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5" />
                      <span>Review Your Information</span>
                    </CardTitle>
                    <CardDescription>
                      Please review all information before submitting your application
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Personal Information Review */}
                    <div>
                      <h4 className="font-medium mb-3">Personal Information</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><span className="font-medium">Name:</span> {formData.first_name} {formData.last_name}</div>
                          <div><span className="font-medium">Email:</span> {formData.email}</div>
                          <div><span className="font-medium">Phone:</span> {formData.phone}</div>
                          <div><span className="font-medium">Date of Birth:</span> {formData.date_of_birth}</div>
                          <div><span className="font-medium">National ID:</span> {formData.national_id}</div>
                          <div><span className="font-medium">Occupation:</span> {formData.occupation}</div>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Address:</span> {formData.address}
                        </div>
                      </div>
                    </div>

                    {/* Contact Information Review */}
                    <div>
                      <h4 className="font-medium mb-3">Contact Information</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div>
                          <span className="font-medium text-sm">Emergency Contact:</span>
                          <div className="text-sm text-gray-600">
                            {formData.emergency_contact_name} - {formData.emergency_contact_phone} ({formData.emergency_contact_relationship})
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-sm">Reference Contacts:</span>
                          {formData.reference_contacts.filter(c => c.name).map((contact, index) => (
                            <div key={index} className="text-sm text-gray-600">
                              {contact.name} - {contact.phone} ({contact.relationship})
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Document Upload Review */}
                    <div>
                      <h4 className="font-medium mb-3">Uploaded Documents</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>ID Document (Front):</span>
                            <span className={documents.id_document_front ? "text-green-600" : "text-red-600"}>
                              {documents.id_document_front ? "✓ Uploaded" : "✗ Missing"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>ID Document (Back):</span>
                            <span className={documents.id_document_back ? "text-green-600" : "text-red-600"}>
                              {documents.id_document_back ? "✓ Uploaded" : "✗ Missing"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Profile Photo:</span>
                            <span className={documents.profile_photo ? "text-green-600" : "text-gray-500"}>
                              {documents.profile_photo ? "✓ Uploaded" : "○ Optional"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Proof of Income:</span>
                            <span className={documents.proof_of_income ? "text-green-600" : "text-gray-500"}>
                              {documents.proof_of_income ? "✓ Uploaded" : "○ Optional"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Final Terms Acceptance */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">📋 Next Steps</h4>
                      <div className="text-sm text-blue-600 space-y-1">
                        <p>• Your application will be reviewed within 24-48 hours</p>
                        <p>• You'll receive SMS and email updates on your application status</p>
                        <p>• Once approved, you can proceed with your PayGo plan</p>
                        <p>• Our team may contact you for additional verification if needed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < steps.length ? (
                <Button onClick={nextStep}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? 'Submitting...' : 'Complete Registration'}
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Plan Summary */}
            {planSession && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Your Selected Plan</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium">{planSession.product_name}</div>
                      <div className="text-sm text-gray-600">
                        Total Price: KES {planSession.product_price?.toLocaleString()}
                      </div>
                    </div>
                    
                    {planSession.selected_plan && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-blue-800">
                          {planSession.selected_plan.frequency_display} Plan
                        </div>
                        <div className="text-sm text-blue-600">
                          {planSession.selected_plan.installment_amount} × {planSession.selected_plan.num_payments} payments
                        </div>
                        <div className="text-xs text-blue-500 mt-1">
                          Down payment: {planSession.selected_plan.down_payment}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Registration Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Registration Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div 
                      key={step.id}
                      className={`flex items-center space-x-3 ${
                        currentStep === step.id ? 'text-blue-600' : 
                        currentStep > step.id ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        currentStep === step.id ? 'bg-blue-100' : 
                        currentStep > step.id ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {currentStep > step.id ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          step.id
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{step.title}</div>
                        <div className="text-xs opacity-75">{step.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🔒 Your Data is Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-gray-600 space-y-2">
                  <p>• All information is encrypted and securely stored</p>
                  <p>• We comply with Kenya Data Protection Act 2019</p>
                  <p>• Your documents are used only for verification</p>
                  <p>• You can request data deletion at any time</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        )}

        {/* Error Display */}
        {error && (
          <Card className="mt-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
