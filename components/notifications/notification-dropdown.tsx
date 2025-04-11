"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { NotificationItem } from "@/components/notifications/notification-item"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export interface Notification {
  id: string
  type: "order_initiated" | "payment_sent" | "payment_received" | "order_completed" | "order_cancelled" | "system"
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  tradeId?: string
}

export function NotificationDropdown() {
  const currentAccount = useCurrentAccount()
  const address = currentAccount?.address
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!address) return

    // Mock notifications - in a real app, this would fetch from an API
    const mockNotifications: Notification[] = [
      {
        id: "1",
        type: "order_initiated",
        title: "New Order Initiated",
        message: "A user has initiated an order for 10 SUI at 1.25 USD",
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        read: false,
        actionUrl: "/merchant/orders/order-1",
        tradeId: "order-1",
      },
      {
        id: "2",
        type: "payment_sent",
        title: "Payment Sent",
        message: "User has marked payment as sent for order #order-2",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        read: false,
        actionUrl: "/merchant/orders/order-2",
        tradeId: "order-2",
      },
      {
        id: "3",
        type: "order_completed",
        title: "Order Completed",
        message: "Order #order-3 has been completed successfully",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        read: true,
        actionUrl: "/merchant/orders/order-3",
        tradeId: "order-3",
      },
      {
        id: "4",
        type: "system",
        title: "Welcome to P2P Exchange",
        message: "Thank you for joining our platform. Start trading now!",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        read: true,
      },
    ]

    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter((n) => !n.read).length)
  }, [address])

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
    setUnreadCount(0)
  }

  if (!address) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto text-xs px-2 py-1" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-[400px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} onRead={markAsRead} />
            ))
          ) : (
            <div className="py-4 px-2 text-center text-muted-foreground">No notifications yet</div>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="w-full cursor-pointer justify-center">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
