"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Send, Upload, Paperclip, Clock, Shield, Lock } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ZKChatInputProps {
  onSendMessageAction: (message: string, isAnonymous: boolean) => Promise<void>
  onSendFileAction: (file: File, isAnonymous: boolean) => Promise<void>
  isLoading?: boolean
  isEncrypted?: boolean
  isAuthenticated?: boolean
}

export function ZKChatInput({
  onSendMessageAction,
  onSendFileAction,
  isLoading = false,
  isEncrypted = false,
  isAuthenticated = false,
}: ZKChatInputProps) {
  const [message, setMessage] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return

    setIsSending(true)
    try {
      await onSendMessageAction(message, isAnonymous)
      setMessage("")
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    await onSendFileAction(file, isAnonymous)

    // Reset the input so the same file can be selected again
    e.target.value = ""
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center space-x-2">
          <Switch id="anonymous-mode" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          <Label htmlFor="anonymous-mode" className="text-sm cursor-pointer">
            Anonymous Mode
          </Label>
        </div>

        <div className="flex items-center space-x-3">
          {isEncrypted && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-xs text-green-500">
                    <Lock className="h-3.5 w-3.5 mr-1" />
                    <span className="hidden sm:inline">Encrypted</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Messages are end-to-end encrypted</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {isAuthenticated && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-xs text-blue-500">
                    <Shield className="h-3.5 w-3.5 mr-1" />
                    <span className="hidden sm:inline">ZK Verified</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Messages are verified with zero-knowledge proofs</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={handleUploadClick}
          disabled={isLoading || isSending}
        >
          {isLoading ? <Clock className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
        />
        <Button variant="outline" size="icon" className="shrink-0" disabled={isLoading || isSending}>
          <Paperclip className="h-5 w-5" />
        </Button>
        <Input
          placeholder={isAnonymous ? "Type an anonymous message..." : "Type a message..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
          disabled={isLoading || isSending}
        />
        <Button
          className="shrink-0"
          size="icon"
          onClick={handleSendMessage}
          disabled={!message.trim() || isLoading || isSending}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
