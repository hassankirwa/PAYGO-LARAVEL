"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Smartphone, 
  RefreshCw, 
  Search,
  Copy,
  ExternalLink 
} from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import { getApiUrl } from '@/lib/api-config'

interface PaymentVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  initialTransactionId?: string
}

interface VerificationData {
  transaction_id: string
  device_id: string
  amount: number
  expected_amount: number | null
  verification_status: 'pending' | 'verified' | 'failed' | 'rejected'
  payment_status: 'received' | 'verified' | 'rejected' | 'refund_requested'
  amount_verified: boolean
  verification_method: string | null
  verified_at: string | null
  rejection_reason: string | null
  amount_shortfall: number
  amount_excess: number
  customer_name: string
  phone: string
  is_sufficient: boolean
  is_verified: boolean
  is_rejected: boolean
  refund_requested: boolean
}

export function PaymentVerificationModal({ 
  isOpen, 
  onClose, 
  initialTransactionId = '' 
}: PaymentVerificationModalProps) {
  const [transactionId, setTransactionId] = useState(initialTransactionId)
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  // Auto-check verification status every 30 seconds for pending transactions
  useEffect(() => {
    if (!verificationData || verificationData.verification_status === 'pending') {
      const interval = setInterval(() => {
        if (transactionId) {
          checkVerificationStatus(false) // Silent check without loading indicator
        }
      }, 30000) // Check every 30 seconds

      return () => clearInterval(interval)
    }
  }, [verificationData, transactionId])

  const checkVerificationStatus = async (showLoading = true) => {
    if (!transactionId.trim()) {
      setError('Please enter a transaction ID')
      return
    }

    if (showLoading) {
      setLoading(true)
    }
    setError(null)

    try {
      const apiUrl = await getApiUrl(`/paybill/verification-status/${transactionId.trim()}`)
      
      const response = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        }
      })

      const data = await response.json()

      if (data.success) {
        setVerificationData(data.data)
        setLastChecked(new Date())
        
        if (showLoading) {
          toast({
            title: "Status Updated",
            description: `Payment status: ${data.data.payment_status}`,
          })
        }
      } else {
        setError(data.error || 'Failed to fetch verification status')
        setVerificationData(null)
      }
    } catch (err) {
      console.error('Error checking verification status:', err)
      setError('Failed to connect to verification service')
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'pending':
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      failed: 'bg-orange-100 text-orange-800',
      pending: 'bg-yellow-100 text-yellow-800',
      received: 'bg-blue-100 text-blue-800',
      refund_requested: 'bg-purple-100 text-purple-800'
    }
    
    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Transaction ID copied to clipboard",
    })
  }

  const formatAmount = (amount: number) => {
    return `KSh ${new Intl.NumberFormat().format(amount)}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Payment Verification Status
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction ID Input */}
          <div className="space-y-2">
            <label htmlFor="transactionId" className="text-sm font-medium">
              M-Pesa Transaction ID
            </label>
            <div className="flex gap-2">
              <Input
                id="transactionId"
                placeholder="e.g. QGR1234567890"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={() => checkVerificationStatus()}
                disabled={loading || !transactionId.trim()}
                className="shrink-0"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Check
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Verification Results */}
          {verificationData && (
            <div className="space-y-4">
              {/* Overall Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(verificationData.verification_status)}
                      Payment Verification
                    </div>
                    {getStatusBadge(verificationData.verification_status)}
                  </CardTitle>
                  <CardDescription>
                    Transaction ID: {verificationData.transaction_id}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(verificationData.transaction_id)}
                      className="ml-2 h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Payment Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Customer</label>
                      <p className="font-medium">{verificationData.customer_name}</p>
                      <p className="text-sm text-gray-500">{verificationData.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Device ID</label>
                      <p className="font-medium">{verificationData.device_id}</p>
                    </div>
                  </div>

                  {/* Amount Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Amount Paid</label>
                      <p className="text-lg font-bold text-blue-600">
                        {formatAmount(verificationData.amount)}
                      </p>
                    </div>
                    {verificationData.expected_amount && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Expected Amount</label>
                        <p className="text-lg font-bold">
                          {formatAmount(verificationData.expected_amount)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Amount Verification */}
                  {verificationData.expected_amount && (
                    <div className="p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Amount Verification</span>
                        {verificationData.is_sufficient ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Sufficient
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Insufficient
                          </Badge>
                        )}
                      </div>
                      
                      {verificationData.amount_shortfall > 0 && (
                        <p className="text-sm text-red-600 mt-1">
                          Shortfall: {formatAmount(verificationData.amount_shortfall)}
                        </p>
                      )}
                      
                      {verificationData.amount_excess > 0 && (
                        <p className="text-sm text-green-600 mt-1">
                          Excess: {formatAmount(verificationData.amount_excess)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Verification Method */}
                  {verificationData.verification_method && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Verified By</label>
                      <p className="text-sm capitalize">
                        {verificationData.verification_method.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(verificationData.verified_at)}
                      </p>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {verificationData.rejection_reason && (
                    <Alert className="border-red-200 bg-red-50">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-red-800">
                        <strong>Rejection Reason:</strong> {verificationData.rejection_reason}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Status Messages */}
                  {verificationData.verification_status === 'pending' && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <AlertDescription className="text-yellow-800">
                        Payment verification is in progress. This may take a few minutes.
                      </AlertDescription>
                    </Alert>
                  )}

                  {verificationData.is_verified && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-800">
                        <strong>Payment Verified!</strong> Your payment has been successfully verified and processed.
                      </AlertDescription>
                    </Alert>
                  )}

                  {verificationData.refund_requested && (
                    <Alert className="border-purple-200 bg-purple-50">
                      <RefreshCw className="h-4 w-4 text-purple-500" />
                      <AlertDescription className="text-purple-800">
                        <strong>Refund Requested:</strong> A refund has been initiated for this payment.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Last Checked */}
              {lastChecked && (
                <p className="text-xs text-gray-500 text-center">
                  Last checked: {lastChecked.toLocaleTimeString()}
                  {verificationData.verification_status === 'pending' && (
                    <span className="ml-2">(Auto-refreshing every 30 seconds)</span>
                  )}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => checkVerificationStatus()}
                  disabled={loading}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Status
                </Button>
                
                {verificationData.is_rejected && (
                  <Button 
                    onClick={() => {
                      // TODO: Link to customer support or re-payment flow
                      toast({
                        title: "Customer Support",
                        description: "Contact support for assistance with rejected payments",
                      })
                    }}
                    className="flex-1"
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    Get Help
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          {!verificationData && !error && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">How to Check Payment Status</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>1. Enter your M-Pesa transaction ID (received via SMS)</p>
                <p>2. Click "Check" to verify your payment status</p>
                <p>3. View real-time verification results</p>
                <p className="text-xs text-gray-500 mt-3">
                  <strong>Note:</strong> Verification may take a few minutes after payment
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 