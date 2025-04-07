import Image from "next/image"
import Link from "next/link"
import { Star, ArrowUpRight, ArrowDownRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ListingCardProps {
  id: string
  tokenSymbol: string
  tokenIcon: string
  amount: number
  price: number
  fiatCurrency: string
  sellerRating: number
  paymentMethods: string[]
  orderType?: "buy" | "sell"
  isMerchant?: boolean
}

export function ListingCard({
  id,
  tokenSymbol,
  tokenIcon,
  amount,
  price,
  fiatCurrency,
  sellerRating,
  paymentMethods,
  orderType = "sell",
  isMerchant = false,
}: ListingCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Image
                src={tokenIcon || `/tokens/${tokenSymbol.toLowerCase()}.png`}
                alt={tokenSymbol}
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="font-semibold">{tokenSymbol}</span>
            </div>
            <div className="flex flex-col gap-1">
              <Badge variant={orderType === "buy" ? "default" : "secondary"} className="flex items-center gap-1">
                {orderType === "buy" ? (
                  <>
                    <ArrowUpRight className="h-3 w-3" />
                    Buy
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-3 w-3" />
                    Sell
                  </>
                )}
              </Badge>
              {isMerchant && (
                <Badge variant="outline" className="text-xs">
                  Merchant
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">
                {amount.toFixed(4)} {tokenSymbol}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Price</span>
              <span className="font-medium">
                {price.toFixed(2)} {fiatCurrency}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Merchant Rating</span>
              <div className="flex items-center gap-1 text-primary">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm">{sellerRating.toFixed(1)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
              {paymentMethods.map((method) => (
                <Badge key={method} variant="outline" className="text-xs">
                  {method}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-3">
        <Button asChild className="w-full">
          <Link href={`/listings/${id}`}>View Listing</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

