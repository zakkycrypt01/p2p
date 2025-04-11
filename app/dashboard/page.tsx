"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatsOverview } from "@/components/dashboard/stats-overview"
import { MyListings } from "@/components/dashboard/my-listings"
import { MyTrades } from "@/components/dashboard/my-trades"
import { useCurrentAccount } from "@mysten/dapp-kit"
import Link from "next/link"
import { PlusCircle, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const currentAccount = useCurrentAccount()
  const address = currentAccount?.address
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get("tab") || "listings"

  // Redirect to home if wallet is not connected
  useEffect(() => {
    if (!address) {
      router.push("/")
    }
  }, [address, router])

  // If wallet is not connected, don't render the dashboard
  if (!address) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button asChild variant="outline" size="sm">
            <Link href="/listings/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Listing
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/listings">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Listings
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-8 bg-card rounded-lg border shadow-sm p-6">
        <StatsOverview />
      </div>

      <Tabs defaultValue={tab} className="w-full">
        <div className="border-b mb-6">
          <TabsList className="bg-transparent -mb-px">
            <TabsTrigger
              value="listings"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              My Listings
            </TabsTrigger>
            <TabsTrigger
              value="trades"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              My Trades
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="listings">
          <MyListings />
        </TabsContent>
        <TabsContent value="trades">
          <MyTrades />
        </TabsContent>
      </Tabs>
    </div>
  )
}
