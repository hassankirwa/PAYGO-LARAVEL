"use client"

import Image from "next/image"
import Link from "next/link" // Import Link
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react"
import { products } from "@/lib/products" // Import products from lib

export default function ProductGridWithCTA() {
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    alert('Thank you for your message! We will get back to you soon.')
  }

  return (
    <>
      <section className="py-12 px-4 md:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Our Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-8">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col lg:flex-row">
                <div className="lg:w-1/2">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    width={600}
                    height={400}
                    className="w-full h-64 object-cover lg:h-full"
                  />
                </div>
                <div className="p-6 lg:w-1/2 flex flex-col justify-between bg-emerald-500 text-white">
                  <div>
                    <h3 className="text-2xl font-bold mb-3">{product.name}</h3>
                    {product.descriptionText && <p className="text-sm mb-4">{product.descriptionText}</p>}
                    <p className="text-xl font-semibold mb-1">Price: ${product.priceUSD} USD</p>
                    <p className="text-lg font-medium mb-4">Starting at ${product.weeklyInstallment}/week</p>
                    <div className="space-y-1 text-sm mb-4">
                      <p>💳 PayGo: {product.paygoWarranty} warranty</p>
                      <p>💰 Cash: {product.cashWarranty} warranty</p>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm mb-4">
                      {product.capacity && <li>Capacity: {product.capacity}</li>}
                      {product.powerConsumption && <li>Power Consumption: {product.powerConsumption}</li>}
                      {product.color && <li>Color Available: {product.color}</li>}
                      {product.defrostType && <li>Defrost Type: {product.defrostType}</li>}
                    </ul>
                    {product.features && product.features.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {product.features.map((feature, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-white text-emerald-700 border border-emerald-700"
                          >
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Link href={`/products/${product.id}`} passHref>
                      <Button variant="default" className="bg-black text-white hover:bg-gray-800">
                        Learn More
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="border-white text-white hover:bg-white hover:text-emerald-500 bg-transparent"
                    >
                      Buy Now
                    </Button>
                    <Link href="/login" passHref>
                      <Button variant="default" className="bg-white text-emerald-700 hover:bg-gray-100">
                        Get it with Paygo installments
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact-section" className="py-10 px-4 md:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Get in Touch with <span className="text-emerald-600">KOYO</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Ready to revolutionize your cooling needs? Contact us today for personalized solar refrigeration solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-emerald-800">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Phone className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Phone</p>
                      <a href="tel:+254702627384" className="text-emerald-600 hover:underline">
                        +254 702 627 384
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Mail className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Email</p>
                      <a href="mailto:info@dropaccess.tech" className="text-emerald-600 hover:underline">
                        info@dropaccess.tech
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Location</p>
                      <p className="text-gray-600">
                        Viken Thirty Industrial Park<br />
                        Godown 191, Eastern Bypass<br />
                        Nairobi, Kenya
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Business Hours</p>
                      <p className="text-gray-600">
                        Monday - Friday: 8:00 AM - 6:00 PM EAT<br />
                        Saturday: 9:00 AM - 2:00 PM EAT<br />
                        Sunday: Closed
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <h4 className="font-semibold text-blue-800 mb-1">Sales Inquiries</h4>
                    <p className="text-sm text-blue-600">Get quotes and product information</p>
                  </CardContent>
                </Card>
                <Card className="bg-emerald-50 border-emerald-200">
                  <CardContent className="p-4 text-center">
                    <h4 className="font-semibold text-emerald-800 mb-1">Technical Support</h4>
                    <p className="text-sm text-emerald-600">Installation and maintenance help</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Contact Form */}
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900">Send us a Message</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="John" required />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" required />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="john@example.com" required />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="+254 700 123 456" />
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <select 
                      id="subject" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                      required
                    >
                      <option value="">Select a subject</option>
                      <option value="sales">Product Information & Sales</option>
                      <option value="support">Technical Support</option>
                      <option value="paygo">PayGo Payment Plans</option>
                      <option value="partnership">Partnership Opportunities</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      rows={5} 
                      placeholder="Tell us how we can help you..." 
                      required 
                    />
                  </div>

                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    We typically respond within 24 hours during business days.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  )
}
