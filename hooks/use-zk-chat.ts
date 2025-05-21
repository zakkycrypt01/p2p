"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useSuiWallet } from "@/hooks/use-sui-wallet"
import { ZKChatClient } from "../lib/zk-chat-client"
import useOrderDetails from "@/hooks/use-order-details"

export interface Message {
  orderId: string
  sender: string
  content: string | null
  timestamp: number
  recipient?: string
  isAnonymous?: boolean
  status: "sending" | "sent" | "delivered" | "read"
}

interface UseZKChatOptions {
  orderId: string
  counterpartyAddress?: string
  autoFetchMessages?: boolean
}

export function useZKChat({ orderId, counterpartyAddress, autoFetchMessages = true }: UseZKChatOptions) {
  const [client, setClient] = useState<ZKChatClient | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInitializing, setIsInitializing] = useState(true)
  const { toast } = useToast()
  const { address } = useSuiWallet()
  const { orderDetails, isLoading: isOrderLoading } = useOrderDetails(orderId) // Call useOrderDetails here

  useEffect(() => {
    console.log("Formatted Order:", orderDetails) // Log the formatted order
  }, [orderDetails])

  useEffect(() => {
    const initializeChat = async () => {
      setIsInitializing(true)
      try {
        const newClient = new ZKChatClient("http://localhost:2001") // Update with the actual HTTP server URL
        await newClient.initialize()
        setClient(newClient)

        // Load initial messages if autoFetchMessages is enabled
        if (autoFetchMessages && address) {
          setIsLoading(true)
          try {
            const messages = await newClient.getMessages(address)
            setMessages(
              messages.map((msg) => ({
                orderId: msg.orderId || Date.now().toString(),
                sender: msg.sender,
                content: msg.message || null,
                timestamp: msg.timestamp,
                isAnonymous: msg.isAnonymous || false,
                status: msg.status || "sent",
              }))
            )
          } catch (error) {
            console.error("Error fetching messages:", error)
            toast({
              title: "Error",
              description: "Failed to fetch messages",
              variant: "destructive",
            })
          } finally {
            setIsLoading(false)
          }
        }
      } catch (error) {
        console.error("Error initializing chat:", error)
        toast({
          title: "Error",
          description: "Failed to initialize secure chat",
          variant: "destructive",
        })
      } finally {
        setIsInitializing(false)
      }
    }

    initializeChat()
  }, [orderId, toast, address, autoFetchMessages])

  const sendMessage = useCallback(
    async (content: string, isAnonymous = false) => {
      if (!content.trim() || !client || !address || !orderDetails) return false

      // Determine sender and recipient
      const isBuyer = address === orderDetails.buyerAddress
      const recipient = isBuyer ? orderDetails.merchantAddress : orderDetails.buyerAddress

      const newMessage: Message = {
        orderId: orderId,
        sender: address,
        content,
        timestamp: Date.now(),
        status: "sending",
        recipient,
      }

      console.log("Sending message:", newMessage)

      setMessages((prev) => [...prev, newMessage])

      try {
        const response = await client.sendMessage({
          orderId,
          sender: address,
          recipient,
          message: content,
          timestamp: Date.now(),
        })

        setMessages((prev) =>
          prev.map((msg) =>
            msg.timestamp === newMessage.timestamp
              ? {
                  ...msg,
                  status: "delivered",
                }
              : msg
          )
        )

        return true
      } catch (error) {
        console.error("Error sending message:", error)
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        })

        setMessages((prev) =>
          prev.map((msg) =>
            msg.timestamp === newMessage.timestamp
              ? { ...msg, status: "sent", content: content + " (Failed to deliver)" }
              : msg
          )
        )

        return false
      }
    },
    [address, client, toast, orderDetails]
  )

  const uploadFile = async (file: File, isAnonymous = false) => {
    if (!client || !address || !orderDetails) return false

    // Determine sender and recipient
    const isBuyer = address === orderDetails.buyerAddress
    const recipient = isBuyer ? orderDetails.merchantAddress : orderDetails.buyerAddress

    const newMessage: Message = {
      orderId: orderId,
      sender: address,
      content: null,
      timestamp: Date.now(),
      status: "sending",
      recipient,
    }

    setMessages((prev) => [...prev, newMessage])

    try {
      const response = await client.uploadFile({
        orderId,
        sender: address,
        recipient,
        file,
        timestamp: Date.now(),
      })

      setMessages((prev) =>
        prev.map((msg) =>
          msg.timestamp === newMessage.timestamp
            ? {
                ...msg,
                status: "delivered",
              }
            : msg
        )
      )

      return true
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      })

      setMessages((prev) =>
        prev.map((msg) =>
          msg.timestamp === newMessage.timestamp
            ? { ...msg, status: "sent", content: "(Failed to deliver)" }
            : msg
        )
      )

      return false
    }
  }

  return {
    client,
    messages,
    isLoading,
    isInitializing,
    sendMessage,
    isAuthenticated: !!client,
    isEncrypted: !!client,
    uploadFile,
  }
}