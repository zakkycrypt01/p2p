"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Upload, Paperclip, Clock } from "lucide-react"

interface ChatInputProps {
  onSendMessageAction: (message: string) => void
  onUploadFileAction: (file: File) => void
  isUploading: boolean
}

export function ChatInput({ onSendMessageAction, onUploadFileAction, isUploading }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSendMessage = () => {
    if (!message.trim()) return
    onSendMessageAction(message)
    setMessage("")
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onUploadFileAction(file)
    // Reset the input so the same file can be selected again
    e.target.value = ""
  }

  return (
    <div className="p-4 border-t">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="shrink-0" onClick={handleUploadClick} disabled={isUploading}>
          {isUploading ? <Clock className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
        </Button>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        <Button variant="outline" size="icon" className="shrink-0">
          <Paperclip className="h-5 w-5" />
        </Button>
        <Input
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button className="shrink-0" size="icon" onClick={handleSendMessage} disabled={!message.trim()}>
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
