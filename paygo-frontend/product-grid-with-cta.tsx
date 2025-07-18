"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Phone, Mail, MapPin, Clock, Send, Search, Filter, Loader2, Scale } from "lucide-react"
import { productApi, type Product, type ProductCategory, type ProductFilters, convertLaravelProduct } from "@/lib/api"
import { useComparison } from "@/lib/comparison"

export default function ProductGridWithCTA() {
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
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000])
  const [capacityRange, setCapacityRange] = useState<[number, number]>([0, 500])
  const [selectedColor, setSelectedColor] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showFilters, setShowFilters] = useState(false)

  // Available filter options (will be populated from API)
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

      if (selectedCategory) {
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

      if (selectedColor) {
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
    }, 500) // 500ms debounce for search

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, selectedCategory, priceRange, capacityRange, selectedColor, sortBy, sortOrder])

  // Refetch when page changes
  useEffect(() => {
    if (currentPage > 1) {
      fetchProducts()
    }
  }, [currentPage])

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Thank you for your message! We will get back to you soon.')
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("")
    setPriceRange(priceRangeLimits)
    setCapacityRange(capacityRangeLimits)
    setSelectedColor("")
    setSortBy("name")
    setSortOrder("asc")
    setCurrentPage(1)
  }

  return (
    <>
      <section className="py-12 px-4 md:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Our Products</h2>
            <p className="text-gray-600">{totalProducts} products available</p>
          </div>

          {/* Search and Filter Controls */}
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              {(searchTerm || selectedCategory || selectedColor) && (
                <Button variant="ghost" onClick={clearFilters}>
                  Clear All
                </Button>
              )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Category Filter */}
                  <div>
                    <Label>Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All categories</SelectItem>
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
                    <Label>Color</Label>
                    <Select value={selectedColor} onValueChange={setSelectedColor}>
                      <SelectTrigger>
                        <SelectValue placeholder="All colors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All colors</SelectItem>
                        {availableColors.map((color) => (
                          <SelectItem key={color} value={color}>
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <Label>Sort by</Label>
                    <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                      const [field, order] = value.split('-')
                      setSortBy(field)
                      setSortOrder(order as 'asc' | 'desc')
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        <SelectItem value="price_usd-asc">Price (Low to High)</SelectItem>
                        <SelectItem value="price_usd-desc">Price (High to Low)</SelectItem>
                        <SelectItem value="capacity_litres-asc">Capacity (Small to Large)</SelectItem>
                        <SelectItem value="capacity_litres-desc">Capacity (Large to Small)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <Label>Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
                    <Slider
                      value={priceRange}
                      onValueChange={(value) => setPriceRange(value as [number, number])}
                      min={priceRangeLimits[0]}
                      max={priceRangeLimits[1]}
                      step={50}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Capacity Range */}
                <div className="mt-4">
                  <Label>Capacity Range: {capacityRange[0]}L - {capacityRange[1]}L</Label>
                  <Slider
                    value={capacityRange}
                    onValueChange={(value) => setCapacityRange(value as [number, number])}
                    min={capacityRangeLimits[0]}
                    max={capacityRangeLimits[1]}
                    step={10}
                    className="mt-2"
                  />
                </div>
              </Card>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading products...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchProducts}>Try Again</Button>
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 gap-8">
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No products found matching your criteria.</p>
                  <Button onClick={clearFilters} className="mt-4">Clear Filters</Button>
                </div>
              ) : (
                products.map((product) => {
                  const frontendProduct = convertLaravelProduct(product)
                  return (
                    <div key={product.id} className="bg-emerald-600 rounded-lg shadow-md overflow-hidden flex flex-col lg:flex-row">
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
                          <h3 className="text-2xl font-bold mb-3 text-white">{product.name}</h3>
                          {product.description_text && <p className="text-sm mb-4 text-white">{product.description_text}</p>}
                          <p className="text-xl font-semibold mb-1 text-white">Price: ${product.price_usd} USD</p>
                          <p className="text-lg font-medium mb-4 text-white">Starting at ${product.weekly_installment_usd}/week</p>
                          <div className="space-y-1 text-sm mb-4 text-white">
                            <p>💳 PayGo: {frontendProduct.paygoWarranty} warranty</p>
                            <p>💰 Cash: {frontendProduct.cashWarranty} warranty</p>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-sm mb-4 text-white">
                            {product.capacity_litres && <li>Capacity: {product.capacity_litres}L</li>}
                            {product.power_consumption_watts && <li>Power Consumption: {product.power_consumption_watts}W</li>}
                            {product.color && <li>Color Available: {product.color}</li>}
                            {product.defrost_type && <li>Defrost Type: {product.defrost_type}</li>}
                          </ul>
                          {(() => {
                            const features = ensureFeatureArray(product.features);
                            return features.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {features.map((feature, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="bg-white text-emerald-700 border border-emerald-700"
                                  >
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                        
                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                          <Link href={`/products/${product.id}`} passHref>
                            <Button variant="default" className="bg-black text-white hover:bg-gray-800 ">
                              Learn More
                            </Button>
                          </Link>
                          
                            <Button
                              variant="outline"
                              className="border-white text-white hover:bg-white hover:text-emerald-500 bg-transparent"
                            >
                              Buy Now
                            </Button>
                            <Button
                              variant="outline"
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
                                  ? 'border-blue-600 text-blue-600 bg-blue-50' 
                                  : 'border-white text-emerald-600 hover:bg-white hover:bg-gray-100'
                                }
                                ${!canAddMore && !isInComparison(product.id) ? 'opacity-50' : ''}
                                px-4 min-w-[44px] h-10
                              `}
                              title={
                                isInComparison(product.id) 
                                  ? 'Remove from comparison' 
                                  : !canAddMore 
                                    ? 'Maximum 3 products can be compared' 
                                    : 'Add to comparison'
                              }
                            >
                              <Scale className="h-5 w-5" />
                            </Button>
                          
                          <Link href="/login" passHref>
                            <Button variant="default" className="bg-white text-emerald-700 hover:bg-gray-100">
                              Get it with PayGo installments
                            </Button>
                          </Link>
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
            <div className="flex justify-center mt-8">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {currentPage}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={products.length < 12} // Assuming 12 per page
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact-section" className="py-6 px-4 md:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-2">Get in Touch</h2>
            <p className="text-base text-gray-300">
              Ready to transform your business with solar-powered refrigeration? Contact us today!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold mb-3">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm">+254 700 123 456</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm">info@koyo.co.ke</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm">Industrial Area, Nairobi, Kenya</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm">Mon - Fri: 8:00 AM - 6:00 PM</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-base font-semibold mb-2">Why Choose KOYO?</h4>
                <div className="grid grid-cols-1 gap-1 text-gray-300 text-sm">
                  <span>• 2-year warranty • Free installation</span>
                  <span>• 24/7 support • Flexible payments</span>
                  <span>• Made in Kenya quality</span>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <Card className="bg-white text-gray-900">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Send us a Message</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <form onSubmit={handleContactSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="firstName" className="text-sm">First Name</Label>
                        <Input id="firstName" placeholder="John" required className="text-sm h-9" />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-sm">Last Name</Label>
                        <Input id="lastName" placeholder="Doe" required className="text-sm h-9" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm">Email</Label>
                        <Input id="email" type="email" placeholder="john@example.com" required className="text-sm h-9" />
                      </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                      <Input id="phone" type="tel" placeholder="+254 700 123 456" className="text-sm h-9" />
                    </div>
                    <div>
                      <Label htmlFor="subject" className="text-sm">Subject</Label>
                      <Input id="subject" placeholder="Inquiry about KOYO products" required className="text-sm h-9" />
                    </div>
                    <div>
                      <Label htmlFor="message" className="text-sm">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us about your refrigeration needs..."
                        rows={3}
                        required
                        className="text-sm"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-9">
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-white py-6 px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Company Info */}
            <div>
              <h4 className="font-bold text-lg mb-3">KOYO PayGo</h4>
              <p className="text-gray-400 text-sm">
                Solar-powered refrigeration solutions with flexible payment plans for businesses across Kenya.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-lg mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/products" className="hover:text-emerald-400 transition-colors">Products</Link></li>
                <li><Link href="/register" className="hover:text-emerald-400 transition-colors">Get Started</Link></li>
                <li><Link href="/login" className="hover:text-emerald-400 transition-colors">Login</Link></li>
                <li><Link href="#contact-section" className="hover:text-emerald-400 transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-bold text-lg mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/terms-and-conditions" className="hover:text-emerald-400 transition-colors">Terms & Conditions</Link></li>
                <li><span>24/7 Technical Support</span></li>
                <li><span>Free Installation</span></li>
                <li><span>2-Year Warranty</span></li>
                <li><span>Flexible Payment Plans</span></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-4 text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} KOYO PayGo Platform. All rights reserved. | Made in Kenya
            </p>
          </div>
        </div>
      </footer>

      {/* Comparison Bar */}
      {comparedProducts.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-6 py-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-emerald-600" />
              <span className="font-medium text-gray-900">
                {comparedProducts.length} product{comparedProducts.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex gap-2">
              <Link href="/compare">
                <Button 
                  size="sm" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={comparedProducts.length < 2}
                >
                  Compare Now
                </Button>
              </Link>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  if (confirm('Are you sure you want to clear all comparisons?')) {
                    clearComparison()
                  }
                }}
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
