"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Shield, 
  FileText, 
  Phone, 
  Mail, 
  Clock, 
  DollarSign, 
  Wifi, 
  Power, 
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Download,
  Eye,
  RefreshCw,
  Zap,
  Users
} from "lucide-react"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function TermsAndConditionsPage() {
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [acceptedIoT, setAcceptedIoT] = useState(false)

  const allAccepted = acceptedTerms && acceptedPrivacy && acceptedIoT

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-emerald-600" />
              <h1 className="text-2xl font-bold text-gray-900">KOYO PayGo Terms</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
              <Button onClick={() => window.print()} variant="outline" className="hidden md:flex">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Navigation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Quick Navigation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="justify-start" onClick={() => document.getElementById('paygo-terms')?.scrollIntoView({ behavior: 'smooth' })}>
                <FileText className="h-4 w-4 mr-2" />
                PayGo Terms
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => document.getElementById('iot-policies')?.scrollIntoView({ behavior: 'smooth' })}>
                <Wifi className="h-4 w-4 mr-2" />
                IoT Policies
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => document.getElementById('customer-rights')?.scrollIntoView({ behavior: 'smooth' })}>
                <Shield className="h-4 w-4 mr-2" />
                Your Rights
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}>
                <HelpCircle className="h-4 w-4 mr-2" />
                FAQ
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* PayGo Terms Section */}
        <section id="paygo-terms" className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <FileText className="h-6 w-6 text-emerald-600" />
                PayGo Terms and Conditions
              </CardTitle>
              <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Terms */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Payment Terms
                </h3>
                <div className="space-y-4 text-gray-700">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">No Interest Policy</h4>
                    <p>KOYO PayGo plans charge <strong>zero interest</strong>. You only pay the base price of the appliance spread over your chosen payment period.</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2">Payment Frequencies</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Weekly: 7-day intervals</li>
                        <li>• Monthly: 30-day intervals</li>
                        <li>• Quarterly: 90-day intervals</li>
                      </ul>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h4 className="font-medium text-orange-800 mb-2">Late Payment Policy</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Grace Period: 3 days</li>
                        <li>• Late Fee: 5% of installment</li>
                        <li>• Service suspension after 7 days</li>
                      </ul>
                    </div>
                  </div>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Early Payment Discount:</strong> Pay your remaining balance early and receive a 2% discount on the outstanding amount.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              {/* Ownership Terms */}
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Ownership and Transfer</h3>
                <div className="space-y-3 text-gray-700">
                  <p>
                    The appliance remains the property of KOYO until all payments are completed. 
                    Upon final payment, full ownership transfers to the customer.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Transfer Requirements:</h4>
                    <ul className="text-sm space-y-1">
                      <li>• All payments must be up to date</li>
                      <li>• Transfer fee of KSh 500 applies</li>
                      <li>• 7-day processing period</li>
                      <li>• New location must be within service area</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Service Terms */}
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Service and Maintenance</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <h4 className="font-medium text-emerald-800 mb-2">Included Services</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Free installation</li>
                      <li>• 24/7 technical support</li>
                      <li>• Preventive maintenance</li>
                      <li>• Parts replacement</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">Warranty Coverage</h4>
                    <ul className="text-sm space-y-1">
                      <li>• 2-year comprehensive warranty</li>
                      <li>• Compressor: 5-year warranty</li>
                      <li>• Solar panel: 10-year warranty</li>
                      <li>• Battery: 3-year warranty</li>
                    </ul>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-800 mb-2">Customer Responsibilities</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Timely payments</li>
                      <li>• Proper usage</li>
                      <li>• Access for maintenance</li>
                      <li>• Report issues promptly</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* IoT Control and Suspension Policies */}
        <section id="iot-policies" className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Wifi className="h-6 w-6 text-blue-600" />
                IoT Control and Suspension Policies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-blue-200 bg-blue-50">
                <Wifi className="h-4 w-4" />
                <AlertDescription>
                  Your KOYO appliance is equipped with smart IoT technology that enables remote monitoring 
                  and payment-based service control for your convenience and security.
                </AlertDescription>
              </Alert>

              {/* How IoT Control Works */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                  How IoT Control Works
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        When Payments Are Current
                      </h4>
                      <ul className="text-sm space-y-1 text-green-700">
                        <li>• Full appliance functionality</li>
                        <li>• Normal temperature control</li>
                        <li>• All features accessible</li>
                        <li>• Remote monitoring for support</li>
                      </ul>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Grace Period (3 Days)
                      </h4>
                      <ul className="text-sm space-y-1 text-orange-700">
                        <li>• Continued full functionality</li>
                        <li>• Payment reminder notifications</li>
                        <li>• No service restrictions</li>
                        <li>• Support remains available</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                        <Power className="h-4 w-4" />
                        Service Suspension (After 7 Days)
                      </h4>
                      <ul className="text-sm space-y-1 text-red-700">
                        <li>• Appliance cooling disabled</li>
                        <li>• Essential monitoring continues</li>
                        <li>• Immediate restoration upon payment</li>
                        <li>• Technical support available</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                        <ArrowRight className="h-4 w-4" />
                        Reactivation Process
                      </h4>
                      <ul className="text-sm space-y-1 text-blue-700">
                        <li>• Make outstanding payment</li>
                        <li>• Automatic service restoration</li>
                        <li>• Usually within 15 minutes</li>
                        <li>• Confirmation SMS sent</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Privacy */}
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  Data Privacy and Security
                </h3>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-800 mb-3">We Collect and Monitor:</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <ul className="text-sm space-y-1 text-purple-700">
                      <li>• Temperature and humidity levels</li>
                      <li>• Power consumption patterns</li>
                      <li>• Door open/close frequency</li>
                      <li>• System diagnostics</li>
                    </ul>
                    <ul className="text-sm space-y-1 text-purple-700">
                      <li>• Payment status updates</li>
                      <li>• Location data (for service)</li>
                      <li>• Usage analytics</li>
                      <li>• Maintenance alerts</li>
                    </ul>
                  </div>
                  <p className="text-sm text-purple-700 mt-3">
                    <strong>Your data is encrypted, secure, and never shared with third parties without your consent.</strong>
                  </p>
                </div>
              </div>

              {/* Emergency Provisions */}
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Emergency Provisions
                </h3>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-red-800 mb-3">
                    <strong>Medical Emergency:</strong> In case of medical emergencies requiring refrigerated medicines, 
                    contact our 24/7 support line for temporary service restoration.
                  </p>
                  <div className="text-sm text-red-700">
                    <p><strong>Emergency Contact:</strong> +254 700 123 456</p>
                    <p><strong>Response Time:</strong> Within 30 minutes</p>
                    <p><strong>Duration:</strong> Up to 72 hours emergency access</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Customer Rights and Support */}
        <section id="customer-rights" className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Shield className="h-6 w-6 text-green-600" />
                Customer Rights and Support Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Your Rights */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Your Rights as a KOYO Customer</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-800 mb-2">Fair Treatment Rights</h4>
                      <ul className="text-sm space-y-1 text-green-700">
                        <li>• Transparent pricing and terms</li>
                        <li>• No hidden fees or charges</li>
                        <li>• Fair dispute resolution</li>
                        <li>• Respectful service</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2">Service Rights</h4>
                      <ul className="text-sm space-y-1 text-blue-700">
                        <li>• Reliable appliance performance</li>
                        <li>• Timely technical support</li>
                        <li>• Regular maintenance</li>
                        <li>• Quality warranty coverage</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <h4 className="font-medium text-purple-800 mb-2">Privacy Rights</h4>
                      <ul className="text-sm space-y-1 text-purple-700">
                        <li>• Data protection and security</li>
                        <li>• Information transparency</li>
                        <li>• Consent for data usage</li>
                        <li>• Right to data deletion</li>
                      </ul>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h4 className="font-medium text-orange-800 mb-2">Financial Rights</h4>
                      <ul className="text-sm space-y-1 text-orange-700">
                        <li>• Clear payment schedules</li>
                        <li>• Payment flexibility options</li>
                        <li>• Early payment benefits</li>
                        <li>• Ownership transfer rights</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Options */}
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Support Options Available to You
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      24/7 Phone Support
                    </h4>
                    <div className="text-sm space-y-2 text-blue-700">
                      <p><strong>Technical Support:</strong><br />+254 700 123 456</p>
                      <p><strong>Payment Queries:</strong><br />+254 700 123 457</p>
                      <p><strong>Emergency Line:</strong><br />+254 700 123 458</p>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Support
                    </h4>
                    <div className="text-sm space-y-2 text-green-700">
                      <p><strong>General Support:</strong><br />support@koyo.co.ke</p>
                      <p><strong>Billing Questions:</strong><br />billing@koyo.co.ke</p>
                      <p><strong>Technical Issues:</strong><br />tech@koyo.co.ke</p>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Online Support
                    </h4>
                    <div className="text-sm space-y-2 text-purple-700">
                      <p><strong>Customer Portal:</strong><br />24/7 account access</p>
                      <p><strong>Live Chat:</strong><br />Mon-Fri, 8AM-6PM</p>
                      <p><strong>Knowledge Base:</strong><br />Self-service resources</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dispute Resolution */}
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Dispute Resolution Process</h3>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-blue-600 font-bold">1</span>
                      </div>
                      <h4 className="font-medium mb-1">Contact Support</h4>
                      <p className="text-sm text-gray-600">Reach out via phone, email, or chat</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-green-600 font-bold">2</span>
                      </div>
                      <h4 className="font-medium mb-1">Investigation</h4>
                      <p className="text-sm text-gray-600">We review your case within 48 hours</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-orange-600 font-bold">3</span>
                      </div>
                      <h4 className="font-medium mb-1">Resolution</h4>
                      <p className="text-sm text-gray-600">Solution provided within 5 business days</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-purple-600 font-bold">4</span>
                      </div>
                      <h4 className="font-medium mb-1">Escalation</h4>
                      <p className="text-sm text-gray-600">Manager review if needed</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <HelpCircle className="h-6 w-6 text-orange-600" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="payment-plans">
                  <AccordionTrigger>How do PayGo payment plans work?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p>PayGo plans allow you to pay for your KOYO appliance in installments instead of paying the full amount upfront. Here's how it works:</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Choose your payment frequency (weekly, monthly, or quarterly)</li>
                        <li>Select your plan duration (6, 12, 18, or 24 months)</li>
                        <li>Make a down payment (10-50% of the product price)</li>
                        <li>Pay regular installments with zero interest</li>
                        <li>Gain full ownership once all payments are complete</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="iot-monitoring">
                  <AccordionTrigger>What does IoT monitoring mean for my appliance?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p>IoT monitoring provides several benefits:</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li><strong>Remote Diagnostics:</strong> We can identify and fix issues before they become problems</li>
                        <li><strong>Payment-Based Control:</strong> Service continues when payments are current</li>
                        <li><strong>Energy Optimization:</strong> Monitor power usage to maximize efficiency</li>
                        <li><strong>Maintenance Alerts:</strong> Proactive notifications for service needs</li>
                        <li><strong>Security:</strong> Protection against theft and unauthorized use</li>
                      </ul>
                      <p>Your privacy is protected - we only collect operational data necessary for service provision.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="payment-methods">
                  <AccordionTrigger>What payment methods are accepted?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p>We accept multiple convenient payment methods:</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li><strong>M-Pesa:</strong> STK Push or Till Number 5174379</li>
                        <li><strong>Bank Transfer:</strong> Direct to our accounts</li>
                        <li><strong>Card Payments:</strong> Visa, Mastercard (online)</li>
                        <li><strong>Cash Payments:</strong> At authorized agents</li>
                        <li><strong>Standing Orders:</strong> Set up automatic payments</li>
                      </ul>
                      <p>All payments are processed securely and you'll receive instant confirmation.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="late-payments">
                  <AccordionTrigger>What happens if I miss a payment?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p>We understand that sometimes payments can be delayed. Here's our policy:</p>
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <p className="text-green-800"><strong>Grace Period (Days 1-3):</strong> Full service continues, reminder sent</p>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                        <p className="text-orange-800"><strong>Days 4-7:</strong> Service continues, late fee of 5% applied</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <p className="text-red-800"><strong>After Day 7:</strong> Service suspended until payment is made</p>
                      </div>
                      <p>Service is automatically restored within 15 minutes of payment confirmation.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="warranty-service">
                  <AccordionTrigger>What warranty and service do I get?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p>KOYO provides comprehensive warranty and service coverage:</p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Warranty Coverage:</h4>
                          <ul className="list-disc pl-6 space-y-1 text-sm">
                            <li>2-year comprehensive warranty</li>
                            <li>5-year compressor warranty</li>
                            <li>10-year solar panel warranty</li>
                            <li>3-year battery warranty</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Included Services:</h4>
                          <ul className="list-disc pl-6 space-y-1 text-sm">
                            <li>Free installation and setup</li>
                            <li>24/7 technical support</li>
                            <li>Regular maintenance visits</li>
                            <li>Free parts replacement</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ownership-transfer">
                  <AccordionTrigger>When do I own the appliance?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p>Ownership transfer occurs automatically when you complete all payments:</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Final payment confirmation received</li>
                        <li>All late fees (if any) settled</li>
                        <li>Ownership certificate issued within 7 days</li>
                        <li>IoT controls removed for full independence</li>
                        <li>Warranty continues under your ownership</li>
                      </ul>
                      <p>You can also purchase the remaining balance early with a 2% discount on outstanding amount.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="relocation">
                  <AccordionTrigger>Can I relocate my appliance?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p>Yes, you can relocate your appliance with some conditions:</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li><strong>Service Area:</strong> New location must be within our coverage area</li>
                        <li><strong>Payment Status:</strong> Account must be current (no overdue payments)</li>
                        <li><strong>Relocation Fee:</strong> KSh 500 processing fee applies</li>
                        <li><strong>Installation:</strong> Professional reinstallation included</li>
                        <li><strong>Timeline:</strong> 7-day processing period required</li>
                      </ul>
                      <p>Contact our support team at least 2 weeks before your planned move.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="technical-support">
                  <AccordionTrigger>How do I get technical support?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p>Multiple support channels are available 24/7:</p>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <h4 className="font-medium text-blue-800 mb-1">Phone Support</h4>
                          <p className="text-sm">+254 700 123 456</p>
                          <p className="text-xs text-blue-600">24/7 availability</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <h4 className="font-medium text-green-800 mb-1">WhatsApp</h4>
                          <p className="text-sm">+254 700 123 456</p>
                          <p className="text-xs text-green-600">Chat support</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                          <h4 className="font-medium text-purple-800 mb-1">Customer Portal</h4>
                          <p className="text-sm">Submit tickets online</p>
                          <p className="text-xs text-purple-600">Track progress</p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </section>

        {/* Legal Compliance and Acceptance */}
        <section className="mb-12">
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Shield className="h-6 w-6 text-blue-600" />
                Legal Compliance and Agreement
              </CardTitle>
              <p className="text-gray-600">Please review and accept these terms to continue using KOYO PayGo services</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Governing Law */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Governing Law</h3>
                <p className="text-sm text-gray-700">
                  These terms are governed by the laws of Kenya. Any disputes will be resolved 
                  in Kenyan courts or through our dispute resolution process.
                </p>
              </div>

              {/* Data Protection Compliance */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-2 text-blue-800">Data Protection Compliance</h3>
                <p className="text-sm text-blue-700 mb-2">
                  We comply with Kenya's Data Protection Act 2019 and international best practices:
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Data minimization - we only collect necessary information</li>
                  <li>• Purpose limitation - data used only for stated purposes</li>
                  <li>• Storage limitation - data retained only as long as necessary</li>
                  <li>• Security measures - encryption and access controls in place</li>
                </ul>
              </div>

              {/* Agreement Checkboxes */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-white border border-gray-200 rounded-lg">
                  <Checkbox 
                    id="accept-terms" 
                    checked={acceptedTerms} 
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  />
                  <div className="flex-1">
                    <label htmlFor="accept-terms" className="text-sm font-medium cursor-pointer">
                      I have read and agree to the PayGo Terms and Conditions
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Including payment terms, ownership conditions, and service obligations
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-white border border-gray-200 rounded-lg">
                  <Checkbox 
                    id="accept-privacy" 
                    checked={acceptedPrivacy} 
                    onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                  />
                  <div className="flex-1">
                    <label htmlFor="accept-privacy" className="text-sm font-medium cursor-pointer">
                      I consent to data collection and processing as described
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      For service delivery, monitoring, and support purposes
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-white border border-gray-200 rounded-lg">
                  <Checkbox 
                    id="accept-iot" 
                    checked={acceptedIoT} 
                    onCheckedChange={(checked) => setAcceptedIoT(checked as boolean)}
                  />
                  <div className="flex-1">
                    <label htmlFor="accept-iot" className="text-sm font-medium cursor-pointer">
                      I understand and accept IoT monitoring and control policies
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Including payment-based service control and remote monitoring
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.print()}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Terms
                </Button>
                <Button
                  className={`flex-1 ${allAccepted ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'}`}
                  disabled={!allAccepted}
                  onClick={() => {
                    if (allAccepted) {
                      // Store acceptance in localStorage with timestamp
                      const acceptance = {
                        accepted: true,
                        timestamp: new Date().toISOString(),
                        terms_version: '1.0'
                      }
                      localStorage.setItem('koyo_terms_acceptance', JSON.stringify(acceptance))
                      alert('Terms accepted successfully! You can now proceed with your PayGo plan.')
                    }
                  }}
                >
                  {allAccepted ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept All Terms
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Please Accept All Terms
                    </>
                  )}
                </Button>
              </div>

              {/* Terms Version and Date */}
              <div className="text-center text-xs text-gray-500 pt-4 border-t">
                <p>Terms Version 1.0 | Last Updated: {new Date().toLocaleDateString()}</p>
                <p>For questions about these terms, contact legal@koyo.co.ke</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer Links */}
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-6 text-sm">
            <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>
            <Link href="/cookie-policy" className="text-blue-600 hover:underline">Cookie Policy</Link>
            <Link href="/contact" className="text-blue-600 hover:underline">Contact Us</Link>
            <Link href="/about" className="text-blue-600 hover:underline">About KOYO</Link>
          </div>
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} KOYO PayGo Platform. All rights reserved. | Made in Kenya
          </p>
        </div>
      </div>
    </div>
  )
} 