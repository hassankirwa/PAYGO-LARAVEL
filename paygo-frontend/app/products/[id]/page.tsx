import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductCarousel } from "@/components/product-carousel"
import { getProductById } from "@/lib/products"
import { Battery, Zap, Shield, Wrench, Sun, Home } from "lucide-react"
import HowItWorksSteps from "@/components/how-it-works-steps"

interface ProductPageProps {
  params: {
    id: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const productId = Number.parseInt(params.id)
  const product = getProductById(productId)

  if (!product) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{product.name}</h1>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {product.features.slice(0, 4).map((feature, idx) => (
                <Badge key={idx} variant="secondary" className="bg-emerald-100 text-emerald-800 px-3 py-1">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Left Column - Images */}
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <CardContent className="p-6">
                  <ProductCarousel images={product.images} />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Pricing & Actions */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader className="bg-emerald-500 text-white">
                  <CardTitle className="text-2xl">Pricing & Purchase</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-4xl font-bold text-emerald-700 mb-2">${product.priceUSD}</p>
                    <p className="text-lg text-gray-600">or starting at</p>
                    <p className="text-2xl font-semibold text-emerald-600">${product.weeklyInstallment}/week</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                      <span className="text-2xl">💳</span>
                      <div>
                        <p className="font-semibold">PayGo Plan</p>
                        <p className="text-sm text-gray-600">{product.paygoWarranty} warranty</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-2xl">💰</span>
                      <div>
                        <p className="font-semibold">Cash Purchase</p>
                        <p className="text-sm text-gray-600">{product.cashWarranty} warranty</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg">
                      Get it with PayGo
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50 py-3 text-lg bg-transparent"
                    >
                      Buy Now (Cash)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Product Information Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-emerald-600" />
                  Product Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  The {product.name.split(",")[0]} is a solar-powered refrigeration solution designed to cater to the
                  diverse needs of households, small businesses, and agricultural operations.
                </p>
              </CardContent>
            </Card>

            {/* Solar Technology */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-emerald-600" />
                  Solar Technology
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  Operates primarily on solar energy, reducing reliance on conventional power sources and lowering
                  energy costs. Engineered for reliable cooling in areas with unstable electricity access.
                </p>
              </CardContent>
            </Card>

            {/* Battery System */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Battery className="h-5 w-5 text-emerald-600" />
                  Advanced Battery System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  Includes a robust battery system capable of storing energy for up to 15 hours, ensuring uninterrupted
                  cooling even during cloudy periods or at night.
                </p>
              </CardContent>
            </Card>

            {/* Dual Power */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-emerald-600" />
                  Dual Power Capability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  For added flexibility, can also be powered by electricity, making it suitable for use in areas with
                  intermittent power supply. This dual capability ensures consistent performance.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Specifications */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-emerald-600" />
                Technical Specifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {product.capacity && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600">{product.capacity}</p>
                    <p className="text-sm text-gray-600">Capacity</p>
                  </div>
                )}
                {product.powerConsumption && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600">{product.powerConsumption}</p>
                    <p className="text-sm text-gray-600">Power Consumption</p>
                  </div>
                )}
                {product.color && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600">{product.color}</p>
                    <p className="text-sm text-gray-600">Color Available</p>
                  </div>
                )}
                {product.defrostType && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600">{product.defrostType}</p>
                    <p className="text-sm text-gray-600">Defrost Type</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Durability & Performance */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                Durability & Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed mb-4">
                Constructed with high-quality materials and advanced cooling technology, the{" "}
                {product.name.split(",")[0]} is built to withstand harsh conditions and provide long-term reliability.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Its performance ensures that perishable items remain fresh and safe, contributing to improved food
                security and quality. This transforms communities by providing reliable refrigeration where conventional
                electricity is unreliable or absent.
              </p>
            </CardContent>
          </Card>

          {/* How It Works Section */}
          <div className="mb-12">
            <HowItWorksSteps />
          </div>

          {/* Contact Information */}
          <Card className="bg-emerald-50 border-emerald-200 mb-12">
            <CardHeader>
              <CardTitle className="text-emerald-800">Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-emerald-700">
                <div>
                  <p className="font-semibold mb-3">Made in Kenya</p>
                  <p className="mb-2">
                    Phone:{" "}
                    <a href="tel:+254702627384" className="hover:underline font-medium">
                      +254 702 627 384
                    </a>
                  </p>
                  <p className="mb-2">
                    Email:{" "}
                    <a href="mailto:info@dropaccess.tech" className="hover:underline font-medium">
                      info@dropaccess.tech
                    </a>
                  </p>
                  <p className="mb-2">
                    Website:{" "}
                    <a
                      href="https://www.dropaccess.tech"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline font-medium"
                    >
                      www.dropaccess.tech
                    </a>
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-3">Location</p>
                  <p className="mb-1">Viken Thirty Industrial Park</p>
                  <p className="mb-1">Godown 191, Eastern Bypass</p>
                  <p className="mb-1">Nairobi, Kenya</p>
                  <p className="mt-3 text-xs text-emerald-600">
                    Business Hours: Mon-Fri 8:00 AM - 6:00 PM EAT
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Support Information */}
          <Card className="bg-blue-50 border-blue-200 mb-16">
            <CardHeader>
              <CardTitle className="text-blue-800">Customer Support & Warranty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-700">
                <div>
                  <p className="font-semibold mb-3">PayGo Support</p>
                  <p className="mb-2">24/7 Payment assistance</p>
                  <p className="mb-2">SMS notifications for payment reminders</p>
                  <p className="mb-2">Instant device reactivation</p>
                  <p className="mb-2">Mobile money integration support</p>
                </div>
                <div>
                  <p className="font-semibold mb-3">Technical Support</p>
                  <p className="mb-2">Installation guidance</p>
                  <p className="mb-2">Maintenance tips and support</p>
                  <p className="mb-2">Troubleshooting assistance</p>
                  <p className="mb-2">Warranty claim processing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
