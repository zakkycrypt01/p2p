"use client"

import { useState } from "react"
import { ListingFilter } from "@/components/listings/listing-filter"
import { ListingList } from "@/components/listings/listing-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Listings() {
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy")

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold">Merchant Order Book</h1>
      </div>

      <Tabs defaultValue="buy" onValueChange={(value) => setOrderType(value as "buy" | "sell")} className="w-full mb-6">
        <div className="border-b mb-6">
          <TabsList className="bg-transparent -mb-px">
            <TabsTrigger
              value="sell"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Buy Crypto
              <span className="ml-2 text-xs text-muted-foreground">(Merchant sells)</span>
            </TabsTrigger>
            <TabsTrigger
              value="buy"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Sell Your Crypto
              <span className="ml-2 text-xs text-muted-foreground">(Merchant buys)</span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="sell" className="mt-0">
          <div className="mb-6">
            <ListingFilter orderType="buy" />
          </div>
          <ListingList orderType="buy" />
        </TabsContent>

        <TabsContent value="buy" className="mt-0">
          <div className="mb-6">
            <ListingFilter orderType="sell" />
          </div>
          <ListingList orderType="sell" />
        </TabsContent>

      </Tabs>
    </div>
  )
}

