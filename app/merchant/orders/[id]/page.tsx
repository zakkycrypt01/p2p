"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSuiWallet } from "@/hooks/use-sui-wallet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { ArrowUpRight, ArrowDownRight, User, Clock, AlertCircle, Copy, ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { use } from "react"

interface Order {
  id: string
  tradeId: string
  tokenSymbol: string
  tokenIcon: string
  amount: number
  price: number
  fiatCurrency: string
  counterpartyAddress: string
  orderType: "buy" | "sell"
  status: "pending_payment" | "payment_sent" | "payment_confirmed" | "completed" | "cancelled" | "disputed"
  createdAt: string
  updatedAt: string
  paymentMethod: string
  paymentDetails?: {
    accountName?: string
    accountNumber?: string
    bankName?: string
    instructions?: string
  }
  paymentProofUrl?: string
  paymentWindow?: number
  releaseTime?: number
}

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params);
  const orderId = id as string;

  const { address } = useSuiWallet()
  const router = useRouter()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!address) {
      router.push("/")
      return
    }

    const fetchOrder = async () => {
      setIsLoading(true)
      try {
        // Mock API call - in a real app, this would fetch from an API
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Mock order data
        const mockOrder: Order = {
          id: orderId,
          tradeId: `trade-${orderId.split("-")[1]}`,
          tokenSymbol: "SUI",
          tokenIcon: "/tokens/sui.png",
          amount: 10,
          price: 1.25,
          fiatCurrency: "USD",
          counterpartyAddress: "0xabc...def",
          orderType: orderId === "order-2" || orderId === "order-4" || orderId === "order-6" ? "sell" : "buy",
          status:
            orderId === "order-1"
              ? "pending_payment"
              : orderId === "order-2"
                ? "payment_sent"
                : orderId === "order-3"
                  ? "payment_confirmed"
                  : orderId === "order-4"
                    ? "completed"
                    : orderId === "order-5"
                      ? "cancelled"
                      : "disputed",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          paymentMethod: "Bank Transfer",
          paymentDetails: {
            accountName: "John Smith",
            accountNumber: "1234567890",
            bankName: "Chase Bank",
            instructions: "Please include the trade ID in the payment reference",
          },
          paymentProofUrl:
            orderId === "order-2" || orderId === "order-3" ? "/placeholder.svg?height=300&width=400" : undefined,
          paymentWindow: 30,
          releaseTime: 15,
        }

        setOrder(mockOrder)
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
  }, [address, orderId, router, toast])

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

  const confirmPayment = async () => {
    setIsProcessing(true)
    try {
      // Mock API call - in a real app, this would call your backend
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setOrder((prev) => (prev ? { ...prev, status: "payment_confirmed" } : null))

      toast({
        title: "Payment confirmed",
        description: "You have confirmed receipt of payment",
      })
    } catch (error) {
      console.error("Error confirming payment:", error)
      toast({
        title: "Error",
        description: "Failed to confirm payment",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const releaseFunds = async () => {
    setIsProcessing(true)
    try {
      // Mock API call - in a real app, this would call your blockchain contract
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setOrder((prev) => (prev ? { ...prev, status: "completed" } : null))

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
      setIsProcessing(false)
    }
  }

  const cancelOrder = async () => {
    setIsProcessing(true)
    try {
      // Mock API call - in a real app, this would call your blockchain contract
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setOrder((prev) => (prev ? { ...prev, status: "cancelled" } : null))

      toast({
        title: "Order cancelled",
        description: "You have cancelled the order",
      })
    } catch (error) {
      console.error("Error cancelling order:", error)
      toast({
        title: "Error",
        description: "Failed to cancel order",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const openDispute = async () => {
    setIsProcessing(true)
    try {
      // Mock API call - in a real app, this would call your backend
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setOrder((prev) => (prev ? { ...prev, status: "disputed" } : null))

      toast({
        title: "Dispute opened",
        description: "You have opened a dispute for this order",
      })
    } catch (error) {
      console.error("Error opening dispute:", error)
      toast({
        title: "Error",
        description: "Failed to open dispute",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!address) return null

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
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
        <div className="flex justify-between items-center mb-6">
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

  const isMerchantBuying = order.orderType === "buy"
  const canConfirmPayment = order.status === "payment_sent" && isMerchantBuying
  const canReleaseFunds = order.status === "payment_confirmed" && !isMerchantBuying
  const canCancel = order.status === "pending_payment" || order.status === "payment_sent"
  const canDispute = order.status !== "completed" && order.status !== "cancelled" && order.status !== "disputed"

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Order Details</h1>
        <Button asChild variant="outline">
          <Link href="/merchant/orders">Back to Orders</Link>
        </Button>
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
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
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
                    {(order.amount * order.price).toFixed(2)} {order.fiatCurrency}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Order ID</h3>
                  <p className="text-sm">{order.id}</p>
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

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-2">Payment Method</h3>
                <Badge variant="secondary">{order.paymentMethod}</Badge>
              </div>

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
                                    onClick={() => copyToClipboard(order.paymentDetails!.bankName!)}
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
                                    onClick={() => copyToClipboard(order.paymentDetails!.accountName!)}
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
                                    onClick={() => copyToClipboard(order.paymentDetails!.accountNumber!)}
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

              {order.status === "disputed" && (
                <>
                  <Separator />
                  <div className="bg-destructive/10 p-4 rounded-lg">
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
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Counterparty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-muted rounded-full p-3">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium">{order.counterpartyAddress}</p>
                  <div className="flex items-center gap-2 mt-1">
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
                </div>
              </div>
            </CardContent>
          </Card>

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
                  <Button className="w-full" onClick={confirmPayment} disabled={isProcessing}>
                    {isProcessing ? "Processing..." : "Confirm Payment Received"}
                  </Button>
                </div>
              )}

              {canReleaseFunds && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2 bg-muted rounded-md mb-2">
                    <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
                    <p className="text-xs">Once you release the funds, this action cannot be undone.</p>
                  </div>
                  <Button className="w-full" onClick={releaseFunds} disabled={isProcessing}>
                    {isProcessing ? "Processing..." : "Release Funds to Buyer"}
                  </Button>
                </div>
              )}

              {canCancel && (
                <Button
                  variant="outline"
                  className="w-full text-destructive"
                  onClick={cancelOrder}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Cancel Order"}
                </Button>
              )}

              {canDispute && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={openDispute}
                  disabled={isProcessing || order.status === "disputed"}
                >
                  {isProcessing ? "Processing..." : order.status === "disputed" ? "Dispute Opened" : "Open Dispute"}
                </Button>
              )}
            </CardContent>
          </Card>

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
                        {formatDate(new Date(Date.now() - 1000 * 60 * 30).toISOString())}
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
                        {formatDate(new Date(Date.now() - 1000 * 60 * 15).toISOString())}
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
                        {formatDate(new Date(Date.now() - 1000 * 60 * 5).toISOString())}
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
                        {formatDate(new Date(Date.now() - 1000 * 60 * 5).toISOString())}
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
                        {formatDate(new Date(Date.now() - 1000 * 60 * 5).toISOString())}
                      </span>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  )
}

