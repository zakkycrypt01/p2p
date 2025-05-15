"use client"

import { useSuiWallet } from "@/hooks/use-sui-wallet"
import dynamic from "next/dynamic"
import { Card } from "@/components/ui/card"
import type { WormholeConnectConfig, WormholeConnectTheme } from "@wormhole-foundation/wormhole-connect"
import Loading from "./loading"
import { ErrorBoundary } from "react-error-boundary"
import ErrorPage from "./error"

const WormholeConnect = dynamic(
  () => import("@wormhole-foundation/wormhole-connect").then((mod) => mod.default),
  { ssr: false, loading: () => <Loading /> }
)

export default function BridgePage() {
  const { address } = useSuiWallet()
  const config: WormholeConnectConfig = {
    network: "Testnet",
    chains: ['Sui', 'Avalanche','Acala','Ethereum','Polygon','Solana','Aptos','Terra','Btc','Bsc','Injective'],
    ui: { title: "Bridge Your Assets" },
  }
  const theme: WormholeConnectTheme = {
    mode: "dark",
    primary: "#2563eb",
    secondary: "#2563eb",
    background: "dark",
  }

  if (!address) return null

  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <ErrorPage error={error} reset={resetErrorBoundary} />
      )}
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <h1 className="text-3xl font-bold mb-6 text-white text-center">
            SuiXchange Bridge
          </h1>
          <Card className="bg-gray-800 border-gray-700 shadow-xl overflow-hidden">
            <div className="p-0">
              <WormholeConnect config={config} theme={theme} />
            </div>
          </Card>
          <div className="mt-6 text-center text-gray-400 text-sm">
            <p>Securely bridge assets and go multichain</p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
