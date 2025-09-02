"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Package, 
  Filter,
  Download,
  Upload,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Settings,
  TrendingUp,
  Shield
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

interface ProductCategory {
  id: number
  name: string
  description?: string
  is_active: boolean
}

interface Product {
  id: number
  name: string
  model_code: string
  description_text?: string
  long_description?: string
  capacity_litres?: number
  power_consumption_watts?: number
  color?: string
  defrost_type?: string
  cash_warranty_months?: number
  paygo_warranty_months?: number
  price_ksh: number
  weekly_installment_ksh: number
  monthly_installment_ksh?: number
  features?: string[] | string  // Can be array or JSON string
  images?: string[] | string    // Can be array or JSON string
  is_active: boolean
  created_at: string
  updated_at: string
  category?: ProductCategory
}

interface ProductsResponse {
  success: boolean
  message: string
  data: {
    data: Product[]
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  meta: {
    categories: ProductCategory[]
    total_active: number
    total_inactive: number
    total_products: number
  }
}

const DEFROST_TYPES = [
  { value: 'Manual', label: 'Manual' },
  { value: 'Automatic', label: 'Automatic' }
]

export function ProductManagementSection() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("created_at")
  const [sortOrder, setSortOrder] = useState<string>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalActive, setTotalActive] = useState(0)
  const [totalInactive, setTotalInactive] = useState(0)
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  // Form states
  const [formData, setFormData] = useState({
    category_id: "",
    name: "",
    model_code: "",
    description_text: "",
    long_description: "",
    capacity_litres: "",
    power_consumption_watts: "",
    color: "",
    defrost_type: "",
    cash_warranty_months: "",
    paygo_warranty_months: "",
    price_ksh: "",
    weekly_installment_ksh: "",
    monthly_installment_ksh: "",
    features: [] as string[],
    images: [] as string[],
    is_active: true
  })
  
  const [newFeature, setNewFeature] = useState("")
  const [newImage, setNewImage] = useState("")

  useEffect(() => {
    fetchProducts()
  }, [searchTerm, selectedCategory, statusFilter, sortBy, sortOrder, currentPage])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: "15",
        sort_by: sortBy,
        sort_order: sortOrder
      })

      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory !== 'all') params.append('category_id', selectedCategory)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      console.log('🔍 Fetching products with params:', params.toString())
      console.log('🔑 Auth token exists:', !!localStorage.getItem('auth_token'))
      console.log('👤 User type:', localStorage.getItem('user_type'))

      const response = await authService.makeRequest(`/admin/products?${params.toString()}`)
      
      console.log('📦 Products response:', response)

      if (response.success) {
        setProducts(response.data.data)
        setCurrentPage(response.data.current_page)
        setTotalPages(response.data.last_page)
        setTotalProducts(response.data.total)
        setCategories(response.meta.categories)
        setTotalActive(response.meta.total_active)
        setTotalInactive(response.meta.total_inactive)
        
        console.log('✅ Products loaded:', response.data.data.length, 'products')
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error)
      toast({
        title: "Authentication Error",
        description: "Please make sure you're logged in as an admin to manage products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      category_id: "",
      name: "",
      model_code: "",
      description_text: "",
      long_description: "",
      capacity_litres: "",
      power_consumption_watts: "",
      color: "",
      defrost_type: "",
      cash_warranty_months: "",
      paygo_warranty_months: "",
      price_ksh: "",
      weekly_installment_ksh: "",
      monthly_installment_ksh: "",
      features: [],
      images: [],
      is_active: true
    })
    setNewFeature("")
    setNewImage("")
  }

  const handleCreateProduct = async () => {
    try {
      const productData = {
        ...formData,
        capacity_litres: formData.capacity_litres ? parseInt(formData.capacity_litres) : null,
        power_consumption_watts: formData.power_consumption_watts ? parseInt(formData.power_consumption_watts) : null,
        cash_warranty_months: formData.cash_warranty_months ? parseInt(formData.cash_warranty_months) : null,
        paygo_warranty_months: formData.paygo_warranty_months ? parseInt(formData.paygo_warranty_months) : null,
        price_ksh: parseFloat(formData.price_ksh),
        weekly_installment_ksh: parseFloat(formData.weekly_installment_ksh),
        monthly_installment_ksh: formData.monthly_installment_ksh ? parseFloat(formData.monthly_installment_ksh) : null,
      }

      const response = await authService.makeRequest('/admin/products', {
        method: 'POST',
        body: JSON.stringify(productData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.success) {
        toast({
          title: "Success",
          description: "Product created successfully",
        })
        setShowCreateModal(false)
        resetForm()
        fetchProducts()
      }
    } catch (error: any) {
      console.error('Error creating product:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      })
    }
  }

  const handleUpdateProduct = async () => {
    if (!selectedProduct) {
      console.error('❌ No product selected for update')
      return
    }



    // Validate required fields
    if (!formData.category_id || !formData.name || !formData.model_code || !formData.price_ksh || !formData.weekly_installment_ksh) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Category, Name, Model Code, Price, Weekly Installment)",
        variant: "destructive",
      })
      return
    }

    console.log('🔄 Updating product:', selectedProduct.id)
    console.log('📝 Form data:', formData)

    try {
      const productData = {
        ...formData,
        capacity_litres: formData.capacity_litres ? parseInt(formData.capacity_litres) : null,
        power_consumption_watts: formData.power_consumption_watts ? parseInt(formData.power_consumption_watts) : null,
        cash_warranty_months: formData.cash_warranty_months ? parseInt(formData.cash_warranty_months) : null,
        paygo_warranty_months: formData.paygo_warranty_months ? parseInt(formData.paygo_warranty_months) : null,
        price_ksh: parseFloat(formData.price_ksh),
        weekly_installment_ksh: parseFloat(formData.weekly_installment_ksh),
        monthly_installment_ksh: formData.monthly_installment_ksh ? parseFloat(formData.monthly_installment_ksh) : null,
      }

      console.log('📤 Sending product data:', productData)

      const response = await authService.makeRequest(`/admin/products/${selectedProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('📥 Update response:', response)

      if (response.success) {
        console.log('✅ Product updated successfully')
        toast({
          title: "Success",
          description: "Product updated successfully",
        })
        setShowEditModal(false)
        setSelectedProduct(null)
        resetForm()
        fetchProducts()
      } else {
        throw new Error(response.message || 'Update failed')
      }
    } catch (error: any) {
      console.error('❌ Error updating product:', error)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update product",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return

    try {
      const response = await authService.makeRequest(`/admin/products/${selectedProduct.id}`, {
        method: 'DELETE',
      })

      if (response.success) {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        })
        setShowDeleteModal(false)
        setSelectedProduct(null)
        fetchProducts()
      }
    } catch (error: any) {
      console.error('Error deleting product:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  const openEditModal = (product: Product) => {
    console.log('🔧 Opening edit modal for product:', product)
    
    setSelectedProduct(product)
    
    // Parse features and images if they're JSON strings
    let parsedFeatures: string[] = []
    let parsedImages: string[] = []
    
    try {
      if (typeof product.features === 'string') {
        parsedFeatures = JSON.parse(product.features)
      } else if (Array.isArray(product.features)) {
        parsedFeatures = product.features
      }
    } catch (e) {
      console.warn('Failed to parse features:', product.features)
      parsedFeatures = []
    }
    
    try {
      if (typeof product.images === 'string') {
        parsedImages = JSON.parse(product.images)
      } else if (Array.isArray(product.images)) {
        parsedImages = product.images
      }
    } catch (e) {
      console.warn('Failed to parse images:', product.images)
      parsedImages = []
    }
    
    console.log('📝 Parsed features:', parsedFeatures)
    console.log('🖼️ Parsed images:', parsedImages)
    
    setFormData({
      category_id: product.category?.id?.toString() || "",
      name: product.name,
      model_code: product.model_code,
      description_text: product.description_text || "",
      long_description: product.long_description || "",
      capacity_litres: product.capacity_litres?.toString() || "",
      power_consumption_watts: product.power_consumption_watts?.toString() || "",
      color: product.color || "",
      defrost_type: product.defrost_type || "",
      cash_warranty_months: product.cash_warranty_months?.toString() || "",
      paygo_warranty_months: product.paygo_warranty_months?.toString() || "",
      price_ksh: product.price_ksh.toString(),
      weekly_installment_ksh: product.weekly_installment_ksh.toString(),
      monthly_installment_ksh: product.monthly_installment_ksh?.toString() || "",
      features: parsedFeatures,
      images: parsedImages,
      is_active: product.is_active
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product)
    setShowDeleteModal(true)
  }

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }))
      setNewFeature("")
    }
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const addImage = () => {
    if (newImage.trim() && !formData.images.includes(newImage.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImage.trim()]
      }))
      setNewImage("")
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const parseArrayField = (field: string[] | string | undefined): string[] => {
    if (!field) return []
    if (Array.isArray(field)) return field
    if (typeof field === 'string') {
      try {
        return JSON.parse(field)
      } catch (e) {
        return []
      }
    }
    return []
  }

  const ProductForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="grid gap-6 py-4 max-h-[75vh] overflow-y-auto pr-2">
      {/* Basic Information Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          <Package className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Basic Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category_id" className="text-sm font-medium text-gray-700 dark:text-gray-300">Category *</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
            >
              <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500">
                <SelectValue placeholder="Select product category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., KOYO BC-50DC FRIDGE, SINGLE DOOR"
              className="border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model_code" className="text-sm font-medium text-gray-700 dark:text-gray-300">Model Code *</Label>
            <Input
              id="model_code"
              value={formData.model_code}
              onChange={(e) => setFormData(prev => ({ ...prev, model_code: e.target.value }))}
              placeholder="e.g., BC-50DC"
              className="border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color" className="text-sm font-medium text-gray-700 dark:text-gray-300">Color</Label>
            <Select
              value={formData.color}
              onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
            >
              <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500">
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="White">White</SelectItem>
                <SelectItem value="Black">Black</SelectItem>
                <SelectItem value="Silver">Silver</SelectItem>
                <SelectItem value="Grey">Grey</SelectItem>
                <SelectItem value="Blue">Blue</SelectItem>
                <SelectItem value="Red">Red</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Technical Specifications Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          <Settings className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Technical Specifications</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="capacity_litres" className="text-sm font-medium text-gray-700 dark:text-gray-300">Capacity (Litres)</Label>
            <Input
              id="capacity_litres"
              type="number"
              value={formData.capacity_litres}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity_litres: e.target.value }))}
              placeholder="e.g., 50, 75, 100"
              className="border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="power_consumption_watts" className="text-sm font-medium text-gray-700 dark:text-gray-300">Power Consumption (Watts)</Label>
            <Input
              id="power_consumption_watts"
              type="number"
              value={formData.power_consumption_watts}
              onChange={(e) => setFormData(prev => ({ ...prev, power_consumption_watts: e.target.value }))}
              placeholder="e.g., 45, 55, 75"
              className="border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defrost_type" className="text-sm font-medium text-gray-700 dark:text-gray-300">Defrost Type</Label>
            <Select
              value={formData.defrost_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, defrost_type: value }))}
            >
              <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select defrost type" />
              </SelectTrigger>
              <SelectContent>
                {DEFROST_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pricing Configuration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price_ksh" className="text-sm font-medium text-gray-700 dark:text-gray-300">Cash Price (KSh) *</Label>
            <Input
              id="price_ksh"
              type="number"
              step="0.01"
              value={formData.price_ksh}
              onChange={(e) => setFormData(prev => ({ ...prev, price_ksh: e.target.value }))}
              placeholder="e.g., 147000, 210000"
              className="border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weekly_installment_ksh" className="text-sm font-medium text-gray-700 dark:text-gray-300">Weekly Installment (KSh) *</Label>
            <Input
              id="weekly_installment_ksh"
              type="number"
              step="0.01"
              value={formData.weekly_installment_ksh}
              onChange={(e) => setFormData(prev => ({ ...prev, weekly_installment_ksh: e.target.value }))}
              placeholder="e.g., 2800, 4200"
              className="border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly_installment_ksh" className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Installment (KSh)</Label>
            <Input
              id="monthly_installment_ksh"
              type="number"
              step="0.01"
              value={formData.monthly_installment_ksh}
              onChange={(e) => setFormData(prev => ({ ...prev, monthly_installment_ksh: e.target.value }))}
              placeholder="e.g., 12180, 18200"
              className="border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Auto-calculated from weekly if left empty
            </p>
          </div>
        </div>
      </div>

      {/* Warranty Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          <Shield className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Warranty Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cash_warranty_months" className="text-sm font-medium text-gray-700 dark:text-gray-300">Cash Purchase Warranty (Months)</Label>
            <Input
              id="cash_warranty_months"
              type="number"
              value={formData.cash_warranty_months}
              onChange={(e) => setFormData(prev => ({ ...prev, cash_warranty_months: e.target.value }))}
              placeholder="12"
              className="border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paygo_warranty_months" className="text-sm font-medium text-gray-700 dark:text-gray-300">PayGo Plan Warranty (Months)</Label>
            <Input
              id="paygo_warranty_months"
              type="number"
              value={formData.paygo_warranty_months}
              onChange={(e) => setFormData(prev => ({ ...prev, paygo_warranty_months: e.target.value }))}
              placeholder="24"
              className="border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Descriptions Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          <Edit className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Product Descriptions</h3>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description_text" className="text-sm font-medium text-gray-700 dark:text-gray-300">Short Description</Label>
            <Textarea
              id="description_text"
              value={formData.description_text}
              onChange={(e) => setFormData(prev => ({ ...prev, description_text: e.target.value }))}
              placeholder="A compact and efficient single-door fridge with a..."
              rows={3}
              className="border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="long_description" className="text-sm font-medium text-gray-700 dark:text-gray-300">Detailed Description</Label>
            <Textarea
              id="long_description"
              value={formData.long_description}
              onChange={(e) => setFormData(prev => ({ ...prev, long_description: e.target.value }))}
              placeholder="The KOYO BC-50DC FRIDGE is a solar-powered refrigerator designed for..."
              rows={4}
              className="border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          <Plus className="h-5 w-5 text-cyan-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Product Features</h3>
        </div>
        
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Features</Label>
          <div className="flex gap-2">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="e.g., Single Door, Freezer Chamber, Compact Design"
              onKeyPress={(e) => e.key === 'Enter' && addFeature()}
              className="border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:ring-cyan-500"
            />
            <Button 
              type="button" 
              onClick={addFeature} 
              variant="outline" 
              size="sm"
              className="border-cyan-300 text-cyan-700 hover:bg-cyan-50 dark:border-cyan-700 dark:text-cyan-300 dark:hover:bg-cyan-950"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[2rem]">
            {formData.features.map((feature, index) => (
              <Badge key={index} variant="secondary" className="gap-1 bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">
                {feature}
                <button onClick={() => removeFeature(index)} className="hover:text-red-600">
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {formData.features.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">No features added yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Images Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          <Upload className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Product Images</h3>
        </div>
        
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Image URLs</Label>
          <div className="flex gap-2">
            <Input
              value={newImage}
              onChange={(e) => setNewImage(e.target.value)}
              placeholder="e.g., /images/koyo-50l-1.jpg"
              onKeyPress={(e) => e.key === 'Enter' && addImage()}
              className="border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
            />
            <Button 
              type="button" 
              onClick={addImage} 
              variant="outline" 
              size="sm"
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {formData.images.map((image, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                <span className="flex-1 text-sm truncate text-gray-700 dark:text-gray-300">{image}</span>
                <Button
                  type="button"
                  onClick={() => removeImage(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {formData.images.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">No images added yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Status Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          <Eye className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Product Status</h3>
        </div>
        
        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Checkbox
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked === true }))}
            className="border-gray-400 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
          />
          <div className="flex-1">
            <Label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Active Product
            </Label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formData.is_active ? 'This product will be visible in the catalog' : 'This product will be hidden from the catalog'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Product Management</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your product catalog including VacciBox and other product types
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 hover:border-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 text-white rounded-lg">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalProducts}</p>
                <p className="text-sm text-blue-600 dark:text-blue-300">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 text-white rounded-lg">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{totalActive}</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-300">Active Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 text-white rounded-lg">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">{totalInactive}</p>
                <p className="text-sm text-red-600 dark:text-red-300">Inactive Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 text-white rounded-lg">
                <Filter className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{categories.length}</p>
                <p className="text-sm text-purple-600 dark:text-purple-300">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price_ksh">Price</SelectItem>
                <SelectItem value="capacity_litres">Capacity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Products</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Product Details</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Category</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-gray-100 text-right">Pricing (KSh)</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-gray-100 text-center">Specifications</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Status</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Created</TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-gray-100 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading products...
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {product.model_code}
                          </div>
                          {product.color && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {product.color}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                        >
                          {product.category?.name || 'No Category'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-right">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(product.price_ksh)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatCurrency(product.weekly_installment_ksh)}/week
                          </div>
                          {product.monthly_installment_ksh && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {formatCurrency(product.monthly_installment_ksh)}/month
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {product.capacity_litres ? `${product.capacity_litres}L` : 'N/A'}
                          </div>
                          {product.power_consumption_watts && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {product.power_consumption_watts}W
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={product.is_active ? "default" : "secondary"}
                          className={product.is_active 
                            ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800" 
                            : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                          }
                        >
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(product.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditModal(product)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteModal(product)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">No products found</div>
            ) : (
              products.map((product) => (
                <Card key={product.id} className="border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Product Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {product.model_code} • {product.color}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditModal(product)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteModal(product)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Category and Status */}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800">
                          {product.category_name}
                        </Badge>
                        <Badge 
                          variant={product.is_active ? "default" : "secondary"}
                          className={product.is_active 
                            ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800" 
                            : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                          }
                        >
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      {/* Pricing */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Price:</span>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            KSh {product.price_ksh?.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Weekly:</span>
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            KSh {product.weekly_installment_ksh?.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Specifications */}
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 text-sm">Specifications:</span>
                        <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                          {product.capacity} • {product.power_consumption} • {product.dimensions}
                        </div>
                      </div>

                      {/* Features */}
                      {parseArrayField(product.features).length > 0 && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400 text-sm">Features:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {parseArrayField(product.features).slice(0, 3).map((feature, index) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800"
                              >
                                {feature}
                              </Badge>
                            ))}
                            {parseArrayField(product.features).length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{parseArrayField(product.features).length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Created Date */}
                      <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                        Created: {formatDate(product.created_at)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {((currentPage - 1) * 15) + 1} to {Math.min(currentPage * 15, totalProducts)} of {totalProducts} products
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Product Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] flex flex-col sm:w-full">
          <DialogHeader className="pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600" />
              Add New Product
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Create a new product for the KOYO catalog including refrigerators, freezers, VacciBox or other product types
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ProductForm />
          </div>
          <DialogFooter className="pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-900">
            <Button 
              variant="outline" 
              onClick={() => setShowCreateModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProduct}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] flex flex-col sm:w-full">
          <DialogHeader className="pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Edit Product
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Update product information and specifications for "{selectedProduct?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ProductForm isEdit />
          </div>
          <DialogFooter className="pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-900">
            <Button 
              variant="outline" 
              onClick={() => setShowEditModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateProduct}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Update Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Product
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete <span className="font-medium text-gray-900 dark:text-gray-100">"{selectedProduct?.name}"</span>? This will mark the product as inactive and hide it from the catalog.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProduct}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 