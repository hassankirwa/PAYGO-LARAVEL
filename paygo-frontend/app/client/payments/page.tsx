"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Receipt, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Eye,
  Smartphone
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MpesaTransaction {
  id: number
  order_reference: string
  mpesa_receipt_number: string
  amount: number
  formatted_amount: string
  phone_number: string
  transaction_date: string
  result_code: number
  result_desc: string
  status: 'completed' | 'failed'
  raw_payload: any
  created_at: string
  updated_at: string
}

export default function PaymentsPage() {
  const { toast } = useToast()
  const [mpesaTransactions, setMpesaTransactions] = useState<MpesaTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)

  useEffect(() => {
    fetchMpesaTransactions()
  }, [currentPage, statusFilter])

  const fetchMpesaTransactions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use direct API URL instead of getApiUrl
      const url = `http://localhost:8000/api/client/mpesa-transactions?status=${statusFilter}&page=${currentPage}&per_page=15`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMpesaTransactions(data.data)
        setTotalPages(data.pagination.last_page)
        setTotalRecords(data.pagination.total)
      } else {
        setError(data.error || 'Failed to fetch payments')
      }
    } catch (err) {
      setError('Failed to load payments')
      console.error('Payments error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchMpesaTransactions()
    toast({
      title: "Refreshing",
      description: "Loading latest payment data...",
    })
  }

  const filteredTransactions = mpesaTransactions.filter(transaction => {
    const matchesSearch = transaction.mpesa_receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.order_reference.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getStatusBadge = (status: string, resultCode: number) => {
    if (resultCode === 0) {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>
    } else {
      return <Badge variant="destructive">Failed</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Payment Center</h1>
        <p className="text-gray-600 mt-2">View your payment transaction history.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-blue-600" />
              <span>Payments ({totalRecords} total)</span>
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by receipt number or order reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="mt-2 text-gray-600">Loading payments...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-red-600 font-medium">Error loading payments</p>
              </div>
              <p className="text-red-600 mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="mt-3"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Payments Table */}
          {!loading && !error && (
            <>
              {filteredTransactions.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt Number</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{transaction.mpesa_receipt_number}</div>
                              <div className="text-sm text-gray-500">{transaction.order_reference}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">KSh {transaction.amount.toLocaleString()}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{formatDate(transaction.transaction_date)}</div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(transaction.status, transaction.result_code)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                  <p className="text-gray-600">No payment transactions match your current filters.</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
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