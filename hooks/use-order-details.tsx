import { useContract } from "@/hooks/useContract"
import { useEffect, useState } from "react"
import { useSuiWallet } from "./use-sui-wallet"

interface FormattedOrder {
    id: string
    shortId: string
    listingId: string
    tokenSymbol: string
    tokenIcon: string
    fiatCurrency: string
    merchantAddress: string
    buyerAddress: string
    paymentMethods: string[]
    orderType: string
    paymentWindow: number
    releaseTime: number
    counterpartyAddress: string
    paymentDetails: {
      bankName?: string
      accountName?: string
      accountNumber?: string
      instructions?: string
    }
    paymentProofUrl?: string
    paymentMade?: boolean
    paymentReceived?: boolean
}

export default function useOrderDetails(orderId: string) {
    const { address } = useSuiWallet()
    const { getOrderByOrderId, getSaleOrderById } = useContract()
    const [orderDetails, setOrderDetails] = useState<FormattedOrder | null>(null)

    const fetchOrderDetails = async () => {
        try {
            const fetchedOrder = await getOrderByOrderId(orderId)
            const orderData = fetchedOrder ?? (await getSaleOrderById(orderId))
            const isSeller = orderData.seller === address // Define isSeller based on the current user's address
            const formatted: FormattedOrder = {
                id: orderData.id,
                shortId: `${orderData.id.slice(0, 6)}...${orderData.id.slice(-4)}`,
                listingId: orderData.listingId,
                tokenSymbol: "SUI",
                tokenIcon: "/tokens/sui.png",
                fiatCurrency: "USD",
                merchantAddress: orderData.seller,
                buyerAddress: orderData.buyer,
                paymentMethods: orderData.metadata?.paymentMethods?.split(",") || ["Bank Transfer"],
                orderType: isSeller ? "sell" : "buy",
                paymentWindow: Math.floor((Number(orderData.expiry) - Number(orderData.createdAt)) / 60),
                releaseTime: 15,
                counterpartyAddress: isSeller ? orderData.buyer : orderData.seller,
                paymentDetails: {
                    bankName: "Chase Bank",
                    accountName: "John Smith",
                    accountNumber: "1234567890",
                    instructions: "Please include the order ID in the payment reference",
                },
                paymentProofUrl: orderData.paymentProof || undefined,
                paymentMade: orderData.paymentMade,
                paymentReceived: orderData.paymentReceived,
            }
            setOrderDetails(formatted)
        } catch (error) {
            console.error("Error fetching order details:", error)
        }
    }

    useEffect(() => {
        fetchOrderDetails()
    }, [orderId, address])

    return { orderDetails, isLoading: !orderDetails }
}