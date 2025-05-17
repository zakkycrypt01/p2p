"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSuiWallet } from "@/hooks/use-sui-wallet"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Eye, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useOrders } from "@/hooks/use-orders"
import { useContract } from "@/hooks/useContract"

// Helper functions for formatting
const formatTokenAmount = (amount: bigint | number): string => {
  if (typeof amount === "bigint") {
    return (Number(amount) / 1000000000).toString()
  }
  return (Number(amount) / 1000000000).toString()
}

const formatPrice = (price: bigint | number): string => {
  if (typeof price === "bigint") {
    return (Number(price) / 100000000000).toFixed(2)
  }
  return (Number(price) / 100000000000).toFixed(2)
}

// Map numeric status to string status
const mapStatus = (status: number): string => {
  const statusMap: { [key: number]: string } = {
    0: "pending_payment",
    1: "payment_sent",
    2: "payment_confirmed",
    3: "completed",
    4: "cancelled",
    5: "disputed",
  }
  return statusMap[status] || "pending_payment"
}

export function MyOrders() {
  const { address } = useSuiWallet()
  const { getOrdersByBuyer } = useContract()
  const { getOrder } = useOrders()
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  // Fetch orders when component mounts
  useEffect(() => {
    const fetchOrders = async () => {
      if (!address) return

      setIsLoading(true)
      try {
        const fetchedOrders = (await getOrdersByBuyer(address)) || []

        const transformedOrders = fetchedOrders.map((order: any) => ({
          id: order.id,
          tokenSymbol: "SUI",
          amount: order.tokenAmount,
          price: order.price,
          fiatCurrency: "USD",
          orderType: order.seller === address ? "sell" : "buy",
          status: mapStatus(Number(order.status)),
          createdAt: Number(order.createdAt) * 1000, // Convert to milliseconds
          expiresAt: Number(order.expiry) * 1000, // Convert to milliseconds
          paymentMethods: order.metadata?.paymentMethods?.split(",") || ["bank_transfer"],
          selectedPaymentMethod: null,
          merchantAddress: order.seller,
          merchantRating: 4.8, // Default rating
          buyerAddress: order.buyer,
          paymentWindow: Math.floor((Number(order.expiry) - Number(order.createdAt)) / 60), // Convert seconds to minutes
          paymentDetails: {
            bank_transfer: {
              accountName: "Merchant Bank Account",
              accountNumber: "1234567890",
              bankName: "Chase Bank",
              instructions: "Please include the order ID in the payment reference",
            },
            paypal: {
              accountName: "merchant@example.com",
              instructions: "Send as Friends & Family to avoid fees",
            },
            revolut: {
              accountName: "merchant@revolut.com",
              instructions: "Send to this Revolut account",
            },
          },
        }))

        // Sort orders by creation date (newest first)
        const sortedOrders = transformedOrders.sort((a: any, b: any) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })

        setOrders(sortedOrders)
      } catch (error) {
        console.error("Error fetching orders:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [address, getOrdersByBuyer])

  // always an array
  const filteredOrders: typeof orders = Array.isArray(orders)
    ? activeTab === "all"
      ? orders
      : orders.filter((order) => order.status === activeTab)
    : []

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
                  <TableCell>{formatTokenAmount(order.amount)}</TableCell>
                  <TableCell>
                    {(Number(formatTokenAmount(order.amount)) * Number(formatPrice(order.price))).toFixed(2)}{" "}
                    {order.fiatCurrency}
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
                        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
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
