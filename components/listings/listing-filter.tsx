"use client"

import { useState } from "react"
import { useListings } from "@/hooks/use-listings"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Filter, X } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

// Mock data
const tokens = [
  { symbol: "SUI", name: "Sui" },
  { symbol: "USDC", name: "USD Coin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "BTC", name: "Bitcoin" },
]

const fiatCurrencies = ["USD", "EUR", "GBP", "JPY", "AUD"]

const paymentMethods = ["Bank Transfer", "PayPal", "Venmo", "Cash App", "Zelle", "Revolut"]

interface ListingFilterProps {
  orderType?: "buy" | "sell"
}

export function ListingFilter({ orderType = "buy" }: ListingFilterProps) {
  const { setFilters } = useListings()
  const [token, setToken] = useState<string>("")
  const [fiatCurrency, setFiatCurrency] = useState<string>("")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([])

  const handlePaymentMethodChange = (method: string, checked: boolean) => {
    if (checked) {
      setSelectedPaymentMethods((prev) => [...prev, method])
    } else {
      setSelectedPaymentMethods((prev) => prev.filter((m) => m !== method))
    }
  }

  const applyFilters = () => {
    setFilters({
      token,
      fiatCurrency,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      paymentMethods: selectedPaymentMethods.length > 0 ? selectedPaymentMethods : undefined,
      orderType,
    })
  }

  const resetFilters = () => {
    setToken("")
    setFiatCurrency("")
    setPriceRange([0, 1000])
    setSelectedPaymentMethods([])
    setFilters({ orderType })
  }

  // Mobile filter
  const MobileFilter = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <Label>Token</Label>
            <Select value={token} onValueChange={setToken}>
              <SelectTrigger>
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tokens</SelectItem>
                {tokens.map((t) => (
                  <SelectItem key={t.symbol} value={t.symbol}>
                    {t.name} ({t.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={fiatCurrency} onValueChange={setFiatCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All currencies</SelectItem>
                {fiatCurrencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <Label>Price Range</Label>
              <div className="text-sm">
                {priceRange[0]} - {priceRange[1]}
              </div>
            </div>
            <Slider
              defaultValue={priceRange}
              min={0}
              max={1000}
              step={10}
              onValueChange={(value) => setPriceRange(value as [number, number])}
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Methods</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {paymentMethods.map((method) => (
                <div key={method} className="flex items-center space-x-2">
                  <Checkbox
                    id={`mobile-${method}`}
                    checked={selectedPaymentMethods.includes(method)}
                    onCheckedChange={(checked) => handlePaymentMethodChange(method, checked as boolean)}
                  />
                  <Label htmlFor={`mobile-${method}`} className="text-sm">
                    {method}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={applyFilters} className="flex-1">
              Apply Filters
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )

  // Desktop filter
  return (
    <div className="bg-card border rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{orderType === "buy" ? "Buy Crypto Filters" : "Sell Crypto Filters"}</h2>
        <div className="flex gap-2">
          <MobileFilter />
          <Button variant="ghost" size="sm" onClick={resetFilters} className="hidden md:flex">
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label className="mb-2 block">Token</Label>
          <Select value={token} onValueChange={setToken}>
            <SelectTrigger>
              <SelectValue placeholder="Select token" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tokens</SelectItem>
              {tokens.map((t) => (
                <SelectItem key={t.symbol} value={t.symbol}>
                  {t.name} ({t.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Currency</Label>
          <Select value={fiatCurrency} onValueChange={setFiatCurrency}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All currencies</SelectItem>
              {fiatCurrencies.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <Label>Price Range</Label>
            <span className="text-sm text-muted-foreground">
              {priceRange[0]} - {priceRange[1]}
            </span>
          </div>
          <Slider
            defaultValue={priceRange}
            min={0}
            max={1000}
            step={10}
            onValueChange={(value) => setPriceRange(value as [number, number])}
          />
        </div>

        <div>
          <Accordion type="single" collapsible defaultValue="payment-methods">
            <AccordionItem value="payment-methods" className="border-none">
              <AccordionTrigger className="py-0 px-0">
                <Label>Payment Methods</Label>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {paymentMethods.map((method) => (
                    <div key={method} className="flex items-center space-x-2">
                      <Checkbox
                        id={method}
                        checked={selectedPaymentMethods.includes(method)}
                        onCheckedChange={(checked) => handlePaymentMethodChange(method, checked as boolean)}
                      />
                      <Label htmlFor={method} className="text-sm">
                        {method}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <div className="hidden md:flex justify-end mt-4">
        <Button onClick={applyFilters}>Apply Filters</Button>
      </div>
    </div>
  )
}

