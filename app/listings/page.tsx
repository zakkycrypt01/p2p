"use client"

import { useState } from "react"
import { useListings } from "@/hooks/use-listings"
import { ListingCard } from "@/components/listings/listing-card"
import { ListingFilter } from "@/components/listings/listing-filter"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function ListingsPage() {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("sell")
  const { listings: buyListings, isLoading: isBuyLoading } = useListings("sell")
  const { listings: sellListings, isLoading: isSellLoading } = useListings("buy")

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">P2P Listings</h1>
          <p className="text-muted-foreground mt-1">
            Buy and sell crypto directly with other users
          </p>
        </div>
        <Button asChild>
          <Link href="/listings/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Listing
          </Link>
        </Button>
      </div>

      <Tabs
        defaultValue="sell"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "buy" | "sell")}
        className="mb-8"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="sell">Buy Tokens</TabsTrigger>
          <TabsTrigger value="buy">Sell Your Tokens</TabsTrigger>
        </TabsList>


        <TabsContent value="sell">
          <div className="mb-6">
            <ListingFilter orderType="sell" />
          </div>
          {isSellLoading ? (
            <div className="text-center py-12">Loading listings...</div>
          ) : sellListings.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No sell listings found</h3>
              <p className="text-muted-foreground mb-4">
                There are no merchants selling tokens right now.
              </p>
              <Button asChild>
                <Link href="/listings/new">Create a Listing</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sellListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  tokenSymbol={listing.tokenSymbol || ""}
                  tokenIcon={listing.tokenIcon || ""}
                  amount={listing.amount ?? 0}
                  price={listing.price}
                  fiatCurrency={listing.fiatCurrency || ""}
                  sellerRating={listing.sellerRating}
                  paymentMethod={listing.paymentMethod}
                  orderType="buy"
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="buy">
          <div className="mb-6">
            <ListingFilter orderType="buy" />
          </div>
          {isBuyLoading ? (
            <div className="text-center py-12">Loading listings...</div>
          ) : buyListings.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No buy listings found</h3>
              <p className="text-muted-foreground mb-4">
                There are no merchants looking to buy tokens right now.
              </p>
              <Button asChild>
                <Link href="/listings/new">Create a Listing</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {buyListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  tokenSymbol={listing.tokenSymbol || ""}
                  tokenIcon={listing.tokenIcon || ""}
                  amount={listing.amount ?? 0}
                  price={listing.price}
                  fiatCurrency={listing.fiatCurrency || ""}
                  sellerRating={listing.sellerRating}
                  paymentMethod={listing.paymentMethod}
                  orderType="sell"
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

