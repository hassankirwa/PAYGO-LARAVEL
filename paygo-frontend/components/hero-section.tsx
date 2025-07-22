"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sun, Battery, Plug, Bolt, User, LogOut, Settings } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authService, User as AuthUser } from "@/lib/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function HeroSection() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser()
          setUser(currentUser)
        }
      } catch (error) {
        console.log('Not authenticated or auth check failed')
        setUser(null)
      } finally {
        setIsAuthenticating(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogout = async () => {
    try {
      await authService.logout()
      setUser(null)
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact-section')
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const getUserInitials = (user: AuthUser) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    }
    if (user.name) {
      const nameParts = user.name.split(' ')
      return nameParts.length > 1 
        ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
        : nameParts[0][0].toUpperCase()
    }
    return user.email[0].toUpperCase()
  }

  const getUserDisplayName = (user: AuthUser) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user.name || user.email
  }

  const getDashboardLink = () => {
    if (user?.user_type === 'admin') {
      return '/admin/dashboard'
    }
    return '/client/dashboard'
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://image.made-in-china.com/2f0j00YorcJlKjMAqz/Green-Power-High-End-Portable-Acdc-Solar-Chest-Freezer.jpg')",
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Top Navigation with Auth Buttons/Profile */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex gap-6 text-white">
            <Link href="/products" className="hover:text-emerald-400 transition-colors">Products</Link>
            <Link href="/terms-and-conditions" className="hover:text-emerald-400 transition-colors">Terms</Link>
          </div>
          
          {/* Conditional rendering based on authentication */}
          {isAuthenticating ? (
            // Loading state
            <div className="w-20 h-10 bg-white/10 rounded-lg animate-pulse"></div>
          ) : user ? (
            // Authenticated user profile dropdown
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-3 hover:bg-white/10 rounded-lg px-3 py-2 text-white border border-white/20 backdrop-blur-sm"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-sm font-medium">
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium text-white">
                      {getUserDisplayName(user)}
                    </p>
                    <p className="text-xs text-white/70 capitalize">{user.user_type}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href={getDashboardLink()} className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="flex items-center gap-2 cursor-pointer text-red-600 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Not authenticated - show Sign In/Register buttons
            <div className="flex gap-3">
              <Link href="/login">
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white hover:text-gray-900 bg-white/10 backdrop-blur-sm"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 text-center text-white">
        <div className="max-w-4xl mx-auto">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Solar-Powered
            <span className="block text-emerald-400">Refrigeration</span>
            Solutions
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto leading-relaxed">
            Reliable cooling for households, businesses, and agricultural operations. Engineered for areas with unstable
            electricity access.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <Sun className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-medium">Solar Powered</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <Plug className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-medium">AC Power</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <Bolt className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-medium">DC Power</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <Battery className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-medium">15-Hour Standby</span>
            </div>
          </div>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg font-semibold rounded-full"
            >
              Explore Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg font-semibold rounded-full bg-transparent"
              onClick={scrollToContact}
            >
              Contact Us
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 pt-8 border-t border-white/20">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">50L - 508L</p>
              <p className="text-gray-300">Capacity Range</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">2 Years</p>
              <p className="text-gray-300">PayGo Warranty</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">Made in</p>
              <p className="text-gray-300">Kenya</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  )
}
