import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { WebSocketProvider } from "@/providers/web-socket-provider"
import { WalletProvider } from "@/providers/wallet-provider"
import { Navbar } from "@/components/navbar"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "P2P Trading Platform",
  description: "Secure peer-to-peer cryptocurrency trading platform",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <WalletProvider>
            <WebSocketProvider>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1">{children}</main>
                <Toaster />
              </div>
            </WebSocketProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'