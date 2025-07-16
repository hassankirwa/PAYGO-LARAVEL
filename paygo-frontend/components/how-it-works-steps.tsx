"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, UserPlus, CreditCard, CheckCircle, ArrowRight } from "lucide-react"

const steps = [
  {
    id: 1,
    title: "Choose a Product",
    subtitle: "Browse our selection of solar-powered refrigeration solutions",
    icon: Search,
    description:
      "Explore our range of KOYO solar fridges and freezers. From compact 50L models perfect for small households to large 508L units ideal for businesses. Each product comes with detailed specifications and pricing information.",
    features: ["50L to 508L capacity range", "Solar + electric dual power", "2-year PayGo warranty", "Made in Kenya"],
    color: "bg-blue-500",
    lightColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    id: 2,
    title: "Register & Subscribe",
    subtitle: "Sign up with Drop Access and select your payment plan",
    icon: UserPlus,
    description:
      "Create your account with Drop Access and choose your subscription plan - weekly or monthly payments. Our smart PayGo system will monitor your payments and automatically manage your appliance access based on your payment status.",
    features: [
      "Weekly or monthly subscriptions",
      "Automatic payment tracking",
      "Smart device management",
      "No credit checks required",
    ],
    color: "bg-emerald-500",
    lightColor: "bg-emerald-50",
    textColor: "text-emerald-600",
  },
  {
    id: 3,
    title: "Pay & Stay Active",
    subtitle: "Make timely payments to keep your appliance running",
    icon: CreditCard,
    description:
      "Receive payment reminders 3 days before your subscription expires. Pay via M-Pesa or mobile money to instantly reactivate your appliance. The unit automatically turns off if payment is missed, encouraging timely payments for uninterrupted service.",
    features: [
      "3-day advance payment reminders",
      "Instant activation upon payment",
      "Automatic deactivation if payment missed",
      "M-Pesa & mobile money integration",
    ],
    color: "bg-orange-500",
    lightColor: "bg-orange-50",
    textColor: "text-orange-600",
  },
  {
    id: 4,
    title: "Complete & Own",
    subtitle: "Finish payments and gain full ownership",
    icon: CheckCircle,
    description:
      "Once all subscription payments are completed, the PayGo system is permanently disabled and you gain full ownership. No more payment reminders, no more deactivation - the appliance is 100% yours forever with continued warranty support.",
    features: [
      "Permanent ownership after final payment",
      "PayGo system permanently disabled",
      "Continued warranty support",
      "No more subscription fees",
    ],
    color: "bg-green-500",
    lightColor: "bg-green-50",
    textColor: "text-green-600",
  },
]

export default function HowItWorksSteps() {
  const [activeStep, setActiveStep] = useState(1)
  const currentStep = steps.find((step) => step.id === activeStep) || steps[0]

  return (
    <section className="py-16 px-4 md:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-emerald-100 text-emerald-800 px-4 py-2">How It Works</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Get Your Solar Fridge in
            <span className="text-emerald-600"> 4 Simple Steps</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From selection to ownership, our streamlined process makes it easy to get the solar refrigeration solution
            you need.
          </p>
        </div>

        {/* Step Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {steps.map((step, index) => (
            <Button
              key={step.id}
              variant={activeStep === step.id ? "default" : "outline"}
              className={`flex items-center gap-2 px-4 py-2 ${
                activeStep === step.id
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50 bg-transparent"
              }`}
              onClick={() => setActiveStep(step.id)}
            >
              <span className="font-semibold">{step.id}</span>
              <span className="hidden sm:inline">{step.title}</span>
              {index < steps.length - 1 && <ArrowRight className="h-4 w-4 ml-2 text-gray-400 hidden lg:inline" />}
            </Button>
          ))}
        </div>

        {/* Active Step Content */}
        <Card className="overflow-hidden shadow-xl">
          <div className={`${currentStep.color} p-6 text-white`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <currentStep.icon className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-white/20 text-white border-white/30">Step {currentStep.id}</Badge>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold">{currentStep.title}</h3>
                <p className="text-lg opacity-90">{currentStep.subtitle}</p>
              </div>
            </div>
          </div>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">What Happens</h4>
                <p className="text-gray-700 leading-relaxed mb-6">{currentStep.description}</p>

                <h4 className="text-xl font-semibold text-gray-900 mb-4">Key Features</h4>
                <ul className="space-y-3">
                  {currentStep.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 ${currentStep.lightColor} rounded-full flex items-center justify-center`}
                      >
                        <CheckCircle className={`h-4 w-4 ${currentStep.textColor}`} />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`${currentStep.lightColor} p-6 rounded-xl`}>
                <h4 className={`text-xl font-semibold ${currentStep.textColor} mb-4`}>
                  Step {currentStep.id} Checklist
                </h4>
                <div className="space-y-3">
                  {currentStep.id === 1 && (
                    <>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">Browse product catalog</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">Compare specifications</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">Check pricing options</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">Select your preferred model</span>
                      </div>
                    </>
                  )}
                  {currentStep.id === 2 && (
                    <>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">Choose subscription frequency</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">Set up mobile money account</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">Activate PayGo monitoring</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">Receive welcome SMS</span>
                      </div>
                    </>
                  )}
                  {currentStep.id === 3 && (
                    <>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">Receive 3-day payment reminder</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">Make payment via M-Pesa</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">Appliance instantly reactivates</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">Continue enjoying uninterrupted service</span>
                      </div>
                    </>
                  )}
                  {currentStep.id === 4 && (
                    <>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">Complete final payment</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">PayGo system permanently disabled</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">Receive ownership certificate</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">Enjoy permanent ownership!</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
            disabled={activeStep === 1}
            className="bg-transparent"
          >
            Previous Step
          </Button>
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Step {activeStep} of {steps.length}
            </p>
          </div>
          <Button
            onClick={() => setActiveStep(Math.min(steps.length, activeStep + 1))}
            disabled={activeStep === steps.length}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Next Step
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
