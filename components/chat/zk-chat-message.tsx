"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Download, Shield, Check, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Message } from "@/hooks/use-zk-chat"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ZKChatMessageProps {
  message: Message
  currentUser: string
}

export function ZKChatMessage({ message, currentUser }: ZKChatMessageProps) {
  const isSentByMe =
    message.sender === currentUser ||
    (message.isAnonymous && message.sender === "anonymous")
  const isAnonymous = message.isAnonymous || message.sender === "anonymous"

  const formatMessageTime = (timestamp: number) => {
    return formatDistanceToNow(timestamp, { addSuffix: true })
  }

  const handleDownload = (url: string) => {
    // In a real app, you would trigger a download here
    window.open(url, "_blank")
  }

  const handleVerifyProof = () => {
    // In a real app, you would verify the ZK proof here
    alert("Proof verified successfully!")
  }

  return (
    <div className={`flex ${isSentByMe ? "justify-end" : "justify-start"} mb-4`}>
      {!isSentByMe && !isAnonymous && (
        <Avatar className="h-8 w-8 mr-2 mt-1">
          <AvatarFallback>{message.sender.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}

      {!isSentByMe && isAnonymous && (
        <Avatar className="h-8 w-8 mr-2 mt-1">
          <AvatarFallback className="bg-purple-700 text-white">
            <Shield className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={`max-w-[80%] ${
          isSentByMe
            ? "bg-primary text-primary-foreground"
            : isAnonymous
              ? "bg-purple-100 dark:bg-purple-900"
              : "bg-muted"
        } rounded-lg p-3 space-y-2`}
      >
        {isAnonymous && (
          <div className="flex items-center text-xs mb-1">
            <Shield className="h-3 w-3 mr-1" />
            <span>Anonymous Message</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-5 px-1 ml-1">
                    <Check className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Verified with zero-knowledge proof</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        <div className="text-sm">{message.content}</div>

        {message.isProof && message.proofUrl && (
          <div className="mt-2 bg-background/20 p-2 rounded-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs">Attachment:</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 p-0 text-xs"
                onClick={() => handleDownload(message.proofUrl!)}
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
            <img
              src={message.proofUrl || "/placeholder.svg"}
              alt="Attachment"
              className="w-full max-h-60 object-contain rounded-md"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-1 text-xs opacity-70">
          <span>{formatMessageTime(message.timestamp)}</span>
          {isSentByMe && (
            <span className="flex items-center">
              {message.status === "sending" && <Clock className="h-3 w-3 ml-1" />}
              {message.status === "sent" && <Check className="h-3 w-3 ml-1" />}
              {message.status === "delivered" && (
                <>
                  <Check className="h-3 w-3" />
                  <Check className="h-3 w-3 -ml-1" />
                </>
              )}
              {message.status === "read" && (
                <span className="text-blue-500">
                  <Check className="h-3 w-3" />
                  <Check className="h-3 w-3 -ml-1" />
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
