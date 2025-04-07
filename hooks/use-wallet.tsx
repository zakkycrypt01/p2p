"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface WalletContextType {
  connect: () => Promise<void>
  disconnect: () => void
  address: string | null
  isConnecting: boolean
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  // Check if wallet was previously connected
  useEffect(() => {
    const savedAddress = localStorage.getItem("walletAddress")
    if (savedAddress) {
      setAddress(savedAddress)
    }
  }, [])

  const connect = async () => {
    setIsConnecting(true)

    try {
      // This would use a real wallet adapter in production
      // Simulating wallet connection
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock address
      const mockAddress = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")

      setAddress(mockAddress)
      localStorage.setItem("walletAddress", mockAddress)
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setAddress(null)
    localStorage.removeItem("walletAddress")
  }

  return (
    <WalletContext.Provider value={{ connect, disconnect, address, isConnecting }}>{children}</WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)

  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }

  return context
}

