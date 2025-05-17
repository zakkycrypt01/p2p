"use client"

import { useCallback } from "react"
import { useSuiWallet } from "./use-sui-wallet"
import { useContract } from "./useContract"

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
  orderType: "buy" | "sell"
  paymentWindow: number 
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
  const { getOrderByOrderId, getSaleOrderById, markPaymentMade, getAllSaleOrders, markSalePaymentReceived } = useContract()

  const createOrder = useCallback(
    (
      params: { id: string },
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
      const { id: orderId } = params    // pull orderId from params.id
      const paymentWindow = listing.paymentWindow || 30
      const expiresAt = new Date(Date.now() + paymentWindow * 60 * 1000).toISOString()
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
        paymentDetails: listing.paymentDetails || {},
      }

      return newOrder
    },
    [address],
  )

  const getOrder = useCallback(
    async (params: { id: string }) => {
      const { id: orderId } = params
      if (!orderId) {
        console.error("Invalid order ID")
        return null
      }
      try {
        const primary = await getOrderByOrderId(orderId)
        if (primary) return primary
        return await getSaleOrderById(orderId)
      } catch (err) {
        console.error("Error fetching order:", err)
        return null
      }
    },
    [getOrderByOrderId, getSaleOrderById],
  )

  const markPaymentAsSent = useCallback(
    (orderId: string, paymentMethod: string) => {
      console.log('orderId :>> ', orderId, 'paymentMethod :>> ', paymentMethod);
      markPaymentMade(orderId);

    },
    [],
  );

  const completeOrder = useCallback(
    (orderId: string) => {
      console.log('Confirming payment received for sale order:', orderId)
      markSalePaymentReceived(orderId)
        .then(txDigest => {
          console.log('Payment received confirmed, tx:', txDigest)
        })
        .catch(err => {
          console.error('Error confirming payment received:', err)
        })
    },
    [markSalePaymentReceived],
  )

 const cancelOrder = useCallback(
    (orderId: string) => {
      console.log('orderId :>> ', orderId);
    },
    [],
  )

  // Open a dispute
  const openDispute = useCallback(
    (orderId: string) => {
      console.log('orderId :>> ', orderId);
    },
    [],
  )

  // Upload payment proof
  const uploadPaymentProof = useCallback((orderId: string, proofUrl: string) => {
    console.log('orderId :>> ', orderId, 'proofUrl :>> ', proofUrl);
  }, [])

  return {
    createOrder,
    getOrder,
    markPaymentAsSent,
    completeOrder,
    cancelOrder,
    openDispute,
    uploadPaymentProof,
  }
}
