"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authService, User as AuthUser } from "@/lib/auth"
import { ClientReceiptsTable } from "@/components/client-receipts-table"

export default function ClientReceiptsPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Client Receipts: Starting auth check...')
      
      try {
        // Check if user is authenticated
        const isAuth = authService.isAuthenticated()
        console.log('🔐 Is authenticated:', isAuth)
        
        if (!isAuth) {
          console.log('❌ Not authenticated, redirecting to login...')
          router.push("/login")
          return
        }

        // Check if user type is client
        const userType = authService.getUserType()
        console.log('👤 User type:', userType)
        
        if (userType !== "client") {
          console.log('❌ Wrong user type, redirecting to login...')
          router.push("/login")
          return
        }

        // Get current user data
        console.log('📡 Fetching current user data...')
        const currentUser = await authService.getCurrentUser()
        
        if (!currentUser) {
          console.log('❌ No current user, redirecting to login...')
          router.push("/login")
          return
        }

        console.log('✅ User authenticated successfully:', currentUser)
        setUser(currentUser)
      } catch (error) {
        console.error("❌ Authentication error:", error)
        router.push("/login")
      } finally {
        console.log('🏁 Auth check complete, setting loading to false')
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your receipts...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment Receipts</h1>
          <p className="mt-2 text-gray-600">
            View and download all your payment receipts and transaction history.
          </p>
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
            <span>Welcome back, {user.first_name}!</span>
            <span>•</span>
            <span>Account: {user.email}</span>
          </div>
        </div>

        {/* Client Receipts Table */}
        <ClientReceiptsTable />
      </div>
    </div>
  )
} 