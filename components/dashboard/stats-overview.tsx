"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, LineChart, PieChart } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

// Mock data
const volumeData = [
  { name: "Jan", volume: 400 },
  { name: "Feb", volume: 300 },
  { name: "Mar", volume: 600 },
  { name: "Apr", volume: 800 },
  { name: "May", volume: 500 },
  { name: "Jun", volume: 900 },
]

const tokenData = [
  { name: "SUI", value: 60 },
  { name: "USDC", value: 25 },
  { name: "ETH", value: 10 },
  { name: "BTC", value: 5 },
]

const statusData = [
  { name: "Completed", value: 85 },
  { name: "Pending", value: 10 },
  { name: "Disputed", value: 5 },
]

const COLORS = ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"]

export function StatsOverview() {
  const { address } = useWallet()

  if (!address) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Connect your wallet to view your stats</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$12,345</div>
          <p className="text-xs text-muted-foreground">+20.1% from last month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">42</div>
          <p className="text-xs text-muted-foreground">+5 from last month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">7</div>
          <p className="text-xs text-muted-foreground">+2 from last week</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">98.5%</div>
          <p className="text-xs text-muted-foreground">+0.5% from last month</p>
        </CardContent>
      </Card>

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Trading Activity</CardTitle>
          <CardDescription>Your trading volume over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="volume">
            <TabsList className="mb-4">
              <TabsTrigger value="volume" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                Volume
              </TabsTrigger>
              <TabsTrigger value="tokens" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Tokens
              </TabsTrigger>
              <TabsTrigger value="status" className="flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                Status
              </TabsTrigger>
            </TabsList>

            <TabsContent value="volume" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="volume" fill="#3b82f6" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="tokens" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={tokenData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#3b82f6"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {tokenData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="status" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="volume" stroke="#3b82f6" />
                </RechartsLineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

