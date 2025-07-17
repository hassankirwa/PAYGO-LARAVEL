"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Smartphone } from "lucide-react"

interface MpesaStkPushModalProps {
  isOpen: boolean
  onClose: () => void
  productName: string
  paymentAmount: number
  paymentType: string
}

export function MpesaStkPushModal({
  isOpen,
  onClose,
  productName,
  paymentAmount,
  paymentType,
}: MpesaStkPushModalProps) {
  const [mpesaPhone, setMpesaPhone] = useState("")

  const handleSTKPush = () => {
    alert(`Sending STK Push to ${mpesaPhone} for KSh ${paymentAmount}...`)
    // In a real app, you'd call an API here
    onClose() // Close modal after action
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Smartphone className="h-6 w-6 text-emerald-600" /> M-Pesa STK Push
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
            <Label htmlFor="mpesa-phone" className="mb-2 block">
              M-Pesa Phone Number
            </Label>
            <Input
              id="mpesa-phone"
              type="tel"
              placeholder="254712345678"
              value={mpesaPhone}
              onChange={(e) => setMpesaPhone(e.target.value)}
              required
              className="h-10"
            />
            <p className="text-xs text-gray-500 mt-2">Enter your M-Pesa registered phone number</p>
          </div>
          <div className="bg-green-50 text-green-800 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Smartphone className="h-4 w-4" /> How STK Push works:
            </h4>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Enter your M-Pesa phone number</li>
              <li>Click "Send STK Push"</li>
              <li>Check your phone for M-Pesa prompt</li>
              <li>Enter your M-Pesa PIN to complete</li>
            </ol>
          </div>
          <Button onClick={handleSTKPush} className="w-full bg-green-600 hover:bg-green-700 py-2.5">
            Send STK Push
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
