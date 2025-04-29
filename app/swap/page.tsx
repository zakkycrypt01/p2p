"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSuiWallet } from "@/hooks/use-sui-wallet"
import { useSuiClientQuery } from "@mysten/dapp-kit"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ArrowDownUp, RefreshCw, AlertCircle } from "lucide-react"
import Image from "next/image"
import BN from "bn.js"
import d from "decimal.js"
import {
  initCetusSDK,
  adjustForSlippage,
  Percentage
} from "@cetusprotocol/cetus-sui-clmm-sdk"

// Declare your full SDKConfig
const SDKConfig = {
  testnet: {
    clmmConfig: {
      // Pool‐registry ID for all CLMM pools on Sui testnet:
      pools_id: '0x67679ae85ea0f39f5c211330bb830f68aeccfbd0085f47f80fc27bef981cc678',
      global_config_id: '0x28565a057d74e4c20d502002bdef5ecf8ff99e1bd9fc4dd11fe549c858ee99d7',
      global_vault_id: '0x6d582d2fa147214d50a0e537084859403e96a3b4554e962d5e993ad5761251f4',
    },
  },
}

// Initialize Cetus SDK using that config
const sdk = initCetusSDK({
  network: 'testnet',
  ...SDKConfig.testnet.clmmConfig,
})

// Extend your Token type
type Token = {
  name: string
  symbol: string
  coinType: string
  balance: number
}

// Declare your default list
const DEFAULT_TOKENS: Token[] = [
  {
    name: "Sui",
    symbol: "SUI",
    coinType: "0x2::sui::SUI",
    balance: 0,
  },
  {
    name: "USD Coin",
    symbol: "USDC",
    coinType: "0xcd9b7fc39478547e0253517fec9a45bfbc021d2afcf0b07d1e2b78d21cee3de8::usdc::USDC",
    balance: 0,
  },
  {
    name: "Tether USD",
    symbol: "USDT",
    coinType: "0xaf9ef585e2efd13321d0a2181e1c0715f9ba28ed052055d33a8b164f6c146a56::tusdt::TUSDT",
    balance: 0,
  }
]

// Replace this with the ID of the actual pool object you want to hit
const TESTNET_POOL_OBJECT_ID = "0xbed3136f15b0ea649fb94bcdf9d3728fb82ba1c3e189bf6062d78ff547850054"

async function fetchOnePool() {
  try {
    const pool = await sdk.Pool.getPool(
      "0xbed3136f15b0ea649fb94bcdf9d3728fb82ba1c3e189bf6062d78ff547850054"
    )
    console.log("✅ got pool:", pool.poolAddress)
  } catch (e) {
    console.error("❌ getPool failed:", e)
  }
}

fetchOnePool()

export default function SwapPage() {
  const { address: currentAccount } = useSuiWallet()
  const router = useRouter()
  const { toast } = useToast()

  const { data: balanceData, isLoading: balancesLoading } = useSuiClientQuery(
    "getBalance",
    { owner: currentAccount ?? "" }
  )

  // Parse on‐chain balances into same shape
  const rawBalances = balanceData
    ? Array.isArray(balanceData)
      ? balanceData
      : [balanceData]
    : []

  const onchain: Token[] = rawBalances.map((b: any) => {
    const symbol = b.coinType.split("::").pop() || b.coinType
    return {
      name: symbol,
      symbol,
      coinType: b.coinType,
      balance: Number(b.totalBalance) / 1e9,
    }
  })

  // Init state from DEFAULT_TOKENS
  const [tokens, setTokens] = useState<Token[]>(DEFAULT_TOKENS)
  const [fromToken, setFromToken] = useState<Token>(DEFAULT_TOKENS[0])
  const [toToken, setToToken] = useState<Token>(DEFAULT_TOKENS[1] || DEFAULT_TOKENS[0])

  // When onchain balances arrive (first time), merge into your universe
  useEffect(() => {
    if (balancesLoading || onchain.length === 0) return
    const merged = DEFAULT_TOKENS.map((dt) => {
      const found = onchain.find((oc) => oc.symbol === dt.symbol)
      return found || dt
    })
    setTokens(merged)
    setFromToken(merged[0])
    setToToken(merged[1] || merged[0])
  }, [balancesLoading, onchain.length])

  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [slippage, setSlippage] = useState("0.5")

  useEffect(() => {
    if (!currentAccount) {
      // Add any logic here if needed, or leave it empty
      console.log("No current account connected");
    }
  }, [currentAccount])

  // always calculate exchange rate & update amounts
  const exchangeRate = fromToken && toToken ? toToken.balance / fromToken.balance : 0

  useEffect(() => {
    if (fromAmount && !isNaN(Number(fromAmount))) {
      setToAmount((Number(fromAmount) * exchangeRate).toFixed(6))
    } else {
      setToAmount("")
    }
  }, [fromAmount, exchangeRate])

  const handleToAmountChange = (value: string) => {
    setToAmount(value)
    if (value && !isNaN(Number(value))) {
      setFromAmount((Number(value) / exchangeRate).toFixed(6))
    } else {
      setFromAmount("")
    }
  }

  const handleSwapTokens = () => {
    const tmp = fromToken!
    setFromToken(toToken)
    setToToken(tmp)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  // Cetus pool & tick data
  const [pool, setPool] = useState<any>(null)
  const [ticks, setTicks] = useState<any[]>([])

  // 1) whenever the user picks a new (fromToken, toToken) pair, fetch the correct pool via SDK helper
  useEffect(() => {
    if (!currentAccount || !fromToken || !toToken) return;

    (async () => {
      // 1) Prepare the encoded coin-type array
      const coinTypes = [fromToken.coinType, toToken.coinType]
        .sort()
        .map((ct) => encodeURIComponent(ct));

      try {
        // 2) Attempt to fetch pools by coin pair
        const pools = await sdk.Pool.getPoolByCoins(coinTypes);
        if (!pools || pools.length === 0) {
          console.log("⚠️ No pool found for that token pair:", coinTypes);
          toast({
            title: "Pool not found",
            description: "No CLMM pool exists for that pair on testnet.",
            variant: "destructive",
          });
          return;
        }

        // 3) Use the first matching pool
        setPool(pools[0]);
      } catch (err) {
        // 4) Catch any parse/network/SDK errors and log them
        console.log("❌ getPoolByCoins error:", err);
        toast({
          title: "Pool lookup failed",
          description: err instanceof Error ? err.message : String(err),
          variant: "destructive",
        });
      }
    })();
  }, [currentAccount, fromToken.coinType, toToken.coinType, toast]);

  // 2) once pool is set, fetch its ticks
  useEffect(() => {
    if (!pool) return
    const coinTypeA = fromToken.coinType
    const coinTypeB = toToken.coinType

    ;(async () => {
      try {
        const data = await sdk.Pool.fetchTicks({
          pool_id: pool.poolAddress,
          coinTypeA,
          coinTypeB,
        })
        setTicks(data)
      } catch (e) {
        console.error("fetchTicks error:", e)
        toast({
          title: "Failed to load pool ticks",
          variant: "destructive",
        })
      }
    })()
  }, [pool, fromToken.coinType, toToken.coinType, toast])

  // Perform the on-chain swap via Cetus
  const handleSwap = async () => {
    if (!currentAccount) {
      toast({ title: "Wallet not connected", description: "Please connect to swap", variant: "destructive" })
      return
    }
    if (!fromAmount || isNaN(Number(fromAmount)) || Number(fromAmount) > fromToken!.balance) {
      toast({ title: "Invalid amount or insufficient balance", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      // direction & raw input
      const a2b = fromToken!.symbol === pool.coinTypeA.split("::").pop()
      const decimalsA = pool.decimalsA
      const amountIn = new BN(
        Math.floor(Number(fromAmount) * 10 ** decimalsA).toString()
      )

      // 1) Pre‐swap quote
      const preswap = await sdk.Swap.preswap({
        pool,
        currentSqrtPrice: pool.current_sqrt_price,
        coinTypeA: pool.coinTypeA,
        coinTypeB: pool.coinTypeB,
        decimalsA,
        decimalsB: pool.decimalsB,
        a2b,
        byAmountIn: true,
        amount: amountIn.toString()
      })

      // 2) compute minimum receive with slippage tolerance
      const tol = Percentage.fromDecimal(d(slippage))
      const estimatedOut = preswap?.estimatedAmountOut || new BN(0)
      const amountLimit = adjustForSlippage(estimatedOut, tol, false)

      // 3) build swap payload (with optional partner)
      const partner = "0x8e0b7668a79592f70fbfb1ae0aebaf9e2019a7049783b9a4b6fe7c6ae038b528"
      const swapPayload = sdk.Swap.createSwapTransactionPayload({
        pool_id: pool.poolAddress,
        coinTypeA: pool.coinTypeA,
        coinTypeB: pool.coinTypeB,
        a2b,
        by_amount_in: true,
        amount: preswap?.amount?.toString() || "0",
        amount_limit: amountLimit.toString(),
        swap_partner: partner
      })

      } catch (error) {
      console.error(error)
      toast({ title: "Swap failed", description: "Try again", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const ready = Boolean(
    currentAccount &&
    !balancesLoading &&
    fromToken &&
    toToken
  )

  return (
    <>
      {!ready ? (
        <div>Loading wallet & balances…</div>
      ) : (
        <div className="container mx-auto py-8 px-4 max-w-md">
          <h1 className="text-3xl font-bold mb-6">Swap Tokens</h1>

          <Card>
            <CardHeader>
              <CardTitle>Swap</CardTitle>
              <CardDescription>Exchange tokens at the best rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="from-amount">From</Label>
                  <span className="text-sm text-muted-foreground">
                    Balance: {fromToken!.balance.toFixed(4)} {fromToken!.symbol}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Input
                      id="from-amount"
                      type="number"
                      placeholder="0.0"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 px-2 text-xs"
                      onClick={() => setFromAmount(fromToken!.balance.toString())}
                    >
                      MAX
                    </Button>
                  </div>
                  <Select
                    value={fromToken!.symbol}
                    onValueChange={(value) => {
                      const token = tokens.find((t) => t.symbol === value)
                      if (token) setFromToken(token)
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tokens.map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          <div className="flex items-center gap-2">
                            <Image
                              src={`/tokens/${token.symbol.toLowerCase()}.png`}
                              alt={token.name}
                              width={20}
                              height={20}
                              className="rounded-full"
                            />
                            {token.symbol}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-center">
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10" onClick={handleSwapTokens}>
                  <ArrowDownUp className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="to-amount">To</Label>
                  <span className="text-sm text-muted-foreground">
                    Balance: {toToken!.balance.toFixed(4)} {toToken!.symbol}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Input
                    id="to-amount"
                    type="number"
                    placeholder="0.0"
                    value={toAmount}
                    onChange={(e) => handleToAmountChange(e.target.value)}
                    className="flex-1"
                  />
                  <Select
                    value={toToken!.symbol}
                    onValueChange={(value) => {
                      const token = tokens.find((t) => t.symbol === value)
                      if (token) setToToken(token)
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tokens.map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          <div className="flex items-center gap-2">
                            <Image
                              src={`/tokens/${token.symbol.toLowerCase()}.png`}
                              alt={token.name}
                              width={20}
                              height={20}
                              className="rounded-full"
                            />
                            {token.symbol}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {fromAmount && toAmount && (
                <div className="bg-muted p-3 rounded-md text-sm">
                  <div className="flex justify-between items-center">
                    <span>Exchange Rate</span>
                    <span>
                      1 {fromToken!.symbol} = {exchangeRate.toFixed(6)} {toToken!.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span>Slippage Tolerance</span>
                    <span>{slippage}%</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="slippage">Slippage Tolerance</Label>
                <div className="flex space-x-2">
                  {["0.1", "0.5", "1.0"].map((value) => (
                    <Button
                      key={value}
                      variant={slippage === value ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setSlippage(value)}
                    >
                      {value}%
                    </Button>
                  ))}
                  <div className="relative flex-1">
                    <Input
                      id="slippage"
                      type="number"
                      value={slippage}
                      onChange={(e) => setSlippage(e.target.value)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300 rounded-md">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Low liquidity warning</p>
                  <p>Swapping large amounts may result in higher slippage.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleSwap}
                disabled={isLoading || !fromAmount || !toAmount || Number(fromAmount) <= 0}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Swapping...
                  </>
                ) : (
                  "Swap"
                )}
              </Button>
            </CardFooter>
          </Card>

          {!pool && (
            <div className="text-center py-4 text-sm text-gray-500">
              Fetching pool data…
            </div>
          )}
        </div>
      )}
    </>
  )
}
