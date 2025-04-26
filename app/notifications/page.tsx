"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, CreditCard, CheckCircle, XCircle, Bell, AlertCircle } from "lucide-react"
import type { Notification } from "@/components/notifications/notification-dropdown"

export default function NotificationsPage() {
  const currentAccount = useCurrentAccount()
  const address = currentAccount?.address
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (!address) {
      router.push("/")
      return
    }

    // Mock notifications - in a real app, this would fetch from an API
    const mockNotifications: Notification[] = [
      {
        id: "1",
        type: "order_initiated",
        title: "New Order Initiated",
        message: "A user has initiated an order for 10 SUI at 1.25 USD",
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        read: false,
        actionUrl: "/merchant/order/order-1",
        tradeId: "order-1",
      },
      {
        id: "2",
        type: "payment_sent",
        title: "Payment Sent",
        message: "User has marked payment as sent for order #order-2",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        read: false,
        actionUrl: "/merchant/order/order-2",
        tradeId: "order-2",
      },
      {
        id: "3",
        type: "order_completed",
        title: "Order Completed",
        message: "Order #order-3 has been completed successfully",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        read: true,
        actionUrl: "/merchant/order/order-3",
        tradeId: "order-3",
      },
      {
        id: "4",
        type: "system",
        title: "Welcome to SuiXchange",
        message: "Thank you for joining our platform. Start trading now!",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        read: true,
      },
      {
        id: "5",
        type: "payment_received",
        title: "Payment Received",
        message: "Payment for order #order-5 has been marked as received",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
        read: true,
        actionUrl: "/merchant/order/order-5",
        tradeId: "order-5",
      },
      {
        id: "6",
        type: "order_cancelled",
        title: "Order Cancelled",
        message: "Order #order-6 has been cancelled",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        read: true,
        actionUrl: "/merchant/order/order-6",
        tradeId: "order-6",
      },
    ]

    setNotifications(mockNotifications)
  }, [address, router])

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "order_initiated":
        return <ShoppingCart className="h-5 w-5 text-primary" />
      case "payment_sent":
      case "payment_received":
        return <CreditCard className="h-5 w-5 text-green-500" />
      case "order_completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "order_cancelled":
        return <XCircle className="h-5 w-5 text-destructive" />
      case "system":
        return <Bell className="h-5 w-5 text-blue-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const filteredNotifications =
    activeTab === "all"
      ? notifications
      : activeTab === "unread"
        ? notifications.filter((n) => !n.read)
        : notifications.filter((n) => n.type === activeTab)

  if (!address) return null

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        {notifications.some((n) => !n.read) && (
          <Button variant="outline" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="order_initiated">Orders</TabsTrigger>
          <TabsTrigger value="payment_sent">Payments</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card key={notification.id} className={notification.read ? "" : "border-primary/50 bg-primary/5"}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getIcon(notification.type)}
                        <CardTitle className="text-lg">{notification.title}</CardTitle>
                      </div>
                      <CardDescription>{formatDate(notification.timestamp)}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p>{notification.message}</p>
                    {notification.actionUrl && (
                      <Button
                        variant="link"
                        className="p-0 h-auto mt-2"
                        onClick={() => router.push(notification.actionUrl!)}
                      >
                        View details
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No notifications found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
