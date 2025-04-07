"use client"

import { useState, useEffect, useCallback } from "react"

export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const connect = useCallback(() => {
    // In a real app, this would connect to a real WebSocket server
    // For this demo, we'll simulate WebSocket behavior
    console.log(`WebSocket connecting to ${url}`)

    // Create a mock WebSocket object
    const mockSocket = {
      onopen: null as any,
      onmessage: null as any,
      onclose: null as any,
      onerror: null as any,
      close: () => {
        if (mockSocket.onclose) {
          mockSocket.onclose({} as CloseEvent)
        }
        setIsConnected(false)
      },
      send: (data: string) => {
        console.log(`WebSocket sent: ${data}`)
      },
    }

    // Simulate connection
    setTimeout(() => {
      setIsConnected(true)
      if (mockSocket.onopen) {
        mockSocket.onopen({} as Event)
      }
    }, 500)

    setSocket(mockSocket as unknown as WebSocket)

    // Cleanup function
    return () => {
      console.log("WebSocket disconnected")
      setIsConnected(false)
    }
  }, [url])

  useEffect(() => {
    const cleanup = connect()
    return cleanup
  }, [connect])

  const sendMessage = useCallback(
    (data: any) => {
      if (socket && isConnected) {
        socket.send(JSON.stringify(data))
      }
    },
    [socket, isConnected],
  )

  return { lastMessage, sendMessage, isConnected }
}

