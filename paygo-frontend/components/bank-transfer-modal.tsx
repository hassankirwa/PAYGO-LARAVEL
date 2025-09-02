"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BankTransferModalProps {
  isOpen: boolean
  onClose: () => void
  productName: string
  paymentAmount: number
  paymentType: string
}

export function BankTransferModal({
  isOpen,
  onClose,
  productName,
  paymentAmount,
  paymentType,
}: BankTransferModalProps) {
  const { toast } = useToast()
  const [cardholderName, setCardholderName] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")

  const handleTransfer = () => {
    toast({
      title: "Bank Transfer Processing! 🏦",
      description: `Processing bank transfer for KSh ${paymentAmount} from card ${cardNumber}...`,
      variant: "default",
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <CreditCard className="h-6 w-6 text-emerald-600" /> Bank Transfer
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 mb-6 text-center">
          <p className="text-xl font-semibold">Payment: KSh {paymentAmount.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">
            {productName} - {paymentType}
          </p>
        </div>
        <div className="space-y-5">
          <div>
            <Label htmlFor="cardholder-name" className="mb-2 block">
              Cardholder Name
            </Label>
            <Input
              id="cardholder-name"
              placeholder="John Doe"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              required
              className="h-10"
            />
          </div>
          <div>
            <Label htmlFor="card-number" className="mb-2 block">
              Card Number
            </Label>
            <Input
              id="card-number"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              required
              className="h-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiry-date" className="mb-2 block">
                Expiry Date
              </Label>
              <Input
                id="expiry-date"
                placeholder="MM/YY"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
                className="h-10"
              />
            </div>
            <div>
              <Label htmlFor="cvv" className="mb-2 block">
                CVV
              </Label>
              <Input
                id="cvv"
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                required
                className="h-10"
              />
            </div>
          </div>
          <div className="bg-green-50 text-green-800 p-4 rounded-lg flex items-center gap-2 border border-green-200">
            <Lock className="h-5 w-5" />
            <p className="text-sm">
              Your card information is encrypted and secure. We accept Visa, MasterCard, and American Express.
            </p>
          </div>
          <Button onClick={handleTransfer} className="w-full bg-emerald-600 hover:bg-emerald-700 py-2.5">
            Complete Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
