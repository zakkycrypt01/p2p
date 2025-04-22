"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatsOverview } from "@/components/dashboard/stats-overview"
import { MyListings } from "@/components/dashboard/my-listings"
import { MyTrades } from "@/components/dashboard/my-trades"
import { MyOrders } from "@/components/dashboard/my-orders"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="listings">My Listings</TabsTrigger>
          <TabsTrigger value="trades">My Trades</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <StatsOverview />
          <MyListings limit={5} showViewAll={() => setActiveTab("listings")} />
          <MyTrades limit={5} showViewAll={() => setActiveTab("trades")} />
        </TabsContent>

        <TabsContent value="listings">
          <MyListings />
        </TabsContent>

        <TabsContent value="trades">
          <MyTrades />
        </TabsContent>

        <TabsContent value="orders">
          <MyOrders />
        </TabsContent>
      </Tabs>
    </div>
  )
}
