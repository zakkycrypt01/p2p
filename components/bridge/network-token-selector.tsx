"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, ExternalLink } from "lucide-react"
import Image from "next/image"

// Network data
const networks = [
  { id: "ethereum", symbol: "ETH", name: "Ethereum", icon: "/tokens/eth.png" },
  { id: "solana", symbol: "SOL", name: "Solana", icon: "/tokens/sol.png" },
  { id: "arbitrum", symbol: "ARB", name: "Arbitrum", icon: "/tokens/arb.png" },
  { id: "base", symbol: "BASE", name: "Base", icon: "/tokens/base.png" },
  { id: "sui", symbol: "SUI", name: "Sui", icon: "/tokens/sui.png" },
]

// Token data by network
const tokensByNetwork = {
  ethereum: [
    { symbol: "ETH", name: "ETH", icon: "/tokens/eth.png", address: null },
    { symbol: "USDC", name: "USDC", icon: "/tokens/usdc.png", address: "0xA0b...06eB48" },
    { symbol: "AGA", name: "AGA", icon: "/tokens/aga.png", address: "0x87B...9Ea88C" },
    { symbol: "ALT", name: "ALT", icon: "/tokens/alt.png", address: "0x845...C0fbFB" },
    { symbol: "AUDIO", name: "AUDIO", icon: "/tokens/audio.png", address: "0x18a...65B998" },
    { symbol: "USDT", name: "USDT", icon: "/tokens/usdt.png", address: "0xdAC...42069" },
    { symbol: "DAI", name: "DAI", icon: "/tokens/dai.png", address: "0x6B1...7A4B2" },
    { symbol: "WBTC", name: "Wrapped Bitcoin", icon: "/tokens/btc.png", address: "0x2260...C2A8" },
  ],
  solana: [
    { symbol: "SOL", name: "SOL", icon: "/tokens/sol.png", address: null },
    { symbol: "USDC", name: "USDC", icon: "/tokens/usdc.png", address: "EPjF...Zn5" },
  ],
  arbitrum: [
    { symbol: "ARB", name: "ARB", icon: "/tokens/arb.png", address: null },
    { symbol: "ETH", name: "ETH", icon: "/tokens/eth.png", address: null },
    { symbol: "USDC", name: "USDC", icon: "/tokens/usdc.png", address: "0xFF9...B7A3" },
  ],
  base: [
    { symbol: "ETH", name: "ETH", icon: "/tokens/eth.png", address: null },
    { symbol: "USDC", name: "USDC", icon: "/tokens/usdc.png", address: "0x833...A9B2" },
  ],
  sui: [
    { symbol: "SUI", name: "SUI", icon: "/tokens/sui.png", address: null },
    { symbol: "USDC", name: "USDC", icon: "/tokens/usdc.png", address: "0x5d4...e7f1" },
  ],
}

interface NetworkTokenSelectorProps {
  isOpen: boolean
  onCloseAction: () => void
  type: "source" | "destination"
  onSelectAction: (network: string, token: string) => void
  currentNetwork: string
  currentToken: string
}

export default function NetworkTokenSelector({
  isOpen,
  onCloseAction,
  type,
  onSelectAction,
  currentNetwork,
  currentToken,
}: NetworkTokenSelectorProps) {
  const [selectedNetwork, setSelectedNetwork] = useState(currentNetwork || "ethereum")
  const [searchQuery, setSearchQuery] = useState("")
  const [availableTokens, setAvailableTokens] = useState(
    tokensByNetwork[selectedNetwork as keyof typeof tokensByNetwork] || [],
  )

  // Update available tokens when network changes
  useEffect(() => {
    if (selectedNetwork) {
      setAvailableTokens(tokensByNetwork[selectedNetwork as keyof typeof tokensByNetwork] || [])
    }
  }, [selectedNetwork])

  // Filter tokens based on search query
  const filteredTokens = availableTokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (token.address && token.address.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Handle network selection
  const handleNetworkSelect = (networkId: string) => {
    setSelectedNetwork(networkId)
    // Reset search when changing networks
    setSearchQuery("")
  }

  // Handle token selection
  const handleTokenSelect = (token: string) => {
    onSelectAction(selectedNetwork, token)
    onCloseAction()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCloseAction()}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {type === "source" ? "From" : "To"} - Select a network
          </DialogTitle>
        </DialogHeader>

        {/* Network selection */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-2">
          {networks.map((network) => (
            <div
              key={network.id}
              className={`flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer transition-colors ${
                selectedNetwork === network.id
                  ? "bg-gray-700 border-2 border-gray-600"
                  : "bg-gray-800 hover:bg-gray-750 border-2 border-transparent"
              }`}
              onClick={() => handleNetworkSelect(network.id)}
            >
              <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center mb-2">
                <Image
                  src={network.icon || "/placeholder.svg"}
                  alt={network.name}
                  width={32}
                  height={32}
                  className="rounded-md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=32&width=32"
                  }}
                />
              </div>
              <span className="text-sm font-medium">{network.symbol}</span>
            </div>
          ))}
          <div
            className="flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-750 border-2 border-transparent"
            onClick={() => {
              // Handle "other" network selection
            }}
          >
            <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center mb-2">
              <span className="text-2xl font-bold">+</span>
            </div>
            <span className="text-sm font-medium">other</span>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-bold mb-3">Select a token</h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            <Input
              placeholder="Search for a token or paste an address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white h-12 rounded-full"
            />
          </div>

          <div className="mt-2">
            <h4 className="text-gray-400 text-sm mb-2">
              Tokens on {networks.find((n) => n.id === selectedNetwork)?.name}
            </h4>
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-1">
              {filteredTokens.map((token) => (
                <div
                  key={token.symbol}
                  className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleTokenSelect(token.symbol)}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                    <Image
                      src={token.icon || "/placeholder.svg"}
                      alt={token.symbol}
                      width={32}
                      height={32}
                      className="rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=32&width=32"
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="text-lg font-semibold">{token.symbol}</div>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <span>{token.name}</span>
                      {token.address && (
                        <>
                          <span className="mx-1">•</span>
                          <span className="flex items-center">
                            {token.address}
                            <ExternalLink size={12} className="ml-1" />
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredTokens.length === 0 && (
                <div className="text-center py-6 text-gray-400">No tokens found matching "{searchQuery}"</div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
