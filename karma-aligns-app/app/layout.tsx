
export const dynamic = "force-static";

import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Karma Aligns",
  description: "Balance your karma and align your life.",
  icons: { icon: "/favicon/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts for Maharlika (headings) + Inter (body) */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Maharlika&family=Inter:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh font-body antialiased">
        {children}
      </body>
    </html>
  );
}
