"use client"

import { useState, useEffect } from "react"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Battery, 
  Zap, 
  Shield, 
  Wrench, 
  Sun, 
  Home, 
  Star,
  MapPin,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Heart,
  Share
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { productApi, type Product } from "@/lib/api"
import { AvailabilityModal } from "@/components/availability-modal"

interface ProductPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProductPage({ params }: ProductPageProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [productId, setProductId] = useState<number | null>(null)

  // Handle async params in Next.js 15
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      const id = Number.parseInt(resolvedParams.id)
      if (isNaN(id)) {
        setError("Invalid product ID")
        setLoading(false)
        return
      }
      setProductId(id)
    }
    getParams()
  }, [params])

  // Fetch product data
  useEffect(() => {
    if (productId === null) return

    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await productApi.getProduct(productId)
        
        if (response.success && response.data) {
          setProduct(response.data)
        } else {
          setError("Product not found")
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        setError("Failed to load product details")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </main>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "The product you're looking for doesn't exist."}</p>
          <Link href="/">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
            <Link href="/" className="hover:text-emerald-600">Products</Link>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>

          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 mb-3">
                  {product.category}
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
                <p className="text-lg text-gray-600 mb-4">{product.description}</p>
                
                {/* Features badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {Array.isArray(product.features) && product.features.slice(0, 5).map((feature, idx) => (
                    <Badge key={idx} variant="outline" className="border-emerald-200 text-emerald-700">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Share className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Left Column - Images & Details */}
            <div className="lg:col-span-2">
              {/* Product Images */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        width={600}
                        height={400}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          // Fallback to placeholder on error
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="text-center text-gray-400">
                        <Home className="h-16 w-16 mx-auto mb-2" />
                        <p>Product Image</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Additional placeholder images */}
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="aspect-square bg-gray-100 rounded border-2 border-transparent hover:border-emerald-500 cursor-pointer">
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Product Information Tabs */}
              <Tabs defaultValue="specifications" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="specifications">Specifications</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="warranty">Warranty</TabsTrigger>
                </TabsList>
                
                <TabsContent value="specifications" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-emerald-600" />
                        Technical Specifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {product.capacity && (
                          <div className="flex justify-between py-2 border-b">
                            <span className="font-medium">Capacity</span>
                            <span className="text-emerald-600">{product.capacity}</span>
                          </div>
                        )}
                        {product.color && (
                          <div className="flex justify-between py-2 border-b">
                            <span className="font-medium">Color</span>
                            <span className="text-emerald-600">{product.color}</span>
                          </div>
                        )}
                        {product.price && (
                          <div className="flex justify-between py-2 border-b">
                            <span className="font-medium">Price (USD)</span>
                            <span className="text-emerald-600">${product.price}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-2 border-b">
                          <span className="font-medium">Power Source</span>
                          <span className="text-emerald-600">Solar + Electric</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="font-medium">Battery Backup</span>
                          <span className="text-emerald-600">Up to 15 hours</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="font-medium">Climate Class</span>
                          <span className="text-emerald-600">Tropical (T)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="features" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-emerald-600" />
                        Key Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.isArray(product.features) && product.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="warranty" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-emerald-600" />
                        Warranty Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Alert>
                          <Shield className="h-4 w-4" />
                          <AlertDescription>
                            <strong>2-Year Comprehensive Warranty</strong> on all PayGo products includes parts, labor, and technical support.
                          </AlertDescription>
                        </Alert>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2">What's Covered</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                              <li>• Manufacturing defects</li>
                              <li>• Electrical components</li>
                              <li>• Cooling system</li>
                              <li>• Solar panel efficiency</li>
                            </ul>
                          </div>
                          <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="font-semibold text-green-900 mb-2">Support Included</h4>
                            <ul className="text-sm text-green-700 space-y-1">
                              <li>• Free installation</li>
                              <li>• 24/7 technical support</li>
                              <li>• Remote diagnostics</li>
                              <li>• On-site repairs</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column - Pricing & Purchase */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader className="bg-emerald-500 text-white">
                  <CardTitle className="text-2xl">Get Your KOYO Today</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-4xl font-bold text-emerald-700 mb-2">${product.price}</p>
                    <p className="text-lg text-gray-600">One-time payment</p>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                      <span className="text-2xl">💳</span>
                      <div>
                        <p className="font-semibold">PayGo Plan Available</p>
                        <p className="text-sm text-gray-600">Flexible weekly payments</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <span className="text-2xl">🚚</span>
                      <div>
                        <p className="font-semibold">Free Delivery & Setup</p>
                        <p className="text-sm text-gray-600">Installation included</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <span className="text-2xl">🛡️</span>
                      <div>
                        <p className="font-semibold">2-Year Warranty</p>
                        <p className="text-sm text-gray-600">Full coverage included</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Link href={`/products/${product.id}/paygo-plans`}>
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg">
                        🧮 View PayGo Plans
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50 py-3 text-lg"
                    >
                      Buy Now (Cash)
                    </Button>
                    <AvailabilityModal productId={product.id} productName={product.name}>
                      <Button
                        variant="ghost"
                        className="w-full text-emerald-600 hover:bg-emerald-50"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Check Availability
                      </Button>
                    </AvailabilityModal>
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Truck className="h-4 w-4" />
                      <span>Free delivery in 3-5 business days</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Installation within 24 hours</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Related Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Solar Technology */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sun className="h-5 w-5 text-emerald-600" />
                  Solar Technology
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Advanced solar panels with high-efficiency cells provide reliable power even in low-light conditions, reducing electricity costs by up to 80%.
                </p>
              </CardContent>
            </Card>

            {/* Battery System */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Battery className="h-5 w-5 text-emerald-600" />
                  Battery Backup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Lithium-ion battery system provides up to 15 hours of cooling without sunlight, ensuring your products stay fresh around the clock.
                </p>
              </CardContent>
            </Card>

            {/* Dual Power */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-emerald-600" />
                  Hybrid Power
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Seamlessly switches between solar and grid power for maximum reliability. Perfect for areas with unstable electricity supply.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Customer Reviews Section (Placeholder) */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-emerald-600" />
                Customer Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Customer reviews will be available soon.</p>
                <p className="text-sm">Be the first to review this product!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
