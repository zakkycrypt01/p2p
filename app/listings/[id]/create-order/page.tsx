"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSuiWallet } from "@/hooks/use-sui-wallet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import Link from "next/link"
import Image from "next/image"
import { useOrders } from "@/hooks/use-orders"
import { getListingsById } from "@/actions/getListingsbyId"
import { useContract } from "@/hooks/useContract"

export default function CreateOrderPage() {
  const params = useParams()
  const { address } = useSuiWallet()
  const router = useRouter()
  const { toast } = useToast()
  const { createOrder } = useOrders()
  const { createOrderFromListing } = useContract() // Move hook call here
  const [listing, setListing] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [amount, setAmount] = useState("")
  const [sliderValue, setSliderValue] = useState(100) // Default to 100% of available amount
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchListing = async () => {
      setIsLoading(true)
      try {
        if (typeof params.id !== "string") {
          throw new Error("Invalid listing ID")
        }
        const listing = await getListingsById(params.id)

        if (!listing) {
          throw new Error("Listing not found")
        }

        const processedListing = {
          ...listing,
          paymentMethods:
            Array.isArray(listing.paymentMethod)
              ? listing.paymentMethod
              : typeof listing.paymentMethod === "string"
              ? listing.paymentMethod.split(",").map((method: string) => method.trim())
              : [],
          amount: listing.amount || 0,
          totalAmount: listing.amount || 0,
        }

        setListing(processedListing)
        setAmount(processedListing.amount.toString())
      } catch (error) {
        console.error("Error fetching listing:", error)
        toast({
          title: "Error",
          description: "Failed to load listing details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (address) {
      fetchListing()
    } else {
      router.push("/")
    }
  }, [address, params.id, router, toast])

  // Update amount when slider changes
  const handleSliderChange = (value: number[]) => {
    const percentage = value[0]
    setSliderValue(percentage)

    if (listing) {
      const calculatedAmount = ((listing.amount * percentage) / 100).toFixed(4)
      setAmount(calculatedAmount)
    }
  }

  // Update slider when amount changes manually
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value
    setAmount(newAmount)

    if (listing && listing.amount > 0 && Number.parseFloat(newAmount) > 0) {
      const percentage = Math.min((Number.parseFloat(newAmount) / listing.amount) * 100, 100)
      setSliderValue(percentage)
    }
  }

  const handleCreateOrder = async () => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create an order",
        variant: "destructive",
      })
      return
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    if (listing.minAmount && Number.parseFloat(amount) < listing.minAmount) {
      toast({
        title: "Amount too low",
        description: `The minimum amount is ${listing.minAmount} ${listing.tokenSymbol}`,
        variant: "destructive",
      })
      return
    }

    if (listing.maxAmount && Number.parseFloat(amount) > listing.maxAmount) {
      toast({
        title: "Amount too high",
        description: `The maximum amount is ${listing.maxAmount} ${listing.tokenSymbol}`,
        variant: "destructive",
      })
      return
    }

    if (Number.parseFloat(amount) > listing.amount) {
      toast({
        title: "Amount exceeds available",
        description: `The maximum available amount is ${listing.amount} ${listing.tokenSymbol}`,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000)) 
      console.log('amount :>> ', amount);
      const token_amount = Number.parseFloat(amount) * Math.pow(10, 9) // Convert to MIST (1 SUI = 10^9 MIST)
      console.log('token_amount :>> ', token_amount);
      if (typeof params.id !== "string") {
        throw new Error("Invalid listing ID");
      }
      const tx = await createOrderFromListing({listingId: params.id, tokenAmount: token_amount})
      toast({
        title: "Order created",
        description: "You have successfully created an order with this merchant",
      })

      // Redirect to the order detail page
      // router.push(`/orders/${newOrder.id}`)
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "Failed to create order",
        description: "There was an error creating this order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !listing) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href={`/listings/${params.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Listing
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Create Order</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p>Loading listing details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href={`/listings/${params.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listing
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create Order</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Enter the amount you want to trade</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <Image
                  src={listing.tokenIcon || `/tokens/${listing.tokenSymbol.toLowerCase()}.png`}
                  alt={listing.tokenSymbol}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              </div>
              <div>
                <h3 className="text-lg font-medium">{listing.tokenSymbol}</h3>
                <p className="text-sm text-muted-foreground">
                  @ {listing.price} {listing.fiatCurrency} per token
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium mb-1">Creating an Order</p>
                <p className="text-sm text-muted-foreground">
                  When you create an order, your crypto will be locked in escrow. For sell orders, you'll release it
                  after receiving payment. For buy orders, the merchant will release it after you send payment.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="amount">Amount ({listing.tokenSymbol})</Label>
                  <span className="text-sm text-muted-foreground">
                    Available: {listing.amount.toFixed(4)} {listing.tokenSymbol}
                  </span>
                </div>
                <Input
                  id="amount"
                  type="number"
                  placeholder={`Enter amount (max: ${listing.amount.toFixed(4)})`}
                  value={amount}
                  onChange={handleAmountChange}
                  max={listing.amount}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>0%</span>
                  <span>{sliderValue}%</span>
                  <span>100%</span>
                </div>

                <Slider value={[sliderValue]} onValueChange={handleSliderChange} max={100} step={1} />
              </div>

              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Total Cost:</span>
                  <span className="font-bold">
                    {(Number(amount) * listing.price).toFixed(2)} {listing.fiatCurrency}
                  </span>
                </div>
                {listing.minAmount && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Min Order:</span>
                    <span>
                      {listing.minAmount} {listing.tokenSymbol}
                    </span>
                  </div>
                )}
                {listing.maxAmount && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Max Order:</span>
                    <span>
                      {listing.maxAmount} {listing.tokenSymbol}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleCreateOrder} disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Create Order"}
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {listing.paymentMethods &&
                  listing.paymentMethods.map((method: string) => (
                    <div key={method} className="flex items-center p-2 border rounded-md">
                      <div className="w-4 h-4 rounded-full bg-primary mr-2"></div>
                      <span>{method}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Time Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {listing.paymentWindow && (
                  <div className="flex justify-between">
                    <span>Payment Window:</span>
                    <span>{listing.paymentWindow} minutes</span>
                  </div>
                )}
                {listing.releaseTime && (
                  <div className="flex justify-between">
                    <span>Release Time:</span>
                    <span>{listing.releaseTime} minutes</span>
                  </div>
                )}
                {listing.expiresAt && (
                  <div className="flex justify-between">
                    <span>Listing Expires:</span>
                    <span>{new Date(listing.expiresAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
