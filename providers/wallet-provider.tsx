"use client"

import type React from "react"

import { WalletProvider as InternalWalletProvider } from "@/hooks/use-wallet"

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return <InternalWalletProvider>{children}</InternalWalletProvider>
}

