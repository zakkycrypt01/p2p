import { TradeDetail } from "@/components/trade/trade-detail"
import { notFound } from "next/navigation"

// This would normally fetch from your API
async function getListing(id: string) {
  // Simulate API call
  const listing = {
    id,
    tokenSymbol: "SUI",
    tokenIcon: "/tokens/sui.png",
    amount: 100,
    price: 1.25,
    fiatCurrency: "USD",
    sellerAddress: "0x123...456",
    sellerRating: 4.8,
    paymentMethods: ["Bank Transfer", "PayPal"],
    status: "open" as "open" | "pending" | "completed" | "cancelled",
    createdAt: new Date().toISOString(),
    description: "Fast transfer, please have payment ready",
    minAmount: 10,
    maxAmount: 100,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  }

  return listing
}

export default async function ListingPage(props: { params: { id: string } }) {
  const { params } = props
  const listing = await getListing(params.id)

  if (!listing) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Listing Details</h1>
      <TradeDetail listing={listing} />
    </div>
  )
}

