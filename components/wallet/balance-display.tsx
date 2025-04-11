"use client"

import { useCurrentAccount } from "@mysten/dapp-kit"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Coins } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"

interface TokenBalance {
  symbol: string
  icon: string
  balance: number
}

export function BalanceDisplay() {
  const currentAccount = useCurrentAccount()
  const [balances, setBalances] = useState<TokenBalance[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // In a real app, you would use useSuiClientQuery to fetch real balances
  // const { data: balanceData, isLoading } = useSuiClientQuery('getBalance', {
  //   owner: currentAccount?.address,
  // })

  useEffect(() => {
    if (!currentAccount?.address) return

    // Mock data for demonstration
    const fetchBalances = async () => {
      setIsLoading(true)
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setBalances([
          { symbol: "SUI", icon: "/tokens/sui.png", balance: 125.45 },
          { symbol: "USDC", icon: "/tokens/usdc.png", balance: 500.0 },
          { symbol: "ETH", icon: "/tokens/eth.png", balance: 0.5 },
        ])
      } catch (error) {
        console.error("Failed to fetch balances:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalances()
  }, [currentAccount?.address])

  if (!currentAccount?.address) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Coins className="h-4 w-4" />
          <span>Balances</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Token Balances</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="p-2 text-center">
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : balances && balances.length > 0 ? (
          balances.map((token) => (
            <DropdownMenuItem key={token.symbol} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Image
                  src={token.icon || "/placeholder.svg"}
                  alt={token.symbol}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
                <span>{token.symbol}</span>
              </div>
              <span className="font-medium">{token.balance.toFixed(4)}</span>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="p-2 text-center">
            <span className="text-sm text-muted-foreground">No tokens found</span>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
