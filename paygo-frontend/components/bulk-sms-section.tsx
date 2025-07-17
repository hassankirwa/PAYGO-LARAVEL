"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MessageSquare, Send } from "lucide-react"

export function BulkSmsSection() {
  const handleSendSms = () => {
    alert("Sending bulk SMS (dummy action)...")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          Bulk SMS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">Send messages to all or filtered clients.</p>
        <div>
          <Label htmlFor="sms-content" className="mb-2 block">
            SMS Content
          </Label>
          <Textarea id="sms-content" placeholder="Type your message here..." rows={5} />
        </div>
        <Button onClick={handleSendSms} className="w-full bg-blue-600 hover:bg-blue-700">
          <Send className="h-4 w-4 mr-2" />
          Send Bulk SMS
        </Button>
      </CardContent>
    </Card>
  )
}
