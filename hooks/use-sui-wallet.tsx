"use client"

import { useCurrentAccount, useSignAndExecuteTransaction, useConnectWallet, useSuiClient } from "@mysten/dapp-kit"
import { useState, useEffect } from "react"

export function useSuiWallet() {
  const currentAccount = useCurrentAccount()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const { mutate: connect } = useConnectWallet()
  const client = useSuiClient()
  const [balance, setBalance] = useState<
    | {
        symbol: string
        icon: string
        balance: number
      }[]
    | null
  >(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)

  // Fetch balances when address changes
  useEffect(() => {
    if (!currentAccount?.address) return

    const fetchBalances = async () => {
      setIsLoadingBalance(true)
      try {
        // In a real app, you would fetch actual balances from the Sui blockchain
        // For now, we'll use mock data
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setBalance([
          { symbol: "SUI", icon: "/tokens/sui.png", balance: 125.45 },
          { symbol: "USDC", icon: "/tokens/usdc.png", balance: 500.0 },
          { symbol: "ETH", icon: "/tokens/eth.png", balance: 0.5 },
        ])
      } catch (error) {
        console.error("Failed to fetch balances:", error)
      } finally {
        setIsLoadingBalance(false)
      }
    }

    fetchBalances()
  }, [currentAccount?.address])

  return {
    address: currentAccount?.address || null,
    // isConnecting is not defined, so it is removed
    balance,
    isLoadingBalance,
    connect,
    // disconnect is not defined, so it is removed
    signAndExecute,
    client,
  }
}
