'use client'

import { useState, useEffect } from 'react'
import PayGoPlanCalculator from './paygo-plan-calculator'
import { productApi } from '@/lib/api'

export default function PayGoCalculatorTest() {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        console.log('PayGoCalculatorTest: Loading first product')
        const response = await productApi.getProduct(1) // Get first product
        if (response.success) {
          setProduct(response.data)
          console.log('PayGoCalculatorTest: Product loaded:', response.data)
        } else {
          setError('Failed to load product')
        }
      } catch (err) {
        console.error('PayGoCalculatorTest: Error:', err)
        setError(`Error: ${err}`)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [])

  if (loading) {
    return <div className="p-4">Loading PayGo Calculator Test...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>
  }

  if (!product) {
    return <div className="p-4">No product found</div>
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">PayGo Calculator Test</h2>
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold">Product: {product.name}</h3>
        <p>Price: KSh {product.price_ksh}</p>
        <p>Weekly Installment: KSh {product.weekly_installment_ksh}</p>
      </div>
      <PayGoPlanCalculator 
        product={product} 
        onPlanSelect={(plan) => console.log('Plan selected:', plan)}
      />
    </div>
  )
} 