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
  triggerButtonText: string
  productName: string
  paymentAmount: number
  paymentType: string // e.g., "Monthly Payment", "Weekly Installment"
}

export function PaymentModal({ triggerButtonText, productName, paymentAmount, paymentType }: PaymentModalProps) {
  const [isStkPushModalOpen, setIsStkPushModalOpen] = useState(false)
  const [isTillPaybillModalOpen, setIsTillPaybillModalOpen] = useState(false)
  const [isBankTransferModalOpen, setIsBankTransferModalOpen] = useState(false)

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700">{triggerButtonText}</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] p-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="p-6 pb-0 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <CreditCard className="h-6 w-6 text-emerald-600" /> Select Payment Method
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <div className="mb-6 text-center">
              <p className="text-2xl font-bold text-gray-900">Payment: KSh {paymentAmount.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">
                {productName} - {paymentType}
              </p>
            </div>

            <div className="space-y-4">
              <Card
                className="cursor-pointer hover:bg-gray-50 transition-colors border-emerald-200"
                onClick={() => setIsStkPushModalOpen(true)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Smartphone className="h-6 w-6 text-emerald-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">M-Pesa STK Push</h3>
                    <p className="text-sm text-gray-600">Pay instantly with M-Pesa</p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:bg-gray-50 transition-colors border-emerald-200"
                onClick={() => setIsTillPaybillModalOpen(true)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Banknote className="h-6 w-6 text-emerald-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Pay with Till or Paybill</h3>
                    <p className="text-sm text-gray-600">Use M-Pesa Till or Paybill</p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:bg-gray-50 transition-colors border-emerald-200"
                onClick={() => setIsBankTransferModalOpen(true)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <CreditCard className="h-6 w-6 text-emerald-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Bank Transfer</h3>
                    <p className="text-sm text-gray-600">Pay with debit or credit card</p>
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
