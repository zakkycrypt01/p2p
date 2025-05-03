"use client"

import { use, useState, useEffect } from "react"
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
  Upload,
  ExternalLink,
  ShieldCheck,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Star,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useOrders } from "@/hooks/use-orders"
import { ChatButton } from "@/components/chat/chat-button"

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
        if (onExpire) onExpire()
        return
      }
      const hours = Math.floor(difference / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ hours, minutes, seconds })
      const totalDuration = expiryTimestamp - (expiryTimestamp - 60 * 60 * 1000)
      const elapsed = totalDuration - difference
      const progressValue = Math.max(0, 100 - (elapsed / totalDuration) * 100)
      setProgress(progressValue)
    }
    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [expiryTimestamp, onExpire])
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
      return "completed"
    case 3:
      return "cancelled"
    case 4:
      return "disputed"
    default:
      return "unknown"
  }
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  // unwrap the params promise
  const { id } = use(params)

  const { address } = useSuiWallet()
  const router = useRouter()
  const { toast } = useToast()
  const { getOrder, markPaymentAsSent, cancelOrder, uploadPaymentProof } = useOrders()
  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [expiryTimestamp, setExpiryTimestamp] = useState<number | null>(null)
  const [formattedOrder, setFormattedOrder] = useState<Record<string, any> | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!address) {
        // router.push("/")
        return
      }

      setIsLoading(true)
      try {
        const fetchedOrder = await getOrder({ id })

        if (fetchedOrder) {
          setOrder(fetchedOrder)
          const formatted: {
            paymentDetails: Record<string, {
              accountName?: string;
              accountNumber?: string;
              bankName?: string;
              instructions?: string;
            }>;
            [key: string]: any;
          } = {
            id: fetchedOrder.id,
            shortId: `${fetchedOrder.id.slice(0, 6)}…${fetchedOrder.id.slice(-4)}`,
            listingId: fetchedOrder.listingId,
            tokenSymbol: fetchedOrder.metadata?.tokenSymbol || "SUI",
            tokenIcon:
              fetchedOrder.metadata?.tokenIcon ||
              `/tokens/${(fetchedOrder.metadata?.tokenSymbol || "sui").toLowerCase()}.png`,

            amount: formatTokenAmount(fetchedOrder.tokenAmount),
            price: formatPrice(fetchedOrder.price),
            fiatCurrency: fetchedOrder.metadata?.fiatCurrency || "USD",
            merchantAddress: fetchedOrder.seller,
            merchantRating: fetchedOrder.metadata?.merchantRating
              ? parseFloat(fetchedOrder.metadata.merchantRating)
              : undefined,

            buyerAddress: fetchedOrder.buyer,
            status: getStatusFromCode(Number(fetchedOrder.status)),
            createdAt: new Date(Number(fetchedOrder.createdAt) * 1000).toISOString(),
            expiresAt: new Date(Number(fetchedOrder.expiry) * 1000).toISOString(),
            paymentMethods:
              (fetchedOrder.metadata?.paymentMethods?.split(",").map((m: string) => m.trim()) || []) as string[],

            orderType: (fetchedOrder.buyer === address ? "buy" : "sell") as "buy" | "sell",
            paymentWindow: Math.floor(
              (Number(fetchedOrder.expiry) - Number(fetchedOrder.createdAt)) / 60
            ) as number,
            paymentDetails: {},
          };
          formatted.paymentMethods.forEach((method: string) => {
            const key = method.toLowerCase().trim();
            formatted.paymentDetails[key] = {
              accountName:
                fetchedOrder.metadata?.[`${key}_accountName`] || "Contact merchant",
              accountNumber: fetchedOrder.metadata?.[`${key}_accountNumber`],
              bankName: fetchedOrder.metadata?.[`${key}_bankName`],
              instructions:
                fetchedOrder.metadata?.[`${key}_instructions`] ||
                `Please contact merchant for ${method} payment details`,
            };
          });

          setFormattedOrder(formatted);
          setSelectedPaymentMethod(formatted.paymentMethods[0] || null);
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
  }, [address, id, router, toast, getOrder])

  useEffect(() => {
    if (!order?.id) return;
    const interval = setInterval(async () => {
      try {
        const updated = await getOrder({ id: order.id });
        if (updated) {
          const newStatus = getStatusFromCode(Number(updated.status));
          setFormattedOrder((prev: Record<string, any> | null) =>
            prev ? { ...prev, status: newStatus } : prev
          );
        }
      } catch (err) {
        console.error("Polling order status failed:", err);
      }
    }, 30000); // every 30s

    return () => clearInterval(interval);
  }, [order, getOrder]);

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

  const confirmPaymentSent = async () => {
    if (!selectedPaymentMethod) {
      toast({
        title: "Payment method required",
        description: "Please select a payment method",
        variant: "destructive",
      })
      return
    }

    setIsConfirming(true)
    try {
      await markPaymentAsSent(order.id, selectedPaymentMethod)
      toast({
        title: "Payment marked as sent",
        description: "You've notified the merchant that payment has been sent",
      })
    } catch (error) {
      console.error("Error confirming payment:", error)
      toast({
        title: "Failed to confirm payment",
        description: "There was an error confirming your payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConfirming(false)
    }
  }

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    try {
      await cancelOrder(order.id);
      setFormattedOrder((prev: Record<string, any> | null) =>
        prev ? { ...prev, status: "cancelled" } : prev
      );
      toast({ title: "Order cancelled", description: "Your order has been cancelled" });
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (error) {
      console.error("Error cancelling order:", error)
      toast({
        title: "Failed to cancel order",
        description: "There was an error cancelling your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false);
    }
  }

  const handleUploadPaymentProof = () => {
    const mockProofUrl = "/placeholder.svg?height=300&width=400"
    uploadPaymentProof(order.id, mockProofUrl)

    // Update local state
    setFormattedOrder((prev: any) => ({ ...prev, paymentProofUrl: mockProofUrl }))

    toast({
      title: "Proof uploaded",
      description: "Your payment proof has been uploaded successfully",
    })
  }

  // Get status badge variant
  const getStatusBadgeVariant = () => {
    switch (formattedOrder?.status) {
      case "pending_payment":
        return "outline"
      case "payment_sent":
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
    switch (formattedOrder?.status) {
      case "pending_payment":
        return "Pending Payment"
      case "payment_sent":
        return "Payment Sent"
      case "completed":
        return "Completed"
      case "cancelled":
        return "Cancelled"
      case "disputed":
        return "Disputed"
      default:
        return formattedOrder?.status?.charAt(0).toUpperCase() + formattedOrder?.status?.slice(1)
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
    setFormattedOrder((prev: any) => ({ ...prev, status: "cancelled" }))
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
  const totalPaymentAmount = (
    Number.parseFloat(formattedOrder.amount) * Number.parseFloat(formattedOrder.price)
  ).toFixed(2)

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
                <Badge variant={isBuyOrder ? "secondary" : "default"} className="flex items-center gap-1">
                  {isBuyOrder ? (
                    <>
                      <ArrowDownRight className="h-3 w-3" />
                      Buy from Merchant
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="h-3 w-3" />
                      Sell to Merchant
                    </>
                  )}
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
                    <span className="text-sm">{formatDate(formattedOrder.createdAt)}</span>
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

              {/* Completed order */}
              {formattedOrder.status === "completed" && (
                <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Order Completed</h3>
                  </div>
                  <p className="text-sm">
                    This order has been completed successfully. The {formattedOrder.tokenSymbol} has been transferred to
                    your wallet.
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
                    <span className="text-sm">{formattedOrder.merchantRating?.toFixed(1)}</span>
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
                  <Button className="w-full" onClick={confirmPaymentSent} disabled={isConfirming}>
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
