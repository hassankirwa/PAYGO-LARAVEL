"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, Download, RefreshCw, Receipt } from "lucide-react"
import { getApiUrl } from "@/lib/api-config"

interface MpesaTransaction {
  id: number
  order_reference: string
  product_name: string
  payment_type: string
  amount: number
  mpesa_receipt_number: string
  phone_number: string
  result_code: number
  result_desc: string
  transaction_date: string
  status: 'successful' | 'failed'
  status_label: string
  created_at: string
}

interface PaymentOrder {
  id: number
  order_reference: string
  product_name: string
  payment_type: string
  paid_amount: number
  plan_type: string
  status: 'pending' | 'completed' | 'failed'
  status_label: string
  mpesa_receipt_number: string
  payment_completed_at: string
  created_at: string
}

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'mpesa' | 'orders'>('mpesa')
  const [mpesaTransactions, setMpesaTransactions] = useState<MpesaTransaction[]>([])
  const [paymentOrders, setPaymentOrders] = useState<PaymentOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)

  const fetchMpesaTransactions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = await getApiUrl(`/client/mpesa-transactions?status=${statusFilter}&page=${currentPage}&per_page=10`)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      })

      const data = await response.json()
      
      if (data.success) {
        setMpesaTransactions(data.data)
        setTotalPages(data.pagination.last_page)
        setTotalRecords(data.pagination.total)
      } else {
        setError(data.error || 'Failed to fetch M-Pesa transactions')
      }
    } catch (err) {
      setError('Failed to load M-Pesa transactions')
      console.error('M-Pesa transactions error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = await getApiUrl(`/client/payment-orders?status=${statusFilter}&page=${currentPage}&per_page=10`)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      })

      const data = await response.json()
      
      if (data.success) {
        setPaymentOrders(data.data)
        setTotalPages(data.pagination.last_page)
        setTotalRecords(data.pagination.total)
      } else {
        setError(data.error || 'Failed to fetch payment orders')
      }
    } catch (err) {
      setError('Failed to load payment orders')
      console.error('Payment orders error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'mpesa') {
      fetchMpesaTransactions()
    } else {
      fetchPaymentOrders()
    }
  }, [activeTab, statusFilter, currentPage])

  const handleRefresh = () => {
    if (activeTab === 'mpesa') {
      fetchMpesaTransactions()
    } else {
      fetchPaymentOrders()
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'successful':
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">✅ {status}</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">❌ {status}</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ {status}</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const formatAmount = (amount: number) => {
    return `KSh ${amount?.toLocaleString() || '0'}`
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter data based on search term
  const filteredMpesaTransactions = mpesaTransactions.filter(transaction =>
    searchTerm === '' ||
    transaction.order_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.mpesa_receipt_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPaymentOrders = paymentOrders.filter(order =>
    searchTerm === '' ||
    order.order_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.mpesa_receipt_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment History</h1>
          <p className="text-gray-600">View your M-Pesa transactions and payment orders</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'mpesa' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('mpesa')}
          className="px-4"
        >
          📱 M-Pesa Transactions
        </Button>
        <Button
          variant={activeTab === 'orders' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('orders')}
          className="px-4"
        >
          📋 Payment Orders
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by order reference, product, or receipt number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {activeTab === 'mpesa' ? (
                  <>
                    <SelectItem value="successful">✅ Successful</SelectItem>
                    <SelectItem value="failed">❌ Failed</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="completed">✅ Completed</SelectItem>
                    <SelectItem value="pending">⏳ Pending</SelectItem>
                    <SelectItem value="failed">❌ Failed</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {activeTab === 'mpesa' ? '📱 M-Pesa Transactions' : '📋 Payment Orders'}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({totalRecords} total)
              </span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
              <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-2">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {/* M-Pesa Transactions Table */}
              {activeTab === 'mpesa' && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order Reference</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMpesaTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            No M-Pesa transactions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMpesaTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">
                              {transaction.order_reference}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{transaction.product_name}</div>
                                <div className="text-sm text-gray-500">{transaction.payment_type}</div>
                              </div>
                            </TableCell>
                            <TableCell>{formatAmount(transaction.amount)}</TableCell>
                            <TableCell>
                              {transaction.mpesa_receipt_number ? (
                                <div className="flex items-center">
                                  <Receipt className="h-4 w-4 mr-1 text-green-600" />
                                  <span className="font-mono text-sm">{transaction.mpesa_receipt_number}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">No receipt</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(transaction.status_label)}
                              {transaction.status === 'failed' && (
                                <div className="text-xs text-red-600 mt-1">
                                  {transaction.result_desc}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{formatDate(transaction.transaction_date || transaction.created_at)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Payment Orders Table */}
              {activeTab === 'orders' && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order Reference</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPaymentOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            No payment orders found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPaymentOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              {order.order_reference}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{order.product_name}</div>
                                <div className="text-sm text-gray-500">{order.payment_type}</div>
                              </div>
                            </TableCell>
                            <TableCell>{formatAmount(order.paid_amount)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{order.plan_type || 'One-time'}</Badge>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(order.status_label)}
                              {order.mpesa_receipt_number && (
                                <div className="text-xs text-green-600 mt-1 flex items-center">
                                  <Receipt className="h-3 w-3 mr-1" />
                                  {order.mpesa_receipt_number}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{formatDate(order.payment_completed_at || order.created_at)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 