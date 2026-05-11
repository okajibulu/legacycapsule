import type { Metadata, Viewport } from "next"
import { Toaster } from "@/components/ui/sonner"
import NavigationWrapper from "@/components/layout/NavigationWrapper"
import FooterWrapper from "@/components/layout/FooterWrapper"
import "./globals.css"

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: "LegacyCapsule — Every Event. Preserved.",
  description: "Capture every voice and moment of your event — in one beautiful digital Capsule.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600&family=Cormorant+SC:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <NavigationWrapper />
        {children}
        <FooterWrapper />
        <Toaster />
      </body>
    </html>
  )
}