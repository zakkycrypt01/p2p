"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Eye, Plus } from "lucide-react"
import { useContract } from "@/hooks/useContract"

interface Listing {
  id: string
  tokenSymbol: string
  amount: number
  price: number
  fiatCurrency: string
  status: "open" | "pending" | "completed" | "cancelled"
  createdAt: string
}

interface MyListingsProps {
  limit?: number
  showViewAll?: () => void
}

export function MyListings({ limit, showViewAll }: MyListingsProps) {
  const currentAccount = useCurrentAccount()
  const address = currentAccount?.address
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { getListingsBySeller } = useContract()

  useEffect(() => {
    if (!address) return

    const fetchListings = async () => {
      setIsLoading(true)
      try {
        const raw = await getListingsBySeller(address)
        const formatted: Listing[] = raw.map((l) => ({
          id: l.id,
          tokenSymbol: l.metadata.symbol ?? "SUI",
          amount: Number(l.tokenAmount) / 1e9, 
          price: Number(l.price),
          fiatCurrency: l.metadata.fiatCurrency ?? "USD",
          status:
            l.status === 0
              ? "open"
              : l.status === 1
              ? "pending"
              : l.status === 2
              ? "completed"
              : "cancelled",
          createdAt: new Date(l.createdAt * 1000).toISOString(),
        }))
        setListings(formatted)
      } catch (error) {
        console.error("Failed to fetch listings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchListings()
  }, [address, getListingsBySeller])

  if (!address) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground mb-4">Connect your wallet to view your listings</p>
        <Button onClick={() => window.scrollTo(0, 0)}>Connect Wallet</Button>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-md">
          <div className="h-12 px-4 border-b flex items-center">
            <Skeleton className="h-4 w-full" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 px-4 flex items-center">
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const display = limit != null ? listings.slice(0, limit) : listings

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Your Listings</h3>
        {showViewAll && (
          <Button size="sm" onClick={showViewAll}>
            View All
          </Button>
        )}
      </div>

      {display.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">You don't have any listings yet</p>
          <Button asChild>
            <Link href="/listings/new">Create Your First Listing</Link>
          </Button>
        </Card>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {display.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell className="font-medium">{listing.tokenSymbol}</TableCell>
                  <TableCell>{listing.amount}</TableCell>
                  <TableCell>
                    {listing.price} {listing.fiatCurrency}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        listing.status === "open"
                          ? "outline"
                          : listing.status === "pending"
                            ? "secondary"
                            : listing.status === "completed"
                              ? "default"
                              : "destructive"
                      }
                    >
                      {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(listing.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/listings/${listing.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
