// app/layout.tsx
import type { Metadata } from "next"
import "./globals.css"
import "leaflet/dist/leaflet.css"

import { Inter, Cormorant_Garamond } from "next/font/google"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { ChartProvider } from "@/components/providers/chart-provider"
import AppShell from "@/components/layout/app-shell"
import AnimatedFavicon from "@/components/layout/animated-favicon"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
})

export const metadata: Metadata = {
  title: {
    default: "Karma Aligns",
    template: "%s · Karma Aligns",
  },
  description: "Karma Aligns — Vedic astrology, beautifully aligned.",
  applicationName: "Karma Aligns",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/karma-wheel.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/karma-wheel-192.png" }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${cormorant.variable} font-sans`}>
        {/* Rotating favicon for brand “spark” (safe to remove if not desired) */}
        <AnimatedFavicon />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ChartProvider>
            <AppShell>{children}</AppShell>
          </ChartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
