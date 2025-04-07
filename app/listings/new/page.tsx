"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { NewListingForm } from "@/components/listings/new-listing-form"
import { useWallet } from "@/hooks/use-wallet"

export default function NewListing() {
  const { address } = useWallet()
  const router = useRouter()

  // Redirect to home if wallet is not connected
  useEffect(() => {
    if (!address) {
      router.push("/")
    }
  }, [address, router])

  // If wallet is not connected, don't render the form
  if (!address) {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Create New Listing</h1>
      <NewListingForm />
    </div>
  )
}

