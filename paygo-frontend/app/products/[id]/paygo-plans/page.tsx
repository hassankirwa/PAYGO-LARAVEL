'use client'

import { useState, useEffect } from 'react'
import { notFound, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calculator, CreditCard, Calendar } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Product, productApi, formatPrice, formatInstallment, formatKshPrice } from '@/lib/api'
import PayGoPlanCalculator from '@/components/paygo-plan-calculator'

export default function PayGoPlansPage() {
  const params = useParams()
  const id = params?.id as string
  const productId = parseInt(id)
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isNaN(productId)) {
      setError('Invalid product ID')
      setLoading(false)
      return
    }

    const loadProduct = async () => {
      try {
        const response = await productApi.getProduct(productId)
        
        if (!response.success || !response.data) {
          setError('Product not found')
          return
        }

        setProduct(response.data)
      } catch (err) {
        console.error('Error loading product:', err)
        setError('Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [productId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    notFound()
  }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link href={`/products/${productId}`}>
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Product
              </Button>
            </Link>
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* Product Image */}
              <div className="w-full md:w-80 flex-shrink-0">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-white">
                  <Image
                    src={product.images[0] || '/placeholder.svg?height=400&width=400'}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Product Info */}
              <div className="flex-1">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 mb-3">
                  {product.category?.name || 'Product'}
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
                {product.description_text && (
                  <p className="text-lg text-gray-600 mb-6">{product.description_text}</p>
                )}
                
                <div className="bg-emerald-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-emerald-700">{formatKshPrice(product.price_ksh)}</span>
                    <span className="text-gray-600">Full Price</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {product.capacity_litres && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capacity</span>
                      <span className="font-medium">{product.capacity_litres}L</span>
                    </div>
                  )}
                  {product.power_consumption_watts && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Power</span>
                      <span className="font-medium">{product.power_consumption_watts}W</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Color</span>
                    <span className="font-medium">{product.color}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PayGo Plans Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Interactive Calculator */}
            <div>
              <PayGoPlanCalculator 
                product={product}
              />
            </div>

            {/* Quick Plan Options */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Popular Plans</span>
                  </CardTitle>
                  <CardDescription>
                    Pre-configured payment options most customers choose
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Monthly Plan - 12 months */}
                  <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">Monthly - 1 Year</h4>
                        <p className="text-sm text-gray-600">Most popular choice</p>
                      </div>
                      <Badge variant="default">Popular</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-blue-600">
                        {formatKshPrice(product.monthly_installment_ksh || 0)}/month
                      </span>
                      <span className="text-sm text-gray-500">12 payments</span>
                    </div>
                  </div>

                  {/* Weekly Plan - 6 months */}
                  <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">Weekly - 6 Months</h4>
                        <p className="text-sm text-gray-600">Lower installments</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-600">
                        {formatKshPrice(product.weekly_installment_ksh)}/week
                      </span>
                      <span className="text-sm text-gray-500">~26 payments</span>
                    </div>
                  </div>

                  {/* Quarterly Plan - 24 months */}
                  <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">Quarterly - 2 Years</h4>
                        <p className="text-sm text-gray-600">Lowest frequency</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-purple-600">
                        {formatKshPrice((product.monthly_installment_ksh || 0) * 3)}/quarter
                      </span>
                      <span className="text-sm text-gray-500">8 payments</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* PayGo Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle>PayGo Benefits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h5 className="font-medium">No Interest Charges</h5>
                      <p className="text-sm text-gray-600">Pay only the product price - no hidden fees or interest</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h5 className="font-medium">Flexible Down Payment</h5>
                      <p className="text-sm text-gray-600">Choose 10-50% down payment based on your budget</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h5 className="font-medium">IoT Control</h5>
                      <p className="text-sm text-gray-600">Device remains functional as long as payments are current</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h5 className="font-medium">Extended Warranty</h5>
                      <p className="text-sm text-gray-600">24-month warranty with PayGo vs 12-month with cash</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Terms */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Payment Terms</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Grace Period</span>
                    <span>3 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Late Fee</span>
                    <span>5% of installment</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Early Payment Discount</span>
                    <span>2% of remaining balance</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interest Rate</span>
                    <span className="text-green-600 font-medium">0% (No Interest!)</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
} 