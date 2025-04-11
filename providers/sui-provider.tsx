"use client"

import type React from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit"
import "@mysten/dapp-kit/dist/index.css"

// Define network configuration
const networkConfig = {
  devnet: {
    url: "https://fullnode.devnet.sui.io",
  },
  testnet: {
    url: "https://fullnode.testnet.sui.io",
  },
  mainnet: {
    url: "https://fullnode.mainnet.sui.io",
  },
}

const queryClient = new QueryClient()

export function SuiProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="devnet">
        <WalletProvider autoConnect={true}>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}
