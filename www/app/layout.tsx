import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

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
    default: "11ai — Reusable skills for AI coding agents",
    template: "%s · 11ai",
  },
  description:
    "A catalog of open-source skills your AI coding agent can install and follow: AI chat stacks, agent automation, benchmarks, integrations, cleanup, and more.",
  openGraph: {
    title: "11ai — Reusable skills for AI coding agents",
    description:
      "Open-source playbooks your AI coding agent installs once and follows by name.",
    url: "https://ai.rj11.io",
    siteName: "11ai",
    type: "website",
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
      </body>
    </html>
  )
}
