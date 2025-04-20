"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpRight, ArrowDownRight, AlertCircle } from "lucide-react"
import { useContract } from "@/hooks/useContract"
import { useSuiWallet } from "@/hooks/use-sui-wallet"



// Mock data
const tokens = [
  { symbol: "SUI", name: "Sui", coinID: `0x2::sui::SUI` },
  { symbol: "USDC", name: "USD Coin", coinID: '0xTODO::usdc::USDC' },
  { symbol: "ETH", name: "Ethereum", coinID: '0xTODO::eth::ETH' },
  { symbol: "USDT", name: "Tether", coinID: '0xTODO::usdt::USDT' },
  { symbol: "BTC", name: "Bitcoin", coinID: '0xTODO::btc::BTC' },
];


const fiatCurrencies = ["USD", "EUR", "GBP", "JPY", "AUD"]

const paymentMethods = [
  { id: "bank_transfer", label: "Bank Transfer" },
  { id: "paypal", label: "PayPal" },
  { id: "venmo", label: "Venmo" },
  { id: "cash_app", label: "Cash App" },
  { id: "zelle", label: "Zelle" },
  { id: "revolut", label: "Revolut" },
]

const sellFormSchema = z.object({
  token: z.string().min(1, "Token is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  price: z.coerce.number().positive("Price must be positive"),
  fiatCurrency: z.string().min(1, "Currency is required"),
  paymentMethods: z.array(z.string()).min(1, "At least one payment method is required"),
  minAmount: z.coerce.number().positive("Minimum amount must be positive"),
  maxAmount: z.coerce.number().positive("Maximum amount must be positive"),
  paymentWindow: z.coerce.number().int().positive("Payment window is required"),
  releaseTime: z.coerce.number().int().positive("Release time is required"),
  description: z.string().optional(),
})

const buyFormSchema = z.object({
  token: z.string().min(1, "Token is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  price: z.coerce.number().positive("Price must be positive"),
  fiatCurrency: z.string().min(1, "Currency is required"),
  paymentMethods: z.array(z.string()).min(1, "At least one payment method is required"),
  minAmount: z.coerce.number().positive("Minimum amount must be positive"),
  maxAmount: z.coerce.number().positive("Maximum amount must be positive"),
  paymentWindow: z.coerce.number().int().positive("Payment window is required"),
  description: z.string().optional(),
})

type SellFormValues = z.infer<typeof sellFormSchema>
type BuyFormValues = z.infer<typeof buyFormSchema>

export function NewListingForm() {
  const coinObjectId = useSuiWallet()
  const currentAccount = useCurrentAccount()
  const connected = useSuiWallet()
  const {createListing} = useContract()
  const address = currentAccount?.address
  
  const [fetchedCoinObjectId, setFetchedCoinObjectId] = useState<string | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    if (coinObjectId?.fetchCoinObjectId) {
      coinObjectId.fetchCoinObjectId({ address: address! }).then((result) => {
        if (isMounted) {
          // console.log('coinObjectId :>> ', result || "No coinObjectId available");
          setFetchedCoinObjectId(result);
        }
      }).catch((error) => {
        if (isMounted) {
          console.log('Error fetching coinObjectId:', error);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [coinObjectId, address]);
  const suiToken = tokens.find(token => token.symbol === "SUI");
  if (suiToken) {
    suiToken.coinID = fetchedCoinObjectId || suiToken.coinID;
  }
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderType, setOrderType] = useState<"buy" | "sell">("sell")
  const [metadata, setMetadata] = useState<Array<{key: string, value: string}>>([
    {key: 'description', value: ''},
    {key: 'paymentMethods', value: ''},
    {key: 'minAmount', value: ''},
    {key: 'maxAmount', value: ''},
  ]);
  const addMetadataField = () => {
    setMetadata([...metadata, {key: '', value: ''}])
  }
  const updateMetadata = (index: number, key: string, value: string) => {
    const newMetadata = [...metadata];
    newMetadata[index] = { ...newMetadata[index], [key]: value };
    setMetadata(newMetadata);
  };

  

  const sellForm = useForm<SellFormValues>({
    resolver: zodResolver(sellFormSchema),
    defaultValues: {
      token: "",
      amount: 1,
      price: 2.5,
      fiatCurrency: "USD",
      paymentMethods: [],
      minAmount: 1.00,
      maxAmount: 100.00,
      paymentWindow: 86400,
      releaseTime: 15,
      description: "",
    },
  })
  
  const buyForm = useForm<BuyFormValues>({
    resolver: zodResolver(buyFormSchema),
    defaultValues: {
      token: "",
      amount: 0.00,
      price: 0.00,
      fiatCurrency: "USD",
      paymentMethods: [],
      minAmount: 0.00,
      maxAmount: 0.00,
      paymentWindow: 30,
      description: "",
    },
  })
  
  const onSubmitSell = async (values: SellFormValues) => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a listing",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Update metadata with form values before processing
      const updatedMetadata = [
        { key: 'description', value: values.description || '' },
        { key: 'paymentMethods', value: values.paymentMethods.join(',') },
        { key: 'minAmount', value: values.minAmount.toString() },
        { key: 'maxAmount', value: values.maxAmount.toString() },
      ];
      
      const metadataKeys = updatedMetadata.map((item) => item.key).filter(key => key.trim() !== '');
      const metadataValues = updatedMetadata
        .filter(item => item.key.trim() !== '')
        .map((item) => item.value);
      
      const tokenDecimalPlaces = 9;
      
      const tokenAmount = BigInt(Math.floor(values.amount * (10 ** tokenDecimalPlaces)));
      const price = BigInt(Math.round(values.price * 100));
      
      console.log("Creating sell listing with:", {
        token: values.token,
        amount: tokenAmount.toString(),
        price: price.toString(),
        expiry: values.paymentWindow,
      });
      
      const result = await createListing({
        token_coin: values.token,
        token_amount: Number(tokenAmount),
        price: Number(price),
        expiry: values.paymentWindow,
        metadataKeys,
        metadataValues,
      })

      toast({
        title: "Sell listing created successfully",
        description: "Your listing has been published to the order book",
      })

    } catch (error) {
      console.error("Error creating listing:", error)
      toast({
        title: "Failed to create listing",
        description: "There was an error creating your listing. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      await new Promise((resolve) => setTimeout(resolve, 100000));
      router.push("/dashboard");
    }
  }

  const onSubmitBuy = async (values: BuyFormValues) => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a listing",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      console.log("Creating buy listing on-chain:", values)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log("Posting listing metadata to API")

      toast({
        title: "Buy listing created successfully",
        description: "Your listing has been published to the order book",
      })

    } catch (error) {
      console.error("Error creating listing:", error)
      toast({
        title: "Failed to create listing",
        description: "There was an error creating your listing. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      router.push("/dashboard")
    }
  }

  if (!address) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="mb-4">Please connect your wallet to create a listing</p>
          <Button onClick={() => window.scrollTo(0, 0)}>Connect Wallet</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="sell" onValueChange={(value) => setOrderType(value as "buy" | "sell")}>
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="sell" className="flex items-center gap-2">
          <ArrowDownRight className="h-4 w-4" />
          Sell Crypto
        </TabsTrigger>
        <TabsTrigger value="buy" className="flex items-center gap-2">
          <ArrowUpRight className="h-4 w-4" />
          Buy Crypto
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sell">
        <Card>
          <CardContent className="pt-6">
            <div className="mb-6 p-4 bg-muted rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium mb-1">Creating a Sell Listing</h3>
                <p className="text-sm text-muted-foreground">
                  When you create a sell listing, you're offering to sell your cryptocurrency to buyers. Once a buyer
                  initiates a trade, your crypto will be locked in escrow until you confirm payment and release the
                  funds.
                </p>
              </div>
            </div>

            <Form {...sellForm}>
              <form onSubmit={sellForm.handleSubmit(onSubmitSell)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={sellForm.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token to Sell</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select token" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tokens.map((token) => (
                              <SelectItem key={token.coinID} value={token.coinID}>
                                {token.name} ({token.symbol})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={sellForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Amount</FormLabel>
                        <FormControl>
                          <Input type="number" step=".1" {...field} />
                        </FormControl>
                        <FormDescription>Total amount of tokens to sell</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={sellForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per Token</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={sellForm.control}
                    name="fiatCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {fiatCurrencies.map((currency) => (
                              <SelectItem key={currency} value={currency}>
                                {currency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={sellForm.control}
                    name="minAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Purchase</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.0001" {...field} />
                        </FormControl>
                        <FormDescription>Minimum amount a buyer can purchase</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={sellForm.control}
                    name="maxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Purchase</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.0001" {...field} />
                        </FormControl>
                        <FormDescription>Maximum amount a buyer can purchase</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={sellForm.control}
                    name="paymentWindow"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Window (minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" min="5" max="180000" {...field} />
                        </FormControl>
                        <FormDescription>Time buyer has to complete payment</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={sellForm.control}
                    name="releaseTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Release Time (minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="60" {...field} />
                        </FormControl>
                        <FormDescription>Maximum time to release funds after payment</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={sellForm.control}
                  name="paymentMethods"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Payment Methods</FormLabel>
                        <FormDescription>Select the payment methods you accept</FormDescription>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {paymentMethods.map((method) => (
                          <FormField
                            key={method.id}
                            control={sellForm.control}
                            name="paymentMethods"
                            render={({ field }) => {
                              return (
                                <FormItem key={method.id} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(method.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, method.id])
                                          : field.onChange(field.value?.filter((value) => value !== method.id))
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{method.label}</FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={sellForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Instructions (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional information or payment instructions for buyers"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Creating Listing..." : "Create Sell Listing"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="buy">
        <Card>
          <CardContent className="pt-6">
            <div className="mb-6 p-4 bg-muted rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium mb-1">Creating a Buy Listing</h3>
                <p className="text-sm text-muted-foreground">
                  When you create a buy listing, you're offering to buy cryptocurrency from sellers. Sellers can view
                  your listing and initiate a trade. You'll need to complete payment within the specified payment
                  window.
                </p>
              </div>
            </div>

            <Form {...buyForm}>
              <form onSubmit={buyForm.handleSubmit(onSubmitBuy)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={buyForm.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token to Buy</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select token" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tokens.map((token) => (
                              <SelectItem key={token.symbol} value={token.symbol}>
                                {token.name} ({token.symbol})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={buyForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Amount</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.0001" {...field} />
                        </FormControl>
                        <FormDescription>Total amount of tokens to buy</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={buyForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per Token</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={buyForm.control}
                    name="fiatCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {fiatCurrencies.map((currency) => (
                              <SelectItem key={currency} value={currency}>
                                {currency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={buyForm.control}
                    name="minAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Purchase</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.0001" {...field} />
                        </FormControl>
                        <FormDescription>Minimum amount you'll buy in a single trade</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={buyForm.control}
                    name="maxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Purchase</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.0001" {...field} />
                        </FormControl>
                        <FormDescription>Maximum amount you'll buy in a single trade</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={buyForm.control}
                    name="paymentWindow"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Window (minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" min="5" max="180" {...field} />
                        </FormControl>
                        <FormDescription>Time you'll have to complete payment</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={buyForm.control}
                  name="paymentMethods"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Payment Methods</FormLabel>
                        <FormDescription>Select the payment methods you can use</FormDescription>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {paymentMethods.map((method) => (
                          <FormField
                            key={method.id}
                            control={buyForm.control}
                            name="paymentMethods"
                            render={({ field }) => {
                              return (
                                <FormItem key={method.id} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(method.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, method.id])
                                          : field.onChange(field.value?.filter((value) => value !== method.id))
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{method.label}</FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={buyForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Information (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional information or requirements for sellers"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Creating Listing..." : "Create Buy Listing"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
