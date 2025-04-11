"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Eye } from "lucide-react"

interface Trade {
  id: string
  tokenSymbol: string
  amount: number
  price: number
  fiatCurrency: string
  counterparty: string
  role: "buyer" | "seller"
  status: "pending" | "completed" | "refunded" | "disputed"
  createdAt: string
}

export function MyTrades() {
  const currentAccount = useCurrentAccount()
  const address = currentAccount?.address
  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!address) return

    const fetchTrades = async () => {
      setIsLoading(true)
      try {
        // This would be a real API call in production
        // Simulating API response
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setTrades([
          {
            id: "trade-1",
            tokenSymbol: "SUI",
            amount: 25,
            price: 1.25,
            fiatCurrency: "USD",
            counterparty: "0xabc...def",
            role: "seller",
            status: "pending",
            createdAt: new Date().toISOString(),
          },
          {
            id: "trade-2",
            tokenSymbol: "USDC",
            amount: 100,
            price: 1.0,
            fiatCurrency: "USD",
            counterparty: "0x123...456",
            role: "buyer",
            status: "completed",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: "trade-3",
            tokenSymbol: "ETH",
            amount: 0.1,
            price: 3000,
            fiatCurrency: "USD",
            counterparty: "0x789...012",
            role: "buyer",
            status: "refunded",
            createdAt: new Date(Date.now() - 172800000).toISOString(),
          },
          {
            id: "trade-4",
            tokenSymbol: "BTC",
            amount: 0.01,
            price: 50000,
            fiatCurrency: "USD",
            counterparty: "0xdef...789",
            role: "seller",
            status: "disputed",
            createdAt: new Date(Date.now() - 259200000).toISOString(),
          },
        ])
      } catch (error) {
        console.error("Failed to fetch trades:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrades()
  }, [address])

  if (!address) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground mb-4">Connect your wallet to view your trades</p>
        <Button onClick={() => window.scrollTo(0, 0)}>Connect Wallet</Button>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="border rounded-md">
          <div className="h-12 px-4 border-b flex items-center">
            <Skeleton className="h-4 w-full" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 px-4 flex items-center">
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Your Trades</h3>
      </div>

      {trades.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">You don't have any trades yet</p>
          <Button asChild>
            <Link href="/">Browse Listings</Link>
          </Button>
        </Card>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell className="font-medium">{trade.tokenSymbol}</TableCell>
                  <TableCell>{trade.amount}</TableCell>
                  <TableCell>
                    {trade.price} {trade.fiatCurrency}
                  </TableCell>
                  <TableCell className="capitalize">{trade.role}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        trade.status === "pending"
                          ? "secondary"
                          : trade.status === "completed"
                            ? "default"
                            : trade.status === "refunded"
                              ? "outline"
                              : "destructive"
                      }
                    >
                      {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(trade.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/listings/${trade.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
