"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  const baseReconnectDelay = 1000 // 1 second

  const connect = useCallback(() => {
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    try {
      // Use the passed-in URL first
      const wsUrl = url || process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080"
      console.log(`WebSocket connecting to ${wsUrl}`)

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log("WebSocket connection established")
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        console.log("WebSocket message received:", event.data)
        setLastMessage(event)
      }

      ws.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code} ${event.reason}`)
        setIsConnected(false)

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000) {
          handleReconnect()
        }
      }

      // Downgrade to warn so Next.js doesn’t treat it as a fatal client‑side error
      ws.onerror = (error) => {
        console.warn("WebSocket error:", error)
      }

      setSocket(ws)

      // Cleanup function
      return () => {
        console.log("Cleaning up WebSocket connection")
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close(1000, "Component unmounted")
        }
        setIsConnected(false)
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
      }
    } catch (error) {
      console.warn("Failed to create WebSocket connection:", error)
      handleReconnect()
      return () => {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
      }
    }
  }, [url])

  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log(`Maximum reconnection attempts (${maxReconnectAttempts}) reached`)
      return
    }

    reconnectAttemptsRef.current += 1
    const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1)

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current})`)

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      connect()
    }, delay)
  }, [connect, baseReconnectDelay, maxReconnectAttempts])

  // Initialize WebSocket connection
  useEffect(() => {
    const cleanup = connect()
    return cleanup
  }, [connect])

  // Set up ping interval to keep connection alive
  useEffect(() => {
    if (!socket || !isConnected) return

    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        // Send ping message
        socket.send(JSON.stringify({ type: "ping" }))
      }
    }, 25000) // Ping every 25 seconds (server timeout is 30s)

    return () => {
      clearInterval(pingInterval)
    }
  }, [socket, isConnected])

  const sendMessage = useCallback(
    (data: any) => {
      if (socket && isConnected && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data))
      } else {
        console.warn("Cannot send message, WebSocket is not connected")
      }
    },
    [socket, isConnected],
  )

  return { lastMessage, sendMessage, isConnected }
}
