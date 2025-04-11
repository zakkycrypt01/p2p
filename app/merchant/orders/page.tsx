"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, ArrowUpDown, Eye, ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"

interface Order {
  id: string
  tradeId: string
  tokenSymbol: string
  amount: number
  price: number
  fiatCurrency: string
  counterpartyAddress: string
  orderType: "buy" | "sell"
  status: "pending_payment" | "payment_sent" | "payment_confirmed" | "completed" | "cancelled" | "disputed"
  createdAt: string
  updatedAt: string
}

export default function MerchantOrdersPage() {
  const currentAccount = useCurrentAccount()
  const address = currentAccount?.address
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (!address) {
      router.push("/")
      return
    }

    // Mock orders - in a real app, this would fetch from an API
    const mockOrders: Order[] = [
      {
        id: "order-1",
        tradeId: "trade-1",
        tokenSymbol: "SUI",
        amount: 10,
        price: 1.25,
        fiatCurrency: "USD",
        counterpartyAddress: "0xabc...def",
        orderType: "buy", // Merchant buys
        status: "pending_payment",
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: "order-2",
        tradeId: "trade-2",
        tokenSymbol: "USDC",
        amount: 100,
        price: 1.0,
        fiatCurrency: "USD",
        counterpartyAddress: "0x123...456",
        orderType: "sell", // Merchant sells
        status: "payment_sent",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: "order-3",
        tradeId: "trade-3",
        tokenSymbol: "ETH",
        amount: 0.5,
        price: 3000,
        fiatCurrency: "USD",
        counterpartyAddress: "0x789...012",
        orderType: "buy", // Merchant buys
        status: "payment_confirmed",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        id: "order-4",
        tradeId: "trade-4",
        tokenSymbol: "BTC",
        amount: 0.01,
        price: 50000,
        fiatCurrency: "USD",
        counterpartyAddress: "0xdef...789",
        orderType: "sell", // Merchant sells
        status: "completed",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
      },
      {
        id: "order-5",
        tradeId: "trade-5",
        tokenSymbol: "SUI",
        amount: 50,
        price: 1.3,
        fiatCurrency: "USD",
        counterpartyAddress: "0xabc...123",
        orderType: "buy", // Merchant buys
        status: "cancelled",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 36 hours ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 35).toISOString(),
      },
      {
        id: "order-6",
        tradeId: "trade-6",
        tokenSymbol: "ETH",
        amount: 0.2,
        price: 3100,
        fiatCurrency: "USD",
        counterpartyAddress: "0x456...789",
        orderType: "sell", // Merchant sells
        status: "disputed",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      },
    ]

    setOrders(mockOrders)
    setFilteredOrders(mockOrders)
  }, [address, router])

  useEffect(() => {
    // Filter orders based on search term and active tab
    let filtered = orders

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.tokenSymbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.counterpartyAddress.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply tab filter
    if (activeTab !== "all") {
      if (activeTab === "buy") {
        filtered = filtered.filter((order) => order.orderType === "buy")
      } else if (activeTab === "sell") {
        filtered = filtered.filter((order) => order.orderType === "sell")
      } else {
        filtered = filtered.filter((order) => order.status === activeTab)
      }
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, activeTab])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_payment":
        return <Badge variant="outline">Pending Payment</Badge>
      case "payment_sent":
        return <Badge variant="secondary">Payment Sent</Badge>
      case "payment_confirmed":
        return <Badge variant="secondary">Payment Confirmed</Badge>
      case "completed":
        return <Badge variant="default">Completed</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      case "disputed":
        return <Badge variant="destructive">Disputed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!address) return null

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Manage Orders</h1>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search orders..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="buy">Buy Orders</TabsTrigger>
          <TabsTrigger value="sell">Sell Orders</TabsTrigger>
          <TabsTrigger value="pending_payment">Pending</TabsTrigger>
          <TabsTrigger value="payment_sent">Payment Sent</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {filteredOrders.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Order ID</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Type
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id.substring(0, 8)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={order.orderType === "buy" ? "default" : "secondary"}
                          className="flex items-center gap-1 w-fit"
                        >
                          {order.orderType === "buy" ? (
                            <>
                              <ArrowUpRight className="h-3 w-3" />
                              Buy
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="h-3 w-3" />
                              Sell
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.tokenSymbol}</TableCell>
                      <TableCell>{order.amount}</TableCell>
                      <TableCell>
                        {order.price} {order.fiatCurrency}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/merchant/orders/${order.id}`}>
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
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">No orders found</p>
                <Button asChild>
                  <Link href="/listings">Browse Listings</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
