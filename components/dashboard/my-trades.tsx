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
import {useContract } from "@/hooks/useContract"

export interface Trade {
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

const statusMapping: Record<number, "pending" | "completed" | "refunded" | "disputed"> = {
  0: "pending",
  1: "disputed",
  2: "refunded",
  3: "completed",
};

function mapOrderStatus(status: number): "pending" | "completed" | "refunded" | "disputed" {
  return statusMapping[status] || "pending";
}

export function MyTrades() {
  const currentAccount = useCurrentAccount()
  const address = currentAccount?.address
  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const {getAllOrders, markPaymentMade, getOrdersByBuyer} = useContract()

  useEffect(() => {
    if (!address) return
    const fetchOrders = async () => {
      try {
        const orders = await getOrdersByBuyer(address)
        const tradesData = orders.map((order) => ({
          id: order.id,
          tokenSymbol: order.metadata?.tokenSymbol || "SUI",
          amount: Number(order.tokenAmount) / 1e9,
          price: Number(order.price) / 1e10, 
          fiatCurrency: "USD",
          counterparty: order.seller,
          role: "buyer" as "buyer" | "seller",
          status: mapOrderStatus(order.status),
          createdAt: new Date(order.createdAt).toISOString(),
        }))
        console.log('tradeData :>> ', tradesData);
        setTrades(tradesData)
      } catch (error) {
        console.error("Failed to fetch orders:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchOrders();
  }, [address, getOrdersByBuyer]);

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
                      <Link href={`/orders/${trade.id}`}>
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
