"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react"
import Image from "next/image"

// Mock transaction data
const mockTransactions = [
  {
    id: "tx1",
    status: "completed",
    fromNetwork: "Ethereum",
    toNetwork: "Sui",
    fromToken: "ETH",
    toToken: "SUI",
    amount: "0.5",
    receivedAmount: "1200",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    fromTxHash: "0x1234...5678",
    toTxHash: "0xabcd...efgh",
  },
  {
    id: "tx2",
    status: "pending",
    fromNetwork: "Ethereum",
    toNetwork: "Sui",
    fromToken: "USDC",
    toToken: "USDC",
    amount: "100",
    receivedAmount: "99.5",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    fromTxHash: "0x8765...4321",
    toTxHash: null,
  },
  {
    id: "tx3",
    status: "failed",
    fromNetwork: "Sui",
    toNetwork: "Ethereum",
    fromToken: "SUI",
    toToken: "ETH",
    amount: "500",
    receivedAmount: "0",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    fromTxHash: "0xfedc...ba98",
    toTxHash: null,
    error: "Insufficient liquidity",
  },
]

// Token icons mapping
const tokenIcons = {
  ETH: "/tokens/eth.png",
  SUI: "/tokens/sui.png",
  USDC: "/tokens/usdc.png",
  BTC: "/tokens/btc.png",
}

export default function BridgeHistoryPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState(mockTransactions)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date)
  }

  // Refresh transaction history
  const refreshHistory = () => {
    setIsRefreshing(true)

    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1500)
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500"
      case "pending":
        return "bg-yellow-500/10 text-yellow-500"
      case "failed":
        return "bg-red-500/10 text-red-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="container mx-auto max-w-3xl">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-white mr-2"
            onClick={() => router.push("/bridge")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Transaction History</h1>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-gray-400 hover:text-white"
            onClick={refreshHistory}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {transactions.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-gray-400 mb-4">No transactions found</div>
              <Button onClick={() => router.push("/bridge")}>Bridge Tokens</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <Card key={tx.id} className="bg-gray-800 border-gray-700 overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </div>
                    <div className="text-sm text-gray-400">{formatDate(tx.timestamp)}</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                        <Image
                          src={
                            tokenIcons[tx.fromToken as keyof typeof tokenIcons] || "/placeholder.svg?height=40&width=40"
                          }
                          alt={tx.fromToken}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{tx.fromNetwork}</div>
                    </div>

                    <div className="flex-1 mx-4">
                      <div className="h-0.5 bg-gray-700 relative">
                        <div
                          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center ${
                            tx.status === "completed"
                              ? "bg-green-500/20 text-green-500"
                              : tx.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-500"
                                : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {tx.status === "completed" ? "✓" : tx.status === "pending" ? "⋯" : "✕"}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                        <Image
                          src={
                            tokenIcons[tx.toToken as keyof typeof tokenIcons] || "/placeholder.svg?height=40&width=40"
                          }
                          alt={tx.toToken}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{tx.toNetwork}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Sent</div>
                      <div className="text-white font-medium">
                        {tx.amount} {tx.fromToken}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Received</div>
                      <div className="text-white font-medium">
                        {tx.status === "completed"
                          ? `${tx.receivedAmount} ${tx.toToken}`
                          : tx.status === "pending"
                            ? "Pending..."
                            : "Failed"}
                      </div>
                    </div>
                  </div>

                  {tx.error && <div className="mt-2 text-sm text-red-400">Error: {tx.error}</div>}

                  <div className="mt-3 pt-3 border-t border-gray-700 flex flex-wrap gap-2">
                    {tx.fromTxHash && (
                      <a
                        href={`https://etherscan.io/tx/${tx.fromTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-400 hover:text-white flex items-center"
                      >
                        Source Tx <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    )}
                    {tx.toTxHash && (
                      <a
                        href={`https://explorer.sui.io/txblock/${tx.toTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-400 hover:text-white flex items-center ml-4"
                      >
                        Destination Tx <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
