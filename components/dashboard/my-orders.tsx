"use client"

import { useState } from "react"
import Link from "next/link"
import { useSuiWallet } from "@/hooks/use-sui-wallet"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Eye, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useOrders } from "@/hooks/use-orders"

export function MyOrders() {
  const { address } = useSuiWallet()
  const { orders, isLoading } = useOrders()
  const [activeTab, setActiveTab] = useState("all")

  // Filter orders based on active tab
  const filteredOrders = activeTab === "all" ? orders : orders.filter((order) => order.status === activeTab)

  if (!address) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground mb-4">Connect your wallet to view your orders</p>
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
        <h3 className="text-lg font-medium">Your Orders</h3>
        <div className="flex gap-2">
          <Button variant={activeTab === "all" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("all")}>
            All
          </Button>
          <Button
            variant={activeTab === "pending_payment" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("pending_payment")}
          >
            Pending
          </Button>
          <Button
            variant={activeTab === "payment_sent" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("payment_sent")}
          >
            Payment Sent
          </Button>
          <Button
            variant={activeTab === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("completed")}
          >
            Completed
          </Button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">You don't have any orders yet</p>
          <Button asChild>
            <Link href="/listings">Browse Listings</Link>
          </Button>
        </Card>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id.substring(0, 8)}</TableCell>
                  <TableCell>{order.tokenSymbol}</TableCell>
                  <TableCell>{order.amount}</TableCell>
                  <TableCell>
                    {(order.amount * order.price).toFixed(2)} {order.fiatCurrency}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={order.orderType === "buy" ? "secondary" : "default"}
                      className="flex items-center gap-1 w-fit"
                    >
                      {order.orderType === "buy" ? (
                        <>
                          <ArrowDownRight className="h-3 w-3" />
                          Buy
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="h-3 w-3" />
                          Sell
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.status === "pending_payment"
                          ? "outline"
                          : order.status === "payment_sent"
                            ? "secondary"
                            : order.status === "completed"
                              ? "default"
                              : "destructive"
                      }
                    >
                      {order.status
                        .split("_")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/orders/${order.id}`}>
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
