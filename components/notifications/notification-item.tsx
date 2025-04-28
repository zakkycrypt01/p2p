"use client"

import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ShoppingCart, CreditCard, CheckCircle, XCircle, Bell, AlertCircle, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Notification } from "@/lib/notification-service"

interface NotificationItemProps {
  notification: Notification
  onReadAction: (id: string) => void
}

export function NotificationItem({ notification, onReadAction }: NotificationItemProps) {
  const router = useRouter()

  const handleClick = () => {
    onReadAction(notification.id)
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  const getIcon = () => {
    switch (notification.type) {
      case "order_initiated":
        return <ShoppingCart className="h-4 w-4 text-primary" />
      case "payment_sent":
      case "payment_received":
        return <CreditCard className="h-4 w-4 text-green-500" />
      case "order_completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "order_cancelled":
        return <XCircle className="h-4 w-4 text-destructive" />
      case "system":
        return <Bell className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const timeAgo = formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })

  return (
    <div className="flex justify-between items-center">
      <div
        className={cn("flex flex-col items-start p-3 cursor-pointer", !notification.read && "bg-muted/50")}
        onClick={handleClick}
      >
        <div className="flex w-full gap-2">
          <div className="mt-0.5">{getIcon()}</div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">{notification.title}</p>
            <p className="text-xs text-muted-foreground">{notification.message}</p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onReadAction(notification.id)}>
            Mark as read
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
