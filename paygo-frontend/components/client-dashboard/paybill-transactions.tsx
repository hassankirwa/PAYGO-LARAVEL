"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calendar, CreditCard, Eye, Filter, RefreshCw, Search, Wallet } from 'lucide-react'
import { formatCurrency, formatDate, formatPhoneNumber } from '@/lib/utils'
import { getApiUrl } from '@/lib/api-config'

interface PaybillTransaction {
  id: number
  trans_id: string
  trans_amount: number
  device_id: string
  payment_type: 'down_payment' | 'installment' | 'advance_payment' | 'late_payment'
  status: 'pending' | 'processed' | 'failed'
  amount_matched: boolean
  credited_to_account: boolean
  expected_amount?: number
  customer_full_name: string
  formatted_phone: string
  transaction_date: string
  processing_notes?: string
  appliance?: {
    id: number
    unit_id: string
    installation_location: string
  }
  payment_order?: {
    id: number
    order_reference: string
    product_name: string
  }
  payment_plan?: {
    id: number
    payment_frequency: string
    installments_completed: number
    total_installments: number
  }
  created_at: string
  updated_at: string
}

interface PaybillTransactionSummary {
  summary: {
    total_transactions: number
    total_amount: number
    recent_transactions: number
    recent_amount: number
    period_days: number
  }
  status_breakdown: Record<string, { count: number; total_amount: number }>
  payment_type_breakdown: Record<string, { count: number; total_amount: number }>
  recent_transactions: PaybillTransaction[]
}

interface PaybillTransactionsProps {
  clientId?: number
}

export function PaybillTransactions({ clientId }: PaybillTransactionsProps) {
  const [transactions, setTransactions] = useState<PaybillTransaction[]>([])
  const [summary, setSummary] = useState<PaybillTransactionSummary | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<PaybillTransaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all_statuses')
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all_types')
  const [daysFilter, setDaysFilter] = useState<string>('30')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage] = useState(10)

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
      })

      if (statusFilter && statusFilter !== 'all_statuses') params.append('status', statusFilter)
      if (paymentTypeFilter && paymentTypeFilter !== 'all_types') params.append('payment_type', paymentTypeFilter)
      if (daysFilter && daysFilter !== 'all_time') params.append('days', daysFilter)

      let url
      try {
        url = await getApiUrl(`/client/paybill-transactions?${params}`)
      } catch (error) {
        console.error('❌ Failed to get API URL:', error)
        throw new Error('Failed to load API configuration. Please check your connection and try again.')
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch PayBill transactions')
      }

      const data = await response.json()
      
      if (data.success) {
        setTransactions(data.data.transactions)
        setTotalPages(data.data.pagination.last_page)
        setError(null)
      } else {
        throw new Error(data.error || 'Failed to load transactions')
      }
    } catch (err) {
      console.error('Error fetching PayBill transactions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        return
      }

      const params = new URLSearchParams()
      if (daysFilter && daysFilter !== 'all_time') params.append('days', daysFilter)

      let url
      try {
        url = await getApiUrl(`/client/paybill-transactions/summary?${params}`)
      } catch (error) {
        console.error('❌ Failed to get API URL:', error)
        return
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSummary(data.data)
        }
      }
    } catch (err) {
      console.error('Error fetching PayBill summary:', err)
    }
  }

  const fetchTransactionDetails = async (transactionId: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        return
      }

      let url
      try {
        url = await getApiUrl(`/client/paybill-transactions/${transactionId}`)
      } catch (error) {
        console.error('❌ Failed to get API URL:', error)
        return
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSelectedTransaction(data.data)
        }
      }
    } catch (err) {
      console.error('Error fetching transaction details:', err)
    }
  }

  useEffect(() => {
    fetchTransactions()
    fetchSummary()
  }, [currentPage, statusFilter, paymentTypeFilter, daysFilter])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { text: 'Pending', variant: 'secondary' as const },
      processed: { text: 'Processed', variant: 'default' as const },
      failed: { text: 'Rejected', variant: 'destructive' as const },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.text}</Badge>
  }

  const getPaymentTypeBadge = (paymentType: string) => {
    const typeConfig = {
      down_payment: { text: 'Down Payment', variant: 'default' as const },
      installment: { text: 'Installment', variant: 'secondary' as const },
      advance_payment: { text: 'Advance Payment', variant: 'outline' as const },
      late_payment: { text: 'Late Payment', variant: 'destructive' as const },
    }
    
    const config = typeConfig[paymentType as keyof typeof typeConfig] || typeConfig.installment
    return <Badge variant={config.variant}>{config.text}</Badge>
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      transaction.trans_id.toLowerCase().includes(searchLower) ||
      transaction.device_id.toLowerCase().includes(searchLower) ||
      transaction.customer_full_name.toLowerCase().includes(searchLower)
    )
  })

  if (loading && transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            PayBill Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading transactions...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            PayBill Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchTransactions} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Wallet className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold">{summary.summary.total_transactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.summary.total_amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent ({summary.summary.period_days} days)</p>
                  <p className="text-2xl font-bold">{summary.summary.recent_transactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Wallet className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.summary.recent_amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Transaction ID, Device ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_statuses">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="payment-type-filter">Payment Type</Label>
              <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_types">All types</SelectItem>
                  <SelectItem value="down_payment">Down Payment</SelectItem>
                  <SelectItem value="installment">Installment</SelectItem>
                  <SelectItem value="advance_payment">Advance Payment</SelectItem>
                  <SelectItem value="late_payment">Late Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="days-filter">Period</Label>
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
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              PayBill Transactions
            </span>
            <Button onClick={fetchTransactions} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Your PayBill payment history and transaction details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center p-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No PayBill transactions found</p>
              <p className="text-sm text-gray-500 mt-2">
                Transactions will appear here after you make PayBill payments
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold">{transaction.trans_id}</h3>
                        {getStatusBadge(transaction.status)}
                        {getPaymentTypeBadge(transaction.payment_type)}
                        {transaction.amount_matched && (
                          <Badge variant="outline" className="text-green-600">
                            Amount Matched
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <p className="font-medium">Amount</p>
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(transaction.trans_amount)}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Device</p>
                          <p>{transaction.device_id}</p>
                        </div>
                        <div>
                          <p className="font-medium">Date</p>
                          <p>{formatDate(transaction.created_at)}</p>
                        </div>
                        <div>
                          <p className="font-medium">Customer</p>
                          <p>{transaction.customer_full_name}</p>
                        </div>
                      </div>
                      
                      {transaction.expected_amount && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600">Expected: </span>
                          <span className="font-medium">
                            {formatCurrency(transaction.expected_amount)}
                          </span>
                        </div>
                      )}
                      
                      {transaction.status === 'failed' && transaction.processing_notes && (
                        <div className="mt-2 text-sm">
                          <div className="bg-red-50 border border-red-200 rounded-md p-2">
                            <p className="text-red-700 font-medium text-xs">Rejection Reason:</p>
                            <p className="text-red-600 text-xs">{transaction.processing_notes}</p>
                          </div>
                        </div>
                      )}
                      
                      {transaction.status === 'failed' && !transaction.amount_matched && transaction.expected_amount && (
                        <div className="mt-1 text-xs text-red-600">
                          Amount mismatch: Received {formatCurrency(transaction.trans_amount)}, Expected {formatCurrency(transaction.expected_amount)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchTransactionDetails(transaction.id)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Transaction Details</DialogTitle>
                            <DialogDescription>
                              PayBill transaction {transaction.trans_id}
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedTransaction && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Transaction Info</h4>
                                  <div className="space-y-1 text-sm">
                                    <p><span className="font-medium">ID:</span> {selectedTransaction.trans_id}</p>
                                    <p><span className="font-medium">Amount:</span> {formatCurrency(selectedTransaction.trans_amount)}</p>
                                    <p><span className="font-medium">Status:</span> {selectedTransaction.status}</p>
                                    <p><span className="font-medium">Type:</span> {selectedTransaction.payment_type}</p>
                                    <p><span className="font-medium">Date:</span> {formatDate(selectedTransaction.created_at)}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-semibold mb-2">Customer Info</h4>
                                  <div className="space-y-1 text-sm">
                                    <p><span className="font-medium">Name:</span> {selectedTransaction.customer_full_name}</p>
                                    <p><span className="font-medium">Phone:</span> {selectedTransaction.formatted_phone}</p>
                                    <p><span className="font-medium">Device:</span> {selectedTransaction.device_id}</p>
                                  </div>
                                </div>
                              </div>
                              
                              {selectedTransaction.appliance && (
                                <div>
                                  <h4 className="font-semibold mb-2">Appliance Info</h4>
                                  <div className="text-sm">
                                    <p><span className="font-medium">Unit ID:</span> {selectedTransaction.appliance.unit_id}</p>
                                    <p><span className="font-medium">Location:</span> {selectedTransaction.appliance.installation_location}</p>
                                  </div>
                                </div>
                              )}
                              
                              {selectedTransaction.payment_plan && (
                                <div>
                                  <h4 className="font-semibold mb-2">Payment Plan</h4>
                                  <div className="text-sm">
                                    <p><span className="font-medium">Frequency:</span> {selectedTransaction.payment_plan.payment_frequency}</p>
                                    <p><span className="font-medium">Progress:</span> {selectedTransaction.payment_plan.installments_completed} / {selectedTransaction.payment_plan.total_installments} installments</p>
                                  </div>
                                </div>
                              )}
                              
                              {selectedTransaction.status === 'failed' && (
                                <div>
                                  <h4 className="font-semibold mb-2 text-red-700">Rejection Details</h4>
                                  <div className="bg-red-50 border border-red-200 rounded-md p-3 space-y-2">
                                    <div className="text-sm">
                                      <span className="font-medium text-red-700">Status:</span>
                                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs">REJECTED</span>
                                    </div>
                                    {selectedTransaction.processing_notes && (
                                      <div className="text-sm">
                                        <span className="font-medium text-red-700">Reason:</span>
                                        <p className="mt-1 text-red-600">{selectedTransaction.processing_notes}</p>
                                      </div>
                                    )}
                                    {selectedTransaction.expected_amount && (
                                      <div className="text-sm">
                                        <span className="font-medium text-red-700">Amount Details:</span>
                                        <div className="mt-1 space-y-1 text-red-600">
                                          <p>• Received: {formatCurrency(selectedTransaction.trans_amount)}</p>
                                          <p>• Expected: {formatCurrency(selectedTransaction.expected_amount)}</p>
                                          <p>• Difference: {formatCurrency(Math.abs(selectedTransaction.trans_amount - selectedTransaction.expected_amount))}</p>
                                        </div>
                                      </div>
                                    )}
                                    <div className="text-xs text-red-500 mt-2 p-2 bg-red-100 rounded">
                                      💡 <strong>Next Steps:</strong> Please retry payment with the exact expected amount shown above.
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {selectedTransaction.processing_notes && selectedTransaction.status !== 'failed' && (
                                <div>
                                  <h4 className="font-semibold mb-2">Notes</h4>
                                  <p className="text-sm bg-gray-50 p-3 rounded">
                                    {selectedTransaction.processing_notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 