// Convert the listing detail page to a client component
"use client"

import { TradeDetail } from "@/components/trade/trade-detail"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getListingsById } from "@/actions/getListingsbyId"

export default function ListingPage() {
  const params = useParams()
  const [listing, setListing] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchListing() {
      try {
        setIsLoading(true)
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
        }

        setListing(processedListing)
      } catch (error) {
        console.error("Error fetching listing:", error)
        setListing(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchListing()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/listings">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Listings
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Listing Details</h1>
        </div>
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!listing) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/listings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Listing Details</h1>
      </div>
      <TradeDetail listing={listing} />
    </div>
  )
}
