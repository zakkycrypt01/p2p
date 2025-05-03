import { Button, type ButtonProps } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import Link from "next/link"

interface ChatButtonProps extends ButtonProps {
  orderId: string
  hasNewMessages?: boolean
}

export function ChatButton({ orderId, hasNewMessages = false, ...props }: ChatButtonProps) {
  return (
    <Button variant="outline" className="relative w-full" asChild {...props}>
      <Link href={`/orders/${orderId}/chat`} className="flex items-center justify-center">
        <MessageCircle className="h-4 w-4 mr-2" />
        Chat with Counterparty
        {hasNewMessages && (
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive transform translate-x-1 -translate-y-1" />
        )}
      </Link>
    </Button>
  )
}
