import ProductGridWithCTA from "../product-grid-with-cta"
import HeroSection from "../components/hero-section"
import PayGoExplanation from "../components/paygo-explanation"
import HowItWorksSteps from "../components/how-it-works-steps"
import PayGoNotificationSystem from "../components/paygo-notification-system"

export default function Page() {
  return (
    <main>
      <HeroSection />
      <PayGoExplanation />
      <HowItWorksSteps />
      <PayGoNotificationSystem />
      <ProductGridWithCTA />
    </main>
  )
}
