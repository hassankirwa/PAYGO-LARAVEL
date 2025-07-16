"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, Smartphone, Power, PowerOff, CheckCircle, AlertTriangle, Calendar } from "lucide-react"

const notificationSteps = [
  {
    day: -3,
    title: "Payment Reminder",
    icon: Bell,
    status: "reminder",
    message: "Your monthly subscription expires in 3 days. Pay KSh 2,500 to continue service.",
    action: "Reminder sent via SMS",
    deviceStatus: "active",
  },
  {
    day: -1,
    title: "Final Notice",
    icon: AlertTriangle,
    status: "warning",
    message: "Final reminder: Your subscription expires tomorrow. Pay now to avoid service interruption.",
    action: "Final SMS sent",
    deviceStatus: "active",
  },
  {
    day: 0,
    title: "Service Suspended",
    icon: PowerOff,
    status: "suspended",
    message: "Payment not received. Your appliance has been temporarily deactivated.",
    action: "Device automatically turned off",
    deviceStatus: "inactive",
  },
  {
    day: 1,
    title: "Payment Received",
    icon: CheckCircle,
    status: "paid",
    message: "Payment confirmed! Your appliance is now active for the next 30 days.",
    action: "Device instantly reactivated",
    deviceStatus: "active",
  },
]

export default function PayGoNotificationSystem() {
  const [selectedStep, setSelectedStep] = useState(0)
  const currentStep = notificationSteps[selectedStep]

  return (
    <section className="py-16 px-4 md:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-emerald-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-800 px-4 py-2">PayGo Smart System</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Smart Payment Notifications &<span className="text-emerald-600"> Automatic Device Control</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our intelligent PayGo system keeps you informed and ensures timely payments through automatic device
            management.
          </p>
        </div>

        {/* Timeline Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {notificationSteps.map((step, index) => (
            <Button
              key={index}
              variant={selectedStep === index ? "default" : "outline"}
              className={`flex items-center gap-2 px-4 py-2 ${
                selectedStep === index
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50 bg-transparent"
              }`}
              onClick={() => setSelectedStep(index)}
            >
              <step.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{step.title}</span>
            </Button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Notification Details */}
          <Card className="shadow-xl">
            <CardHeader
              className={`${
                currentStep.status === "reminder"
                  ? "bg-blue-500"
                  : currentStep.status === "warning"
                    ? "bg-orange-500"
                    : currentStep.status === "suspended"
                      ? "bg-red-500"
                      : "bg-green-500"
              } text-white`}
            >
              <CardTitle className="flex items-center gap-3">
                <currentStep.icon className="h-6 w-6" />
                {currentStep.title}
                <Badge className="bg-white/20 text-white border-white/30">
                  Day {currentStep.day === 0 ? "X" : currentStep.day > 0 ? `+${currentStep.day}` : currentStep.day}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Customer Notification</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-emerald-500">
                    <div className="flex items-start gap-3">
                      <Smartphone className="h-5 w-5 text-emerald-600 mt-1" />
                      <p className="text-gray-700 italic">"{currentStep.message}"</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">System Action</h4>
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <span className="text-gray-700">{currentStep.action}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Device Status</h4>
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      currentStep.deviceStatus === "active" ? "bg-green-50" : "bg-red-50"
                    }`}
                  >
                    {currentStep.deviceStatus === "active" ? (
                      <>
                        <Power className="h-5 w-5 text-green-600" />
                        <span className="text-green-700 font-semibold">Appliance Active & Running</span>
                      </>
                    ) : (
                      <>
                        <PowerOff className="h-5 w-5 text-red-600" />
                        <span className="text-red-700 font-semibold">Appliance Deactivated</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visual Device Status */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-600" />
                Monthly Payment Cycle
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Timeline */}
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  {notificationSteps.map((step, index) => (
                    <div
                      key={index}
                      className={`relative flex items-center gap-4 pb-6 ${
                        selectedStep === index ? "opacity-100" : "opacity-50"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.status === "reminder"
                            ? "bg-blue-100 text-blue-600"
                            : step.status === "warning"
                              ? "bg-orange-100 text-orange-600"
                              : step.status === "suspended"
                                ? "bg-red-100 text-red-600"
                                : "bg-green-100 text-green-600"
                        } ${selectedStep === index ? "ring-2 ring-emerald-500" : ""}`}
                      >
                        <step.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{step.title}</p>
                        <p className="text-sm text-gray-600">
                          Day {step.day === 0 ? "X (Expiry)" : step.day > 0 ? `+${step.day}` : step.day}
                        </p>
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          step.deviceStatus === "active" ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></div>
                    </div>
                  ))}
                </div>

                {/* Key Benefits */}
                <div className="mt-8 p-4 bg-emerald-50 rounded-lg">
                  <h4 className="font-semibold text-emerald-800 mb-2">Why This System Works</h4>
                  <ul className="text-sm text-emerald-700 space-y-1">
                    <li>• Prevents missed payments with advance reminders</li>
                    <li>• Encourages timely payment through device control</li>
                    <li>• Instant reactivation upon payment confirmation</li>
                    <li>• No service interruption for paying customers</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="inline-block p-6 bg-gradient-to-r from-emerald-500 to-blue-500 text-white">
            <h3 className="text-xl font-bold mb-2">Ready to Get Started?</h3>
            <p className="mb-4">Join thousands of satisfied customers enjoying reliable solar refrigeration</p>
            <Button className="bg-white text-emerald-600 hover:bg-gray-100">Start Your PayGo Journey</Button>
          </Card>
        </div>
      </div>
    </section>
  )
}
