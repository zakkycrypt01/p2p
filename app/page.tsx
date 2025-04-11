"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, CheckCircle, Shield, Zap, BarChart3, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HeroAnimation } from "@/components/landing/hero-animation"
import { StatsCounter } from "@/components/landing/stats-counter"
import { useCurrentAccount } from "@mysten/dapp-kit"

export default function Home() {
  const currentAccount = useCurrentAccount()
  const address = currentAccount?.address
  const router = useRouter()

  // Redirect to dashboard if wallet is connected
  useEffect(() => {
    if (address) {
      router.push("/dashboard")
    }
  }, [address, router])

  // If wallet is connected, don't render the landing page
  if (address) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-background -z-10" />
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Secure P2P Trading for <span className="text-primary">Crypto</span>
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Trade cryptocurrencies directly with other users. No middlemen, no high fees, just secure peer-to-peer
                  transactions.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg" className="gap-1">
                  <Link href="/listings">
                    Start Trading <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="#how-it-works">How It Works</Link>
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Secure Escrow</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Low Fees</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[500px] aspect-square">
                <HeroAnimation />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <StatsCounter
                value={10000}
                suffix="+"
                duration={2}
                className="text-3xl md:text-4xl font-bold text-primary"
              />
              <p className="text-sm md:text-base text-muted-foreground">Active Users</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <StatsCounter
                value={50}
                suffix="M+"
                duration={2}
                className="text-3xl md:text-4xl font-bold text-primary"
              />
              <p className="text-sm md:text-base text-muted-foreground">Trading Volume</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <StatsCounter
                value={100}
                suffix="+"
                duration={2}
                className="text-3xl md:text-4xl font-bold text-primary"
              />
              <p className="text-sm md:text-base text-muted-foreground">Countries</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <StatsCounter
                value={99.9}
                suffix="%"
                duration={2}
                className="text-3xl md:text-4xl font-bold text-primary"
              />
              <p className="text-sm md:text-base text-muted-foreground">Success Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Platform Features</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Everything you need for secure peer-to-peer cryptocurrency trading
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <Card className="bg-card border-0 shadow-md">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Secure Escrow</h3>
                <p className="text-muted-foreground">
                  All trades are protected by our secure escrow system, ensuring your funds are safe until the trade is
                  complete.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-0 shadow-md">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Fast Transactions</h3>
                <p className="text-muted-foreground">
                  Complete trades quickly with our streamlined process and instant notifications.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-0 shadow-md">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Low Fees</h3>
                <p className="text-muted-foreground">
                  Enjoy minimal trading fees compared to centralized exchanges, keeping more of your assets.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Start trading in minutes with our simple process
              </p>
            </div>
          </div>
          <div className="mt-12">
            <Tabs defaultValue="buy" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="buy">Buying Crypto</TabsTrigger>
                <TabsTrigger value="sell">Selling Crypto</TabsTrigger>
              </TabsList>
              <TabsContent value="buy" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                      1
                    </div>
                    <h3 className="text-xl font-bold">Browse Listings</h3>
                    <p className="text-muted-foreground">
                      Find sellers offering the cryptocurrency you want at your preferred price and payment method.
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                      2
                    </div>
                    <h3 className="text-xl font-bold">Start a Trade</h3>
                    <p className="text-muted-foreground">
                      Select a listing and initiate the trade. The seller's crypto will be held in escrow.
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                      3
                    </div>
                    <h3 className="text-xl font-bold">Pay & Receive</h3>
                    <p className="text-muted-foreground">
                      Send payment using the agreed method. Once confirmed, the crypto is released to your wallet.
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="sell" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                      1
                    </div>
                    <h3 className="text-xl font-bold">Create a Listing</h3>
                    <p className="text-muted-foreground">
                      Specify the amount, price, and payment methods you accept for your cryptocurrency.
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                      2
                    </div>
                    <h3 className="text-xl font-bold">Secure Escrow</h3>
                    <p className="text-muted-foreground">
                      When a buyer initiates a trade, your crypto is securely held in escrow until payment is confirmed.
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                      3
                    </div>
                    <h3 className="text-xl font-bold">Confirm & Complete</h3>
                    <p className="text-muted-foreground">
                      Verify you've received payment and release the crypto to complete the trade.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="mt-12 flex justify-center">
              <Button asChild size="lg">
                <Link href="/listings">Start Trading Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">What Our Users Say</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join thousands of satisfied traders on our platform
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <Card className="bg-card border-0 shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-primary"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ))}
                </div>
                <p className="text-muted-foreground">
                  "I've been using this platform for 6 months now and it's been a game-changer. The escrow system gives
                  me peace of mind and the fees are much lower than centralized exchanges."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Alex Thompson</p>
                    <p className="text-sm text-muted-foreground">Trader since 2022</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-0 shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-primary"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ))}
                </div>
                <p className="text-muted-foreground">
                  "The variety of payment methods and the user-friendly interface make trading so easy. I've completed
                  over 50 trades with zero issues. Highly recommended!"
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Sarah Johnson</p>
                    <p className="text-sm text-muted-foreground">Trader since 2021</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-0 shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-primary"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ))}
                </div>
                <p className="text-muted-foreground">
                  "As a seller, I appreciate the detailed transaction history and analytics. The platform has helped me
                  build a reputation and grow my trading business."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Michael Chen</p>
                    <p className="text-sm text-muted-foreground">Trader since 2020</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Frequently Asked Questions
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Find answers to common questions about our platform
              </p>
            </div>
          </div>
          <div className="mt-12 max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How secure is the platform?</AccordionTrigger>
                <AccordionContent>
                  Our platform uses a secure escrow system built on the Sui blockchain. All trades are protected, and
                  funds are only released when both parties confirm the transaction is complete. We also implement
                  strict security measures to protect user data and assets.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>What are the trading fees?</AccordionTrigger>
                <AccordionContent>
                  We charge a minimal fee of 0.5% per transaction, which is significantly lower than most centralized
                  exchanges. There are no hidden fees or charges, and you can see the exact fee amount before confirming
                  any trade.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>How do I resolve disputes?</AccordionTrigger>
                <AccordionContent>
                  In the rare case of a dispute, our platform provides a resolution center where both parties can submit
                  evidence. Our support team will review the case and make a fair decision based on the evidence
                  provided. Most disputes are resolved within 24-48 hours.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Which cryptocurrencies can I trade?</AccordionTrigger>
                <AccordionContent>
                  Currently, our platform supports trading of SUI, USDC, ETH, and BTC. We plan to add more
                  cryptocurrencies in the future based on user demand and market conditions.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>What payment methods are supported?</AccordionTrigger>
                <AccordionContent>
                  Our platform supports a wide range of payment methods, including bank transfers, PayPal, Venmo, Cash
                  App, Zelle, and Revolut. Sellers can specify which payment methods they accept for each listing.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="relative overflow-hidden rounded-lg bg-primary p-8 md:p-12">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-600" />
            <div className="relative z-10 flex flex-col items-center justify-center space-y-6 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                  Ready to Start Trading?
                </h2>
                <p className="max-w-[600px] text-white/90 md:text-xl/relaxed">
                  Join thousands of users trading cryptocurrencies securely and efficiently on our platform.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                  <Link href="/listings">Browse Listings</Link>
                </Button>
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  <Link href="/listings/new">Create Listing</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
