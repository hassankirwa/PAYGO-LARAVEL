"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Mail, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function EmailMarketingSection() {
  const { toast } = useToast()

  const sendCampaign = () => {
    toast({
      title: "Email Campaign Sent! 📧",
      description: "Sending email campaign (dummy action)...",
      variant: "default",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-purple-600" />
          Email Marketing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">Create and send email campaigns to your subscribers.</p>
        <div>
          <Label htmlFor="email-subject" className="mb-2 block">
            Subject
          </Label>
          <Input id="email-subject" placeholder="Enter email subject" />
        </div>
        <div>
          <Label htmlFor="email-content" className="mb-2 block">
            Email Content
          </Label>
          <Textarea id="email-content" placeholder="Type your email content here..." rows={8} />
        </div>
        <Button onClick={sendCampaign} className="w-full bg-purple-600 hover:bg-purple-700">
          <Send className="h-4 w-4 mr-2" />
          Send Email Campaign
        </Button>
      </CardContent>
    </Card>
  )
}
