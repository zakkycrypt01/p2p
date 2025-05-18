"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSuiWallet } from "@/hooks/use-sui-wallet"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, ArrowUpDown, Eye, ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"
import { useContract } from "@/hooks/useContract"

interface Order {
  id: string
  tradeId: string
  tokenSymbol: string
  amount: bigint | number
  price: bigint | number
  fiatCurrency: string
  counterpartyAddress: string
  orderType: "buy" | "sell"
  status: "pending_payment" | "payment_sent" | "payment_confirmed" | "completed" | "cancelled" | "disputed"
  createdAt: number | string
  updatedAt: number | string
}

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

export default function MerchantOrdersPage() {
  const { address } = useSuiWallet()
  const { getAllOrders, getOrdersBySeller, getSaleOrdersByBuyer } = useContract()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const mapStatus = (status: number): Order["status"] => {
    const statusMap: { [key: number]: Order["status"] } = {
      0: "pending_payment",
      1: "payment_sent",
      2: "payment_confirmed",
      3: "completed",
      4: "cancelled",
      5: "disputed",
    }
    return statusMap[status] || "pending_payment"
  }

  useEffect(() => {
    if (!address) {
      router.push("/")
      return
    }

    const loadOrders = async () => {
      try {
        const sellerOrders = await getOrdersBySeller(address)
        const buyerSaleOrders = await getSaleOrdersByBuyer(address)
        const merged = [...sellerOrders, ...buyerSaleOrders]
        const fetched = Array.from(
          new Map(merged.map((o: any) => [o.id, o])).values()
        )

        console.log("Fetched orders:", fetched)

        const uiOrders: Order[] = fetched.map((o: any) => ({
          id: o.id,
          tradeId: o.listingId,
          tokenSymbol: "SUI",
          amount: o.tokenAmount,
          price: o.price,
          fiatCurrency: "USD",
          counterpartyAddress: o.seller === address ? o.buyer : o.seller,
          orderType: o.seller === address ? "sell" : "buy",
          status: mapStatus(Number(o.status)),
          createdAt: Number(o.createdAt) * 1000,
          updatedAt: Number(o.updatedAt) * 1000,
        }))

        uiOrders.sort((a, b) => {
          const dateA = typeof a.createdAt === "number"
            ? a.createdAt
            : new Date(a.createdAt).getTime()
          const dateB = typeof b.createdAt === "number"
            ? b.createdAt
            : new Date(b.createdAt).getTime()
          return dateB - dateA
        })

        setOrders(uiOrders)
        setFilteredOrders(uiOrders)
      } catch (error) {
        console.error("Error loading orders:", error)
      }
    }

    loadOrders()
  }, [address, router, getOrdersBySeller, getSaleOrdersByBuyer])

  useEffect(() => {
    let filtered = orders
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.tokenSymbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.counterpartyAddress.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    if (activeTab !== "all") {
      if (activeTab === "buy") {
        filtered = filtered.filter((order) => order.orderType === "buy")
      } else if (activeTab === "sell") {
        filtered = filtered.filter((order) => order.orderType === "sell")
      } else {
        filtered = filtered.filter((order) => order.status === activeTab)
      }
    }

    // Maintain sorting by creation date (newest first)
    filtered.sort((a, b) => {
      const dateA = typeof a.createdAt === "number" ? a.createdAt : new Date(a.createdAt).getTime()
      const dateB = typeof b.createdAt === "number" ? b.createdAt : new Date(b.createdAt).getTime()
      return dateB - dateA
    })

    setFilteredOrders(filtered)
  }, [orders, searchTerm, activeTab])

  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp)
    return date.toLocaleString()
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
                      <TableCell>{formatTokenAmount(order.amount)}</TableCell>
                      <TableCell>
                        {formatPrice(order.price)} {order.fiatCurrency}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/merchant/order/${order.id}`}>
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
