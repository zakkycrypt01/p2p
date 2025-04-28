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

type Token = { symbol: string; name: string; icon: string; balance: number; price: number }

export default function SwapPage() {
  const { address: currentAccount } = useSuiWallet()
  const router = useRouter()
  const { toast } = useToast()

  const { data: balanceData, isLoading: balancesLoading } = useSuiClientQuery(
    "getBalance",
    { owner: currentAccount ?? "" }
  )

  const rawBalances = balanceData
    ? Array.isArray(balanceData)
      ? balanceData
      : [balanceData]
    : []

  const balances: Token[] = rawBalances.map((b: any) => {
    const symbol = b.coinType.split("::").pop() ?? b.coinType
    return {
      symbol,
      name: symbol,
      icon: b.iconUrl ?? `/tokens/${symbol.toLowerCase()}.png`,
      balance: Number(b.totalBalance) / 1e9,
      price: 0,
    }
  })

  const [tokens, setTokens] = useState<Token[]>([])
  const [fromToken, setFromToken] = useState<Token>()
  const [toToken, setToToken] = useState<Token>()

  useEffect(() => {
    if (!balancesLoading && balances.length) {
      setTokens(balances)
      setFromToken(balances[0])
      setToToken(balances[1] ?? balances[0])
    }
  }, [balancesLoading, balances.length])

  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [slippage, setSlippage] = useState("0.5")

  useEffect(() => {
    if (!currentAccount) router.push("/")
  }, [currentAccount, router])

  // always calculate exchange rate & update amounts
  const exchangeRate = fromToken && toToken ? toToken.price / fromToken.price : 0

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

  const handleSwap = async () => {
    if (!currentAccount) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to swap tokens",
        variant: "destructive",
      })
      return
    }

    if (!fromAmount || !toAmount || isNaN(Number(fromAmount)) || isNaN(Number(toAmount))) {
      toast({
        title: "Invalid amount",
        description: "Please enter valid amounts",
        variant: "destructive",
      })
      return
    }

    if (Number(fromAmount) > fromToken!.balance) {
      toast({
        title: "Insufficient balance",
        description: `You don't have enough ${fromToken!.symbol}`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Swap successful",
        description: `Swapped ${fromAmount} ${fromToken!.symbol} for ${toAmount} ${toToken!.symbol}`,
      })

      setFromAmount("")
      setToAmount("")
    } catch (error) {
      console.error("Error swapping tokens:", error)
      toast({
        title: "Swap failed",
        description: "There was an error swapping your tokens. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const ready = Boolean(currentAccount && !balancesLoading && fromToken && toToken)

  return (
    <>
      {!ready ? null : (
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
                              src={token.icon || "/placeholder.svg"}
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
                              src={token.icon || "/placeholder.svg"}
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
        </div>
      )}
    </>
  )
}
