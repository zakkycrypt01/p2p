"use client"

import { useState, useEffect, useCallback } from "react"
import { useWebSocket } from "./use-web-socket"
import { useSuiWallet } from "./use-sui-wallet"
import {useContract} from './useContract'

interface Listing {
  id: string
  tokenSymbol: string
  tokenIcon: string
  amount: number
  price: number
  fiatCurrency: string
  sellerRating: number
  paymentMethods: string[]
  status: "open" | "pending" | "completed" | "cancelled"
  createdAt: string
  orderType?: "buy" | "sell"
}

interface ListingFilters {
  token?: string
  minPrice?: number
  maxPrice?: number
  fiatCurrency?: string
  paymentMethods?: string[]
  orderType?: "buy" | "sell"
}

export function useListings(defaultOrderType?: "buy" | "sell") {
  
  const [listings, setListings] = useState<Listing[]>([])
  const [filters, setFilters] = useState<ListingFilters>({
    orderType: defaultOrderType,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchListings = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // This would be a real API call in production
      // Simulating API response
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock data
      const mockListings: Listing[] = [
        {
          id: "listing-1",
          tokenSymbol: "SUI",
          tokenIcon: "/tokens/sui.png",
          amount: 100,
          price: 1.25,
          fiatCurrency: "USD",
          sellerRating: 4.8,
          paymentMethods: ["Bank Transfer", "PayPal"],
          status: "open",
          createdAt: new Date().toISOString(),
          orderType: "sell",
        },
        {
          id: "listing-2",
          tokenSymbol: "USDC",
          tokenIcon: "/tokens/usdc.png",
          amount: 500,
          price: 1.0,
          fiatCurrency: "USD",
          sellerRating: 4.5,
          paymentMethods: ["Bank Transfer", "Venmo"],
          status: "open",
          createdAt: new Date().toISOString(),
          orderType: "sell",
        },
        {
          id: "listing-3",
          tokenSymbol: "USDT",
          tokenIcon: "/tokens/usdt.png",
          amount: 0.5,
          price: 3000,
          fiatCurrency: "USD",
          sellerRating: 4.9,
          paymentMethods: ["Bank Transfer", "Cash App"],
          status: "open",
          createdAt: new Date().toISOString(),
          orderType: "buy",
        },
        {
          id: "listing-4",
          tokenSymbol: "BTC",
          tokenIcon: "/tokens/btc.png",
          amount: 0.01,
          price: 50000,
          fiatCurrency: "USD",
          sellerRating: 5.0,
          paymentMethods: ["Bank Transfer", "Zelle"],
          status: "open",
          createdAt: new Date().toISOString(),
          orderType: "buy",
        },
        {
          id: "listing-5",
          tokenSymbol: "SUI",
          tokenIcon: "/tokens/sui.png",
          amount: 50,
          price: 1.3,
          fiatCurrency: "EUR",
          sellerRating: 4.7,
          paymentMethods: ["Bank Transfer", "Revolut"],
          status: "open",
          createdAt: new Date().toISOString(),
          orderType: "sell",
        },
        {
          id: "listing-6",
          tokenSymbol: "USDC",
          tokenIcon: "/tokens/usdc.png",
          amount: 1000,
          price: 0.95,
          fiatCurrency: "EUR",
          sellerRating: 4.6,
          paymentMethods: ["Bank Transfer"],
          status: "open",
          createdAt: new Date().toISOString(),
          orderType: "buy",
        },
        {
          id: "listing-7",
          tokenSymbol: "USDT",
          tokenIcon: "/tokens/usdt.png",
          amount: 0.2,
          price: 2900,
          fiatCurrency: "GBP",
          sellerRating: 4.8,
          paymentMethods: ["Bank Transfer", "PayPal"],
          status: "open",
          createdAt: new Date().toISOString(),
          orderType: "sell",
        },
        {
          id: "listing-8",
          tokenSymbol: "BTC",
          tokenIcon: "/tokens/btc.png",
          amount: 0.005,
          price: 49000,
          fiatCurrency: "GBP",
          sellerRating: 4.9,
          paymentMethods: ["Bank Transfer", "Revolut"],
          status: "open",
          createdAt: new Date().toISOString(),
          orderType: "buy",
        },
      ]

      // Apply filters
      let filteredListings = [...mockListings]

      // Filter by order type first
      if (filters.orderType) {
        filteredListings = filteredListings.filter((listing) => (listing.orderType || "sell") === filters.orderType)
      }

      if (filters.token) {
        filteredListings = filteredListings.filter((listing) => listing.tokenSymbol === filters.token)
      }

      if (filters.fiatCurrency) {
        filteredListings = filteredListings.filter((listing) => listing.fiatCurrency === filters.fiatCurrency)
      }

      if (filters.minPrice !== undefined) {
        filteredListings = filteredListings.filter((listing) => listing.price >= filters.minPrice!)
      }

      if (filters.maxPrice !== undefined) {
        filteredListings = filteredListings.filter((listing) => listing.price <= filters.maxPrice!)
      }

      if (filters.paymentMethods && filters.paymentMethods.length > 0) {
        filteredListings = filteredListings.filter((listing) =>
          filters.paymentMethods!.some((method) => listing.paymentMethods.includes(method)),
        )
      }

      setListings(filteredListings)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  // Initial fetch
  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  // WebSocket updates
  const { lastMessage } = useWebSocket("/ws/listings")

  useEffect(() => {
    if (!lastMessage) return

    try {
      const data = JSON.parse(lastMessage.data)

      if (data.type === "new_listing") {
        setListings((prev) => [data.listing, ...prev])
      } else if (data.type === "update_listing") {
        setListings((prev) => prev.map((listing) => (listing.id === data.listing.id ? data.listing : listing)))
      } else if (data.type === "remove_listing") {
        setListings((prev) => prev.filter((listing) => listing.id !== data.listingId))
      }
    } catch (err) {
      console.error("Failed to process WebSocket message", err)
    }
  }, [lastMessage])

  return {
    listings,
    isLoading,
    error,
    setFilters,
    refreshListings: fetchListings,
  }
}

