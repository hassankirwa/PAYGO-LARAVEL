"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sun, Battery, Plug, Bolt } from "lucide-react"
import Link from "next/link"

export default function HeroSection() {
  const scrollToContact = () => {
    const contactSection = document.getElementById('contact-section')
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' })
    }
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

      {/* Top Navigation with Auth Buttons */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="container mx-auto flex justify-end">
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
