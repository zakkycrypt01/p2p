"use client"

import { useState, useEffect, useCallback } from "react"
import { useSuiWallet } from "./use-sui-wallet"

export interface Order {
  id: string
  listingId: string
  tokenSymbol: string
  tokenIcon: string
  amount: number
  price: number
  fiatCurrency: string
  merchantAddress: string
  merchantRating: number
  buyerAddress: string
  status: "pending_payment" | "payment_sent" | "completed" | "cancelled" | "disputed"
  createdAt: string
  expiresAt: string
  paymentMethods: string[]
  selectedPaymentMethod: string | null
  orderType: "buy" | "sell" // buy from merchant or sell to merchant
  paymentWindow: number // minutes
  paymentDetails: {
    [key: string]: {
      accountName?: string
      accountNumber?: string
      bankName?: string
      instructions?: string
    }
  }
  paymentProofUrl?: string
}

export function useOrders() {
  const { address } = useSuiWallet()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load orders from localStorage on component mount
  useEffect(() => {
    if (!address) return

    const loadOrders = () => {
      setIsLoading(true)
      try {
        const savedOrders = localStorage.getItem("mockOrders")
        if (savedOrders) {
          const parsedOrders = JSON.parse(savedOrders) as Order[]
          // Only show orders related to the current user
          const filteredOrders = parsedOrders.filter(
            (order) => order.buyerAddress === address || order.merchantAddress === address,
          )
          setOrders(filteredOrders)
        }
      } catch (error) {
        console.error("Error loading orders:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [address])

  // Save orders to localStorage whenever they change
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem("mockOrders", JSON.stringify(orders))
    }
  }, [orders])

  // Create a new order
  const createOrder = useCallback(
    (
      listing: {
        id: string
        tokenSymbol: string
        tokenIcon: string
        price: number
        fiatCurrency: string
        sellerAddress: string
        sellerRating: number
        paymentMethods: string[]
        orderType?: "buy" | "sell"
        paymentWindow?: number
        paymentDetails?: {
          [key: string]: {
            accountName?: string
            accountNumber?: string
            bankName?: string
            instructions?: string
          }
        }
      },
      amount: number,
    ): Order => {
      if (!address) throw new Error("Wallet not connected")

      // Generate a unique order ID
      const orderId = `order-${Math.floor(Math.random() * 10000)}`

      // Calculate expiration time (default to 30 minutes if not specified)
      const paymentWindow = listing.paymentWindow || 30
      const expiresAt = new Date(Date.now() + paymentWindow * 60 * 1000).toISOString()

      // Create the new order
      const newOrder: Order = {
        id: orderId,
        listingId: listing.id,
        tokenSymbol: listing.tokenSymbol,
        tokenIcon: listing.tokenIcon || `/tokens/${listing.tokenSymbol.toLowerCase()}.png`,
        amount,
        price: listing.price,
        fiatCurrency: listing.fiatCurrency,
        merchantAddress: listing.sellerAddress,
        merchantRating: listing.sellerRating,
        buyerAddress: address,
        status: "pending_payment",
        createdAt: new Date().toISOString(),
        expiresAt,
        paymentMethods: listing.paymentMethods,
        selectedPaymentMethod: null,
        orderType: listing.orderType || "buy",
        paymentWindow,
        paymentDetails: listing.paymentDetails || {
          "bank transfer": {
            accountName: "Merchant Bank Account",
            accountNumber: "1234567890",
            bankName: "Chase Bank",
            instructions: "Please send payment to this account and include the trade ID",
          },
          paypal: {
            accountName: "merchant@example.com",
            instructions: "Send as Friends & Family to avoid fees",
          },
        },
      }

      // Add the new order to the state
      setOrders((prevOrders) => [...prevOrders, newOrder])

      return newOrder
    },
    [address],
  )

  // Get a specific order by ID
  const getOrder = useCallback(
    (orderId: string) => {
      return orders.find((order) => order.id === orderId) || null
    },
    [orders],
  )

  // Update an order's status
  const updateOrderStatus = useCallback((orderId: string, status: Order["status"], additionalData?: Partial<Order>) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order.id === orderId ? { ...order, ...additionalData, status } : order)),
    )
  }, [])

  // Mark payment as sent
  const markPaymentAsSent = useCallback(
    (orderId: string, paymentMethod: string) => {
      updateOrderStatus(orderId, "payment_sent", { selectedPaymentMethod: paymentMethod })
    },
    [updateOrderStatus],
  )

  // Mark order as completed (merchant releases funds)
  const completeOrder = useCallback(
    (orderId: string) => {
      updateOrderStatus(orderId, "completed")
    },
    [updateOrderStatus],
  )

  // Cancel an order
  const cancelOrder = useCallback(
    (orderId: string) => {
      updateOrderStatus(orderId, "cancelled")
    },
    [updateOrderStatus],
  )

  // Open a dispute
  const openDispute = useCallback(
    (orderId: string) => {
      updateOrderStatus(orderId, "disputed")
    },
    [updateOrderStatus],
  )

  // Upload payment proof
  const uploadPaymentProof = useCallback((orderId: string, proofUrl: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order.id === orderId ? { ...order, paymentProofUrl: proofUrl } : order)),
    )
  }, [])

  return {
    orders,
    isLoading,
    createOrder,
    getOrder,
    updateOrderStatus,
    markPaymentAsSent,
    completeOrder,
    cancelOrder,
    openDispute,
    uploadPaymentProof,
  }
}
