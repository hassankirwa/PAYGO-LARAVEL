import ProductGridWithCTA from "../product-grid-with-cta"
import HeroSection from "../components/hero-section"
import PayGoExplanation from "../components/paygo-explanation"
import HowItWorksSteps from "../components/how-it-works-steps"
import PayGoNotificationSystem from "../components/paygo-notification-system"
// import SimpleProductsTest from "../components/simple-products-test"
// import PayGoCalculatorTest from "../components/paygo-calculator-test"

export default function Page() {
  return (
    <main>
      <HeroSection />
      <PayGoExplanation />
      <HowItWorksSteps />
      <PayGoNotificationSystem />
      {/* <SimpleProductsTest /> */}
      {/* <PayGoCalculatorTest /> */}
      <ProductGridWithCTA />
    </main>
  )
}
