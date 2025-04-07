"use client"

import { useEffect, useState } from "react"
import { useWallet } from "@/hooks/use-wallet"
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

interface TokenBalance {
  symbol: string
  icon: string
  balance: number
}

export function BalanceDisplay() {
  const { address } = useWallet()
  const [balances, setBalances] = useState<TokenBalance[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!address) return

    const fetchBalances = async () => {
      setIsLoading(true)
      try {
        // This would be a real API call in production
        // Simulating API response
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
  }, [address])

  if (!address) return null

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
        ) : balances.length > 0 ? (
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

