"use client"

import { useEffect, useState } from "react"
import { useWebSocketContext } from "@/providers/web-socket-provider"
import { notificationService, type Notification } from "@/lib/notification-service"
import { useSuiWallet } from "@/hooks/use-sui-wallet"
import { useToast } from "@/components/ui/use-toast"

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { sendMessage } = useWebSocketContext()
  const { address } = useSuiWallet()
  const { toast } = useToast()
  useEffect(() => {
    const initialNotifications = notificationService.getNotifications()
    setNotifications(initialNotifications)
    setUnreadCount(initialNotifications.filter((n) => !n.read).length)
    const handleNotificationsChanged = () => {
      const updatedNotifications = notificationService.getNotifications()
      setNotifications(updatedNotifications)
      setUnreadCount(updatedNotifications.filter((n) => !n.read).length)
    }
    const handleNewNotification = (notification?: Notification) => {
      if (!notification) return
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      })
    }
    const unsubscribeChanged = notificationService.subscribe(
      "changed",
      handleNotificationsChanged
    )
    const unsubscribeNew = notificationService.subscribe(
      "new",
      handleNewNotification
    )

    return () => {
      unsubscribeChanged()
      unsubscribeNew()
    }
  }, [toast])
  const userNotifications = notifications.filter((notification) => {
    if (notification.recipientId && notification.recipientId === address) {
      return true
    }
    if (!notification.recipientId) {
      return true
    }

    return false
  })
  const markAsRead = (id: string) => {
    notificationService.markAsRead(id)
  }
  const markAllAsRead = () => {
    notificationService.markAllAsRead()
  }
  const sendNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    sendMessage({
      type: "notification",
      payload: notification,
    })
  }
  const addTestNotification = () => {
    const types = [
      "system",
      "order_initiated",
      "payment_sent",
      "payment_received",
      "order_completed",
      "order_cancelled",
    ]
    const randomType = types[Math.floor(Math.random() * types.length)] as Notification["type"]

    const notification: Omit<Notification, "id" | "timestamp" | "read"> = {
      type: randomType,
      title: `Test ${randomType.replace("_", " ")}`,
      message: `This is a test notification of type ${randomType}`,
      recipientId: address ?? undefined,
    }

    sendNotification(notification)
  }

  return {
    notifications: userNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    sendNotification,
    addTestNotification,
  }
}
