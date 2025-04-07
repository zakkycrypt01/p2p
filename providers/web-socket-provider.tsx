"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useWebSocket } from "@/hooks/use-web-socket"

interface WebSocketContextType {
  sendMessage: (data: any) => void
  isConnected: boolean
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { sendMessage, isConnected } = useWebSocket("/ws")

  return <WebSocketContext.Provider value={{ sendMessage, isConnected }}>{children}</WebSocketContext.Provider>
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext)

  if (context === undefined) {
    throw new Error("useWebSocketContext must be used within a WebSocketProvider")
  }

  return context
}

