"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSuiWallet } from "@/hooks/use-sui-wallet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle } from "lucide-react"
import { useContract } from "@/hooks/useContract"

interface AcceptOrderButtonProps {
  listingId: string
  onStatusChangeAction: () => void
}

// Update the AcceptOrderButton to reflect the merchant-centric model
export function AcceptOrderButton({ listingId, onStatusChangeAction }: AcceptOrderButtonProps) {
  const { address } = useSuiWallet()
  const router = useRouter()
  const { toast } = useToast()
  const [amount, setAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Move the hook call to the component level
  const { createOrderFromListing } = useContract()

  const handleCreateOrder = async () => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to accept this order",
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

    setIsSubmitting(true)

    try {
      // This would call your Move module in production
      // console.log("Calling fill_order() on-chain:", { listingId, amount })

      // Simulate blockchain delay
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      const token_amount = Number.parseFloat(amount) * 1e8 // Convert to smallest unit
      const tx = await createOrderFromListing({ listingId, tokenAmount: token_amount })
      console.log("Transaction response:", tx)
      // This would post to your backend API in production
      // console.log("Posting to backend to mark trade as pending")

      toast({
        title: "Order accepted",
        description: "You have successfully accepted this merchant's order",
      })

      onStatusChangeAction()
    } catch (error) {
      console.error("Error accepting order:", error)
      toast({
        title: "Failed to accept order",
        description: "There was an error accepting this order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Order</CardTitle>
        <CardDescription>Enter the amount you want to trade</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <p className="text-sm">
              When you create order, the seller crypto will be locked in escrow. For sell orders, you release it after
              receiving payment. For buy orders, the merchant will release it after you send payment.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleCreateOrder} disabled={isSubmitting}>
          {isSubmitting ? "Processing..." : "Create Order"}
        </Button>
      </CardFooter>
    </Card>
  )
}

