"use client"

import { useState } from "react"
import { Bell, MoreHorizontal } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useNotifications } from "@/hooks/use-notification"

export function NotificationItem({
  notification,
  onReadAction,
  showMenu = true,
}: {
  notification: { id: string; title: string; message: string }
  onReadAction: (id: string) => void
  showMenu?: boolean
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="font-semibold">{notification.title}</p>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
      </div>

      {showMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={4}>
            <DropdownMenuItem onSelect={() => onReadAction(notification.id)}>
              Mark as read
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => console.log("delete", notification.id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, addTestNotification } = useNotifications()
  const [open, setOpen] = useState(false)

  // Get the most recent 5 notifications
  const recentNotifications = notifications.slice(0, 5)

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const handleNotificationClick = (id: string) => {
    markAsRead(id)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-8 text-xs">
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
          {recentNotifications.length > 0 ? (
            recentNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="p-0 focus:bg-transparent"
                onSelect={(e) => e.preventDefault()}
              >
                <div
                  onClick={() => {
                    handleNotificationClick(notification.id)
                    setOpen(false)
                  }}
                  className="w-full"
                >
                  <NotificationItem
                    notification={notification}
                    onReadAction={handleNotificationClick}
                  />
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="py-4 px-2 text-center text-muted-foreground">No notifications</div>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="flex justify-between p-2">
          <Link href="/notifications" passHref>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              View all
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={addTestNotification}>
            Test
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
