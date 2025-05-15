"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSuiWallet } from "@/hooks/use-sui-wallet"
import dynamic from "next/dynamic"
import { Card } from "@/components/ui/card"
import type { WormholeConnectConfig, WormholeConnectTheme } from "@wormhole-foundation/wormhole-connect"

const WormholeConnect = dynamic(
  () => import("@wormhole-foundation/wormhole-connect").then((mod) => mod.default),
  { ssr: false }
)

export default function BridgePage() {
  const config: WormholeConnectConfig = {
    network: 'Testnet',
    chains: ['Sui', 'Avalanche','Acala','Ethereum','Polygon','Solana','Aptos','Terra','Btc'],

    ui: {
      title: 'Bridge Your Assets',
    },
  }
  const theme: WormholeConnectTheme = {
    mode: 'dark',
    primary: '#2563eb',
    secondary: "#2563eb"
  }

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-white text-center">Token Bridge</h1>
        <Card className="bg-gray-800 border-gray-700 shadow-xl overflow-hidden">
          <div className="p-0">
            <WormholeConnect config={config} theme={theme} />
          </div>
        </Card>
        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>Securely bridge tokens between Sui and Avalanche with Wormhole</p>
          <p className="mt-1">Using Testnet for development and testing</p>
        </div>
      </div>
    </div>
  )
}
