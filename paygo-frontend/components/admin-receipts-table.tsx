"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
  Edit,
  ExternalLink,
  Users,
  Send,
  Package
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { receiptApi } from "@/lib/api"

interface ReceiptItem {
  id: number
  receipt_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
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
  updated_at: string
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

export function AdminReceiptsTable() {
  const { toast } = useToast()
  const [receipts, setReceipts] = useState<ReceiptItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
    from: 0,
    to: 0,
  })

  // Filter and search states
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Modal states
  const [viewingReceipt, setViewingReceipt] = useState<ReceiptDetails | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isStatusUpdateDialogOpen, setIsStatusUpdateDialogOpen] = useState(false)
  const [isBulkUpdateDialogOpen, setIsBulkUpdateDialogOpen] = useState(false)
  
  // Status update states
  const [updatingReceipt, setUpdatingReceipt] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState("")
  const [statusNotes, setStatusNotes] = useState("")
  const [bulkStatus, setBulkStatus] = useState("")
  const [bulkNotes, setBulkNotes] = useState("")

  // Load receipts with current filters
  const loadReceipts = async (page: number = 1) => {
    setLoading(true)
    try {
      console.log('🔍 Loading admin receipts with filters:', {
        page,
        search,
        status: statusFilter,
        payment_type: paymentTypeFilter,
        sort_by: sortBy,
        sort_direction: sortDirection
      })

      const response = await receiptApi.getAllReceipts({
        page,
        per_page: pagination.per_page,
        search: search || undefined,
        status: statusFilter,
        payment_type: paymentTypeFilter,
        sort_by: sortBy,
        sort_direction: sortDirection,
      })

      if (response.success) {
        setReceipts(response.data || [])
        setPagination(response.pagination)
        toast({
          title: "Receipts Loaded",
          description: `Loaded ${response.data?.length || 0} receipts from ${response.pagination?.total || 0} total.`,
          variant: "default",
        })
      } else {
        throw new Error(response.error || 'Failed to load receipts')
      }
    } catch (error) {
      console.error('❌ Failed to load receipts:', error)
      toast({
        title: "Error Loading Receipts",
        description: "Could not load receipts. Please try again.",
        variant: "destructive",
      })
      setReceipts([])
    } finally {
      setLoading(false)
    }
  }

  // Load receipts on component mount and when filters change
  useEffect(() => {
    loadReceipts(1)
  }, [search, statusFilter, paymentTypeFilter, sortBy, sortDirection])

  // View receipt details (enhanced)
  const viewReceipt = async (receiptNumber: string) => {
    try {
      console.log('👁️ Viewing receipt:', receiptNumber)
      
      const response = await receiptApi.getReceipt(receiptNumber)
      
      if (response.success) {
        setViewingReceipt(response.data)
        setIsViewDialogOpen(true)
        
        // Refresh the current receipt in the table to update status
        loadReceipts(pagination.current_page)
        
        toast({
          title: "Receipt Loaded",
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

  // Preview receipt PDF (new)
  const previewReceipt = async (receiptNumber: string) => {
    try {
      console.log('🖼️ Previewing receipt PDF:', receiptNumber)
      
      const response = await receiptApi.previewReceipt(receiptNumber)
      
      if (response.success) {
        // Refresh the table to update status
        loadReceipts(pagination.current_page)
        
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

  // Download receipt (enhanced)
  const downloadReceipt = async (receiptNumber: string) => {
    try {
      console.log('💾 Downloading receipt:', receiptNumber)
      
      const response = await receiptApi.downloadReceipt(receiptNumber)
      
      if (response.success) {
        // Refresh the table to update status
        loadReceipts(pagination.current_page)
        
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

  // Update receipt status (new)
  const updateReceiptStatus = async () => {
    if (!updatingReceipt || !newStatus) return

    try {
      console.log('📝 Updating receipt status:', updatingReceipt, newStatus)
      
      const response = await receiptApi.updateReceiptStatus(updatingReceipt, newStatus, statusNotes)
      
      if (response.success) {
        setIsStatusUpdateDialogOpen(false)
        setUpdatingReceipt(null)
        setNewStatus("")
        setStatusNotes("")
        
        // Refresh the table
        loadReceipts(pagination.current_page)
        
        toast({
          title: "Status Updated",
          description: `Receipt ${updatingReceipt} status updated to ${newStatus}.`,
          variant: "default",
        })
      } else {
        throw new Error(response.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('❌ Failed to update status:', error)
      toast({
        title: "Error Updating Status",
        description: "Could not update receipt status. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Bulk update statuses (new)
  const bulkUpdateStatuses = async () => {
    if (selectedReceipts.length === 0 || !bulkStatus) return

    try {
      console.log('📝 Bulk updating receipt statuses:', selectedReceipts, bulkStatus)
      
      const response = await receiptApi.bulkUpdateStatus(selectedReceipts, bulkStatus, bulkNotes)
      
      if (response.success) {
        setIsBulkUpdateDialogOpen(false)
        setSelectedReceipts([])
        setBulkStatus("")
        setBulkNotes("")
        
        // Refresh the table
        loadReceipts(pagination.current_page)
        
        toast({
          title: "Bulk Update Complete",
          description: `Updated ${response.data.updated_count} receipt(s) to ${bulkStatus}.`,
          variant: "default",
        })
      } else {
        throw new Error(response.error || 'Failed to bulk update')
      }
    } catch (error) {
      console.error('❌ Failed to bulk update:', error)
      toast({
        title: "Error Bulk Updating",
        description: "Could not update receipt statuses. Please try again.",
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
      loadReceipts(page)
    }
  }

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReceipts(receipts.map(r => r.receipt_number))
    } else {
      setSelectedReceipts([])
    }
  }

  // Handle individual select
  const handleSelectReceipt = (receiptNumber: string, checked: boolean) => {
    if (checked) {
      setSelectedReceipts([...selectedReceipts, receiptNumber])
    } else {
      setSelectedReceipts(selectedReceipts.filter(r => r !== receiptNumber))
    }
  }

  // Status badge component (enhanced)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'generated':
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50"><Clock className="h-3 w-3 mr-1" />Generated</Badge>
      case 'sent':
        return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50"><Send className="h-3 w-3 mr-1" />Sent</Badge>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Receipts</h1>
          <p className="text-muted-foreground">Manage and view all payment receipts</p>
        </div>
        <div className="flex items-center space-x-2">
          <Receipt className="h-8 w-8 text-primary" />
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedReceipts.length > 0 && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-medium">{selectedReceipts.length} receipt(s) selected</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsBulkUpdateDialogOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedReceipts([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Receipt #, name, email, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="downloaded">Downloaded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_type">Payment Type</Label>
              <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="down_payment">Down Payment</SelectItem>
                  <SelectItem value="installment">Installment</SelectItem>
                  <SelectItem value="full_payment">Full Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refresh">Actions</Label>
              <Button 
                onClick={() => loadReceipts(pagination.current_page)} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Receipts ({pagination.total})</span>
            <Badge variant="outline" className="text-sm">
              Showing {pagination.from} to {pagination.to} of {pagination.total}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading receipts...</span>
            </div>
          ) : receipts.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No receipts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedReceipts.length === receipts.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('receipt_number')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Receipt #</span>
                        {getSortIcon('receipt_number')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('customer_name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Customer</span>
                        {getSortIcon('customer_name')}
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
                      <TableCell>
                        <Checkbox
                          checked={selectedReceipts.includes(receipt.receipt_number)}
                          onCheckedChange={(checked) => handleSelectReceipt(receipt.receipt_number, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {receipt.receipt_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{receipt.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{receipt.customer_phone}</p>
                          <p className="text-xs text-muted-foreground">{receipt.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {receipt.product_name}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-green-600">
                          {receipt.formatted_amount}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(receipt.payment_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {receipt.payment_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {receipt.mpesa_receipt_number}
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setUpdatingReceipt(receipt.receipt_number)
                                setNewStatus(receipt.status)
                                setIsStatusUpdateDialogOpen(true)
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Update Status
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

      {/* Enhanced Receipt Details Modal */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>Receipt Details</span>
            </DialogTitle>
            <DialogDescription>
              Comprehensive view of payment receipt {viewingReceipt?.receipt_number}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Customer Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                      <p className="text-sm font-semibold">{viewingReceipt.customer_info.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p className="text-sm">{viewingReceipt.customer_info.phone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="text-sm">{viewingReceipt.customer_info.email}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Product Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Package className="h-5 w-5" />
                      <span>Product Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Product Name</Label>
                      <p className="text-sm font-semibold">{viewingReceipt.product_info.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Payment Type</Label>
                      <p className="text-sm">
                        <Badge variant="secondary">
                          {viewingReceipt.payment_details.payment_type.replace('_', ' ')}
                        </Badge>
                      </p>
                    </div>
                    {viewingReceipt.payment_details.plan_type && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Plan Type</Label>
                        <p className="text-sm">
                          <Badge variant="outline">
                            {viewingReceipt.payment_details.plan_type}
                          </Badge>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Payment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Payment Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Amount Paid</Label>
                      <p className="text-xl font-bold text-green-600">
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
                </CardContent>
              </Card>

              {/* Status Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Status Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Generated</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(viewingReceipt.timestamps.generated_at)}
                        </p>
                      </div>
                    </div>
                    
                    {viewingReceipt.timestamps.sent_at && (
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Sent</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(viewingReceipt.timestamps.sent_at)}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {viewingReceipt.timestamps.viewed_at && (
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Viewed</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(viewingReceipt.timestamps.viewed_at)}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {viewingReceipt.timestamps.downloaded_at && (
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Downloaded</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(viewingReceipt.timestamps.downloaded_at)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            <div className="flex space-x-2">
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
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (viewingReceipt) {
                    setUpdatingReceipt(viewingReceipt.receipt_number)
                    setNewStatus(viewingReceipt.status)
                    setIsStatusUpdateDialogOpen(true)
                    setIsViewDialogOpen(false)
                  }
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Update Status
              </Button>
              <Button onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Modal */}
      <Dialog open={isStatusUpdateDialogOpen} onOpenChange={setIsStatusUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Receipt Status</DialogTitle>
            <DialogDescription>
              Update the status for receipt {updatingReceipt}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_status">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="downloaded">Downloaded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status_notes">Notes (Optional)</Label>
              <Textarea
                id="status_notes"
                placeholder="Add any notes about this status update..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateReceiptStatus} disabled={!newStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Modal */}
      <Dialog open={isBulkUpdateDialogOpen} onOpenChange={setIsBulkUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Status Update</DialogTitle>
            <DialogDescription>
              Update status for {selectedReceipts.length} selected receipt(s)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk_status">New Status</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="downloaded">Downloaded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bulk_notes">Notes (Optional)</Label>
              <Textarea
                id="bulk_notes"
                placeholder="Add any notes about this bulk update..."
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="bg-muted p-3 rounded">
              <p className="text-sm font-medium">Selected Receipts:</p>
              <div className="text-xs text-muted-foreground mt-1">
                {selectedReceipts.slice(0, 5).join(', ')}
                {selectedReceipts.length > 5 && ` and ${selectedReceipts.length - 5} more...`}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={bulkUpdateStatuses} disabled={!bulkStatus}>
              Update {selectedReceipts.length} Receipt(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 