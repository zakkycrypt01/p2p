"use client"

import { useState } from "react"
import { useWallet } from "@/hooks/use-sui-wallet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react"

interface ReleaseRefundButtonsProps {
  tradeId: string
  isSeller: boolean
  onRelease: () => void
  onRefund: () => void
}

export function ReleaseRefundButtons({ tradeId, isSeller, onRelease, onRefund }: ReleaseRefundButtonsProps) {
  const { address } = useWallet()
  const { toast } = useToast()
  const [isReleasing, setIsReleasing] = useState(false)
  const [isRefunding, setIsRefunding] = useState(false)

  const handleReleaseFunds = async () => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to release funds",
        variant: "destructive",
      })
      return
    }

    setIsReleasing(true)

    try {
      // This would call your Move module in production
      console.log("Calling release() on-chain:", { tradeId })

      // Simulate blockchain delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Funds released",
        description: "You have successfully released the funds to the buyer",
      })

      onRelease()
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

  const handleRefund = async () => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to claim refund",
        variant: "destructive",
      })
      return
    }

    setIsRefunding(true)

    try {
      // This would call your Move module in production
      console.log("Calling refund() on-chain:", { tradeId })

      // Simulate blockchain delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Refund claimed",
        description: "You have successfully claimed a refund",
      })

      onRefund()
    } catch (error) {
      console.error("Error claiming refund:", error)
      toast({
        title: "Failed to claim refund",
        description: "There was an error claiming the refund. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefunding(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade Actions</CardTitle>
        <CardDescription>
          {isSeller ? "Release funds once you've confirmed payment" : "Claim refund if the trade has expired"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSeller ? (
          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg mb-4">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Verify payment before releasing funds</p>
              <p>Make sure you have received the payment before releasing the tokens. This action cannot be undone.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg mb-4">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Claim refund only if trade has expired</p>
              <p>You can claim a refund if the seller hasn't released the tokens after the trade has expired.</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-3">
        {isSeller ? (
          <Button className="w-full" onClick={handleReleaseFunds} disabled={isReleasing}>
            {isReleasing ? "Processing..." : "Release Funds"}
            {!isReleasing && <CheckCircle2 className="ml-2 h-4 w-4" />}
          </Button>
        ) : (
          <Button variant="destructive" className="w-full" onClick={handleRefund} disabled={isRefunding}>
            {isRefunding ? "Processing..." : "Claim Refund"}
            {!isRefunding && <XCircle className="ml-2 h-4 w-4" />}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

