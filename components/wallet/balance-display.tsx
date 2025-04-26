"use client"

import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit"
import { useEffect } from "react"
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

type TokenBalance = {
  symbol: string;
  icon: string;
  balance: number;
};

export function BalanceDisplay() {
  const currentAccount = useCurrentAccount()
  const { data: balanceData, isLoading } = useSuiClientQuery("getBalance", {
    owner: currentAccount?.address ?? "",
  })

  if (!currentAccount?.address) return null
  const rawBalances = balanceData
    ? Array.isArray(balanceData)
      ? balanceData
      : [balanceData]
    : []

  const balances: TokenBalance[] =
    rawBalances.map((b: any) => ({
      symbol: b.coinType.split("::").pop() ?? b.coinType,
      icon: b.iconUrl ?? `/tokens/${b.coinType
        .split("::")
        .pop()
        ?.toLowerCase()}.png`,
      balance: Number(b.totalBalance) / 1e9, 
    })) || []

  useEffect(() => {
    if (!isLoading && balances.length === 0) {
      console.log("No tokens found, raw balanceData:", balanceData)
    }
  }, [isLoading, balances, balanceData])

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
            <span className="text-sm text-muted-foreground">
              Loading...
            </span>
          </div>
        ) : balances.length > 0 ? (
          balances.map((token) => (
            <DropdownMenuItem
              key={token.symbol}
              className="flex justify-between items-center"
            >
              <div className="flex items-center gap-2">
                <Image
                  src={token.icon}
                  alt={token.symbol}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
                <span>{token.symbol}</span>
              </div>
              <span className="font-medium">
                {token.balance.toFixed(4)}
              </span>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="p-2 text-center">
            <span className="text-sm text-muted-foreground">
              No tokens found
            </span>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
