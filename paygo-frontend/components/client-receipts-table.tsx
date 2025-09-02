"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Receipt, 
  Download, 
  Eye, 
  Search, 
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Filter,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  ExternalLink,
  TrendingUp,
  Package,
  CreditCard
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { receiptApi } from "@/lib/api"

interface ClientReceiptItem {
  id: number
  receipt_number: string
  product_name: string
  payment_amount: number
  formatted_amount: string
  payment_method: string
  mpesa_receipt_number: string
  payment_date: string
  payment_type: string
  plan_type: string
  order_reference: string
  status: string
  generated_at: string
  viewed_at: string
  downloaded_at: string
  created_at: string
}

interface ReceiptDetails {
  receipt_number: string
  receipt_content: any
  customer_info: {
    name: string
    email: string
    phone: string
  }
  payment_details: {
    amount: number
    payment_date: string
    payment_method: string
    mpesa_receipt: string
    order_reference: string
    payment_type: string
    plan_type: string
  }
  product_info: {
    name: string
  }
  status: string
  timestamps: {
    generated_at: string
    sent_at: string
    viewed_at: string
    downloaded_at: string
    created_at: string
    updated_at: string
  }
}

interface PaginationInfo {
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number
  to: number
}

interface Summary {
  total_receipts: number
  total_amount_paid: number
}

export function ClientReceiptsTable() {
  const { toast } = useToast()
  const [receipts, setReceipts] = useState<ClientReceiptItem[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
    from: 0,
    to: 0,
  })
  const [summary, setSummary] = useState<Summary>({
    total_receipts: 0,
    total_amount_paid: 0,
  })

  // Sort states
  const [sortBy, setSortBy] = useState("payment_date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Modal states
  const [viewingReceipt, setViewingReceipt] = useState<ReceiptDetails | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  // Load client's receipts
  const loadClientReceipts = async (page: number = 1) => {
    setLoading(true)
    try {
      console.log('🔍 Loading client receipts:', {
        page,
        sort_by: sortBy,
        sort_direction: sortDirection
      })

      const response = await receiptApi.getClientReceipts({
        page,
        per_page: pagination.per_page,
        sort_by: sortBy,
        sort_direction: sortDirection,
      })

      if (response.success) {
        setReceipts(response.data || [])
        setPagination(response.pagination)
        setSummary(response.summary || { total_receipts: 0, total_amount_paid: 0 })
        
        if (response.data && response.data.length > 0) {
          toast({
            title: "Receipts Loaded",
            description: `Found ${response.data.length} receipt(s) in your payment history.`,
            variant: "default",
          })
        }
      } else {
        throw new Error(response.error || 'Failed to load receipts')
      }
    } catch (error) {
      console.error('❌ Failed to load client receipts:', error)
      toast({
        title: "Error Loading Receipts",
        description: "Could not load your payment history. Please try again.",
        variant: "destructive",
      })
      setReceipts([])
    } finally {
      setLoading(false)
    }
  }

  // Load receipts on component mount and when sort changes
  useEffect(() => {
    loadClientReceipts(1)
  }, [sortBy, sortDirection])

  // View receipt details
  const viewReceipt = async (receiptNumber: string) => {
    try {
      console.log('👁️ Viewing receipt:', receiptNumber)
      
      const response = await receiptApi.getReceipt(receiptNumber)
      
      if (response.success) {
        setViewingReceipt(response.data)
        setIsViewDialogOpen(true)
        
        // Refresh receipts to update status
        loadClientReceipts(pagination.current_page)
        
        toast({
          title: "Receipt Opened",
          description: `Receipt ${receiptNumber} opened for viewing.`,
          variant: "default",
        })
      } else {
        throw new Error(response.error || 'Failed to load receipt')
      }
    } catch (error) {
      console.error('❌ Failed to view receipt:', error)
      toast({
        title: "Error Viewing Receipt",
        description: "Could not load receipt details. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Preview receipt PDF
  const previewReceipt = async (receiptNumber: string) => {
    try {
      console.log('🖼️ Previewing receipt PDF:', receiptNumber)
      
      const response = await receiptApi.previewReceipt(receiptNumber)
      
      if (response.success) {
        // Refresh receipts to update status
        loadClientReceipts(pagination.current_page)
        
        toast({
          title: "Receipt Preview",
          description: `Receipt ${receiptNumber} opened in new tab.`,
          variant: "default",
        })
      } else {
        throw new Error(response.error || 'Failed to preview receipt')
      }
    } catch (error) {
      console.error('❌ Failed to preview receipt:', error)
      toast({
        title: "Error Previewing Receipt",
        description: "Could not preview receipt. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Download receipt
  const downloadReceipt = async (receiptNumber: string) => {
    try {
      console.log('💾 Downloading receipt:', receiptNumber)
      
      const response = await receiptApi.downloadReceipt(receiptNumber)
      
      if (response.success) {
        // Refresh receipts to update status
        loadClientReceipts(pagination.current_page)
        
        toast({
          title: "Receipt Downloaded",
          description: `Receipt ${receiptNumber} downloaded successfully.`,
          variant: "default",
        })
      } else {
        throw new Error(response.error || 'Failed to download receipt')
      }
    } catch (error) {
      console.error('❌ Failed to download receipt:', error)
      toast({
        title: "Error Downloading Receipt",
        description: "Could not download receipt. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortDirection("desc")
    }
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.last_page) {
      loadClientReceipts(page)
    }
  }

  // Status badge component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'generated':
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50"><Clock className="h-3 w-3 mr-1" />Generated</Badge>
      case 'sent':
        return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50"><RefreshCw className="h-3 w-3 mr-1" />Sent</Badge>
      case 'viewed':
        return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50"><Eye className="h-3 w-3 mr-1" />Viewed</Badge>
      case 'downloaded':
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50"><CheckCircle className="h-3 w-3 mr-1" />Downloaded</Badge>
      default:
        return <Badge variant="outline" className="text-gray-600 border-gray-200"><AlertCircle className="h-3 w-3 mr-1" />{status}</Badge>
    }
  }

  // Sort icon component
  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="h-4 w-4" />
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Receipts</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total_receipts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  KSh {summary.total_amount_paid.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment History</p>
                <p className="text-2xl font-bold text-purple-600">
                  {pagination.total > 0 ? 'Active' : 'No Data'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Your Payment History</span>
            </span>
            <Button 
              onClick={() => loadClientReceipts(pagination.current_page)} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="sort_by">Sort by:</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment_date">Payment Date</SelectItem>
                  <SelectItem value="payment_amount">Amount</SelectItem>
                  <SelectItem value="created_at">Receipt Date</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="sort_direction">Order:</Label>
              <Select value={sortDirection} onValueChange={(value) => setSortDirection(value as "asc" | "desc")}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Payment Receipts ({pagination.total})</span>
            {pagination.total > 0 && (
              <Badge variant="outline" className="text-sm">
                Showing {pagination.from} to {pagination.to} of {pagination.total}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading your receipts...</span>
            </div>
          ) : receipts.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No receipts found</h3>
              <p className="text-muted-foreground mb-4">
                You don't have any payment receipts yet. Make a payment to see your receipts here.
              </p>
              <Button variant="outline" onClick={() => loadClientReceipts(1)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('receipt_number')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Receipt #</span>
                        {getSortIcon('receipt_number')}
                      </div>
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('payment_amount')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Amount</span>
                        {getSortIcon('payment_amount')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('payment_date')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Payment Date</span>
                        {getSortIcon('payment_date')}
                      </div>
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>M-Pesa Receipt</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((receipt) => (
                    <TableRow key={receipt.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">
                        {receipt.receipt_number}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{receipt.product_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-green-600">
                          {receipt.formatted_amount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(receipt.payment_date).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {receipt.payment_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span>{receipt.mpesa_receipt_number}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(receipt.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => viewReceipt(receipt.receipt_number)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => previewReceipt(receipt.receipt_number)}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Preview PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadReceipt(receipt.receipt_number)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.total > pagination.per_page && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {pagination.from} to {pagination.to} of {pagination.total} receipts
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                    const page = i + 1
                    return (
                      <Button
                        key={page}
                        variant={pagination.current_page === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-10"
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Receipt Details Modal */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>Receipt Details</span>
            </DialogTitle>
            <DialogDescription>
              Detailed view of your payment receipt {viewingReceipt?.receipt_number}
            </DialogDescription>
          </DialogHeader>
          
          {viewingReceipt && (
            <div className="space-y-6">
              {/* Receipt Header */}
              <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold text-green-600">KOYO PayGo</h2>
                <p className="text-muted-foreground">Payment Receipt</p>
                <p className="font-mono text-sm bg-muted p-2 rounded mt-2">
                  {viewingReceipt.receipt_number}
                </p>
                <div className="mt-2">
                  {getStatusBadge(viewingReceipt.status)}
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Product</Label>
                  <p className="text-lg font-semibold">{viewingReceipt.product_info.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Amount Paid</Label>
                  <p className="text-lg font-bold text-green-600">
                    KSh {Number(viewingReceipt.payment_details.amount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Payment Date</Label>
                  <p className="text-sm">
                    {new Date(viewingReceipt.payment_details.payment_date).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                  <p className="text-sm">{viewingReceipt.payment_details.payment_method}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">M-Pesa Receipt</Label>
                  <p className="text-sm font-mono">{viewingReceipt.payment_details.mpesa_receipt}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Order Reference</Label>
                  <p className="text-sm font-mono">{viewingReceipt.payment_details.order_reference}</p>
                </div>
              </div>

              {/* Payment Type Info */}
              <div className="bg-muted p-4 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Payment Type</Label>
                    <p className="text-sm font-semibold">
                      {viewingReceipt.payment_details.payment_type.replace('_', ' ')}
                    </p>
                  </div>
                  {viewingReceipt.payment_details.plan_type && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Plan</Label>
                      <p className="text-sm font-semibold">{viewingReceipt.payment_details.plan_type}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => viewingReceipt && previewReceipt(viewingReceipt.receipt_number)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => viewingReceipt && downloadReceipt(viewingReceipt.receipt_number)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 