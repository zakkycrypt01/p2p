"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ChatMessageProps {
  id: string
  content: string
  sender: string
  currentUser: string
  timestamp: number
  isProof?: boolean
  proofUrl?: string
  status: "sending" | "sent" | "delivered" | "read"
  onDownload?: (url: string) => void
}

export function ChatMessage({
  content,
  sender,
  currentUser,
  timestamp,
  isProof,
  proofUrl,
  status,
  onDownload,
}: ChatMessageProps) {
  const isSentByMe = sender === currentUser

  const formatMessageTime = (timestamp: number) => {
    return formatDistanceToNow(timestamp, { addSuffix: true })
  }

  return (
    <div className={`flex ${isSentByMe ? "justify-end" : "justify-start"} mb-4`}>
      {!isSentByMe && (
        <Avatar className="h-8 w-8 mr-2 mt-1">
          <AvatarFallback>{sender.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}

      <div
        className={`max-w-[80%] ${
          isSentByMe ? "bg-primary text-primary-foreground" : "bg-muted"
        } rounded-lg p-3 space-y-2`}
      >
        <div className="text-sm">{content}</div>

        {isProof && proofUrl && (
          <div className="mt-2 bg-background/20 p-2 rounded-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs">Payment Proof:</span>
              {!isSentByMe && onDownload && (
                <Button variant="ghost" size="sm" className="h-6 p-0 text-xs" onClick={() => onDownload(proofUrl)}>
                  <Download className="h-3 w-3 mr-1" />
                  Save
                </Button>
              )}
            </div>
            <img
              src={proofUrl || "/placeholder.svg"}
              alt="Payment proof"
              className="w-full max-h-60 object-contain rounded-md"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-1 text-xs opacity-70">
          <span>{formatMessageTime(timestamp)}</span>
          {isSentByMe && (
            <span>
              {status === "sending" && "Sending..."}
              {status === "sent" && "Sent"}
              {status === "delivered" && "Delivered"}
              {status === "read" && "Read"}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
