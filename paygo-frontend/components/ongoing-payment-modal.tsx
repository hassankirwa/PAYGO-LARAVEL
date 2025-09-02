"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Receipt, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
  RefreshCw,
  Info,
  DollarSign,
  Calendar,
  User
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OngoingPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  clientData?: {
    deviceId: string
    customerName: string
    customerPhone: string
    paymentPlan: {
      installmentAmount: number
      nextPaymentDate: string
      remainingBalance: number
      totalInstallments: number
      completedInstallments: number
    }
    appliance: {
      model: string
    }
  }
  onPaymentCompleted?: () => void
}

interface PaymentMethod {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  instructions: string[]
  businessNumber?: string
  tillNumber?: string
}

export function OngoingPaymentModal({ 
  isOpen, 
  onClose, 
  clientData, 
  onPaymentCompleted 
}: OngoingPaymentModalProps) {
  const { toast } = useToast()
  const [activeMethod, setActiveMethod] = useState("paybill")
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">("idle")
  const [paymentReference, setPaymentReference] = useState<string>("")
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Default clientData values to prevent undefined errors
  const defaultClientData = {
    deviceId: "N/A",
    customerName: "Customer",
    customerPhone: "N/A",
    paymentPlan: {
      installmentAmount: 0,
      nextPaymentDate: "N/A",
      remainingBalance: 0,
      totalInstallments: 0,
      completedInstallments: 0
    },
    appliance: {
      model: "KOYO Appliance"
    }
  }

  const safeClientData = clientData || defaultClientData

  const paymentMethods: PaymentMethod[] = [
    {
      id: "paybill",
      name: "M-Pesa PayBill",
      icon: <Smartphone className="h-5 w-5" />,
      description: "Pay through M-Pesa PayBill using your device ID",
      businessNumber: "174379",
      instructions: [
        "Dial *150*00# on your phone",
        "Select 'Pay Bill'",
        "Enter Business Number: 174379",
        `Enter Account Number: ${safeClientData.deviceId}`,
        `Enter Amount: ${safeClientData.paymentPlan.installmentAmount}`,
        "Enter your M-Pesa PIN",
        "Confirm the payment"
      ]
    },
    {
      id: "till",
      name: "M-Pesa Till Number",
      icon: <Receipt className="h-5 w-5" />,
      description: "Pay through M-Pesa Till Number",
      tillNumber: "5544332",
      instructions: [
        "Dial *150*00# on your phone",
        "Select 'Buy Goods and Services'",
        "Enter Till Number: 5544332",
        `Enter Amount: ${safeClientData.paymentPlan.installmentAmount}`,
        `Reference: ${safeClientData.deviceId}`,
        "Enter your M-Pesa PIN",
        "Confirm the payment"
      ]
    },
    {
      id: "bank",
      name: "Bank Transfer",
      icon: <Building2 className="h-5 w-5" />,
      description: "Pay through bank transfer or mobile banking",
      instructions: [
        "Log in to your mobile banking app",
        "Select 'Send Money' or 'Transfer'",
        "Enter Account: KOYO PayGo",
        "Account Number: 1234567890",
        `Amount: KSh ${safeClientData.paymentPlan.installmentAmount.toLocaleString()}`,
        `Reference: ${safeClientData.deviceId}`,
        "Complete the transfer"
      ]
    }
  ]

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`
  }

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      toast({
        title: "Copied!",
        description: `${fieldName} copied to clipboard`,
        variant: "default",
      })
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast({
        title: "Copy failed",
        description: "Please copy the number manually",
        variant: "destructive",
      })
    }
  }

  const handlePaymentInitiate = () => {
    setIsConfirmDialogOpen(true)
  }

  const confirmPayment = () => {
    setIsConfirmDialogOpen(false)
    setPaymentStatus("processing")
    
    // Simulate payment processing
    setTimeout(() => {
      // In a real implementation, this would check payment status via API
      const isSuccess = Math.random() > 0.3 // 70% success rate for demo
      
      if (isSuccess) {
        setPaymentStatus("success")
        setPaymentReference(`MP${Date.now().toString().slice(-8)}`)
        toast({
          title: "Payment Successful!",
          description: `Your installment of ${formatCurrency(safeClientData.paymentPlan.installmentAmount)} has been received.`,
          variant: "default",
        })
        onPaymentCompleted?.()
      } else {
        setPaymentStatus("failed")
        toast({
          title: "Payment Failed",
          description: "Payment could not be processed. Please try again.",
          variant: "destructive",
        })
      }
    }, 3000)
  }

  const resetPayment = () => {
    setPaymentStatus("idle")
    setPaymentReference("")
  }

  const currentMethod = paymentMethods.find(method => method.id === activeMethod)

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Make Payment</span>
            </DialogTitle>
            <DialogDescription>
              Make your installment payment for {safeClientData.appliance.model}
            </DialogDescription>
          </DialogHeader>

          {paymentStatus === "idle" && (
            <>
              {/* Payment Summary */}
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Installment Amount</p>
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(safeClientData.paymentPlan.installmentAmount)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Due Date</p>
                        <p className="text-sm font-semibold">{safeClientData.paymentPlan.nextPaymentDate}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Account</p>
                        <p className="text-sm font-semibold font-mono">{safeClientData.deviceId}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method Selection */}
              <Tabs value={activeMethod} onValueChange={setActiveMethod}>
                <TabsList className="grid w-full grid-cols-3">
                  {paymentMethods.map((method) => (
                    <TabsTrigger key={method.id} value={method.id} className="flex items-center space-x-2">
                      {method.icon}
                      <span className="hidden sm:inline">{method.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {paymentMethods.map((method) => (
                  <TabsContent key={method.id} value={method.id} className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          {method.icon}
                          <span>{method.name}</span>
                        </CardTitle>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Quick Copy Section */}
                        {method.businessNumber && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Business Number</Label>
                                <div className="flex items-center space-x-2 mt-1">
                                  <code className="bg-white px-3 py-2 rounded border font-mono text-lg">
                                    {method.businessNumber}
                                  </code>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(method.businessNumber!, "Business Number")}
                                  >
                                    {copiedField === "Business Number" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Account Number</Label>
                                <div className="flex items-center space-x-2 mt-1">
                                  <code className="bg-white px-3 py-2 rounded border font-mono text-lg">
                                    {safeClientData.deviceId}
                                  </code>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(safeClientData.deviceId, "Account Number")}
                                  >
                                    {copiedField === "Account Number" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {method.tillNumber && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Till Number</Label>
                                <div className="flex items-center space-x-2 mt-1">
                                  <code className="bg-white px-3 py-2 rounded border font-mono text-lg">
                                    {method.tillNumber}
                                  </code>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(method.tillNumber!, "Till Number")}
                                  >
                                    {copiedField === "Till Number" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Reference</Label>
                                <div className="flex items-center space-x-2 mt-1">
                                  <code className="bg-white px-3 py-2 rounded border font-mono text-lg">
                                    {safeClientData.deviceId}
                                  </code>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(safeClientData.deviceId, "Reference")}
                                  >
                                    {copiedField === "Reference" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Instructions */}
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Step-by-step Instructions:</Label>
                          <ol className="space-y-2">
                            {method.instructions.map((instruction, index) => (
                              <li key={index} className="flex items-start space-x-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                                  {index + 1}
                                </span>
                                <span className="text-sm">{instruction}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* Important Notes */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex items-start space-x-2">
                            <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-amber-800">Important Notes:</p>
                              <ul className="text-sm text-amber-700 mt-1 space-y-1">
                                <li>• Pay exactly {formatCurrency(safeClientData.paymentPlan.installmentAmount)} to avoid processing delays</li>
                                <li>• Use your device ID ({safeClientData.deviceId}) as the account/reference number</li>
                                <li>• Payment confirmation will be sent via SMS</li>
                                <li>• Your appliance will remain active after successful payment</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handlePaymentInitiate} className="bg-green-600 hover:bg-green-700">
                  I Have Made Payment
                </Button>
              </div>
            </>
          )}

          {paymentStatus === "processing" && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Processing Payment...</h3>
              <p className="text-gray-600">We're confirming your payment. This may take a few moments.</p>
            </div>
          )}

          {paymentStatus === "success" && (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-600 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-4">
                Your installment payment of {formatCurrency(safeClientData.paymentPlan.installmentAmount)} has been confirmed.
              </p>
              {paymentReference && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-green-700">
                    <strong>Reference Number:</strong> {paymentReference}
                  </p>
                </div>
              )}
              <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
                Done
              </Button>
            </div>
          )}

          {paymentStatus === "failed" && (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-red-600 mb-2">Payment Failed</h3>
              <p className="text-gray-600 mb-4">
                We couldn't confirm your payment. Please try again or contact support if the issue persists.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <Button variant="outline" onClick={resetPayment}>
                  Try Again
                </Button>
                <Button onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Have you completed the payment of {formatCurrency(safeClientData.paymentPlan.installmentAmount)} using {currentMethod?.name}?
              <br /><br />
              <strong>Please ensure:</strong>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>You've paid exactly {formatCurrency(safeClientData.paymentPlan.installmentAmount)}</li>
                <li>You've used {safeClientData.deviceId} as the account/reference number</li>
                <li>You've received an M-Pesa confirmation SMS</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Not Yet</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPayment}>Yes, I've Paid</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 