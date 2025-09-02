"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Scale, 
  X, 
  CheckCircle, 
  Home,
  Zap,
  Battery,
  Shield,
  DollarSign,
  Calendar
} from 'lucide-react'
import { useComparison } from '@/lib/comparison'
import { Product } from '@/lib/api'

export default function ComparePage() {
  const { comparedProducts, removeFromComparison, clearComparison } = useComparison()

  if (comparedProducts.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Scale className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Products to Compare</h1>
          <p className="text-gray-600 mb-6">
            Add products to comparison from the product catalog to see them side by side.
          </p>
          <Link href="/">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse Products
            </Button>
          </Link>
        </div>
      </main>
    )
  }

  if (comparedProducts.length === 1) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Scale className="h-16 w-16 text-emerald-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Add More Products</h1>
          <p className="text-gray-600 mb-6">
            You need at least 2 products to compare. Add more products from the catalog.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Add More Products
              </Button>
            </Link>
            <Button 
              variant="outline"
              onClick={() => clearComparison()}
            >
              Clear Comparison
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const getComparisonValue = (product: Product, field: keyof Product) => {
    const value = product[field]
    if (value === null || value === undefined) return 'N/A'
    return value
  }

  const highlightDifferences = (products: Product[], field: keyof Product, index: number) => {
    const values = products.map(p => getComparisonValue(p, field))
    const uniqueValues = [...new Set(values)]
    
    // If all values are the same, don't highlight
    if (uniqueValues.length === 1) return ''
    
    // Highlight differences
    return 'bg-yellow-50 border-yellow-200'
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Products
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Product Comparison</h1>
                <p className="text-gray-600">Compare {comparedProducts.length} products side by side</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                if (confirm('Clear all comparisons?')) {
                  clearComparison()
                }
              }}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Clear All
            </Button>
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-6 font-semibold text-gray-900 w-48">Product</th>
                    {comparedProducts.map((product) => (
                      <th key={product.id} className="text-center p-6 min-w-80">
                        <div className="relative">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromComparison(product.id)}
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                width={300}
                                height={200}
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-gray-400">
                                <Home className="h-12 w-12" />
                              </div>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg text-gray-900 mb-2">{product.name}</h3>
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                            {product.category}
                          </Badge>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Price */}
                  <tr className="border-b">
                    <td className="p-6 font-medium text-gray-900 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        Price
                      </div>
                    </td>
                    {comparedProducts.map((product, index) => (
                      <td key={product.id} className={`p-6 text-center ${highlightDifferences(comparedProducts, 'price', index)}`}>
                        <div className="font-bold text-2xl text-emerald-700">
                          {formatPrice(product.price)}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Capacity */}
                  <tr className="border-b">
                    <td className="p-6 font-medium text-gray-900 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-emerald-600" />
                        Capacity
                      </div>
                    </td>
                    {comparedProducts.map((product, index) => (
                      <td key={product.id} className={`p-6 text-center ${highlightDifferences(comparedProducts, 'capacity', index)}`}>
                        <span className="font-semibold text-lg">
                          {product.capacity || 'N/A'}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Color */}
                  <tr className="border-b">
                    <td className="p-6 font-medium text-gray-900 bg-gray-50">Color</td>
                    {comparedProducts.map((product, index) => (
                      <td key={product.id} className={`p-6 text-center ${highlightDifferences(comparedProducts, 'color', index)}`}>
                        <span className="font-medium">{product.color}</span>
                      </td>
                    ))}
                  </tr>

                  {/* Power Consumption */}
                  <tr className="border-b">
                    <td className="p-6 font-medium text-gray-900 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-emerald-600" />
                        Power Consumption
                      </div>
                    </td>
                    {comparedProducts.map((product, index) => (
                      <td key={product.id} className={`p-6 text-center ${highlightDifferences(comparedProducts, 'powerConsumption', index)}`}>
                        <span className="font-medium">{product.powerConsumption || 'N/A'}</span>
                      </td>
                    ))}
                  </tr>

                  {/* PayGo Plans */}
                  <tr className="border-b bg-blue-50">
                    <td className="p-6 font-medium text-blue-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        PayGo Plans
                      </div>
                    </td>
                    {comparedProducts.map((product) => (
                      <td key={product.id} className="p-6 text-center">
                        <div className="space-y-2">
                          <div className="text-sm text-blue-700">
                            <span className="font-semibold">Weekly:</span> {formatPrice(product.weeklyInstallment)}
                          </div>
                          <div className="text-sm text-blue-700">
                            <span className="font-semibold">Monthly:</span> {formatPrice(product.monthlyInstallment)}
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Features */}
                  <tr className="border-b">
                    <td className="p-6 font-medium text-gray-900 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        Features
                      </div>
                    </td>
                    {comparedProducts.map((product) => (
                      <td key={product.id} className="p-6">
                        <div className="space-y-2">
                          {Array.isArray(product.features) && product.features.slice(0, 5).map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                              <span className="text-gray-700">{feature}</span>
                            </div>
                          ))}
                          {Array.isArray(product.features) && product.features.length > 5 && (
                            <div className="text-xs text-gray-500">
                              +{product.features.length - 5} more features
                            </div>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Actions */}
                  <tr>
                    <td className="p-6 font-medium text-gray-900 bg-gray-50">Actions</td>
                    {comparedProducts.map((product) => (
                      <td key={product.id} className="p-6">
                        <div className="space-y-3">
                          <Link href={`/products/${product.id}`}>
                            <Button variant="outline" className="w-full">
                              View Details
                            </Button>
                          </Link>
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                            Start PayGo Plan
                          </Button>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Comparison Notes */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-emerald-600" />
                  Warranty
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  All KOYO products come with a comprehensive 2-year warranty including parts, labor, and technical support.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Battery className="h-5 w-5 text-emerald-600" />
                  Solar Power
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Every product includes advanced solar technology with battery backup for up to 15 hours of operation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  PayGo Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Flexible payment plans with no interest, free installation, and 24/7 customer support included.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
} 