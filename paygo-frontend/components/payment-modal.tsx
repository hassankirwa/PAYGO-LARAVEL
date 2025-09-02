"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CreditCard, Smartphone, Banknote } from "lucide-react"
import { MpesaStkPushModal } from "./mpesa-stk-push-modal"
import { TillPaybillModal } from "./till-paybill-modal"
import { BankTransferModal } from "./bank-transfer-modal"

interface PaymentModalProps {
  // Trigger button pattern (legacy)
  triggerButtonText?: string
  productName?: string
  paymentAmount?: number
  paymentType?: string // e.g., "Monthly Payment", "Weekly Installment"
  
  // Controlled modal pattern (new)
  isOpen?: boolean
  onClose?: () => void
  onPaymentInitiated?: () => void
}

export function PaymentModal({ 
  triggerButtonText, 
  productName = "KOYO Appliance", 
  paymentAmount = 0, 
  paymentType = "Payment",
  isOpen,
  onClose,
  onPaymentInitiated
}: PaymentModalProps) {
  const [isStkPushModalOpen, setIsStkPushModalOpen] = useState(false)
  const [isTillPaybillModalOpen, setIsTillPaybillModalOpen] = useState(false)
  const [isBankTransferModalOpen, setIsBankTransferModalOpen] = useState(false)

  // Use controlled or uncontrolled pattern based on props
  const isControlled = typeof isOpen === 'boolean'

  const modalProps = isControlled 
    ? { open: isOpen, onOpenChange: (open: boolean) => !open && onClose?.() }
    : {}

  return (
    <>
      <Dialog {...modalProps}>
        {/* Only show trigger if not in controlled mode */}
        {!isControlled && triggerButtonText && (
          <DialogTrigger asChild>
            <Button className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700">{triggerButtonText}</Button>
          </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-[425px] p-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="p-6 pb-0 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <CreditCard className="h-6 w-6 text-emerald-600" /> Select Payment Method
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <div className="mb-6 text-center">
              <p className="text-2xl font-bold text-gray-900">Payment: KSh {(paymentAmount || 0).toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">
                {productName} - {paymentType}
              </p>
            </div>

            <div className="space-y-4">
              <Card
                className="cursor-pointer hover:bg-gray-50 transition-colors border-emerald-200"
                onClick={() => {
                  setIsStkPushModalOpen(true)
                  onPaymentInitiated?.()
                }}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Smartphone className="h-6 w-6 text-emerald-600" />
                  <div>
                    <h3 className="font-semibold">M-Pesa STK Push</h3>
                    <p className="text-sm text-gray-600">Pay directly from your phone</p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsTillPaybillModalOpen(true)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Banknote className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="font-semibold">Till/Paybill</h3>
                    <p className="text-sm text-gray-600">Pay using M-Pesa Till or Paybill</p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsBankTransferModalOpen(true)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                  <div>
                    <h3 className="font-semibold">Bank Transfer</h3>
                    <p className="text-sm text-gray-600">Direct bank transfer</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual Payment Modals */}
      <MpesaStkPushModal
        isOpen={isStkPushModalOpen}
        onClose={() => setIsStkPushModalOpen(false)}
        productName={productName}
        paymentAmount={paymentAmount}
        paymentType={paymentType}
      />
      <TillPaybillModal
        isOpen={isTillPaybillModalOpen}
        onClose={() => setIsTillPaybillModalOpen(false)}
        productName={productName}
        paymentAmount={paymentAmount}
        paymentType={paymentType}
      />
      <BankTransferModal
        isOpen={isBankTransferModalOpen}
        onClose={() => setIsBankTransferModalOpen(false)}
        productName={productName}
        paymentAmount={paymentAmount}
        paymentType={paymentType}
      />
    </>
  )
}
