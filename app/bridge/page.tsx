"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSuiWallet } from "@/hooks/use-sui-wallet"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { ArrowUpDown, History } from "lucide-react"
import Image from "next/image"
import NetworkTokenSelector from "@/components/bridge/network-token-selector"

// Network data
const networks = {
  ethereum: { name: "Ethereum", icon: "/tokens/eth.png" },
  solana: { name: "Solana", icon: "/tokens/sol.png" },
  arbitrum: { name: "Arbitrum", icon: "/tokens/arb.png" },
  base: { name: "Base", icon: "/tokens/base.png" },
  sui: { name: "Sui", icon: "/tokens/sui.png" },
}

// Token data
const tokens = {
  ETH: { name: "Ethereum", icon: "/tokens/eth.png", balance: 1.25, price: 3000.0 },
  SUI: { name: "Sui", icon: "/tokens/sui.png", balance: 1250.45, price: 1.25 },
  USDC: { name: "USD Coin", icon: "/tokens/usdc.png", balance: 500.0, price: 1.0 },
  SOL: { name: "Solana", icon: "/tokens/sol.png", balance: 25.0, price: 120.0 },
  ARB: { name: "Arbitrum", icon: "/tokens/arb.png", balance: 150.0, price: 1.5 },
  AGA: { name: "AGA", icon: "/tokens/aga.png", balance: 100.0, price: 0.5 },
  ALT: { name: "ALT", icon: "/tokens/alt.png", balance: 200.0, price: 0.75 },
  AUDIO: { name: "AUDIO", icon: "/tokens/audio.png", balance: 300.0, price: 0.25 },
}

export default function BridgePage() {
  const { address } = useSuiWallet()
  const router = useRouter()
  const { toast } = useToast()

  const [sourceNetwork, setSourceNetwork] = useState("ethereum")
  const [destinationNetwork, setDestinationNetwork] = useState("sui")
  const [sourceToken, setSourceToken] = useState("ETH")
  const [destinationToken, setDestinationToken] = useState("SUI")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSourceWalletConnected, setIsSourceWalletConnected] = useState(false)
  const [estimatedTime, setEstimatedTime] = useState("10-30 minutes")
  const [fee, setFee] = useState("0.001 ETH")

  // Modal states
  const [isSourceSelectorOpen, setIsSourceSelectorOpen] = useState(false)
  const [isDestinationSelectorOpen, setIsDestinationSelectorOpen] = useState(false)

  // Redirect to home if wallet is not connected
  useEffect(() => {
    if (!address) {
      router.push("/")
    }
  }, [address, router])

  // Swap networks
  const handleSwapNetworks = () => {
    const tempNetwork = sourceNetwork
    const tempToken = sourceToken

    setSourceNetwork(destinationNetwork)
    setSourceToken(destinationToken)
    setDestinationNetwork(tempNetwork)
    setDestinationToken(tempToken)
  }

  // Handle source selection
  const handleSourceSelect = (network: string, token: string) => {
    setSourceNetwork(network)
    setSourceToken(token)
  }

  // Handle destination selection
  const handleDestinationSelect = (network: string, token: string) => {
    setDestinationNetwork(network)
    setDestinationToken(token)
  }

  // Connect source wallet
  const handleConnectSourceWallet = () => {
    setIsLoading(true)

    // Simulate connection delay
    setTimeout(() => {
      setIsSourceWalletConnected(true)
      setIsLoading(false)

      toast({
        title: "Source wallet connected",
        description: `Successfully connected to ${networks[sourceNetwork as keyof typeof networks].name} wallet`,
      })
    }, 1500)
  }

  // Execute bridge transaction
  const handleBridge = async () => {
    if (!isSourceWalletConnected) {
      toast({
        title: "Source wallet not connected",
        description: "Please connect your source wallet first",
        variant: "destructive",
      })
      return
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    const tokenInfo = tokens[sourceToken as keyof typeof tokens]
    if (Number(amount) > tokenInfo.balance) {
      toast({
        title: "Insufficient balance",
        description: `You don't have enough ${sourceToken}`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Simulate blockchain delay
      await new Promise((resolve) => setTimeout(resolve, 3000))

      toast({
        title: "Bridge initiated",
        description: `Bridging ${amount} ${sourceToken} from ${networks[sourceNetwork as keyof typeof networks].name} to ${networks[destinationNetwork as keyof typeof networks].name}. This may take ${estimatedTime}.`,
      })

      // Reset form
      setAmount("")
      setIsSourceWalletConnected(false)
    } catch (error) {
      console.error("Error bridging tokens:", error)
      toast({
        title: "Bridge failed",
        description: "There was an error bridging your tokens. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // If wallet is not connected, don't render the page
  if (!address) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-white text-center">Bridge Tokens</h1>

        <Card className="bg-gray-800 border-gray-700 shadow-xl">
          <div className="p-6 space-y-6">
            {/* From section */}
            <div className="space-y-2">
              <Label htmlFor="source-network" className="text-gray-300 text-lg">
                From
              </Label>
              <div
                className="bg-gray-900 rounded-lg p-4 cursor-pointer hover:bg-gray-850 transition-colors"
                onClick={() => setIsSourceSelectorOpen(true)}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                    <Image
                      src={tokens[sourceToken as keyof typeof tokens]?.icon || "/placeholder.svg"}
                      alt={sourceToken}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-semibold text-white">{sourceToken}</div>
                    <div className="text-gray-400">{tokens[sourceToken as keyof typeof tokens]?.name}</div>
                  </div>
                  <div className="text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Swap button */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-10 w-10 bg-gray-700 hover:bg-gray-600 text-gray-300"
                onClick={handleSwapNetworks}
              >
                <ArrowUpDown className="h-5 w-5" />
              </Button>
            </div>

            {/* To section */}
            <div className="space-y-2">
              <Label htmlFor="destination-network" className="text-gray-300 text-lg">
                To
              </Label>
              <div
                className="bg-gray-900 rounded-lg p-4 cursor-pointer hover:bg-gray-850 transition-colors"
                onClick={() => setIsDestinationSelectorOpen(true)}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                    <Image
                      src={tokens[destinationToken as keyof typeof tokens]?.icon || "/placeholder.svg"}
                      alt={destinationToken}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-semibold text-white">{destinationToken}</div>
                    <div className="text-gray-400">{tokens[destinationToken as keyof typeof tokens]?.name}</div>
                  </div>
                  <div className="text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-gray-300 text-lg">
                Amount
              </Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white text-2xl h-16 pl-4 pr-20"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => setAmount(tokens[sourceToken as keyof typeof tokens].balance.toString())}
                >
                  Max
                </Button>
              </div>
              {amount && (
                <div className="text-sm text-gray-400 flex justify-between">
                  <span>
                    Balance: {tokens[sourceToken as keyof typeof tokens].balance} {sourceToken}
                  </span>
                  <span>≈ ${(Number(amount) * tokens[sourceToken as keyof typeof tokens].price).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Bridge details */}
            {amount && Number(amount) > 0 && (
              <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Estimated time</span>
                  <span className="text-white">{estimatedTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Bridge fee</span>
                  <span className="text-white">{fee}</span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {!isSourceWalletConnected ? (
              <Button
                className="w-full h-14 text-lg bg-indigo-500 hover:bg-indigo-600"
                onClick={handleConnectSourceWallet}
                disabled={isLoading}
              >
                {isLoading ? "Connecting..." : "Connect source wallet"}
              </Button>
            ) : (
              <Button
                className="w-full h-14 text-lg bg-indigo-500 hover:bg-indigo-600"
                onClick={handleBridge}
                disabled={isLoading || !amount || Number(amount) <= 0}
              >
                {isLoading ? "Processing..." : "Bridge tokens"}
              </Button>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 flex justify-center items-center">
            <div className="text-gray-400 text-sm flex items-center">
              Powered by
              <span className="font-bold text-white ml-2">WORMHOLE</span>
            </div>
          </div>
        </Card>

        {/* Transaction history button */}
        <div className="mt-4 flex justify-center">
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-white"
            onClick={() => router.push("/bridge/history")}
          >
            <History className="mr-2 h-4 w-4" />
            Transaction History
          </Button>
        </div>
      </div>

      {/* Network/Token Selectors */}
      <NetworkTokenSelector
        isOpen={isSourceSelectorOpen}
        onCloseAction={() => setIsSourceSelectorOpen(false)}
        type="source"
        onSelectAction={handleSourceSelect}
        currentNetwork={sourceNetwork}
        currentToken={sourceToken}
      />

      <NetworkTokenSelector
        isOpen={isDestinationSelectorOpen}
        onCloseAction={() => setIsDestinationSelectorOpen(false)}
        type="destination"
        onSelectAction={handleDestinationSelect}
        currentNetwork={destinationNetwork}
        currentToken={destinationToken}
      />
    </div>
  )
}
