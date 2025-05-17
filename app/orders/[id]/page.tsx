"use client"

import { useState, useEffect, use, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSuiWallet } from "@/hooks/use-sui-wallet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import {
  ArrowLeft,
  Clock,
  AlertCircle,
  Copy,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  MessageCircle,
  Upload,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useContract } from "@/hooks/useContract"
import { ChatButton } from "@/components/chat/chat-button"
import { useOrders } from "@/hooks/use-orders"

interface OrderDetailPageProps {
  params: Promise<{
    id: string
  }>
}

function CountdownTimer({ expiryTimestamp, onExpire }: { expiryTimestamp: number; onExpire?: () => void }) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [progress, setProgress] = useState(100)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now()
      const difference = expiryTimestamp - now

      if (difference <= 0) {
        setIsExpired(true)
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
        setProgress(0)
        onExpire?.()
        return
      }

      const hours = Math.floor(difference / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)
      setTimeLeft({ hours, minutes, seconds })

      const totalDuration = expiryTimestamp - (expiryTimestamp - 60 * 60 * 1000)
      const elapsed = totalDuration - difference
      setProgress(Math.max(0, 100 - (elapsed / totalDuration) * 100))
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [expiryTimestamp, onExpire])

  const fmt = (u: number) => u.toString().padStart(2, "0")

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
          {timeLeft.hours > 0 && `${fmt(timeLeft.hours)}:`}
          {fmt(timeLeft.minutes)}:{fmt(timeLeft.seconds)}
        </span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  )
}

const formatTokenAmount = (amount: bigint | number | string) =>
  (Number(amount) / 1e9).toString()

const formatPrice = (price: bigint | number | string) =>
  (Number(price) / 1e11).toFixed(2)

const getStatusFromCode = (order: any) => {
  try {
    // support raw code or Move object shape
    const statusCode = order?.status
      ?? order?.asMoveObject?.contents?.json?.status;
    if (statusCode === undefined) return "unknown";
    const codeNum = typeof statusCode === "string"
      ? parseInt(statusCode, 10)
      : statusCode;
    switch (codeNum) {
      case 0: return "pending_payment";
      case 1: return "payment_sent";
      case 2: return "payment_confirmed";
      case 3: return "completed";
      case 4: return "cancelled";
      case 5: return "disputed";
      default: return "unknown";
    }
  } catch {
    return "unknown";
  }
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params)
  const { address } = useSuiWallet()
  const router = useRouter()
  const { toast } = useToast()
  const { getOrder, markPaymentAsSent, completeOrder, cancelOrder, uploadPaymentProof } = useOrders()
  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isDisputing, setIsDisputing] = useState(false)
  const [expiryTimestamp, setExpiryTimestamp] = useState<number | null>(null)
  const [formattedOrder, setFormattedOrder] = useState<Record<string, any> | null>(null)

  useEffect(() => {
    if (!address) return

    const fetchOrder = async () => {
      setIsLoading(true)
      try {
        const orderData = await getOrder({ id })
        if (!orderData) throw new Error("Order not found")

        setOrder(orderData)

        const paymentDetails: Record<string, {
          accountName?: string
          accountNumber?: string
          bankName?: string
          instructions: string
        }> = {
          "bank transfer": {
            accountName: "Merchant Bank Account",
            accountNumber: "Contact merchant",
            bankName: "Contact merchant",
            instructions: "Please contact merchant for payment details and include your order ID",
          },
        }

        const fmt = {
          id: orderData.id,
          shortId: `${orderData.id.slice(0, 6)}...${orderData.id.slice(-4)}`,
          listingId: orderData.listingId,
          tokenSymbol: "SUI",
          tokenIcon: "/tokens/sui.png",
          amount: formatTokenAmount(orderData.tokenAmount),
          price: formatPrice(orderData.price),
          fiatCurrency: "USD",
          merchantAddress: orderData.seller,
          merchantRating: 4.8,
          buyerAddress: orderData.buyer,
          status: getStatusFromCode(orderData),
          createdAt: new Date(Number(orderData.createdAt) * 1e3).toISOString(),
          expiresAt: new Date(Number(orderData.expiry) * 1e3).toISOString(),
          paymentMethods: orderData.metadata?.paymentMethods?.split(",") || ["Bank Transfer"],
          orderType: orderData.buyer === address ? "buy" : "sell",
          paymentDetails,
          paymentMade: orderData.paymentMade,
          paymentReceived: orderData.paymentReceived,
        }

        fmt.paymentMethods.forEach((m: string) => {
          const key = m.toLowerCase().trim()
          if (!fmt.paymentDetails[key]) {
            fmt.paymentDetails[key] = {
              accountName: "Contact merchant",
              instructions: `Please contact merchant for ${m} payment details`,
            }
          }
        })

        setFormattedOrder(fmt)
        setSelectedPaymentMethod(fmt.paymentMethods[0])
        setExpiryTimestamp(new Date(fmt.expiresAt).getTime())
      } catch (err) {
        console.error(err)
        toast({ title: "Error", description: "Failed to load order", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [address, id, getOrder])

  const fetchOrderStatus = useCallback(async () => {
    if (!order?.id) return

    console.log(`[poll] → fetching status for order ${order.id}`)
    try {
      const u = await getOrder({ id: order.id })
      const newStatus = getStatusFromCode(u)

      console.log(`[poll] ← raw order object:`, u)
      console.log(`[poll] ← parsed newStatus: "${newStatus}"`)

      setFormattedOrder((prev: any) => {
        if (!prev) return prev
        const updated = { ...prev, status: newStatus }
        console.log(`[poll] ✓ formattedOrder.status set to "${newStatus}"`)
        return updated
      })
    } catch (err) {
      console.error(`[poll] ✗ error fetching status:`, err)
    }
  }, [order?.id, getOrder])

  useEffect(() => {
    if (!order?.id) return
    // just fetch status once and don’t start an interval
    fetchOrderStatus()
  }, [order?.id, fetchOrderStatus])

  useEffect(() => {
    if (!order) {
      return;
    }

    if (order.status === "pending_payment") {
    }
  }, [order]);

  const fmtDate = (s: string) => new Date(s).toLocaleString()
  const copyToClipboard = (t: string) => {
    navigator.clipboard.writeText(t)
    toast({ title: "Copied", description: "Copied to clipboard" })
  }

  const handleMarkPaymentSent = async () => {
    if (!selectedPaymentMethod) {
      toast({ title: "Select method", description: "Please choose a payment method", variant: "destructive" })
      return
    }
    setIsConfirming(true)
    try {
      await markPaymentAsSent(order.id, selectedPaymentMethod)
      setFormattedOrder((p: any) => ({ ...p, status: "payment_sent" }))
      toast({ title: "Marked", description: "Payment marked as sent" })
    } catch {
      toast({ title: "Error", description: "Could not mark payment", variant: "destructive" })
    } finally {
      setIsConfirming(false)
    }
  }

  const handleConfirmPayment = async () => {
    setIsConfirming(true)
    try {
      await completeOrder(order.id)
      // your hook will markSalePaymentReceived and emit the TX
      setFormattedOrder((p: any) => ({ ...p, status: "payment_confirmed" }))
      toast({ title: "Confirmed", description: "Payment confirmed" })
    } catch {
      toast({ title: "Error", description: "Could not confirm", variant: "destructive" })
    } finally {
      setIsConfirming(false)
    }
  }

  const handleReleaseFunds = async () => {
    setIsReleasing(true)
    try {
      // await releaseFunds(order.id)
      setFormattedOrder((p: any) => ({ ...p, status: "completed" }))
      toast({ title: "Released", description: "Funds released" })
    } catch {
      toast({ title: "Error", description: "Could not release funds", variant: "destructive" })
    } finally {
      setIsReleasing(false)
    }
  }

  const handleCancelOrder = async () => {
    setIsCancelling(true)
    try {
      // invoke the hook that sends the on-chain cancel tx
      const txDigest = await cancelOrder(order.id)
      console.log('[handleCancelOrder] tx digest:', txDigest)

      // update UI immediately
      setFormattedOrder((prev) => {
        if (!prev) return prev
        return { ...prev, status: 'cancelled' }
      })
      toast({ title: 'Cancelled', description: 'Order cancelled' })

      // after a moment navigate back
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err) {
      console.error('[handleCancelOrder] error:', err)
      toast({ title: 'Error', description: 'Could not cancel order', variant: 'destructive' })
    } finally {
      setIsCancelling(false)
    }
  }

  const handleOpenDispute = async () => {
    setIsDisputing(true)
    try {
      setFormattedOrder((p: any) => ({ ...p, status: "disputed" }))
      toast({ title: "Dispute opened", description: "Order disputed" })
    } catch {
      toast({ title: "Error", description: "Could not open dispute", variant: "destructive" })
    } finally {
      setIsDisputing(false)
    }
  }

  const handleUploadPaymentProof = () => {
    const mockProofUrl = "/placeholder.svg?height=300&width=400"
    setFormattedOrder((p: any) => ({ ...p, paymentProofUrl: mockProofUrl }))
    toast({ title: "Uploaded", description: "Proof uploaded" })
  }

  const handleOrderExpiry = () => {
    toast({ title: "Expired", description: "Order has expired", variant: "destructive" })
    setFormattedOrder((p: any) => ({ ...p, status: "cancelled" }))
  }

  if (isLoading || !formattedOrder) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
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

  const isBuyOrder = formattedOrder.orderType === "buy"
  const isSeller = formattedOrder.merchantAddress === address
  const totalPaymentAmount = (
    Number.parseFloat(formattedOrder.amount) * Number.parseFloat(formattedOrder.price)
  ).toFixed(2)

  // Determine available actions based on order status and user role
  const canMarkPaymentSent = formattedOrder.status === "pending_payment" && isBuyOrder && !isSeller
  const canConfirmPayment = formattedOrder.status === "payment_sent" && !isBuyOrder && isSeller
  const canReleaseFunds = formattedOrder.status === "payment_confirmed" && !isBuyOrder && isSeller
  const canCancel =
    (formattedOrder.status === "pending_payment" || formattedOrder.status === "payment_sent") &&
    ((isBuyOrder && !isSeller) || (!isBuyOrder && isSeller))
  const canDispute =
    formattedOrder.status !== "completed" &&
    formattedOrder.status !== "cancelled" &&
    formattedOrder.status !== "disputed"

  // Get status badge variant
  const getStatusBadgeVariant = () => {
    switch (formattedOrder.status) {
      case "pending_payment":
        return "outline"
      case "payment_sent":
      case "payment_confirmed":
        return "secondary"
      case "completed":
        return "default"
      case "cancelled":
      case "disputed":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Format status display text
  const getStatusDisplayText = () => {
    return formattedOrder.status
      .split("_")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Render different views based on order type
  if (isBuyOrder) {
    // Buy Order View - This is the existing view
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
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
                  <Badge variant={getStatusBadgeVariant()}>{getStatusDisplayText()}</Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <ArrowDownRight className="h-3 w-3" />
                    Buy from Merchant
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Order summary */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Order Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Order ID</span>
                      <span className="text-sm">{formattedOrder.shortId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Amount</span>
                      <span className="text-sm font-semibold">
                        {formattedOrder.amount} {formattedOrder.tokenSymbol}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Payment</span>
                      <span className="text-sm font-semibold text-primary">
                        {totalPaymentAmount} {formattedOrder.fiatCurrency}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Created</span>
                      <span className="text-sm">{fmtDate(formattedOrder.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Time remaining - using the CountdownTimer component */}
                {(formattedOrder.status === "pending_payment" || formattedOrder.status === "payment_sent") &&
                  expiryTimestamp && <CountdownTimer expiryTimestamp={expiryTimestamp} onExpire={handleOrderExpiry} />}

                {/* Payment instructions for pending payment */}
                {formattedOrder.status === "pending_payment" && (
                  <>
                    <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-primary" />
                        <h3 className="font-medium">Payment Required</h3>
                      </div>
                      <p className="text-sm mb-4">
                        Please complete your payment of{" "}
                        <span className="font-medium">
                          {totalPaymentAmount} {formattedOrder.fiatCurrency}
                        </span>{" "}
                        to the merchant using one of the accepted payment methods below.
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-sm font-medium mb-4">Payment Methods</h3>

                      <Tabs defaultValue={formattedOrder.paymentMethods[0]} onValueChange={setSelectedPaymentMethod}>
                        <TabsList className="mb-4">
                          {formattedOrder.paymentMethods.map((method: string) => (
                            <TabsTrigger key={method} value={method}>
                              {method}
                            </TabsTrigger>
                          ))}
                        </TabsList>

                        {formattedOrder.paymentMethods.map((method: string) => {
                          // Use lowercase method name for lookup
                          const methodKey = method.toLowerCase()
                          const details = formattedOrder.paymentDetails[methodKey]

                          return (
                            <TabsContent key={method} value={method} className="space-y-4">
                              <Card>
                                <CardContent className="pt-6">
                                  {details && (
                                    <div className="space-y-4">
                                      {details.bankName && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm font-medium">Bank Name</span>
                                          <div className="flex items-center gap-2">
                                            <span>{details.bankName}</span>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6"
                                              onClick={() => copyToClipboard(details.bankName)}
                                            >
                                              <Copy className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      )}

                                      {details.accountName && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm font-medium">Account Name/Email</span>
                                          <div className="flex items-center gap-2">
                                            <span>{details.accountName}</span>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6"
                                              onClick={() => copyToClipboard(details.accountName)}
                                            >
                                              <Copy className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      )}

                                      {details.accountNumber && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm font-medium">Account Number</span>
                                          <div className="flex items-center gap-2">
                                            <span>{details.accountNumber}</span>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6"
                                              onClick={() => copyToClipboard(details.accountNumber)}
                                            >
                                              <Copy className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      )}

                                      {details.instructions && (
                                        <div>
                                          <span className="text-sm font-medium">Instructions</span>
                                          <p className="text-sm mt-1 p-2 bg-muted rounded-md">{details.instructions}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <div className="mt-4">
                                    <p className="text-sm text-muted-foreground">
                                      Please make your payment of{" "}
                                      <span className="font-medium">
                                        {totalPaymentAmount} {formattedOrder.fiatCurrency}
                                      </span>{" "}
                                      using the details above.
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>
                          )
                        })}
                      </Tabs>
                    </div>
                  </>
                )}

                {/* Payment sent confirmation */}
                {formattedOrder.status === "payment_sent" && (
                  <div className="bg-secondary/20 p-4 rounded-lg border border-secondary/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-secondary" />
                      <h3 className="font-medium">Payment Sent</h3>
                    </div>
                    <p className="text-sm mb-2">
                      You've marked your payment of{" "}
                      <span className="font-medium">
                        {totalPaymentAmount} {formattedOrder.fiatCurrency}
                      </span>{" "}
                      as sent. The merchant will verify your payment and release the crypto.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This typically takes 5-30 minutes depending on the payment method.
                    </p>
                  </div>
                )}

                {/* Payment confirmed */}
                {formattedOrder.status === "payment_confirmed" && (
                  <div className="bg-secondary/20 p-4 rounded-lg border border-secondary/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-secondary" />
                      <h3 className="font-medium">Payment Confirmed</h3>
                    </div>
                    <p className="text-sm mb-2">
                      The merchant has confirmed receipt of your payment of{" "}
                      <span className="font-medium">
                        {totalPaymentAmount} {formattedOrder.fiatCurrency}
                      </span>
                      . The crypto will be released to your wallet soon.
                    </p>
                  </div>
                )}

                {/* Completed order */}
                {formattedOrder.status === "completed" && (
                  <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Order Completed</h3>
                    </div>
                    <p className="text-sm">
                      This order has been completed successfully. The {formattedOrder.tokenSymbol} has been transferred
                      to your wallet.
                    </p>
                  </div>
                )}

                {/* Cancelled order */}
                {formattedOrder.status === "cancelled" && (
                  <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <h3 className="font-medium">Order Cancelled</h3>
                    </div>
                    <p className="text-sm">
                      This order has been cancelled. Any funds in escrow have been returned to their original owners.
                    </p>
                  </div>
                )}

                {/* Disputed order */}
                {formattedOrder.status === "disputed" && (
                  <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <h3 className="font-medium">Order Disputed</h3>
                    </div>
                    <p className="text-sm">
                      This order is currently under dispute. Our support team will review the case and contact both
                      parties. Please check your email for updates.
                    </p>
                  </div>
                )}

                {/* Payment proof if available */}
                {formattedOrder.paymentProofUrl && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium mb-2">Payment Proof</h3>
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
            {/* Merchant info card */}
            <Card>
              <CardHeader>
                <CardTitle>Merchant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-muted rounded-full p-3">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {formattedOrder.merchantAddress.slice(0, 6)}...{formattedOrder.merchantAddress.slice(-4)}
                    </p>
                    <div className="flex items-center gap-1 text-primary">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm">{formattedOrder.merchantRating?.toFixed(1) || "4.8"}</span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Verified merchant with 50+ completed trades</p>
                  <p>Average response time: &lt;30 minutes</p>
                </div>
              </CardContent>
            </Card>

            {/* Action buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Order Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formattedOrder.status === "pending_payment" && (
                  <>
                    <Button className="w-full" onClick={handleMarkPaymentSent} disabled={isConfirming}>
                      {isConfirming ? "Processing..." : "I've Sent the Payment"}
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleUploadPaymentProof}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Payment Proof
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-destructive"
                      onClick={handleCancelOrder}
                      disabled={isCancelling}
                    >
                      {isCancelling ? "Cancelling..." : "Cancel Order"}
                    </Button>
                  </>
                )}

                {formattedOrder.status === "payment_sent" && (
                  <>
                    <ChatButton orderId={order.id} className="w-full" hasNewMessages={true} />
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        Your payment has been marked as sent. The merchant will verify and release the crypto to your
                        wallet.
                      </p>
                    </div>
                    <Button variant="outline" className="w-full" onClick={handleUploadPaymentProof}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Additional Proof
                    </Button>
                  </>
                )}

                {formattedOrder.status === "payment_confirmed" && (
                  <>
                    <ChatButton orderId={order.id} className="w-full mb-2" />
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        Your payment has been confirmed. The merchant will release the crypto to your wallet soon.
                      </p>
                    </div>
                  </>
                )}

                {formattedOrder.status === "completed" && (
                  <>
                    <ChatButton orderId={order.id} className="w-full mb-2" />
                    <Button asChild className="w-full">
                      <Link href="/dashboard">View Dashboard</Link>
                    </Button>
                  </>
                )}

                {(formattedOrder.status === "cancelled" || formattedOrder.status === "disputed") && (
                  <>
                    <ChatButton orderId={order.id} className="w-full mb-2" />
                    <Button asChild className="w-full">
                      <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                  </>
                )}

                {formattedOrder.status !== "pending_payment" && formattedOrder.status !== "cancelled" && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/chat/${order.id}`} className="flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat with Merchant
                      {formattedOrder.status === "payment_sent" && (
                        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive transform translate-x-1 -translate-y-1" />
                      )}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

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
  } else {
    // Sell Order View
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
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
                  <Badge variant={getStatusBadgeVariant()}>{getStatusDisplayText()}</Badge>
                  <Badge variant="default" className="flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3" />
                    Sell to Buyer
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Order summary */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Order Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Order ID</span>
                      <span className="text-sm">{formattedOrder.shortId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Amount</span>
                      <span className="text-sm font-semibold">
                        {formattedOrder.amount} {formattedOrder.tokenSymbol}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Payment</span>
                      <span className="text-sm font-semibold text-primary">
                        {totalPaymentAmount} {formattedOrder.fiatCurrency}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Created</span>
                      <span className="text-sm">{fmtDate(formattedOrder.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Time remaining - using the CountdownTimer component */}
                {(formattedOrder.status === "pending_payment" || formattedOrder.status === "payment_sent") &&
                  expiryTimestamp && <CountdownTimer expiryTimestamp={expiryTimestamp} onExpire={handleOrderExpiry} />}

                {/* Pending payment state */}
                {formattedOrder.status === "pending_payment" && (
                  <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Awaiting Buyer Payment</h3>
                    </div>
                    <p className="text-sm mb-2">
                      Your {formattedOrder.amount} {formattedOrder.tokenSymbol} is locked in escrow. The buyer will send
                      you{" "}
                      <span className="font-medium">
                        {totalPaymentAmount} {formattedOrder.fiatCurrency}
                      </span>{" "}
                      via one of your accepted payment methods.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You'll be notified when the buyer marks the payment as sent.
                    </p>
                  </div>
                )}

                {/* Payment sent state */}
                {formattedOrder.status === "payment_sent" && (
                  <div className="bg-secondary/20 p-4 rounded-lg border border-secondary/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-secondary" />
                      <h3 className="font-medium">Payment Sent by Buyer</h3>
                    </div>
                    <p className="text-sm mb-2">
                      The buyer has marked their payment of{" "}
                      <span className="font-medium">
                        {totalPaymentAmount} {formattedOrder.fiatCurrency}
                      </span>{" "}
                      as sent. Please check your payment method and confirm once received.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      After confirming receipt, you'll need to release the crypto from escrow.
                    </p>
                  </div>
                )}

                {/* Payment confirmed state */}
                {formattedOrder.status === "payment_confirmed" && (
                  <>
                  </>
                )}

                {/* Completed order */}
                {formattedOrder.status === "completed" && (
                  <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Order Completed</h3>
                    </div>
                    <p className="text-sm">
                      This order has been completed successfully. The {formattedOrder.tokenSymbol} has been transferred
                      to the buyer and you've received{" "}
                      <span className="font-medium">
                        {totalPaymentAmount} {formattedOrder.fiatCurrency}
                      </span>
                      .
                    </p>
                  </div>
                )}

                {/* Cancelled order */}
                {formattedOrder.status === "cancelled" && (
                  <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <h3 className="font-medium">Order Cancelled</h3>
                    </div>
                    <p className="text-sm">
                      This order has been cancelled. Any funds in escrow have been returned to their original owners.
                    </p>
                  </div>
                )}

                {/* Disputed order */}
                {formattedOrder.status === "disputed" && (
                  <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <h3 className="font-medium">Order Disputed</h3>
                    </div>
                    <p className="text-sm">
                      This order is currently under dispute. Our support team will review the case and contact both
                      parties. Please check your email for updates.
                    </p>
                  </div>
                )}

                {/* Payment proof if available */}
                {formattedOrder.paymentProofUrl && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium mb-2">Payment Proof</h3>
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
            {/* Buyer info card */}
            <Card>
              <CardHeader>
                <CardTitle>Buyer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-muted rounded-full p-3">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {formattedOrder.buyerAddress.slice(0, 6)}...{formattedOrder.buyerAddress.slice(-4)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Order Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formattedOrder.status === "pending_payment" && (
                  <>
                    <ChatButton orderId={order.id} className="w-full mb-2" />
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        Waiting for the buyer to send payment of {totalPaymentAmount} {formattedOrder.fiatCurrency}.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full text-destructive"
                      onClick={handleCancelOrder}
                      disabled={isCancelling}
                    >
                      {isCancelling ? "Cancelling..." : "Cancel Order"}
                    </Button>
                  </>
                )}

                {formattedOrder.status === "payment_sent" && (
                  <>
                    <ChatButton orderId={order.id} className="w-full mb-2" hasNewMessages={true} />
                    <Button className="w-full" onClick={handleConfirmPayment} disabled={isConfirming}>
                      {isConfirming ? "Confirm Payment Received" : "Confirm Payment Received"}
                    </Button>
                    <div className="flex items-start gap-2 p-2 bg-muted rounded-md mb-2">
                      <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
                      <p className="text-xs">Verify that you've received the payment before confirming.</p>
                    </div>
                  </>
                )}

                {formattedOrder.status === "completed" && (
                  <Button asChild className="w-full">
                    <Link href="/dashboard">View Dashboard</Link>
                  </Button>
                )}

                {(formattedOrder.status === "cancelled" || formattedOrder.status === "disputed") && (
                  <Button asChild className="w-full">
                    <Link href="/dashboard">Back to Dashboard</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

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
}
