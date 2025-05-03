"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSuiWallet } from "@/hooks/use-sui-wallet"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { MessageSquare, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface Conversation {
  id: string
  orderId: string
  counterparty: string
  lastMessage: string
  timestamp: number
  unread: number
  type: "buyer" | "seller"
}

export default function ChatPage() {
  const { address } = useSuiWallet()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchConversations = async () => {
      if (!address) {
        router.push("/dashboard")
        return
      }

      setIsLoading(true)
      try {
        // In a real app, you would fetch conversations from your API
        // For this demo, we'll use mock data
        const mockConversations = generateMockConversations()
        setConversations(mockConversations)
      } catch (error) {
        console.error("Error fetching conversations:", error)
        toast({
          title: "Error",
          description: "Failed to load conversations",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
  }, [address, router, toast])

  const generateMockConversations = (): Conversation[] => {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    const twoHoursAgo = now - 2 * 60 * 60 * 1000
    const oneDayAgo = now - 24 * 60 * 60 * 1000

    return [
      {
        id: "1",
        orderId: "order123",
        counterparty: "0x1234567890abcdef1234567890abcdef12345678",
        lastMessage: "Thank you for your order. Please let me know when you've sent the payment.",
        timestamp: twoHoursAgo,
        unread: 0,
        type: "seller",
      },
      {
        id: "2",
        orderId: "order456",
        counterparty: "0xabcdef1234567890abcdef1234567890abcdef12",
        lastMessage: "I've sent the payment. Here's the proof of payment.",
        timestamp: oneHourAgo,
        unread: 2,
        type: "buyer",
      },
      {
        id: "3",
        orderId: "order789",
        counterparty: "0x7890abcdef1234567890abcdef1234567890abcd",
        lastMessage: "The funds have been released. Thank you for your business!",
        timestamp: oneDayAgo,
        unread: 0,
        type: "seller",
      },
    ]
  }

  const formatTime = (timestamp: number) => {
    return formatDistanceToNow(timestamp, { addSuffix: true })
  }

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.counterparty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getChatLink = (conversation: Conversation) => {
    return conversation.type === "buyer"
      ? `/orders/${conversation.orderId}/chat`
      : `/merchant/order/${conversation.orderId}/chat`
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search conversations..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p>Loading conversations...</p>
          </CardContent>
        </Card>
      ) : filteredConversations.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No conversations found</h3>
            {searchQuery ? (
              <p className="text-muted-foreground">No results match your search criteria.</p>
            ) : (
              <p className="text-muted-foreground">
                You don't have any active conversations yet. Start trading to chat with buyers and sellers.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredConversations.map((conversation) => (
            <Card key={conversation.id} className="hover:bg-accent/50 transition-colors">
              <Link href={getChatLink(conversation)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-4">
                      <AvatarFallback>{conversation.counterparty.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <p className="font-medium">
                          {conversation.counterparty.slice(0, 6)}...{conversation.counterparty.slice(-4)}
                        </p>
                        <span className="text-xs text-muted-foreground ml-2">
                          Order #{conversation.orderId.slice(0, 6)}
                        </span>
                        <span className="text-xs bg-primary/10 text-primary rounded px-2 py-0.5 ml-2">
                          {conversation.type === "buyer" ? "You're buying" : "You're selling"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{conversation.lastMessage}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(conversation.timestamp)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {conversation.unread > 0 && (
                      <span className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs mr-3">
                        {conversation.unread}
                      </span>
                    )}
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
