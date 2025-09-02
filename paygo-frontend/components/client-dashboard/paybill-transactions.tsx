"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  RefreshCw, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  XCircle,
  Hash,
  Smartphone,
  Calendar,
  DollarSign,
  Activity,
  Loader2
} from "lucide-react"
import { getApiUrl } from "@/lib/api-config"
import { usePaybillMonitor } from "@/hooks/usePaybillMonitor"
import { toast } from "@/hooks/use-toast"
import { paybillApi, PaybillTransaction, PaybillTransactionSummary } from "@/lib/api"

interface PaybillTransaction {
  id: number
  trans_id: string
  device_id: string
  trans_amount: number
  formatted_amount: string
  customer_name: string
  phone: string
  status: 'pending' | 'validated' | 'validated_pending_confirmation' | 'processed' | 'failed' | 'rejected'
  amount_matched: boolean
  credited_to_account: boolean
  payment_type: string
  processing_notes?: string
  processed_at?: string
  processed_by?: string
  expected_amount?: number
  created_at: string
  updated_at: string
  trans_time: string
  business_short_code: string
  bill_ref_number: string
  first_name: string
  middle_name?: string
  last_name: string
  msisdn: string
  org_account_balance?: string
  validation_details?: any
  raw_payload?: any
}

interface PaybillTransactionSummary {
  total_transactions: number
  total_amount: number
  formatted_total_amount: string
  processed_transactions: number
  processed_amount: number
  formatted_processed_amount: string
  pending_transactions: number
  pending_amount: number
  formatted_pending_amount: string
  failed_transactions: number
  failed_amount: number
  formatted_failed_amount: string
  recent_transactions: PaybillTransaction[]
}

interface PaybillTransactionsProps {
  clientId: number
}

export function PaybillTransactions({ clientId }: PaybillTransactionsProps) {
  const [transactions, setTransactions] = useState<PaybillTransaction[]>([])
  const [summary, setSummary] = useState<PaybillTransactionSummary | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<PaybillTransaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastManualRefresh, setLastManualRefresh] = useState<Date>(new Date())
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all_statuses')
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all_types')
  const [daysFilter, setDaysFilter] = useState<string>('30')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage] = useState(10)

  // Real-time monitoring
  const {
    isMonitoring,
    startDashboardMonitoring,
    stopMonitoring
  } = usePaybillMonitor({
    onTransactionFound: (data) => {
      if (data.type === 'dashboard_new') {
        console.log('🆕 New PayBill transaction detected:', data.transaction)
        toast({
          title: "New Payment Received! 💰",
          description: `${data.transaction.formatted_amount} from ${data.transaction.customer_name}`,
        })
        
        // Add new transaction to the list
        setTransactions(prev => [data.transaction, ...prev])
        
        // Refresh summary
        fetchSummary()
      }
    },
    onTransactionSuccess: (data) => {
      console.log('✅ PayBill transaction processed:', data.transaction)
      toast({
        title: "Payment Processed Successfully! ✅",
        description: `${data.transaction.formatted_amount} has been confirmed and processed.`,
      })
      
      // Update transaction in the list
      setTransactions(prev => 
        prev.map(t => 
          t.id === data.transaction.id 
            ? { ...t, ...data.transaction }
            : t
        )
      )
      
      // Refresh summary
      fetchSummary()
    },
    onTransactionFailed: (data) => {
      console.log('❌ PayBill transaction failed:', data.transaction)
      toast({
        title: "Payment Issue Detected ⚠️",
        description: data.reason || 'Payment processing encountered an issue.',
        variant: "destructive",
      })
      
      // Update transaction in the list
      setTransactions(prev => 
        prev.map(t => 
          t.id === data.transaction.id 
            ? { ...t, ...data.transaction }
            : t
        )
      )
      
      // Refresh summary
      fetchSummary()
    }
  })

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const params: any = {
        page: currentPage,
        per_page: perPage,
      }

      if (statusFilter && statusFilter !== 'all_statuses') params.status = statusFilter
      if (paymentTypeFilter && paymentTypeFilter !== 'all_types') params.payment_type = paymentTypeFilter
      if (daysFilter && daysFilter !== 'all_time') params.days = daysFilter

      const response = await paybillApi.getTransactions(params, token)
      
      if (response.success) {
        setTransactions(response.data.transactions)
        setTotalPages(response.data.pagination.last_page)
        setError(null)
      } else {
        throw new Error('Failed to load transactions')
      }
    } catch (err) {
      console.error('Error fetching PayBill transactions:', err)
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      
      toast({
        title: "Error Loading Transactions",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, perPage, statusFilter, paymentTypeFilter, daysFilter])

  const fetchSummary = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        return
      }

      const params: any = {}
      if (daysFilter && daysFilter !== 'all_time') params.days = daysFilter

      const response = await paybillApi.getTransactionSummary(params, token)
      
      if (response.success) {
        setSummary(response.data)
      }
    } catch (err) {
      console.error('Error fetching PayBill summary:', err)
    }
  }, [daysFilter])

  const fetchTransactionDetail = async (transactionId: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await paybillApi.getTransactionDetail(transactionId, token)
      
      if (response.success) {
        setSelectedTransaction(response.data)
      } else {
        throw new Error('Failed to load transaction details')
      }
    } catch (err) {
      console.error('Error fetching transaction details:', err)
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      
      toast({
        title: "Error Loading Transaction",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // Load initial data and start real-time monitoring
  useEffect(() => {
    fetchTransactions()
    fetchSummary()
    
    // Start real-time monitoring for this client
    if (clientId) {
      console.log(`🚀 Starting real-time PayBill monitoring for client: ${clientId}`)
      startDashboardMonitoring(clientId.toString())
    }

    // Cleanup on unmount
    return () => {
      stopMonitoring()
    }
  }, [clientId, fetchTransactions, fetchSummary, startDashboardMonitoring, stopMonitoring])

  // Refresh data when filters change
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const handleManualRefresh = () => {
    setLastManualRefresh(new Date())
    fetchTransactions()
    fetchSummary()
    
    toast({
      title: "Refreshed",
      description: "Transaction data has been refreshed",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Processed</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'validated':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Validated</Badge>
      case 'validated_pending_confirmation':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Confirming</Badge>
      case 'failed':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        transaction.trans_id.toLowerCase().includes(query) ||
        transaction.device_id.toLowerCase().includes(query) ||
        transaction.customer_name.toLowerCase().includes(query) ||
        transaction.phone.includes(query)
      )
    }
    return true
  })

  if (loading && transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading PayBill Transactions...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Real-time Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Hash className="h-5 w-5 text-emerald-600" />
            PayBill Transactions
            {isMonitoring && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                Live Monitoring
              </Badge>
            )}
          </h2>
          <p className="text-sm text-gray-600">Your PayBill payment history and transaction details</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleManualRefresh}
          disabled={loading}
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-lg font-semibold">{summary.formatted_total_amount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Processed</p>
                  <p className="text-lg font-semibold">{summary.processed_transactions}</p>
                  <p className="text-xs text-gray-500">{summary.formatted_processed_amount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-lg font-semibold">{summary.pending_transactions}</p>
                  <p className="text-xs text-gray-500">{summary.formatted_pending_amount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-lg font-semibold">{summary.failed_transactions}</p>
                  <p className="text-xs text-gray-500">{summary.formatted_failed_amount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_statuses">All Statuses</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="validated">Validated</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Payment Type</label>
              <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_types">All Types</SelectItem>
                  <SelectItem value="down_payment">Down Payment</SelectItem>
                  <SelectItem value="installment">Installment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Time Period</label>
              <Select value={daysFilter} onValueChange={setDaysFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="all_time">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Search</label>
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            PayBill Transactions
            {isMonitoring && (
              <span className="text-sm font-normal text-green-600">(Live updates enabled)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No PayBill transactions found</p>
              <p className="text-sm text-gray-500 mt-1">
                Transactions will appear here after you make PayBill payments
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 px-4 font-medium text-gray-700">Transaction ID</th>
                    <th className="py-3 px-4 font-medium text-gray-700">Device ID</th>
                    <th className="py-3 px-4 font-medium text-gray-700">Amount</th>
                    <th className="py-3 px-4 font-medium text-gray-700">Customer</th>
                    <th className="py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">{transaction.trans_id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">{transaction.device_id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">{transaction.formatted_amount}</span>
                        {transaction.amount_matched === false && (
                          <div className="text-xs text-amber-600">
                            Expected: KSh {transaction.expected_amount?.toLocaleString() || 'N/A'}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{transaction.customer_name}</p>
                          <p className="text-sm text-gray-600">{transaction.phone}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(transaction.status)}
                        {transaction.processing_notes && (
                          <div className="text-xs text-gray-600 mt-1 max-w-xs truncate">
                            {transaction.processing_notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p>{formatDate(transaction.created_at)}</p>
                          {transaction.processed_at && (
                            <p className="text-xs text-gray-600">
                              Processed: {formatDate(transaction.processed_at)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchTransactionDetail(transaction.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              PayBill transaction {selectedTransaction?.trans_id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-700">Transaction ID</label>
                  <p className="font-mono">{selectedTransaction.trans_id}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Device ID</label>
                  <p className="font-mono">{selectedTransaction.device_id}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Amount</label>
                  <p className="font-semibold text-lg">{selectedTransaction.formatted_amount}</p>
                  {selectedTransaction.expected_amount && (
                    <p className="text-xs text-gray-600">Expected: KSh {selectedTransaction.expected_amount.toLocaleString()}</p>
                  )}
                </div>
                <div>
                  <label className="font-medium text-gray-700">Status</label>
                  <div>{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Customer</label>
                  <p>{selectedTransaction.customer_name}</p>
                  <p className="text-xs text-gray-600">{selectedTransaction.phone}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Payment Type</label>
                  <p className="capitalize">{selectedTransaction.payment_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Created</label>
                  <p>{formatDate(selectedTransaction.created_at)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Processed</label>
                  <p>{selectedTransaction.processed_at ? formatDate(selectedTransaction.processed_at) : 'Not processed'}</p>
                  {selectedTransaction.processed_by && (
                    <p className="text-xs text-gray-600">By: {selectedTransaction.processed_by}</p>
                  )}
                </div>
              </div>
              
              {selectedTransaction.processing_notes && (
                <div>
                  <label className="font-medium text-gray-700">Processing Notes</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{selectedTransaction.processing_notes}</p>
                </div>
              )}
              
              {selectedTransaction.validation_details && (
                <div>
                  <label className="font-medium text-gray-700">Validation Details</label>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(selectedTransaction.validation_details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 