"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Search, Filter, Loader2, Scale, ArrowLeft } from "lucide-react"
import { productApi, type Product, type ProductCategory, type ProductFilters, convertLaravelProduct, formatKshPrice } from "@/lib/api"
import { useComparison } from "@/lib/comparison"

export default function ProductsPage() {
  // State for products and filters
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalProducts, setTotalProducts] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Comparison functionality
  const { addToComparison, removeFromComparison, isInComparison, canAddMore, comparedProducts, clearComparison } = useComparison()

  // Helper function to ensure features is always an array
  const ensureFeatureArray = (features: any): string[] => {
    if (Array.isArray(features)) return features;
    if (typeof features === 'string') {
      try {
        const parsed = JSON.parse(features);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000])
  const [capacityRange, setCapacityRange] = useState<[number, number]>([0, 500])
  const [selectedColor, setSelectedColor] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showFilters, setShowFilters] = useState(false)

  // Available filter options
  const [availableColors, setAvailableColors] = useState<string[]>([])
  const [priceRangeLimits, setPriceRangeLimits] = useState<[number, number]>([0, 3000])
  const [capacityRangeLimits, setCapacityRangeLimits] = useState<[number, number]>([0, 500])

  // Fetch products with current filters
  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const filters: ProductFilters = {
        page: currentPage,
        per_page: 12,
        sort_by: sortBy as any,
        sort_order: sortOrder,
      }

      if (searchTerm.trim()) {
        filters.search = searchTerm.trim()
      }

      if (selectedCategory && selectedCategory !== "all") {
        filters.category_id = parseInt(selectedCategory)
      }

      if (priceRange[0] > priceRangeLimits[0]) {
        filters.min_price = priceRange[0]
      }

      if (priceRange[1] < priceRangeLimits[1]) {
        filters.max_price = priceRange[1]
      }

      if (capacityRange[0] > capacityRangeLimits[0]) {
        filters.min_capacity = capacityRange[0]
      }

      if (capacityRange[1] < capacityRangeLimits[1]) {
        filters.max_capacity = capacityRange[1]
      }

      if (selectedColor && selectedColor !== "all") {
        filters.color = selectedColor
      }

      const response = await productApi.getProducts(filters)
      
      if (response.success) {
        setProducts(response.data.data)
        setTotalProducts(response.data.total)
        
        // Update filter options from API response
        if (response.filters) {
          setAvailableColors(response.filters.colors)
          setPriceRangeLimits([response.filters.price_range.min, response.filters.price_range.max])
          setCapacityRangeLimits([response.filters.capacity_range.min, response.filters.capacity_range.max])
          
          // Initialize range sliders if not set
          if (priceRange[0] === 0 && priceRange[1] === 3000) {
            setPriceRange([response.filters.price_range.min, response.filters.price_range.max])
          }
          if (capacityRange[0] === 0 && capacityRange[1] === 500) {
            setCapacityRange([response.filters.capacity_range.min, response.filters.capacity_range.max])
          }
        }
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Failed to load products. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await productApi.getCategories()
      if (response.success) {
        setCategories(response.data)
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("all")
    setSelectedColor("all")
    setPriceRange(priceRangeLimits)
    setCapacityRange(capacityRangeLimits)
    setSortBy("name")
    setSortOrder("asc")
    setCurrentPage(1)
  }

  // Initial load
  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [])

  // Refetch when filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setCurrentPage(1) // Reset to first page when filters change
      fetchProducts()
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, selectedCategory, priceRange, capacityRange, selectedColor, sortBy, sortOrder])

  // Refetch when page changes
  useEffect(() => {
    if (currentPage > 1) {
      fetchProducts()
    }
  }, [currentPage])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-emerald-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/" className="flex items-center gap-2 text-white hover:text-emerald-200 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">KOYO Solar Refrigeration</h1>
            <p className="text-xl md:text-2xl text-emerald-100 mb-6">
              Browse our complete collection of solar-powered fridges and freezers
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <span>50L - 508L Capacity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <span>2 Years PayGo Warranty</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <span>Made in Kenya</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Controls */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="capacity">Capacity</SelectItem>
                  <SelectItem value="created_at">Newest</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">A-Z</SelectItem>
                  <SelectItem value="desc">Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
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
                </div>

                {/* Color Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <Select value={selectedColor} onValueChange={setSelectedColor}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Colors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Colors</SelectItem>
                      {availableColors.map((color) => (
                        <SelectItem key={color} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Price Range: {formatKshPrice(priceRange[0])} - {formatKshPrice(priceRange[1])}
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    min={priceRangeLimits[0]}
                    max={priceRangeLimits[1]}
                    step={50}
                    className="mt-2"
                  />
                </div>

                {/* Capacity Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Capacity: {capacityRange[0]}L - {capacityRange[1]}L
                  </label>
                  <Slider
                    value={capacityRange}
                    onValueChange={(value) => setCapacityRange(value as [number, number])}
                    min={capacityRangeLimits[0]}
                    max={capacityRangeLimits[1]}
                    step={10}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-6">
                <p className="text-sm text-gray-600">
                  {totalProducts} product{totalProducts !== 1 ? 's' : ''} found
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {totalProducts} Product{totalProducts !== 1 ? 's' : ''} Available
          </h2>
          {comparedProducts.length > 0 && (
            <Link href="/compare">
              <Button variant="outline" className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Compare ({comparedProducts.length})
              </Button>
            </Link>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <span className="ml-2 text-gray-600">Loading products...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchProducts} className="bg-emerald-600 hover:bg-emerald-700">
              Try Again
            </Button>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 gap-8">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No products found matching your criteria.</p>
                <Button onClick={clearFilters} className="bg-emerald-600 hover:bg-emerald-700">
                  Clear Filters
                </Button>
              </div>
            ) : (
              products.map((product) => {
                const frontendProduct = convertLaravelProduct(product)
                return (
                  <div key={product.id} className="bg-emerald-600 rounded-lg shadow-lg overflow-hidden flex flex-col lg:flex-row hover:shadow-xl transition-shadow">
                    <div className="lg:w-1/2">
                      <Image
                        src={frontendProduct.image || "/placeholder.svg"}
                        alt={product.name}
                        width={600}
                        height={400}
                        className="w-full h-64 object-cover lg:h-full"
                      />
                    </div>
                    
                    <div className="lg:w-1/2 p-6 flex flex-col justify-between text-white">
                      <div>
                        <h3 className="text-2xl font-bold mb-3">{product.name}</h3>
                        {product.description_text && (
                          <p className="text-sm mb-4 opacity-90">{product.description_text}</p>
                        )}
                        <p className="text-xl font-semibold mb-1">Price: {formatKshPrice(product.price_ksh)}</p>
                        <p className="text-lg font-medium mb-4">
                          Starting at {formatKshPrice(product.weekly_installment_ksh)}/week with PayGo
                        </p>
                        <div className="space-y-1 text-sm mb-4">
                          <p>💳 PayGo: {frontendProduct.paygoWarranty} warranty</p>
                          <p>💰 Cash: {frontendProduct.cashWarranty} warranty</p>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sm mb-4">
                          {product.capacity_litres && <li>Capacity: {product.capacity_litres}L</li>}
                          {product.power_consumption_watts && <li>Power: {product.power_consumption_watts}W</li>}
                          {product.color && <li>Color: {product.color}</li>}
                          {product.defrost_type && <li>Defrost: {product.defrost_type}</li>}
                        </ul>
                        {(() => {
                          const features = ensureFeatureArray(product.features);
                          return features.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {features.map((feature, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="bg-white text-emerald-700"
                                >
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                      
                      <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        <Link href={`/products/${product.id}`}>
                          <Button className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto">
                            Learn More
                          </Button>
                        </Link>
                        
                        <Button
                          variant="outline"
                          className="border-white text-white hover:bg-white hover:text-emerald-600"
                        >
                          Buy Now
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (isInComparison(product.id)) {
                              removeFromComparison(product.id)
                            } else {
                              addToComparison(product)
                            }
                          }}
                          disabled={!canAddMore && !isInComparison(product.id)}
                          className={`
                            ${isInComparison(product.id) 
                              ? 'border-blue-300 text-blue-300 bg-blue-50' 
                              : 'border-white text-white hover:bg-white hover:text-emerald-600'
                            }
                            ${!canAddMore && !isInComparison(product.id) ? 'opacity-50' : ''}
                          `}
                          title={
                            isInComparison(product.id) 
                              ? 'Remove from comparison' 
                              : !canAddMore 
                                ? 'Maximum 3 products can be compared' 
                                : 'Add to comparison'
                          }
                        >
                          <Scale className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && products.length > 0 && (
          <div className="flex justify-center mt-12">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 py-2 text-gray-600">
                Page {currentPage}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={products.length < 12}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 