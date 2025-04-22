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
import { use } from "react"

interface OrderDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  // Unwrap the params promise using React.use()
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
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!address) {
        router.push("/")
        return
      }

      setIsLoading(true)
      try {
        const foundOrder = getOrder(id) // Use the unwrapped id here

        if (foundOrder) {
          setOrder(foundOrder)
          setSelectedPaymentMethod(foundOrder.selectedPaymentMethod || foundOrder.paymentMethods[0])

          // Calculate time remaining
          const expiresAt = new Date(foundOrder.expiresAt).getTime()
          const now = Date.now()
          const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000 / 60)) // in minutes
          setTimeRemaining(remaining)
        } else {
          // If no order is found, create a mock one for testing
          // This would be removed in production
          const mockOrder = {
            id: id,
            listingId: "listing-123",
            tokenSymbol: "SUI",
            tokenIcon: "/tokens/sui.png",
            amount: 25,
            price: 1.25,
            fiatCurrency: "USD",
            merchantAddress: "0x123...456",
            merchantRating: 4.8,
            buyerAddress: address,
            status: "pending_payment", // pending_payment, payment_sent, completed, cancelled, disputed
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
            paymentMethods: ["Bank Transfer", "PayPal"],
            selectedPaymentMethod: null,
            orderType: "buy", // buy from merchant or sell to merchant
            paymentWindow: 30, // minutes
            paymentDetails: {
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
          setOrder(mockOrder)
          setSelectedPaymentMethod(mockOrder.paymentMethods[0])

          // Calculate time remaining
          const expiresAt = new Date(mockOrder.expiresAt).getTime()
          const now = Date.now()
          const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000 / 60)) // in minutes
          setTimeRemaining(remaining)
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

    // Set up timer to update time remaining
    const timer = setInterval(() => {
      if (order?.expiresAt) {
        const expiresAt = new Date(order.expiresAt).getTime()
        const now = Date.now()
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000 / 60)) // in minutes
        setTimeRemaining(remaining)
      }
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [address, id, router, toast, getOrder]) // Use the unwrapped id in dependencies

  // Update local state when order changes
  useEffect(() => {
    if (order) {
      const updatedOrder = getOrder(order.id)
      if (updatedOrder) {
        setOrder(updatedOrder)
      }
    }
  }, [getOrder, order])

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
      // Mark payment as sent in our mock order system
      markPaymentAsSent(order.id, selectedPaymentMethod)

      // Update local state
      setOrder((prev: any) => ({ ...prev, status: "payment_sent", selectedPaymentMethod }))

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
    setIsCancelling(true)
    try {
      // Cancel the order in our mock order system
      cancelOrder(order.id)

      // Update local state
      setOrder((prev: any) => ({ ...prev, status: "cancelled" }))

      toast({
        title: "Order cancelled",
        description: "Your order has been cancelled",
      })

      // Redirect to dashboard after a short delay
      setTimeout(() => router.push("/dashboard"), 1500)
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

  const handleUploadPaymentProof = () => {
    // In a real app, this would open a file picker and upload the proof
    // For this mock, we'll just simulate it
    const mockProofUrl = "/placeholder.svg?height=300&width=400"
    uploadPaymentProof(order.id, mockProofUrl)

    // Update local state
    setOrder((prev: any) => ({ ...prev, paymentProofUrl: mockProofUrl }))

    toast({
      title: "Proof uploaded",
      description: "Your payment proof has been uploaded successfully",
    })
  }

  // Get status badge variant
  const getStatusBadgeVariant = () => {
    switch (order?.status) {
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
    switch (order?.status) {
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
        return order?.status?.charAt(0).toUpperCase() + order?.status?.slice(1)
    }
  }

  if (isLoading || !order) {
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

  const isBuyOrder = order.orderType === "buy"
  const totalPaymentAmount = (order.amount * order.price).toFixed(2)

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
                    <span className="text-sm">{order.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Amount</span>
                    <span className="text-sm font-semibold">
                      {order.amount} {order.tokenSymbol}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Payment</span>
                    <span className="text-sm font-semibold text-primary">
                      {totalPaymentAmount} {order.fiatCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Created</span>
                    <span className="text-sm">{formatDate(order.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Time remaining */}
              {(order.status === "pending_payment" || order.status === "payment_sent") && timeRemaining !== null && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Time Remaining
                    </span>
                    <span className={timeRemaining < 5 ? "text-destructive font-medium" : "font-medium"}>
                      {timeRemaining} minutes
                    </span>
                  </div>
                  <Progress value={(timeRemaining / order.paymentWindow) * 100} className="h-2" />
                </div>
              )}

              {/* Payment instructions for pending payment */}
              {order.status === "pending_payment" && (
                <>
                  <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Payment Required</h3>
                    </div>
                    <p className="text-sm mb-4">
                      Please complete your payment of{" "}
                      <span className="font-medium">
                        {totalPaymentAmount} {order.fiatCurrency}
                      </span>{" "}
                      to the merchant using one of the accepted payment methods below.
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium mb-4">Payment Methods</h3>

                    <Tabs defaultValue={order.paymentMethods[0]} onValueChange={setSelectedPaymentMethod}>
                      <TabsList className="mb-4">
                        {order.paymentMethods.map((method: string) => (
                          <TabsTrigger key={method} value={method}>
                            {method}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {order.paymentMethods.map((method: string) => {
                        // Use lowercase method name for lookup
                        const methodKey = method.toLowerCase()
                        const details = order.paymentDetails[methodKey]

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
                                      {totalPaymentAmount} {order.fiatCurrency}
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
              {order.status === "payment_sent" && (
                <div className="bg-secondary/20 p-4 rounded-lg border border-secondary/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-secondary" />
                    <h3 className="font-medium">Payment Sent</h3>
                  </div>
                  <p className="text-sm mb-2">
                    You've marked your payment of{" "}
                    <span className="font-medium">
                      {totalPaymentAmount} {order.fiatCurrency}
                    </span>{" "}
                    as sent. The merchant will verify your payment and release the crypto.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This typically takes 5-30 minutes depending on the payment method.
                  </p>
                </div>
              )}

              {/* Completed order */}
              {order.status === "completed" && (
                <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Order Completed</h3>
                  </div>
                  <p className="text-sm">
                    This order has been completed successfully. The {order.tokenSymbol} has been transferred to your
                    wallet.
                  </p>
                </div>
              )}

              {/* Cancelled order */}
              {order.status === "cancelled" && (
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
              {order.status === "disputed" && (
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
              {order.paymentProofUrl && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">Payment Proof</h3>
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
                    {order.merchantAddress.slice(0, 6)}...{order.merchantAddress.slice(-4)}
                  </p>
                  <div className="flex items-center gap-1 text-primary">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm">{order.merchantRating.toFixed(1)}</span>
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
              {order.status === "pending_payment" && (
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

              {order.status === "payment_sent" && (
                <>
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

              {order.status === "completed" && (
                <Button asChild className="w-full">
                  <Link href="/dashboard">View Dashboard</Link>
                </Button>
              )}

              {(order.status === "cancelled" || order.status === "disputed") && (
                <Button asChild className="w-full">
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              )}
            </CardContent>
          </Card>

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
