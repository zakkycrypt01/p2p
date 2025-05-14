"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSuiWallet } from "@/hooks/use-sui-wallet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Star, User, Clock, AlertCircle, ArrowUpRight, ArrowDownRight, ShieldCheck } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

interface Listing {
  id: string
  tokenSymbol: string
  tokenIcon: string
  price: number
  fiatCurrency: string
  sellerAddress: string
  address: string
  sellerRating: number
  paymentMethods: string[]
  status: string
  createdAt: string
  description?: string
  minAmount?: number
  maxAmount?: number
  expiresAt?: string
  orderType?: "buy" | "sell"
  paymentWindow?: number
  releaseTime?: number
  amount?: number
  totalAmount?: number
  paymentDetails?: {
    [key: string]: {
      accountName?: string
      accountNumber?: string
      bankName?: string
      instructions?: string
    }
  }
}

interface TradeDetailProps {
  listing: Listing
}

export function TradeDetail({ listing }: TradeDetailProps) {
  const { address } = useSuiWallet()
  const router = useRouter()
  const { toast } = useToast()
  const [status, setStatus] = useState(listing.status)
  const [isCancelling, setIsCancelling] = useState(false)

  // Normalize legacy status values
  const normalizedStatus =
    status === "open"
      ? "active"
      : status === "pending"
        ? "partially_sold"
        : status === "completed"
          ? "sold"
          : status.replace(/\s+/g, "_").toLowerCase(); // Replace spaces with underscores

  // Calculate available amount for partially sold listings
  const amount =
    listing.amount !== undefined
      ? listing.amount
      : normalizedStatus === "partially_sold"
        ? (listing.amount ?? 0) * 0.4
        : listing.amount

  const totalAmount = listing.totalAmount !== undefined ? listing.totalAmount : listing.amount
  const soldAmount = (totalAmount ?? 0) - (amount ?? 0)
  const soldPercentage = (soldAmount / (totalAmount ?? 1)) * 100

  // Handle null address scenario
  const isOwner = address && address === listing.sellerAddress
  const isBuyer = address && address !== listing.sellerAddress
  const isVisitor = !address

  const canCreateOrder = 
    (normalizedStatus === "active" || normalizedStatus === "partially_sold") &&
    !!address &&
    address !== listing.sellerAddress;

  console.log({
    address,
    sellerAddress: listing.sellerAddress,
    isOwner,
    isBuyer,
    normalizedStatus,
    canCreateOrder,
  })

  const isBuyOrder = listing.orderType === "buy"

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      // This would call your blockchain contract in production
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setStatus("canceled")
      toast({
        title: "Listing cancelled",
        description: "Your listing has been cancelled",
      })
      setTimeout(() => router.push("/dashboard"), 1500)
    } catch (error) {
      console.error("Error cancelling listing:", error)
      toast({
        title: "Failed to cancel listing",
        description: "There was an error cancelling the listing. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  // Get status badge variant
  const getStatusBadgeVariant = () => {
    switch (normalizedStatus) {
      case "active":
        return "outline"
      case "partially_sold":
        return "secondary"
      case "sold":
        return "default"
      case "canceled":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Format status display text
  const getStatusDisplayText = () => {
    switch (normalizedStatus) {
      case "active":
        return "Active"
      case "partially_sold":
        return "Partially Sold"
      case "sold":
        return "Sold"
      case "canceled":
        return "Canceled"
      default:
        return normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Image
                  src={listing.tokenIcon || `/tokens/${listing.tokenSymbol.toLowerCase()}.png`}
                  alt={listing.tokenSymbol}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                {totalAmount} {listing.tokenSymbol}
              </CardTitle>
              <CardDescription>
                @ {listing.price} {listing.fiatCurrency} per token
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={getStatusBadgeVariant()}>{getStatusDisplayText()}</Badge>
              <Badge variant={isBuyOrder ? "default" : "secondary"} className="flex items-center gap-1">
                {isBuyOrder ? (
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
            {/* Listing status information */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Listing Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Available Amount</span>
                  <span className="text-sm font-semibold">
                    {amount} {listing.tokenSymbol}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Price per Token</span>
                  <span className="text-sm font-semibold">
                    {listing.price} {listing.fiatCurrency}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Value</span>
                  <span className="text-sm font-semibold text-primary">
                    {((amount ?? 0) * listing.price).toFixed(2)} {listing.fiatCurrency}
                  </span>
                </div>
              </div>
            </div>

            {normalizedStatus === "partially_sold" && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    Available: {(amount ?? 0).toFixed(4)} {listing.tokenSymbol}
                  </span>
                  <span>
                    Sold: {soldAmount.toFixed(4)} {listing.tokenSymbol}
                  </span>
                </div>
                <Progress value={soldPercentage} className="h-2" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Value</h3>
                <p className="text-xl font-semibold">
                  {((totalAmount ?? 0) * listing.price).toFixed(2)} {listing.fiatCurrency}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                <p className="text-sm">{formatDate(listing.createdAt)}</p>
              </div>

              {listing.expiresAt && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Expires</h3>
                  <p className="text-sm flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDate(listing.expiresAt)}
                  </p>
                </div>
              )}

              {(listing.minAmount || listing.maxAmount) && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Purchase Limits</h3>
                  <p className="text-sm">
                    {listing.minAmount && `Min: ${listing.minAmount} ${listing.tokenSymbol}`}
                    {listing.minAmount && listing.maxAmount && " / "}
                    {listing.maxAmount && `Max: ${listing.maxAmount} ${listing.tokenSymbol}`}
                  </p>
                </div>
              )}

              {(listing.paymentWindow || listing.releaseTime) && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Time Limits</h3>
                  <p className="text-sm">
                    {listing.paymentWindow && `Payment Window: ${listing.paymentWindow} minutes`}
                    {listing.paymentWindow && listing.releaseTime && " / "}
                    {listing.releaseTime && `Release Time: ${listing.releaseTime} minutes`}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium mb-2">Accepted Payment Methods</h3>
              <div className="flex flex-wrap gap-2">
                {listing.paymentMethods.map((method: string) => (
                  <Badge key={method} variant="secondary">
                    {method}
                  </Badge>
                ))}
              </div>
            </div>

            {listing.description && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium mb-2">Description</h3>
                  <p className="text-sm whitespace-pre-line">{listing.description}</p>
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
                All trades are protected by our escrow service. The crypto is locked in escrow until the payment is
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
                  {listing.address.slice(0, 6)}...{listing.address.slice(-4)}
                </p>
                <div className="flex items-center gap-1 text-primary">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm">{listing.sellerRating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Verified merchant with 50+ completed trades</p>
              <p>Average response time: &lt;30 minutes</p>
            </div>
          </CardContent>
        </Card>

        {/* Create Order button for buyers when listing is active */}
        {canCreateOrder && (
          <Card>
            <CardHeader>
              <CardTitle>Create Order</CardTitle>
              <CardDescription>Start trading with this merchant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg mb-4">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Ready to trade?</p>
                  <p>
                    When you create an order, you'll be able to proceed with the payment details and complete the
                    transaction.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" asChild>
                <Link href={`/listings/${listing.id}/create-order`}>Create Order</Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Cancel listing button for owner */}
        {isOwner && normalizedStatus === "active" && (
          <Button variant="outline" className="w-full" onClick={handleCancel} disabled={isCancelling}>
            {isCancelling ? "Cancelling..." : "Cancel Listing"}
          </Button>
        )}

        {/* Trade information for buyers */}
        {isBuyer && normalizedStatus === "active" && (
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Step 1: Create an Order</AccordionTrigger>
                  <AccordionContent>
                    Click the "Create Order" button to specify how much you want to trade and initiate the transaction.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Step 2: Make Payment</AccordionTrigger>
                  <AccordionContent>
                    After creating an order, you'll see payment instructions. Send the payment using one of the accepted
                    methods.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Step 3: Confirm Payment</AccordionTrigger>
                  <AccordionContent>
                    Mark your payment as sent in the order details page. The merchant will verify your payment.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Step 4: Receive Crypto</AccordionTrigger>
                  <AccordionContent>
                    Once the merchant confirms your payment, they'll release the crypto from escrow to your wallet.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
