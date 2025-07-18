import type { Metadata } from 'next'
import './globals.css'
import { ComparisonProvider } from '@/lib/comparison'

export const metadata: Metadata = {
  title: 'KOYO PayGo Platform',
  description: 'Solar-powered refrigeration solutions with flexible payment plans',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <ComparisonProvider>
          {children}
        </ComparisonProvider>
      </body>
    </html>
  )
}
