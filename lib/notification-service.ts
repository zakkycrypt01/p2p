// This service handles notification storage and management
// In a real app, this would connect to a backend API

import { v4 as uuidv4 } from "uuid"
import { create } from "zustand"
import { persist } from "zustand/middleware"

export type NotificationType =
  | "order_initiated"
  | "payment_sent"
  | "payment_received"
  | "order_completed"
  | "order_cancelled"
  | "system"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  tradeId?: string
  recipientId?: string // The user who should receive this notification
  senderId?: string // The user who sent this notification
}

interface NotificationStore {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => string
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  getUnreadCount: () => number
  clearAll: () => void
}

// Create a Zustand store with persistence
export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (notification) => {
        const id = uuidv4()
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: new Date().toISOString(),
          read: false,
        }

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }))

        // Emit an event that can be caught by the WebSocket provider
        const event = new CustomEvent("newNotification", {
          detail: newNotification,
        })
        if (typeof window !== "undefined") {
          window.dispatchEvent(event)
        }

        return id
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification,
          ),
        }))
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((notification) => ({
            ...notification,
            read: true,
          })),
        }))
      },

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.read).length
      },

      clearAll: () => {
        set({ notifications: [] })
      },
    }),
    {
      name: "notification-storage", // name of the item in localStorage
    },
  ),
)

// Singleton service for notifications
export class NotificationService {
  private static instance: NotificationService
  private newListeners = new Set<(n: Notification) => void>()
  private changeListeners = new Set<() => void>()

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  public addNotification(payload: Omit<Notification, "id" | "timestamp" | "read">): string {
    // 1) add to store
    const id = useNotificationStore.getState().addNotification(payload)
    // 2) grab the created note
    const newNote = useNotificationStore
      .getState()
      .notifications.find((n) => n.id === id)!
    // 3) fire both channels
    this.newListeners.forEach((cb) => cb(newNote))
    this.changeListeners.forEach((cb) => cb())
    return id
  }

  /** store‐wrapper APIs your hook expects */
  public getNotifications(): Notification[] {
    return useNotificationStore.getState().notifications
  }
  public markAsRead(id: string): void {
    useNotificationStore.getState().markAsRead(id)
    this.changeListeners.forEach((cb) => cb())
  }
  public markAllAsRead(): void {
    useNotificationStore.getState().markAllAsRead()
    this.changeListeners.forEach((cb) => cb())
  }
  public clearAll(): void {
    useNotificationStore.getState().clearAll()
    this.changeListeners.forEach((cb) => cb())
  }

  /** new signature: subscribe/unsubscribe by channel */
  public subscribe(
    event: "new" | "changed",
    callback: (arg?: Notification) => void
  ): () => void {
    if (event === "new") this.newListeners.add(callback as (n: Notification) => void)
    else this.changeListeners.add(callback as () => void)
    return () => this.unsubscribe(event, callback)
  }

  public notifyListeners(notification: Notification): void {
    // no longer used
  }

  public unsubscribe(event: "new" | "changed", callback: (arg?: Notification) => void): void {
    if (event === "new") this.newListeners.delete(callback as (n: Notification) => void)
    else this.changeListeners.delete(callback as () => void)
  }

  // Helper methods for common notification types
  public notifyOrderInitiated(orderId: string, details: string, recipientId?: string): string {
    return this.addNotification({
      type: "order_initiated",
      title: "New Order Initiated",
      message: `A new order has been initiated: ${details}`,
      actionUrl: `/merchant/order/${orderId}`,
      tradeId: orderId,
      recipientId,
    })
  }

  public notifyPaymentSent(orderId: string, details: string, recipientId?: string): string {
    return this.addNotification({
      type: "payment_sent",
      title: "Payment Sent",
      message: `Payment has been sent for order #${orderId}: ${details}`,
      actionUrl: `/merchant/order/${orderId}`,
      tradeId: orderId,
      recipientId,
    })
  }

  public notifyPaymentReceived(orderId: string, details: string, recipientId?: string): string {
    return this.addNotification({
      type: "payment_received",
      title: "Payment Received",
      message: `Payment has been received for order #${orderId}: ${details}`,
      actionUrl: `/merchant/order/${orderId}`,
      tradeId: orderId,
      recipientId,
    })
  }

  public notifyOrderCompleted(orderId: string, details: string, recipientId?: string): string {
    return this.addNotification({
      type: "order_completed",
      title: "Order Completed",
      message: `Order #${orderId} has been completed: ${details}`,
      actionUrl: `/merchant/order/${orderId}`,
      tradeId: orderId,
      recipientId,
    })
  }

  public notifyOrderCancelled(orderId: string, reason: string, recipientId?: string): string {
    return this.addNotification({
      type: "order_cancelled",
      title: "Order Cancelled",
      message: `Order #${orderId} has been cancelled: ${reason}`,
      actionUrl: `/merchant/order/${orderId}`,
      tradeId: orderId,
      recipientId,
    })
  }

  public notifySystem(title: string, message: string, recipientId?: string): string {
    return this.addNotification({
      type: "system",
      title,
      message,
      recipientId,
    })
  }

  // Method to send notification via WebSocket
  public sendNotificationViaWebSocket(
    ws: WebSocket,
    notification: Omit<Notification, "id" | "timestamp" | "read">,
  ): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "notification",
          payload: notification,
        }),
      )
    }
  }
}

export const notificationService = NotificationService.getInstance()

// Initialize with some demo notifications if needed
export function initializeDemoNotifications(userId: string) {
  const store = useNotificationStore.getState()

  // Only add demo notifications if the store is empty
  if (store.notifications.length === 0) {
    notificationService.notifyOrderInitiated("order-1", "A user has initiated an order for 10 SUI at 1.25 USD", userId)

    notificationService.notifyPaymentSent("order-2", "User has marked payment as sent", userId)

    notificationService.notifyOrderCompleted("order-3", "Order has been completed successfully", userId)

    notificationService.notifySystem(
      "Welcome to P2P Exchange",
      "Thank you for joining our platform. Start trading now!",
      userId,
    )

    // Mark some as read
    setTimeout(() => {
      store.markAsRead("order-3")
    }, 100)
  }
}
