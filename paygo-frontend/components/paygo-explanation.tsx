import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, CreditCard, Home, Calendar } from "lucide-react"

export default function PayGoExplanation() {
  return (
    <section className="py-16 px-4 md:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-emerald-100 text-emerald-800 px-4 py-2">PayGo System</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Own Your Solar Fridge with
            <span className="text-emerald-600"> Easy Monthly Payments</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our PayGo system makes solar refrigeration accessible to everyone. Pay in affordable monthly installments
            until you own your appliance completely.
          </p>
        </div>

        {/* How PayGo Works */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">How PayGo Works</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Low Initial Payment</h4>
                  <p className="text-gray-600">
                    Start with a small down payment and begin using your solar fridge immediately.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Flexible Payments</h4>
                  <p className="text-gray-600">
                    Make weekly or monthly payments via M-Pesa or mobile money at your convenience.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Home className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Complete Ownership</h4>
                  <p className="text-gray-600">
                    Once all payments are complete, the appliance is 100% yours with no additional fees.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-8 rounded-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">PayGo Example</h3>
            <Card className="bg-white shadow-lg">
              <CardHeader className="bg-emerald-500 text-white">
                <CardTitle className="text-center">KOYO BC-90DC Fridge</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Price:</span>
                    <span className="text-2xl font-bold text-gray-900">$1,290</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Down Payment:</span>
                    <span className="text-lg font-semibold text-emerald-600">$129 (10%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Weekly Payment:</span>
                    <span className="text-lg font-semibold text-emerald-600">$25</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment Period:</span>
                    <span className="text-lg font-semibold text-gray-900">52 weeks</span>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-center gap-2 text-emerald-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">2 Years Warranty Included</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center p-6 border-emerald-200 hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Credit Checks</h4>
            <p className="text-gray-600">Simple approval process without complex credit requirements.</p>
          </Card>

          <Card className="text-center p-6 border-emerald-200 hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-emerald-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Mobile Payments</h4>
            <p className="text-gray-600">Pay easily using M-Pesa, Airtel Money, or other mobile money services.</p>
          </Card>

          <Card className="text-center p-6 border-emerald-200 hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="h-8 w-8 text-emerald-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Immediate Use</h4>
            <p className="text-gray-600">Start using your solar fridge right away while making payments.</p>
          </Card>
        </div>
      </div>
    </section>
  )
}
