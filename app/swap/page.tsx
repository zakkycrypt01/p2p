"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"

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

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { address } = useSuiWallet()
  const router = useRouter()
  const { toast } = useToast()
  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isDisputing, setIsDisputing] = useState(false)
  const [expiryTimestamp, setExpiryTimestamp] = useState<number | null>(null)

  useEffect(() => {
    if (!address) {
      router.push("/")
      return
    }

    const fetchOrder = async () => {
      setIsLoading(true)
      try {
        // Mock data for the order
        const mockOrder = {
          id: params.id,
          shortId: `${params.id.slice(0, 6)}...${params.id.slice(-4)}`,
          listingId: "listing-123",
          tokenSymbol: "SUI",
          tokenIcon: "/tokens/sui.png",
          amount: "10",
          price: "1.25",
          fiatCurrency: "USD",
          merchantAddress: address,
          buyerAddress: "0xabc...def",
          status: "payment_sent", // pending_payment, payment_sent, payment_confirmed, completed, cancelled, disputed
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(), // 30 minutes from now
          paymentMethods: ["Bank Transfer", "PayPal"],
          orderType: "sell", // buy or sell
          paymentWindow: 30,
          releaseTime: 15,
          counterpartyAddress: "0xabc...def",
          paymentDetails: {
            bankName: "Chase Bank",
            accountName: "John Smith",
            accountNumber: "1234567890",
            instructions: "Please include the order ID in the payment reference",
          },
          paymentProofUrl: "/placeholder.svg?height=300&width=400",
          paymentMade: true,
          paymentReceived: false,
        }

        setOrder(mockOrder)
        setExpiryTimestamp(new Date(mockOrder.expiresAt).getTime())
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
  }, [address, params.id, router, toast])

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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update local state
      setOrder((prev: any) => ({ ...prev, status: "payment_confirmed" }))

      toast({
        title: "Payment confirmed",
        description: "You've confirmed receipt of payment",
      })
    } catch (error) {
      console.error("Error confirming payment:", error)
      toast({
        title: "Failed to confirm payment",
        description: "There was an error confirming the payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConfirming(false)
    }
  }

  const handleReleaseFunds = async () => {
    setIsReleasing(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update local state
      setOrder((prev: any) => ({ ...prev, status: "completed" }))

      toast({
        title: "Funds released",
        description: "You've successfully released the funds",
      })
    } catch (error) {
      console.error("Error releasing funds:", error)
      toast({
        title: "Failed to release funds",
        description: "There was an error releasing the funds. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsReleasing(false)
    }
  }

  const handleCancelOrder = async () => {
    setIsCancelling(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update local state
      setOrder((prev: any) => ({ ...prev, status: "cancelled" }))

      toast({
        title: "Order cancelled",
        description: "Your order has been cancelled",
      })

      // Redirect to orders page after a short delay
      setTimeout(() => router.push("/merchant/orders"), 1500)
    } catch (error) {
      console.error("Error cancelling order:", error)
      toast({
        title: "Failed to cancel order",
        description: "There was an error cancelling your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const handleOpenDispute = async () => {
    setIsDisputing(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update local state
      setOrder((prev: any) => ({ ...prev, status: "disputed" }))

      toast({
        title: "Dispute opened",
        description: "You've opened a dispute for this order",
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

  // Handle order expiry
  const handleOrderExpiry = () => {
    toast({
      title: "Order Expired",
      description: "This order has expired. You can no longer complete the payment.",
      variant: "destructive",
    })

    // Optionally update the order status or take other actions
    setOrder((prev: any) => ({ ...prev, status: "cancelled" }))
  }

  if (!address) return null

  if (isLoading || !order) {
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

  const isMerchantBuying = order.orderType === "buy"
  const isSeller = order.merchantAddress === address
  const totalPaymentAmount = (Number.parseFloat(order.amount) * Number.parseFloat(order.price)).toFixed(2)

  // Determine available actions based on order status and user role
  const canConfirmPayment = order.status === "payment_sent" && isMerchantBuying && isSeller
  const canReleaseFunds = order.status === "payment_confirmed" && !isMerchantBuying && isSeller
  const canCancel =
    (order.status === "pending_payment" || order.status === "payment_sent") &&
    ((isMerchantBuying && isSeller) || (!isMerchantBuying && isSeller))
  const canDispute = order.status !== "completed" && order.status !== "cancelled" && order.status !== "disputed"

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
                    src={order.tokenIcon || `/tokens/${order.tokenSymbol.toLowerCase()}.png`}
                    alt={order.tokenSymbol}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  {order.amount} {order.tokenSymbol}
                </CardTitle>
                <CardDescription>
                  @ {order.price} {order.fiatCurrency} per token
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant={
                    order.status === "pending_payment"
                      ? "outline"
                      : order.status === "payment_sent" || order.status === "payment_confirmed"
                        ? "secondary"
                        : order.status === "completed"
                          ? "default"
                          : "destructive"
                  }
                >
                  {order.status
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
                    {totalPaymentAmount} {order.fiatCurrency}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Order ID</h3>
                  <p className="text-sm">{order.shortId}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                  <p className="text-sm flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                  <p className="text-sm">{formatDate(order.updatedAt)}</p>
                </div>

                {(order.paymentWindow || order.releaseTime) && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Time Limits</h3>
                    <p className="text-sm">
                      {order.paymentWindow && `Payment Window: ${order.paymentWindow} minutes`}
                      {order.paymentWindow && order.releaseTime && " / "}
                      {order.releaseTime && `Release Time: ${order.releaseTime} minutes`}
                    </p>
                  </div>
                )}
              </div>

              {/* Time remaining - using the CountdownTimer component */}
              {(order.status === "pending_payment" || order.status === "payment_sent") && expiryTimestamp && (
                <>
                  <Separator />
                  <CountdownTimer expiryTimestamp={expiryTimestamp} onExpire={handleOrderExpiry} />
                </>
              )}

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-2">Payment Method</h3>
                <div className="flex flex-wrap gap-2">
                  {order.paymentMethods.map((method: string) => (
                    <Badge key={method} variant="secondary">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Payment details section */}
              {order.status !== "pending_payment" && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-4">Payment Details</h3>

                    <Card>
                      <CardContent className="pt-6">
                        {order.paymentDetails && (
                          <div className="space-y-4">
                            {order.paymentDetails.bankName && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Bank Name</span>
                                <div className="flex items-center gap-2">
                                  <span>{order.paymentDetails.bankName}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(order.paymentDetails.bankName)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}

                            {order.paymentDetails.accountName && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Account Name/Email</span>
                                <div className="flex items-center gap-2">
                                  <span>{order.paymentDetails.accountName}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(order.paymentDetails.accountName)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}

                            {order.paymentDetails.accountNumber && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Account Number</span>
                                <div className="flex items-center gap-2">
                                  <span>{order.paymentDetails.accountNumber}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(order.paymentDetails.accountNumber)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}

                            {order.paymentDetails.instructions && (
                              <div>
                                <span className="text-sm font-medium">Instructions</span>
                                <p className="text-sm mt-1 p-2 bg-muted rounded-md">
                                  {order.paymentDetails.instructions}
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

              {/* Status-specific information */}
              {order.status === "pending_payment" && (
                <>
                  <Separator />
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Awaiting Payment</h3>
                    </div>
                    <p className="text-sm">
                      {isMerchantBuying ? (
                        <>
                          You need to wait for the seller to send payment of {totalPaymentAmount} {order.fiatCurrency}.
                        </>
                      ) : (
                        <>
                          The buyer needs to send payment of {totalPaymentAmount} {order.fiatCurrency}.
                        </>
                      )}
                    </p>
                  </div>
                </>
              )}

              {order.status === "payment_sent" && (
                <>
                  <Separator />
                  <div className="bg-secondary/20 p-4 rounded-lg border border-secondary/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-secondary" />
                      <h3 className="font-medium">Payment Sent</h3>
                    </div>
                    <p className="text-sm mb-2">
                      {isMerchantBuying ? (
                        <>
                          The seller has marked their payment of{" "}
                          <span className="font-medium">
                            {totalPaymentAmount} {order.fiatCurrency}
                          </span>{" "}
                          as sent. Please verify the payment and confirm receipt.
                        </>
                      ) : (
                        <>
                          The buyer has marked their payment of{" "}
                          <span className="font-medium">
                            {totalPaymentAmount} {order.fiatCurrency}
                          </span>{" "}
                          as sent. Please verify the payment and confirm receipt.
                        </>
                      )}
                    </p>
                  </div>
                </>
              )}

              {order.status === "payment_confirmed" && (
                <>
                  <Separator />
                  <div className="bg-secondary/20 p-4 rounded-lg border border-secondary/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-secondary" />
                      <h3 className="font-medium">Payment Confirmed</h3>
                    </div>
                    <p className="text-sm mb-2">
                      {isMerchantBuying ? (
                        <>
                          You've confirmed receipt of the seller's payment of{" "}
                          <span className="font-medium">
                            {totalPaymentAmount} {order.fiatCurrency}
                          </span>
                          .
                        </>
                      ) : (
                        <>
                          You've confirmed receipt of the buyer's payment of{" "}
                          <span className="font-medium">
                            {totalPaymentAmount} {order.fiatCurrency}
                          </span>
                          . Please release the crypto to complete the trade.
                        </>
                      )}
                    </p>
                  </div>
                </>
              )}

              {/* Payment proof if available */}
              {order.paymentProofUrl &&
                (order.status === "payment_sent" ||
                  order.status === "payment_confirmed" ||
                  order.status === "completed") && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium mb-4">Payment Proof</h3>
                      <div className="border rounded-md p-2">
                        <Image
                          src={order.paymentProofUrl || "/placeholder.svg"}
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
              {order.status === "completed" && (
                <>
                  <Separator />
                  <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Order Completed</h3>
                    </div>
                    <p className="text-sm">
                      This order has been completed successfully. The {order.tokenSymbol} has been transferred to
                      {isMerchantBuying ? " your wallet." : " the buyer's wallet."}
                    </p>
                  </div>
                </>
              )}

              {/* Cancelled order */}
              {order.status === "cancelled" && (
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
              {order.status === "disputed" && (
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
                    {order.counterpartyAddress.slice(0, 6)}...{order.counterpartyAddress.slice(-4)}
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
                  onClick={() => copyToClipboard(order.counterpartyAddress)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                  <a
                    href={`https://explorer.sui.io/address/${order.counterpartyAddress}`}
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

          {/* Action buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Order Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  disabled={isDisputing || order.status === "disputed"}
                >
                  {isDisputing ? "Processing..." : order.status === "disputed" ? "Dispute Opened" : "Open Dispute"}
                </Button>
              )}

              {order.status === "completed" && (
                <Button asChild className="w-full">
                  <Link href="/merchant/orders">Back to Orders</Link>
                </Button>
              )}

              {(order.status === "cancelled" || order.status === "disputed") && (
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
                    <span className="text-muted-foreground">{formatDate(order.createdAt)}</span>
                  </div>

                  {order.status !== "pending_payment" && (
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                        <span>Payment sent</span>
                      </div>
                      <span className="text-muted-foreground">
                        {formatDate(new Date(new Date(order.createdAt).getTime() + 10 * 60 * 1000).toISOString())}
                      </span>
                    </div>
                  )}

                  {(order.status === "payment_confirmed" || order.status === "completed") && (
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                        <span>Payment confirmed</span>
                      </div>
                      <span className="text-muted-foreground">
                        {formatDate(new Date(new Date(order.createdAt).getTime() + 20 * 60 * 1000).toISOString())}
                      </span>
                    </div>
                  )}

                  {order.status === "completed" && (
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span>Order completed</span>
                      </div>
                      <span className="text-muted-foreground">
                        {formatDate(new Date(new Date(order.createdAt).getTime() + 30 * 60 * 1000).toISOString())}
                      </span>
                    </div>
                  )}

                  {order.status === "cancelled" && (
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-destructive"></div>
                        <span>Order cancelled</span>
                      </div>
                      <span className="text-muted-foreground">
                        {formatDate(new Date(new Date(order.createdAt).getTime() + 15 * 60 * 1000).toISOString())}
                      </span>
                    </div>
                  )}

                  {order.status === "disputed" && (
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-destructive"></div>
                        <span>Dispute opened</span>
                      </div>
                      <span className="text-muted-foreground">
                        {formatDate(new Date(new Date(order.createdAt).getTime() + 25 * 60 * 1000).toISOString())}
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
              href={`https://explorer.sui.io/txblock/${order.id}`}
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
