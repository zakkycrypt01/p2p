"use client"

import type React from "react"

import { useState, useEffect, useRef, use } from "react"
import { useRouter } from "next/navigation"
import { useSuiWallet } from "@/hooks/use-sui-wallet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Send, Upload, Paperclip, Clock, Download } from 'lucide-react'
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useOrders } from "@/hooks/use-orders"
import { formatDistanceToNow } from "date-fns"

interface ChatPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface Message {
  id: string
  sender: string
  content: string
  timestamp: number
  isProof?: boolean
  proofUrl?: string
  status: "sending" | "sent" | "delivered" | "read"
}

export default function MerchantChatPage({ params }: ChatPageProps) {
  const { id } = use(params)

  const { address } = useSuiWallet()
  const router = useRouter()
  const { toast } = useToast()
  const { getOrder } = useOrders()
  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [counterpartyAddress, setCounterpartyAddress] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!address) {
        return
      }

      setIsLoading(true)
      try {
        const fetchedOrder = await getOrder({ id })

        if (fetchedOrder) {
          setOrder(fetchedOrder)
          const counterparty = fetchedOrder.buyer
          setCounterpartyAddress(counterparty)

          const mockMessages = generateMockMessages(address, counterparty, fetchedOrder)
          setMessages(mockMessages)
        }
      } catch (error) {
        console.error("Error fetching order:", error)
        toast({
          title: "Error",
          description: "Failed to load order details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [address, id, router, toast, getOrder])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const generateMockMessages = (merchantAddress: string, buyerAddress: string, order: any): Message[] => {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    const twoHoursAgo = now - 2 * 60 * 60 * 1000

    return [
      {
        id: "1",
        sender: merchantAddress,
        content: "Hello! Thank you for your order. Please let me know when you've sent the payment.",
        timestamp: twoHoursAgo,
        status: "read",
      },
      {
        id: "2",
        sender: buyerAddress,
        content: "Hi! I'm about to make the payment. Do you prefer I send you the receipt here?",
        timestamp: twoHoursAgo + 5 * 60 * 1000,
        status: "read",
      },
      {
        id: "3",
        sender: merchantAddress,
        content: "Yes, please upload the payment proof here once you've made the transfer.",
        timestamp: twoHoursAgo + 10 * 60 * 1000,
        status: "read",
      },
      {
        id: "4",
        sender: buyerAddress,
        content: "I've sent the payment. Here's the proof of payment.",
        timestamp: oneHourAgo,
        isProof: true,
        proofUrl: "/placeholder.svg?height=300&width=400",
        status: "read",
      },
    ]
  }

  const handleSendMessage = () => {
    if (!message.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: address || "",
      content: message,
      timestamp: Date.now(),
      status: "sending",
    }

    setMessages((prev) => [...prev, newMessage])
    setMessage("")

    setTimeout(() => {
      setMessages((prev) => prev.map((msg) => (msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg)))

      if (Math.random() > 0.7) {
        setTimeout(() => {
          const reply: Message = {
            id: Date.now().toString(),
            sender: counterpartyAddress,
            content: "Thanks for the update! I'll check it shortly.",
            timestamp: Date.now(),
            status: "delivered",
          }
          setMessages((prev) => [...prev, reply])
        }, 10000) // Reply after 10 seconds
      }
    }, 1000)
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

    setIsUploading(true)

    setTimeout(() => {
      const mockProofUrl = "/placeholder.svg?height=300&width=400"

      const proofMessage: Message = {
        id: Date.now().toString(),
        sender: address || "",
        content: "Here's the payment confirmation receipt.",
        timestamp: Date.now(),
        isProof: true,
        proofUrl: mockProofUrl,
        status: "sent",
      }

      setMessages((prev) => [...prev, proofMessage])
      setIsUploading(false)

      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully",
      })
    }, 2000)
  }

  const formatMessageTime = (timestamp: number) => {
    return formatDistanceToNow(timestamp, { addSuffix: true })
  }

  const handleDownloadProof = (proofUrl: string) => {
    toast({
      title: "Download started",
      description: "The payment proof is being downloaded",
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href={`/merchant/order/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Order
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Chat</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p>Loading chat...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href={`/merchant/order/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Order
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Chat with Buyer</h1>
      </div>

      <Card className="h-[calc(100vh-200px)] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarFallback>{counterpartyAddress.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {counterpartyAddress.slice(0, 6)}...{counterpartyAddress.slice(-4)}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Order #{id.slice(0, 6)}...{id.slice(-4)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === address ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] ${
                  msg.sender === address ? "bg-primary text-primary-foreground" : "bg-muted"
                } rounded-lg p-3 space-y-2`}
              >
                <div className="text-sm">{msg.content}</div>

                {msg.isProof && msg.proofUrl && (
                  <div className="mt-2 bg-background/20 p-2 rounded-md">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs">Payment Proof:</span>
                      {msg.sender !== address && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 p-0 text-xs"
                          onClick={() => handleDownloadProof(msg.proofUrl!)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                      )}
                    </div>
                    <img
                      src={msg.proofUrl || "/placeholder.svg"}
                      alt="Payment proof"
                      className="w-full max-h-60 object-contain rounded-md"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-1 text-xs opacity-70">
                  <span>{formatMessageTime(msg.timestamp)}</span>
                  {msg.sender === address && (
                    <span>
                      {msg.status === "sending" && "Sending..."}
                      {msg.status === "sent" && "Sent"}
                      {msg.status === "delivered" && "Delivered"}
                      {msg.status === "read" && "Read"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={handleUploadClick}
              disabled={isUploading}
            >
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
      </Card>
    </div>
  )
}
