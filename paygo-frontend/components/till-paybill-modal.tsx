"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Banknote } from "lucide-react"

interface TillPaybillModalProps {
  isOpen: boolean
  onClose: () => void
  productName: string
  paymentAmount: number
  paymentType: string
}

export function TillPaybillModal({ isOpen, onClose, productName, paymentAmount, paymentType }: TillPaybillModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Banknote className="h-6 w-6 text-emerald-600" /> Pay with Till or Paybill
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 mb-6 text-center">
          <p className="text-xl font-semibold">Payment: KSh {paymentAmount.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">
            {productName} - {paymentType}
          </p>
        </div>
        <div className="space-y-5">
          <div className="bg-green-50 text-green-800 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Banknote className="h-4 w-4" /> M-Pesa Paybill Instructions:
            </h4>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Go to M-Pesa menu</li>
              <li>Select "Pay Bill"</li>
              <li>
                Enter Business Number: <span className="font-bold">654321</span>
              </li>
              <li>
                Enter Account Number: <span className="font-bold">john@example.com</span>
              </li>
              <li>
                Enter Amount: <span className="font-bold">KSh {paymentAmount.toLocaleString()}</span>
              </li>
              <li>Enter your M-Pesa PIN</li>
            </ol>
          </div>
          <div className="bg-orange-50 text-orange-800 p-4 rounded-lg border border-orange-200">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Banknote className="h-4 w-4" /> M-Pesa Till Instructions:
            </h4>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Go to M-Pesa menu</li>
              <li>Select "Buy Goods and Services"</li>
              <li>
                Enter Till Number: <span className="font-bold">567890</span>
              </li>
              <li>
                Enter Amount: <span className="font-bold">KSh {paymentAmount.toLocaleString()}</span>
              </li>
              <li>Enter your M-Pesa PIN</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
