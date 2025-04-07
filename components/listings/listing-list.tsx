"use client"
import { useListings } from "@/hooks/use-listings"
import { ListingCard } from "./listing-card"
import { Skeleton } from "@/components/ui/skeleton"

interface ListingListProps {
  orderType?: "buy" | "sell"
}

// Update the ListingList component to clearly show merchant listings
export function ListingList({ orderType = "buy" }: ListingListProps) {
  const { listings, isLoading, error } = useListings(orderType)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Failed to load listings. Please try again.</p>
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No merchant listings found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          id={listing.id}
          tokenSymbol={listing.tokenSymbol}
          tokenIcon={listing.tokenIcon}
          amount={listing.amount}
          price={listing.price}
          fiatCurrency={listing.fiatCurrency}
          sellerRating={listing.sellerRating}
          paymentMethods={listing.paymentMethods}
          orderType={listing.orderType || orderType}
          isMerchant={true}
        />
      ))}
    </div>
  )
}

