"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useWebSocket } from "@/hooks/use-web-socket"
import { useSuiWallet } from "@/hooks/use-sui-wallet"
import { notificationService } from "@/lib/notification-service"

// Create context
interface WebSocketContextType {
  isConnected: boolean
  lastMessage: any
  sendMessage: (data: any) => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { lastMessage, sendMessage, isConnected } = useWebSocket("")
  const { address } = useSuiWallet()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Handle incoming messages
  useEffect(() => {
    if (!lastMessage) return

    try {
      const data = JSON.parse(lastMessage.data)
      console.log("Parsed WebSocket message:", data)

      // Handle different message types
      switch (data.type) {
        case "connection_established":
          console.log("WebSocket connection established:", data.payload)
          break

        case "auth_success":
          console.log("WebSocket authentication successful:", data.payload)
          setIsAuthenticated(true)

          // Subscribe to channels after authentication
          sendMessage({
            type: "subscribe",
            payload: { channel: "notifications" },
          })

          sendMessage({
            type: "subscribe",
            payload: { channel: "orders" },
          })

          sendMessage({
            type: "subscribe",
            payload: { channel: "payments" },
          })

          sendMessage({
            type: "subscribe",
            payload: { channel: "system" },
          })
          break

        case "notification":
          console.log("Received notification:", data.payload)
          // Add notification to service
          notificationService.addNotification(data.payload)
          break

        default:
          console.log("Unhandled message type:", data.type)
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error)
    }
  }, [lastMessage, sendMessage])

  // Authenticate when connected and wallet address is available
  useEffect(() => {
    if (isConnected && address && !isAuthenticated) {
      console.log("Authenticating with WebSocket server...")
      sendMessage({
        type: "auth",
        payload: { address },
      })
    }
  }, [isConnected, address, isAuthenticated, sendMessage])

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage, sendMessage }}>{children}</WebSocketContext.Provider>
  )
}

// Custom hook to use the WebSocket context
export function useWebSocketContext() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error("useWebSocketContext must be used within a WebSocketProvider")
  }
  return context
}
