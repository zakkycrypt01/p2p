"use client"

import { useState } from "react"
import { useNotifications } from "@/hooks/use-notification"
import { NotificationItem } from "@/components/notifications/notification-item"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, Trash2, RefreshCw } from "lucide-react"
import type { NotificationType } from "@/lib/notification-service"

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, addTestNotification } = useNotifications()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | NotificationType | "unread">("all")

  // Filter notifications based on search term and active tab
  const filteredNotifications = notifications.filter((notification) => {
    // Search filter
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())

    // Tab filter
    const matchesTab =
      activeTab === "all" || (activeTab === "unread" && !notification.read) || activeTab === notification.type

    return matchesSearch && matchesTab
  })

  const handleNotificationClick = (id: string) => {
    markAsRead(id)
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
          <Button variant="outline" size="sm" onClick={addTestNotification}>
            Add Test Notification
          </Button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search notifications..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="order_initiated">Orders</TabsTrigger>
          <TabsTrigger value="payment_sent">Payments</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <div className="space-y-4">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onReadAction={handleNotificationClick}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm
                  ? "No notifications match your search"
                  : activeTab === "unread"
                    ? "No unread notifications"
                    : "No notifications"}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
