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
import { AcceptOrderButton } from "./accept-order-button"
import { ReleaseRefundButtons } from "./release-refund-buttons"
import { Star, User, Clock, AlertCircle, ArrowUpRight, ArrowDownRight, CheckCircle, Copy } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CardFooter } from "@/components/ui/card"
import { useContract } from "@/hooks/useContract"

interface Listing {
  id: string
  tokenSymbol: string
  tokenIcon: string
  amount: number
  price: number
  fiatCurrency: string
  sellerAddress: string
  sellerRating: number
  paymentMethod: string[]
  status: "open" | "pending" | "completed" | "cancelled"
  createdAt: string
  description?: string
  minAmount?: number
  maxAmount?: number
  expiresAt?: string
  orderType?: "buy" | "sell"
  paymentWindow?: number
  releaseTime?: number
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

// Update the TradeDetail component to reflect the correct flow
export function TradeDetail({ listing }: TradeDetailProps) {
  // Normalize the listing data to match the expected format
  const normalizedListing = {
    ...listing,
    paymentMethods: listing.paymentMethod || [], // Convert paymentMethod to paymentMethods
    status: listing.status?.toLowerCase() === "active" ? "open" : listing.status?.toLowerCase() // Convert status to lowercase
  };

  const { address } = useSuiWallet()
  const router = useRouter()
  const { toast } = useToast()
  const [status, setStatus] = useState(normalizedListing.status)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)

  const isOwner = address === normalizedListing.sellerAddress
  const canAccept = !isOwner && status === "open"
  const showTradeActions = status === "pending" && (isOwner || address)
  const isBuyOrder = normalizedListing.orderType === "buy"

  const userIsSelling = !isOwner && isBuyOrder
  const userIsBuying = !isOwner && !isBuyOrder

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const handleStatusChange = (newStatus: "open" | "pending" | "completed" | "cancelled") => {
    setStatus(newStatus)

    if (newStatus === "completed") {
      toast({
        title: "Trade completed",
        description: userIsSelling
          ? "You have released the crypto to the merchant"
          : "The merchant has released the crypto to you",
      })
    } else if (newStatus === "cancelled") {
      toast({
        title: "Trade cancelled",
        description: "The trade has been cancelled and funds returned",
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The information has been copied to your clipboard",
    })
  }

  const confirmPayment = () => {
    setPaymentConfirmed(true)
    toast({
      title: "Payment confirmed",
      description: userIsBuying
        ? "You've notified the merchant that payment has been sent"
        : "You've confirmed receipt of the merchant's payment",
    })
  }

  // Mock payment details
  const paymentDetails = normalizedListing.paymentDetails || {
    bank_transfer: {
      accountName: userIsBuying ? "Your Bank Account" : "Merchant Bank Account",
      accountNumber: userIsBuying ? "Your Account Number" : "1234567890",
      bankName: userIsBuying ? "Your Bank" : "Chase Bank",
      instructions: userIsSelling
        ? "The merchant will send payment to this account"
        : "Please send payment to this account",
    },
    paypal: {
      accountName: userIsBuying ? "your.email@example.com" : "merchant@example.com",
      instructions: userIsBuying
        ? "The merchant will send payment to this PayPal account"
        : "Send as Friends & Family to avoid fees",
    },
    zelle: {
      accountName: userIsBuying ? "your.email@example.com" : "merchant@example.com",
      instructions: userIsSelling ? "The merchant will send payment to this Zelle account" : "Include trade ID in memo",
    },
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Image
                  src={normalizedListing.tokenIcon || `/tokens/${normalizedListing.tokenSymbol.toLowerCase()}.png`}
                  alt={normalizedListing.tokenSymbol}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                {normalizedListing.amount} {normalizedListing.tokenSymbol}
              </CardTitle>
              <CardDescription>
                @ {normalizedListing.price} {normalizedListing.fiatCurrency} per token
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge
                variant={
                  status === "open"
                    ? "outline"
                    : status === "pending"
                      ? "secondary"
                      : status === "completed"
                        ? "default"
                        : "destructive"
                }
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Value</h3>
                <p className="text-xl font-semibold">
                  {(normalizedListing.amount * normalizedListing.price).toFixed(2)} {normalizedListing.fiatCurrency}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                <p className="text-sm">{formatDate(normalizedListing.createdAt)}</p>
              </div>

              {normalizedListing.expiresAt && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Expires</h3>
                  <p className="text-sm flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDate(normalizedListing.expiresAt)}
                  </p>
                </div>
              )}

              {(normalizedListing.minAmount || normalizedListing.maxAmount) && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Purchase Limits</h3>
                  <p className="text-sm">
                    {normalizedListing.minAmount && `Min: ${normalizedListing.minAmount} ${normalizedListing.tokenSymbol}`}
                    {normalizedListing.minAmount && normalizedListing.maxAmount && " / "}
                    {normalizedListing.maxAmount && `Max: ${normalizedListing.maxAmount} ${normalizedListing.tokenSymbol}`}
                  </p>
                </div>
              )}

              {(normalizedListing.paymentWindow || normalizedListing.releaseTime) && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Time Limits</h3>
                  <p className="text-sm">
                    {normalizedListing.paymentWindow && `Payment Window: ${normalizedListing.paymentWindow} minutes`}
                    {normalizedListing.paymentWindow && normalizedListing.releaseTime && " / "}
                    {normalizedListing.releaseTime && `Release Time: ${normalizedListing.releaseTime} minutes`}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium mb-2">Accepted Payment Methods</h3>
              <div className="flex flex-wrap gap-2">
                {normalizedListing.paymentMethod && normalizedListing.paymentMethod.map((method: string) => (
                  <Badge key={method} variant="secondary">
                  {method}
                  </Badge>
                ))}
              </div>
            </div>

            {normalizedListing.description && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium mb-2">Description</h3>
                  <p className="text-sm whitespace-pre-line">{normalizedListing.description}</p>
                </div>
              </>
            )}

            {status === "pending" && (
              <>
                <Separator />
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Trade Instructions</h3>
                  </div>
                  {userIsSelling ? (
                    <p className="text-sm">
                      1. The merchant will send payment to your account using one of your accepted payment methods.
                      <br />
                      2. Once you confirm receipt of payment, release the crypto to complete the trade.
                      <br />
                      3. If there are any issues, contact support immediately.
                    </p>
                  ) : userIsBuying ? (
                    <p className="text-sm">
                      1. Send payment to the merchant using one of the accepted payment methods.
                      <br />
                      2. After payment is sent, notify the merchant through the platform.
                      <br />
                      3. The merchant will verify payment and release the tokens.
                      <br />
                      4. If there are any issues, contact support immediately.
                    </p>
                  ) : (
                    <p className="text-sm">
                      1. Buyer should send payment using one of the accepted payment methods.
                      <br />
                      2. After payment is sent, buyer will notify you through the platform.
                      <br />
                      3. Verify payment and release the tokens.
                      <br />
                      4. If there are any issues, contact support immediately.
                    </p>
                  )}
                </div>
              </>
            )}

            {status === "pending" && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium mb-4">Payment Details</h3>
                  
                  {normalizedListing.paymentMethods && normalizedListing.paymentMethods.length > 0 ? (
                    <Tabs 
                      defaultValue={normalizedListing.paymentMethods[0]} 
                      onValueChange={setSelectedPaymentMethod}
                    >
                      <TabsList className="mb-4">
                        {normalizedListing.paymentMethod.map((method: string) => (
                          <TabsTrigger key={method} value={method}>
                          {method}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {normalizedListing.paymentMethods.map((method) => {
                        const details = paymentDetails[method.toLowerCase().replace(" ", "_")]
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
                                            onClick={() => copyToClipboard(details.bankName!)}
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
                                            onClick={() => copyToClipboard(details.accountName!)}
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
                                            onClick={() => copyToClipboard(details.accountNumber!)}
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
                                    {userIsBuying ? (
                                      <>
                                        Please make your payment of{" "}
                                        <span className="font-medium">
                                          {(normalizedListing.amount * normalizedListing.price).toFixed(2)} {normalizedListing.fiatCurrency}
                                        </span>{" "}
                                        using the details above.
                                      </>
                                    ) : userIsSelling ? (
                                      <>
                                        You will send payment of{" "}
                                        <span className="font-medium">
                                          {(normalizedListing.amount * normalizedListing.price).toFixed(2)} {normalizedListing.fiatCurrency}
                                        </span>{" "}
                                        to merchant's account.
                                      </>
                                    ) : (
                                      <>
                                        Payment amount:{" "}
                                        <span className="font-medium">
                                          {(normalizedListing.amount * normalizedListing.price).toFixed(2)} {normalizedListing.fiatCurrency}
                                        </span>
                                      </>
                                    )}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>

                            {(userIsBuying || userIsSelling) && (
                              <Button className="w-full" onClick={confirmPayment} disabled={paymentConfirmed}>
                                {paymentConfirmed ? (
                                  <span className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    {userIsSelling ? "Payment Sent" : "Payment Received"}
                                  </span>
                                ) : userIsSelling ? (
                                  "I've Sent the Payment"
                                ) : (
                                  "I've Received the Payment"
                                )}
                              </Button>
                            )}
                          </TabsContent>
                        )
                      })}
                    </Tabs>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      No payment methods available
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
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
                  {normalizedListing.sellerAddress.slice(0, 6)}...{normalizedListing.sellerAddress.slice(-4)}
                </p>
                <div className="flex items-center gap-1 text-primary">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm">{normalizedListing.sellerRating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Verified merchant with 50+ completed trades</p>
              <p>Average response time: &lt;30 minutes</p>
            </div>
          </CardContent>
        </Card>

        {canAccept && <AcceptOrderButton listingId={normalizedListing.id} onStatusChangeAction={() => handleStatusChange("pending")} />}

        {status === "pending" && userIsBuying && paymentConfirmed && (
          <Card>
            <CardHeader>
              <CardTitle>Release Crypto</CardTitle>
              <CardDescription>Confirm you've received payment from the merchant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg mb-4">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Verify payment before releasing crypto</p>
                  <p>
                    Make sure you have received the payment before releasing the tokens. This action cannot be undone.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleStatusChange("completed")}>
                Release Crypto to Merchant
              </Button>
            </CardFooter>
          </Card>
        )}

        {showTradeActions && isOwner && (
          <ReleaseRefundButtons
            tradeId={normalizedListing.id}
            isSeller={isOwner}
            onReleaseAction={() => handleStatusChange("completed")}
            onRefundAction={() => handleStatusChange("cancelled")}
          />
        )}

        {isOwner && status === "open" && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              toast({
                title: "Listing cancelled",
                description: "Your listing has been cancelled",
              })
              handleStatusChange("cancelled")
              setTimeout(() => router.push("/dashboard"), 1500)
            }}
          >
            Cancel Listing
          </Button>
        )}

        {status === "pending" && (
          <Accordion type="single" collapsible>
            <AccordionItem value="payment-proof">
              <AccordionTrigger>Upload Payment Proof</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {userIsBuying
                      ? "Upload proof of your payment to the merchant here."
                      : "Upload proof of the merchant's payment to you here."}
                  </p>
                  <Button className="w-full">Upload Screenshot</Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </div>
  )
}

