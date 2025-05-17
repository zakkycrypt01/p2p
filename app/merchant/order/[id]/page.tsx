"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSuiWallet } from "@/hooks/use-sui-wallet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import {
  ArrowUpRight,
  ArrowDownRight,
  User,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink,
  CheckCircle,
  ShieldCheck,
  Star,
  ArrowLeft,
  MessageCircle,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"
import { useContract } from "@/hooks/useContract"

// Define the FormattedOrder interface
interface FormattedOrder {
  id: string
  shortId: string
  listingId: string
  tokenSymbol: string
  tokenIcon: string
  amount: string
  price: string
  fiatCurrency: string
  merchantAddress: string
  buyerAddress: string
  status: string
  createdAt: string
  updatedAt: string
  expiresAt: string
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

// Add a CountdownTimer component
function CountdownTimer({ expiryTimestamp, onExpire }: { expiryTimestamp: number; onExpire?: () => void }) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [progress, setProgress] = useState(100)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    // Calculate initial time difference
    const calculateTimeLeft = () => {
      const now = Date.now()
      const difference = expiryTimestamp - now

      if (difference <= 0) {
        setIsExpired(true)
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
        setProgress(0)
        if (onExpire) onExpire()
        return
      }

      // Calculate hours, minutes, seconds
      const hours = Math.floor(difference / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ hours, minutes, seconds })

      // Calculate progress based on total time between creation and expiry
      const totalDuration = expiryTimestamp - (expiryTimestamp - 60 * 60 * 1000) // Assuming 1 hour window by default
      const elapsed = totalDuration - difference
      const progressValue = Math.max(0, 100 - (elapsed / totalDuration) * 100)
      setProgress(progressValue)
    }

    // Initial calculation
    calculateTimeLeft()

    // Set up interval to update countdown
    const timer = setInterval(calculateTimeLeft, 1000)

    // Clean up interval on unmount
    return () => clearInterval(timer)
  }, [expiryTimestamp, onExpire])

  // Format time units to always show two digits
  const formatTimeUnit = (unit: number) => unit.toString().padStart(2, "0")

  if (isExpired) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Time Remaining
          </span>
          <span className="text-destructive font-medium">Expired</span>
        </div>
        <Progress value={0} className="h-2" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          Time Remaining
        </span>
        <span className={timeLeft.hours === 0 && timeLeft.minutes < 5 ? "text-destructive font-medium" : "font-medium"}>
          {timeLeft.hours > 0 && `${formatTimeUnit(timeLeft.hours)}:`}
          {formatTimeUnit(timeLeft.minutes)}:{formatTimeUnit(timeLeft.seconds)}
        </span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  )
}

// Helper functions for formatting and converting data
const formatTokenAmount = (amount: bigint | number | string): string => {
  if (typeof amount === "bigint") {
    return (Number(amount) / 1000000000).toString()
  } else if (typeof amount === "number") {
    return (amount / 1000000000).toString()
  } else {
    return (Number(amount) / 1000000000).toString()
  }
}

const formatPrice = (price: bigint | number | string): string => {
  if (typeof price === "bigint") {
    return (Number(price) / 100000000000).toFixed(2)
  } else if (typeof price === "number") {
    return (price / 100000000000).toFixed(2)
  } else {
    return (Number(price) / 100000000000).toFixed(2)
  }
}

const getStatusFromCode = (statusCode: number): string => {
  switch (statusCode) {
    case 0:
      return "pending_payment"
    case 1:
      return "payment_sent"
    case 2:
      return "payment_confirmed"
    case 3:
      return "completed"
    case 4:
      return "cancelled"
    case 5:
      return "disputed"
    default:
      return "unknown"
  }
}

export default function OrderDetailPage() {
  const { address } = useSuiWallet()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const {
    getOrderByOrderId,
    markPaymentReceived,
    cancelOrder,
    getSaleOrderById,
    markSalePaymentMade,
  } = useContract()
  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isDisputing, setIsDisputing] = useState(false)
  const [expiryTimestamp, setExpiryTimestamp] = useState<number | null>(null)
  const [formattedOrder, setFormattedOrder] = useState<any>(null)
  // Add a new state for tracking the "mark payment as sent" action
  const [isMarkingPaymentSent, setIsMarkingPaymentSent] = useState(false)

  useEffect(() => {
    console.log("raw address from wallet:", address)
    // only redirect after we see the above
    if (!address) {
      // router.push("/")
      return
    }

    const fetchOrder = async () => {
      if (!address) {
        // router.push("/")
        return
      }

      setIsLoading(true)
      try {
        // first try our order system…
        const fetchedOrder = await getOrderByOrderId(id)
        // …if not found, fall back to sale‐order lookup
        const orderData = fetchedOrder ?? (await getSaleOrderById(id))

        if (orderData) {
          setOrder(orderData)

          // normalize both addresses: lowercase + strip leading "0x"
          const normalize = (addr: string) => addr.toLowerCase().replace(/^0x/, "").trim()
          const sellerNorm = normalize(orderData.seller)
          const userNorm = normalize(address)

          console.log("seller:", sellerNorm, "you:", userNorm)

          const isSeller = sellerNorm === userNorm

          const formatted = {
            id: orderData.id,
            shortId: `${orderData.id.slice(0, 6)}...${orderData.id.slice(-4)}`,
            listingId: orderData.listingId,
            tokenSymbol: "SUI", // Default to SUI
            tokenIcon: "/tokens/sui.png",
            amount: formatTokenAmount(orderData.tokenAmount),
            price: formatPrice(orderData.price),
            fiatCurrency: "USD", // Default to USD
            merchantAddress: orderData.seller,
            buyerAddress: orderData.buyer,
            status: getStatusFromCode(Number(orderData.status)),
            createdAt: new Date(Number(orderData.createdAt) * 1000).toISOString(),
            updatedAt: new Date(Number(orderData.createdAt) * 1000).toISOString(),
            expiresAt: new Date(Number(orderData.expiry) * 1000).toISOString(),
            paymentMethods: orderData.metadata?.paymentMethods?.split(",") || ["Bank Transfer"],
            orderType: isSeller ? "sell" : "buy",
            paymentWindow: Math.floor((Number(orderData.expiry) - Number(orderData.createdAt)) / 60), // in minutes
            releaseTime: 15, // Default release time in minutes
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

          setFormattedOrder(formatted)

          // Set expiry timestamp for countdown
          const expiry = new Date(formatted.expiresAt).getTime()
          setExpiryTimestamp(expiry)
        }
      } catch (error) {
        console.error("Error fetching order:", error)
        toast({
          title: "Error",
          description: "Failed to load order details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [address, id, router, toast, getOrderByOrderId, getSaleOrderById])

  // Add a second effect to run *after* `order` is set:
  useEffect(() => {
    if (!address || !order?.seller) return

    const normalize = (addr: string) => addr.toLowerCase().replace(/^0x/, "").trim()

    const sellerNorm = normalize(order.seller)
    const userNorm = normalize(address)

    console.log("Normalized addresses:", {
      seller: order.seller,
      sellerNorm,
      user: address,
      userNorm,
      isMatch: sellerNorm === userNorm,
    })

    const isSeller = sellerNorm === userNorm

    // update only the fields that depend on isSeller
    setFormattedOrder(
      (prev: FormattedOrder | null) =>
        prev && {
          ...prev,
          orderType: isSeller ? "sell" : "buy",
          counterpartyAddress: isSeller ? order.buyer : order.seller,
        },
    )
  }, [address, order])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The information has been copied to your clipboard",
    })
  }

  const handleConfirmPayment = async () => {
    setIsConfirming(true)
    try {
      // Mark payment as received in our order system
      await markPaymentReceived(order.id)

      // Update local state
      setFormattedOrder((prev: any) => ({ ...prev, status: "payment_confirmed" }))

      toast({
        title: "Payment Confirmed",
        description: "You have successfully confirmed the payment",
      })
    } catch (error) {
      console.error("Error confirming payment:", error)
      toast({
        title: "Error",
        description: "Failed to confirm payment",
        variant: "destructive",
      })
    } finally {
      setIsConfirming(false)
    }
  }

  const handleReleaseFunds = async () => {
    setIsReleasing(true)
    try {
      // Release funds in our order system
      await markPaymentReceived(order.id)

      // Update local state
      setFormattedOrder((prev: any) => ({ ...prev, status: "completed" }))

      toast({
        title: "Funds released",
        description: "You have successfully released the funds",
      })
    } catch (error) {
      console.error("Error releasing funds:", error)
      toast({
        title: "Error",
        description: "Failed to release funds",
        variant: "destructive",
      })
    } finally {
      setIsReleasing(false)
    }
  }

  const handleCancelOrder = async () => {
    setIsCancelling(true)
    try {
      // Cancel the order in our order system
      await cancelOrder(order.id)

      // Update local state
      setFormattedOrder((prev: any) => ({ ...prev, status: "cancelled" }))

      toast({
        title: "Order cancelled",
        description: "You have cancelled the order",
      })

      // Redirect to orders page after a short delay
      setTimeout(() => router.push("/merchant/orders"), 1500)
    } catch (error) {
      console.error("Error cancelling order:", error)
      toast({
        title: "Failed to cancel order",
        description: "There was an error cancelling the order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const handleOpenDispute = async () => {
    setIsDisputing(true)
    try {
      setFormattedOrder((prev: any) => ({ ...prev, status: "disputed" }))

      toast({
        title: "Dispute opened",
        description: "You have opened a dispute for this order",
      })
    } catch (error) {
      console.error("Error opening dispute:", error)
      toast({
        title: "Failed to open dispute",
        description: "There was an error opening a dispute. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDisputing(false)
    }
  }

  // Add a new function to handle marking payment as sent (after the handleOpenDispute function)
  const handleMarkPaymentSent = async () => {
    setIsMarkingPaymentSent(true)
    try {
      // on‐chain call
      await markSalePaymentMade(order.id)

      // Update local UI state
      setFormattedOrder((prev: any) => ({ ...prev, status: "payment_sent" }))

      toast({
        title: "Payment marked as sent",
        description: "You have marked your payment as sent. The seller will verify and release the crypto.",
      })
    } catch (error) {
      console.error("Error marking payment as sent:", error)
      toast({
        title: "Error",
        description: "Failed to mark payment as sent",
        variant: "destructive",
      })
    } finally {
      setIsMarkingPaymentSent(false)
    }
  }

  // Handle order expiry
  const handleOrderExpiry = () => {
    toast({
      title: "Order Expired",
      description: "This order has expired.",
      variant: "destructive",
    })

    setFormattedOrder((prev: any) => ({ ...prev, status: "cancelled" }))
  }

  if (!address) return null

  if (isLoading || !formattedOrder) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/merchant/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Order Details</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p>Loading order details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/merchant/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Order Details</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Order not found</p>
            <Button asChild>
              <Link href="/merchant/orders">Back to Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isMerchantBuying = formattedOrder.orderType === "buy"
  const isMerchantSelling = !isMerchantBuying
  const canConfirmPayment = formattedOrder.status === "payment_sent" && isMerchantSelling
  const canReleaseFunds = formattedOrder.status === "payment_confirmed" && isMerchantSelling
  const canCancel = formattedOrder.status === "pending_payment" || formattedOrder.status === "payment_sent"
  const canDispute =
    formattedOrder.status !== "completed" &&
    formattedOrder.status !== "cancelled" &&
    formattedOrder.status !== "disputed"

  const totalPaymentAmount = (
    Number.parseFloat(formattedOrder.amount) * Number.parseFloat(formattedOrder.price)
  ).toFixed(2)

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/merchant/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Order Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Image
                    src={formattedOrder.tokenIcon || `/tokens/${formattedOrder.tokenSymbol.toLowerCase()}.png`}
                    alt={formattedOrder.tokenSymbol}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  {formattedOrder.amount} {formattedOrder.tokenSymbol}
                </CardTitle>
                <CardDescription>
                  @ {formattedOrder.price} {formattedOrder.fiatCurrency} per token
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant={
                    formattedOrder.status === "pending_payment"
                      ? "outline"
                      : formattedOrder.status === "payment_sent" || formattedOrder.status === "payment_confirmed"
                        ? "secondary"
                        : formattedOrder.status === "completed"
                          ? "default"
                          : "destructive"
                  }
                >
                  {formattedOrder.status
                    .split("_")
                    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </Badge>
                <Badge variant={isMerchantBuying ? "default" : "secondary"} className="flex items-center gap-1">
                  {isMerchantBuying ? (
                    <>
                      <ArrowUpRight className="h-3 w-3" />
                      Merchant Buys
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3" />
                      Merchant Sells
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Total Value</h3>
                  <p className="text-xl font-semibold">
                    {totalPaymentAmount} {formattedOrder.fiatCurrency}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Order ID</h3>
                  <p className="text-sm">{formattedOrder.shortId}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                  <p className="text-sm flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDate(formattedOrder.createdAt)}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                  <p className="text-sm">{formatDate(formattedOrder.updatedAt)}</p>
                </div>

                {(formattedOrder.paymentWindow || formattedOrder.releaseTime) && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Time Limits</h3>
                    <p className="text-sm">
                      {formattedOrder.paymentWindow && `Payment Window: ${formattedOrder.paymentWindow} minutes`}
                      {formattedOrder.paymentWindow && formattedOrder.releaseTime && " / "}
                      {formattedOrder.releaseTime && `Release Time: ${formattedOrder.releaseTime} minutes`}
                    </p>
                  </div>
                )}
              </div>

              {/* Time remaining - using the CountdownTimer component */}
              {(formattedOrder.status === "pending_payment" || formattedOrder.status === "payment_sent") &&
                expiryTimestamp && (
                  <>
                    <Separator />
                    <CountdownTimer expiryTimestamp={expiryTimestamp} onExpire={handleOrderExpiry} />
                  </>
                )}

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-2">Payment Method</h3>
                <div className="flex flex-wrap gap-2">
                  {formattedOrder.paymentMethods.map((method: string) => (
                    <Badge key={method} variant="secondary">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Payment details section - different for buy vs sell */}
              {formattedOrder.status !== "pending_payment" && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-4">
                      {isMerchantBuying ? "Your Payment Details" : "Payment Details"}
                    </h3>

                    <Card>
                      <CardContent className="pt-6">
                        {formattedOrder.paymentDetails && (
                          <div className="space-y-4">
                            {formattedOrder.paymentDetails.bankName && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Bank Name</span>
                                <div className="flex items-center gap-2">
                                  <span>{formattedOrder.paymentDetails.bankName}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(formattedOrder.paymentDetails.bankName)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}

                            {formattedOrder.paymentDetails.accountName && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Account Name/Email</span>
                                <div className="flex items-center gap-2">
                                  <span>{formattedOrder.paymentDetails.accountName}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(formattedOrder.paymentDetails.accountName)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}

                            {formattedOrder.paymentDetails.accountNumber && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Account Number</span>
                                <div className="flex items-center gap-2">
                                  <span>{formattedOrder.paymentDetails.accountNumber}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(formattedOrder.paymentDetails.accountNumber)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}

                            {formattedOrder.paymentDetails.instructions && (
                              <div>
                                <span className="text-sm font-medium">Instructions</span>
                                <p className="text-sm mt-1 p-2 bg-muted rounded-md">
                                  {formattedOrder.paymentDetails.instructions}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {/* Status-specific information - different for buy vs sell */}
              {formattedOrder.status === "pending_payment" && (
                <>
                  <Separator />
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">
                        {isMerchantBuying ? "Waiting for Your Payment" : "Awaiting Buyer Payment"}
                      </h3>
                    </div>
                    <p className="text-sm">
                      {isMerchantBuying ? (
                        <>
                          You need to send payment of {totalPaymentAmount} {formattedOrder.fiatCurrency} to the seller.
                        </>
                      ) : (
                        <>
                          The buyer needs to send payment of {totalPaymentAmount} {formattedOrder.fiatCurrency}.
                        </>
                      )}
                    </p>
                  </div>
                </>
              )}

              {formattedOrder.status === "payment_sent" && (
                <>
                  <Separator />
                  <div className="bg-secondary/20 p-4 rounded-lg border border-secondary/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-secondary" />
                      <h3 className="font-medium">
                        {isMerchantBuying ? "Your Payment Sent" : "Payment Received from Buyer"}
                      </h3>
                    </div>
                    <p className="text-sm mb-2">
                      {isMerchantBuying ? (
                        <>
                          You've marked your payment of{" "}
                          <span className="font-medium">
                            {totalPaymentAmount} {formattedOrder.fiatCurrency}
                          </span>{" "}
                          as sent. The seller will verify and release the crypto.
                        </>
                      ) : (
                        <>
                          The buyer has marked their payment of{" "}
                          <span className="font-medium">
                            {totalPaymentAmount} {formattedOrder.fiatCurrency}
                          </span>{" "}
                          as sent. Please verify the payment and confirm receipt.
                        </>
                      )}
                    </p>
                  </div>
                </>
              )}

              {formattedOrder.status === "payment_confirmed" && (
                <>
                  <Separator />
                  <div className="bg-secondary/20 p-4 rounded-lg border border-secondary/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-secondary" />
                      <h3 className="font-medium">{isMerchantBuying ? "Payment Confirmed" : "Payment Confirmed"}</h3>
                    </div>
                    <p className="text-sm mb-2">
                      {isMerchantBuying ? (
                        <>
                          Your payment of{" "}
                          <span className="font-medium">
                            {totalPaymentAmount} {formattedOrder.fiatCurrency}
                          </span>{" "}
                          has been confirmed. The crypto will be released to your wallet.
                        </>
                      ) : (
                        <>
                          You've confirmed receipt of the buyer's payment of{" "}
                          <span className="font-medium">
                            {totalPaymentAmount} {formattedOrder.fiatCurrency}
                          </span>
                          . The crypto will be released to the buyer.
                        </>
                      )}
                    </p>
                  </div>
                </>
              )}

              {/* Payment proof if available */}
              {formattedOrder.paymentProofUrl &&
                (formattedOrder.status === "payment_sent" ||
                  formattedOrder.status === "payment_confirmed" ||
                  formattedOrder.status === "completed") && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium mb-4">
                        {isMerchantBuying ? "Your Payment Proof" : "Buyer's Payment Proof"}
                      </h3>
                      <div className="border rounded-md p-2">
                        <Image
                          src={formattedOrder.paymentProofUrl || "/placeholder.svg"}
                          alt="Payment proof"
                          width={400}
                          height={300}
                          className="w-full h-auto rounded-md"
                        />
                      </div>
                    </div>
                  </>
                )}

              {/* Completed order */}
              {formattedOrder.status === "completed" && (
                <>
                  <Separator />
                  <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Order Completed</h3>
                    </div>
                    <p className="text-sm">
                      {isMerchantBuying ? (
                        <>
                          This order has been completed successfully. The {formattedOrder.tokenSymbol} has been
                          transferred to your wallet and your payment has been confirmed.
                        </>
                      ) : (
                        <>
                          This order has been completed successfully. The {formattedOrder.tokenSymbol} has been
                          transferred to the buyer's wallet and you have received the payment.
                        </>
                      )}
                    </p>
                  </div>
                </>
              )}

              {/* Cancelled order */}
              {formattedOrder.status === "cancelled" && (
                <>
                  <Separator />
                  <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <h3 className="font-medium">Order Cancelled</h3>
                    </div>
                    <p className="text-sm">
                      This order has been cancelled. Any funds in escrow have been returned to their original owners.
                    </p>
                  </div>
                </>
              )}

              {/* Disputed order */}
              {formattedOrder.status === "disputed" && (
                <>
                  <Separator />
                  <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <h3 className="font-medium text-destructive">Dispute Information</h3>
                    </div>
                    <p className="text-sm">
                      This order is currently under dispute. Our support team will review the case and contact both
                      parties. Please check your email for updates or contact support for more information.
                    </p>
                  </div>
                </>
              )}

              {/* Escrow information */}
              <Separator />
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Escrow Protection</h3>
                </div>
                <p className="text-sm">
                  This trade is protected by our escrow service. The crypto is locked in escrow until the payment is
                  confirmed, ensuring a safe trading experience for both parties.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Counterparty info card */}
          <Card>
            <CardHeader>
              <CardTitle>{isMerchantBuying ? "Seller" : "Buyer"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-muted rounded-full p-3">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium">
                    {formattedOrder.counterpartyAddress.slice(0, 6)}...{formattedOrder.counterpartyAddress.slice(-4)}
                  </p>
                  <div className="flex items-center gap-1 text-primary">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm">4.8</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => copyToClipboard(formattedOrder.counterpartyAddress)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                  <a
                    href={`https://explorer.sui.io/address/${formattedOrder.counterpartyAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Explorer
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons - different for buy vs sell */}
          <Card>
            <CardHeader>
              <CardTitle>Order Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Chat button */}
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/chat/${formattedOrder.id}`} className="flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat with {isMerchantBuying ? "Seller" : "Buyer"}
                  {formattedOrder?.status === "payment_sent" && (
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive transform translate-x-1 -translate-y-1" />
                  )}
                </Link>
              </Button>

              {/* Buy order specific actions */}
              {isMerchantBuying && (
                <>
                  {formattedOrder.status === "pending_payment" && (
                    <>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          You need to send payment of {totalPaymentAmount} {formattedOrder.fiatCurrency} to the seller.
                          Once you've sent the payment, mark it as sent.
                        </p>
                      </div>
                      <Button className="w-full" onClick={handleMarkPaymentSent} disabled={isMarkingPaymentSent}>
                        {isMarkingPaymentSent ? "Processing..." : "I've Sent the Payment"}
                      </Button>
                    </>
                  )}

                  {formattedOrder.status === "payment_sent" && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        Your payment has been marked as sent. The seller will verify and release the crypto to your
                        wallet.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Sell order specific actions */}
              {isMerchantSelling && (
                <>
                  {canConfirmPayment && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 p-2 bg-muted rounded-md mb-2">
                        <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
                        <p className="text-xs">Verify that you've received the payment before confirming.</p>
                      </div>
                      <Button className="w-full" onClick={handleConfirmPayment} disabled={isConfirming}>
                        {isConfirming ? "Processing..." : "Confirm Payment Received"}
                      </Button>
                    </div>
                  )}

                  {canReleaseFunds && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 p-2 bg-muted rounded-md mb-2">
                        <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
                        <p className="text-xs">Once you release the funds, this action cannot be undone.</p>
                      </div>
                      <Button className="w-full" onClick={handleReleaseFunds} disabled={isReleasing}>
                        {isReleasing ? "Processing..." : "Release Funds to Buyer"}
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Common actions for both buy and sell */}
              {canCancel && (
                <Button
                  variant="outline"
                  className="w-full text-destructive"
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                >
                  {isCancelling ? "Processing..." : "Cancel Order"}
                </Button>
              )}

              {canDispute && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleOpenDispute}
                  disabled={isDisputing || formattedOrder.status === "disputed"}
                >
                  {isDisputing
                    ? "Processing..."
                    : formattedOrder.status === "disputed"
                      ? "Dispute Opened"
                      : "Open Dispute"}
                </Button>
              )}

              {formattedOrder.status === "completed" && (
                <Button asChild className="w-full">
                  <Link href="/merchant/orders">Back to Orders</Link>
                </Button>
              )}

              {(formattedOrder.status === "cancelled" || formattedOrder.status === "disputed") && (
                <Button asChild className="w-full">
                  <Link href="/merchant/orders">Back to Orders</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Order history */}
          <Accordion type="single" collapsible>
            <AccordionItem value="order-history">
              <AccordionTrigger>Order History</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span>Order created</span>
                    </div>
                    <span className="text-muted-foreground">{formatDate(formattedOrder.createdAt)}</span>
                  </div>

                  {formattedOrder.status !== "pending_payment" && (
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                        <span>Payment sent</span>
                      </div>
                      <span className="text-muted-foreground">
                        {formatDate(
                          new Date(new Date(formattedOrder.createdAt).getTime() + 10 * 60 * 1000).toISOString(),
                        )}
                      </span>
                    </div>
                  )}

                  {(formattedOrder.status === "payment_confirmed" || formattedOrder.status === "completed") && (
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                        <span>Payment confirmed</span>
                      </div>
                      <span className="text-muted-foreground">
                        {formatDate(
                          new Date(new Date(formattedOrder.createdAt).getTime() + 20 * 60 * 1000).toISOString(),
                        )}
                      </span>
                    </div>
                  )}

                  {formattedOrder.status === "completed" && (
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span>Order completed</span>
                      </div>
                      <span className="text-muted-foreground">
                        {formatDate(
                          new Date(new Date(formattedOrder.createdAt).getTime() + 30 * 60 * 1000).toISOString(),
                        )}
                      </span>
                    </div>
                  )}

                  {formattedOrder.status === "cancelled" && (
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-destructive"></div>
                        <span>Order cancelled</span>
                      </div>
                      <span className="text-muted-foreground">
                        {formatDate(
                          new Date(new Date(formattedOrder.createdAt).getTime() + 15 * 60 * 1000).toISOString(),
                        )}
                      </span>
                    </div>
                  )}

                  {formattedOrder.status === "disputed" && (
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-destructive"></div>
                        <span>Dispute opened</span>
                      </div>
                      <span className="text-muted-foreground">
                        {formatDate(
                          new Date(new Date(formattedOrder.createdAt).getTime() + 25 * 60 * 1000).toISOString(),
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* View on explorer */}
          <Button variant="outline" className="w-full" asChild>
            <a
              href={`https://explorer.sui.io/txblock/${formattedOrder.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Explorer
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
