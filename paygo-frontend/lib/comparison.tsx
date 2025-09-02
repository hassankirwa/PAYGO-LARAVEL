"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Product } from './api'

interface ComparisonContextType {
  comparedProducts: Product[]
  addToComparison: (product: Product) => void
  removeFromComparison: (productId: number) => void
  clearComparison: () => void
  isInComparison: (productId: number) => boolean
  canAddMore: boolean
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined)

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [comparedProducts, setComparedProducts] = useState<Product[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('koyo-comparison')
    if (saved) {
      try {
        setComparedProducts(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load comparison from localStorage:', error)
      }
    }
  }, [])

  // Save to localStorage whenever comparison changes
  useEffect(() => {
    localStorage.setItem('koyo-comparison', JSON.stringify(comparedProducts))
  }, [comparedProducts])

  const addToComparison = (product: Product) => {
    setComparedProducts(prev => {
      // Don't add if already in comparison
      if (prev.some(p => p.id === product.id)) return prev
      
      // Only allow up to 3 products
      if (prev.length >= 3) return prev
      
      return [...prev, product]
    })
  }

  const removeFromComparison = (productId: number) => {
    setComparedProducts(prev => prev.filter(p => p.id !== productId))
  }

  const clearComparison = () => {
    setComparedProducts([])
  }

  const isInComparison = (productId: number) => {
    return comparedProducts.some(p => p.id === productId)
  }

  const canAddMore = comparedProducts.length < 3

  const value: ComparisonContextType = {
    comparedProducts,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
    canAddMore,
  }

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  )
}

export function useComparison() {
  const context = useContext(ComparisonContext)
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider')
  }
  return context
} 