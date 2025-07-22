'use client'

import { useState, useEffect } from 'react'
import { productApi } from '@/lib/api'

export default function SimpleProductsTest() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('SimpleProductsTest: Starting API call')
        const response = await productApi.getProducts()
        console.log('SimpleProductsTest: API response:', response)
        
        if (response.success) {
          setProducts(response.data.data)
          console.log('SimpleProductsTest: Products set:', response.data.data.length)
        } else {
          setError('API returned success: false')
        }
      } catch (err) {
        console.error('SimpleProductsTest: API error:', err)
        setError(`Error: ${err}`)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) {
    return <div className="p-4">Loading products...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Simple Products Test</h2>
      <p>Found {products.length} products</p>
      {products.map((product) => (
        <div key={product.id} className="border p-2 mb-2">
          <h3>{product.name}</h3>
          <p>Price: KSh {product.price_ksh}</p>
        </div>
      ))}
    </div>
  )
} 