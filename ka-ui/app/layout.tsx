import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import AppShell from "@/components/layout/app-shell"
import AnimatedFavicon from "@/components/layout/animated-favicon"
import "leaflet/dist/leaflet.css"

export const metadata = {
  title: {
    default: "Karma Aligns",
    template: "%s · Karma Aligns",
  },
  description: "Karma Aligns — Vedic astrology, beautifully aligned.",
  icons: {
    icon: [
      { url: "/karma-wheel.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" }, // fallback if you have one
    ],
    apple: [{ url: "/karma-wheel-192.png" }],
  },
  applicationName: "Karma Aligns",
  manifest: "/manifest.webmanifest",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* animated favicon (can be turned off via env; see component) */}
        <AnimatedFavicon />
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  )
}
