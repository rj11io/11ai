import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"

import "./globals.css"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://ai.rj11.io"),
  title: {
    default: "11ai · Open source AI agent skills and plugins",
    template: "%s · 11ai",
  },
  description:
    "Playbooks, routines, automations, and long running tasks for building software and more.",
  icons: {
    icon: [
      {
        url: "/static/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/static/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/static/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/static/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: {
      url: "/static/apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png",
    },
  },
  openGraph: {
    title: "11ai · Open source AI agent skills and plugins",
    description:
      "Playbooks, routines, automations, and long running tasks for building software and more.",
    url: "https://ai.rj11.io",
    siteName: "11ai",
    type: "website",
    images: [
      {
        url: "/static/ai-rj11io-web-og.png",
        width: 1200,
        height: 630,
        alt: "11ai · Open source AI agent skills and plugins",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/static/ai-rj11io-web-og.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body>
        <ThemeProvider>
          <div className="flex min-h-svh flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
