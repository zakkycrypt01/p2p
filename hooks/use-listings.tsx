"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useWebSocket } from "./use-web-socket"
import { useSuiWallet } from "./use-sui-wallet"
import { useContract } from "./useContract"
import { addListings } from "@/actions/addListings"
import { getListings } from "@/actions/getListings"
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client"

interface Listing {
  id: string
  ownerAddress?: string
  transactionDigest?: string
  price: number
  remainingAmount?: bigint
  paymentMethod?: string[] // Changed from `paymentMethod` to `paymentMethods`
  description?: string
  amount?: number
  minAmount?: number
  maxAmount?: number
  expiry?: number
  status?: string
  createdAt?: number | string // Allow both timestamp and ISO string
  metadata?: Array<{
    description?: string
    paymentMethods?: string
    minAmount?: number
    maxAmount?: number
  }>
  tokenSymbol?: string
  tokenIcon?: string
  fiatCurrency?: string
  sellerRating?: number
  orderType?: "buy" | "sell"
}

interface ListingFilters {
  token?: string
  minPrice?: number
  maxPrice?: number
  fiatCurrency?: string
  paymentMethods?: string[]
  orderType?: "buy" | "sell"
}

export function useListings(defaultOrderType?: "buy" | "sell") {
  const [listings, setListings] = useState<Listing[]>([])
  const [fetchedListings, setFetchedListings] = useState<Listing[]>([])
  const [fetchedListingsFromDb, setFetchedListingsFromDb] = useState<any[]>([])
  const [fetchedAds, setFetchedAds] = useState<any[]>([])

  // Token‐detail state (was missing)
  const [adTokenSymbol, setAdTokenSymbol] = useState<string[]>([])
  const [adTokenIcon,   setAdTokenIcon]   = useState<string[]>([])
  const [tokenSymbol,   setTokenSymbol]   = useState<string[]>([])
  const [tokenIcon,     setTokenIcon]     = useState<string[]>([])

  const [filters, setFilters] = useState<ListingFilters>({
    orderType: defaultOrderType,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { getAllListings, getAllBuyAdverts } = useContract()
  const { address } = useSuiWallet()
  const fetchAttemptedRef = useRef(false)
  const adsFetchAttemptRef = useRef(false)
  const listingsAddedRef = useRef(false)

  const fetchAds = useCallback(async () => {
    try {
      const rawAds = await getAllBuyAdverts()
      const mappedAds = rawAds.map((ad: any) => {
        const metadataObj = ad.metadata || {}
        return {
          id: ad.id || "",
          ownerAddress: ad.buyer || "",
          transactionDigest: ad.transactionDigest,
          price: Number(ad.offeredPrice) || 0,
          remainingAmount: ad.remainingAmount,
          createdAt: ad.createdAt ? Number(ad.createdAt) : undefined,
          expiry: typeof ad.expiry === "number" ? ad.expiry : undefined,
          status: (() => {
            switch (ad.status) {
              case 0:
                return "Active"
              case 1:
                return "Sold"
              case 2:
                return "Partially Sold"
              case 3:
                return "Canceled"
              case 4:
                return "Expired"
              default:
                return "Unknown"
            }
          })(),
          description: metadataObj.description || "",
          paymentMethod: metadataObj.paymentMethods || "",
          minAmount:
            ad?.minSellAmount !== undefined ? Number(ad.minSellAmount) : undefined,
          maxAmount:
            ad?.maxSellAmount !== undefined ? Number(ad.maxSellAmount) : undefined,
        }
      })
      setFetchedAds(mappedAds)
    } catch (err) {
      console.error("Error fetching listings:", err)
    }
  }, [getAllBuyAdverts])

  useEffect(() => {
    if (!adsFetchAttemptRef.current && address) {
      adsFetchAttemptRef.current = true
      fetchAds()
    }
  }, [address, fetchAds])

  const fetchTokenDetails = useCallback(async (digest: string) => {
    const client = new SuiClient({ url: getFullnodeUrl("testnet") })

    try {
      const tx = await client.getTransactionBlock({
        digest,
        options: {
          showEvents: true,
          showObjectChanges: true,
        },
      })
      const listingObjects =
        tx.objectChanges?.filter((change) => {
          return (
            change.type === "created" &&
            "objectType" in change &&
            change.objectType.includes("::marketplace::Listing<")
          )
        }) || []
      if (listingObjects.length > 0) {
        const objectWithType = listingObjects[0] as { objectType: string }
        const match = objectWithType.objectType.match(/<(.+)>/)
        if (match) {
          const coinType = match[1]
          try {
            const metadata = await client.getCoinMetadata({ coinType })
            if (metadata) {
              return {
                symbol: metadata.symbol || "",
                icon:
                  metadata.iconUrl ||
                  "https://res.cloudinary.com/dh0hcpmzk/image/upload/v1744934236/sui_p6ug5f.png",
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch metadata for coin type ${coinType}:`, error)
          }
        }
      }
      const coinObjects =
        tx.objectChanges?.filter((change) => {
          return (
            "objectType" in change &&
            change.objectType?.includes("::coin::Coin<")
          )
        }) || []

      for (const obj of coinObjects) {
        const objectWithType = obj as { objectType: string }

        const match = objectWithType.objectType.match(/<(.+)>/)
        if (!match) continue

        const coinType = match[1]

        try {
          const metadata = await client.getCoinMetadata({ coinType })

          if (metadata) {
            return {
              symbol: metadata.symbol || "",
              icon: metadata.iconUrl || "",
              decimals: metadata.decimals || 0,
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch metadata for coin type ${coinType}:`, error)
        }
      }

      const listingEvents =
        tx.events?.filter((event) =>
          event.type.includes("::marketplace::ListingCreatedEvent")
        ) || []

      if (listingEvents.length > 0 && listingEvents[0].parsedJson) {
      }
      return null
    } catch (error) {
      console.error(`Error processing transaction ${digest}:`, error)
      return null
    }
  }, [])

  const fetchAndSetAdTokenDetails = useCallback(async () => {
    if (fetchedAds.length === 0) return
    const details = await Promise.all(
      fetchedAds.map(async (ad) => {
        const info = ad.transactionDigest
          ? await fetchTokenDetails(ad.transactionDigest)
          : null
        return {
          symbol: info?.symbol ?? "Unknown",
          icon:
            info?.icon ??
            "https://res.cloudinary.com/dh0hcpmzk/image/upload/v1744934236/sui_p6ug5f.png",
        }
      })
    )
    setAdTokenSymbol(details.map((d) => d.symbol))
    setAdTokenIcon(details.map((d) => d.icon))
  }, [fetchedAds, fetchTokenDetails])

  useEffect(() => {
    fetchAndSetAdTokenDetails()
  }, [fetchAndSetAdTokenDetails])

  const addAdsToDb = useCallback(async () => {
    if (fetchedAds.length === 0) return
    try {
      const details = await Promise.all(
        fetchedAds.map(async (ad) => {
          const info = ad.transactionDigest
            ? await fetchTokenDetails(ad.transactionDigest)
            : null
          return {
            id: ad.id,
            tokenSymbol: info?.symbol || "Unknown",
            tokenIcon:
              info?.icon ||
              "https://res.cloudinary.com/dh0hcpmzk/image/upload/v1744934236/sui_p6ug5f.png",
            amount:
              info?.decimals !== undefined
                ? Number(ad.remainingAmount) / 10 ** info.decimals
                : Number(ad.remainingAmount) / 10 ** 9,
            price: ad.price / 100,
            fiatCurrency: "USD",
            paymentMethod: ad.paymentMethod || "Unknown",
            createdAt: ad.createdAt
              ? new Date(Number(ad.createdAt) * 1000).toISOString()
              : "Unknown",
            orderType: "sell",
            address: ad.ownerAddress,
            buyerAddress: ad.ownerAddress,
            buyerRating: 0,
            description: ad.description || "No description provided",
            minAmount:
              ad.minAmount !== undefined
                ? ad.minAmount / 10 ** (info?.decimals ?? 0)
                : undefined,
            maxAmount:
              ad.maxAmount !== undefined
                ? ad.maxAmount / 10 ** (info?.decimals ?? 0)
                : undefined,
            expiry: ad.expiry
              ? new Date(Number(ad.expiry) * 1000).toISOString()
              : "Unknown",
            status: ad.status || "Unknown",
          }
        })
      )
      await addListings(details)
      console.log("Ads added to the database successfully.")
    } catch (error) {
      console.error("Error adding ads to the database:", error)
    }
  }, [fetchedAds, fetchTokenDetails])

  useEffect(() => {
    addAdsToDb()
  }, [addAdsToDb])

  const fetchListingsOnChain = useCallback(async () => {
    try {
      const rawListings = await getAllListings()
      const mappedListings: Listing[] = rawListings.map((listing: any) => {
        const metadataObj = listing.metadata || {}
        return {
          id: listing.id || "",
          ownerAddress: listing.seller || "",
          transactionDigest: listing.transactionDigest,
          price: Number(listing.price) || 0,
          remainingAmount: listing.remainingAmount,
          createdAt: listing.createdAt ? Number(listing.createdAt) : undefined,
          expiry: typeof listing.expiry === "number" ? listing.expiry : undefined,
          status: (() => {
            switch (listing.status) {
              case 0:
                return "Active"
              case 1:
                return "Sold"
              case 2:
                return "Partially Sold"
              case 3:
                return "Canceled"
              case 4:
                return "Expired"
              default:
                return "Unknown"
            }
          })(),
          description: metadataObj.description || "",
          paymentMethod: metadataObj.paymentMethods || "",
          minAmount: metadataObj.minAmount
            ? Number(metadataObj.minAmount)
            : undefined,
          maxAmount: metadataObj.maxAmount
            ? Number(metadataObj.maxAmount)
            : undefined,
          metadata: [
            {
              description: metadataObj.description,
              paymentMethods: metadataObj.paymentMethods,
              minAmount: metadataObj.minAmount
                ? Number(metadataObj.minAmount)
                : undefined,
              maxAmount: metadataObj.maxAmount
                ? Number(metadataObj.maxAmount)
                : undefined,
              createdAt: listing.createdAt ? Number(listing.createdAt) : undefined,
            },
          ],
        }
      })

      setFetchedListings(mappedListings)
    } catch {
      setFetchedListings([])
    }
  }, [getAllListings])

  useEffect(() => {
    if (!fetchAttemptedRef.current && address) {
      fetchAttemptedRef.current = true
      fetchListingsOnChain()
    }
  }, [address, fetchListingsOnChain])

  const fetchAndSetTokenDetails = useCallback(async () => {
    if (fetchedListings.length === 0) return
    const details = await Promise.all(
      fetchedListings.map(async (l) => {
        const info = l.transactionDigest
          ? await fetchTokenDetails(l.transactionDigest)
          : null
        return {
          id: l.id,
          tokenSymbol: info?.symbol || "Unknown",
          tokenIcon:
            info?.icon ||
            "https://res.cloudinary.com/dh0hcpmzk/image/upload/v1744934236/sui_p6ug5f.png",
          amount:
            info?.decimals !== undefined
              ? Number(l.remainingAmount) / 10 ** 9
              : Number(l.remainingAmount) / 10 ** 9,
          price: l.price / 100,
          fiatCurrency: "USD",
          paymentMethod: l.paymentMethod || "Unknown",
          createdAt: l.createdAt
            ? new Date(Number(l.createdAt) * 1000).toISOString()
            : "Unknown",
          orderType: "buy",
          address: l.ownerAddress,
          sellerAddress: l.ownerAddress,
          sellerRating: 0,
          description: l.description || "No description provided",
          minAmount:
            Array.isArray(l.metadata) && l.metadata[0]?.minAmount !== undefined
              ? l.metadata[0].minAmount
              : undefined,
          maxAmount:
            l.maxAmount !== undefined ? l.maxAmount : undefined,
          expiry: l.expiry
            ? new Date(Number(l.expiry) * 1000).toISOString()
            : "Unknown",
          status: l.status || "Unknown",
        }
      })
    )
    setTokenSymbol(details.map((d) => d.tokenSymbol))
    setTokenIcon(details.map((d) => d.tokenIcon))
  }, [fetchedListings, fetchTokenDetails])

  useEffect(() => {
    fetchAndSetTokenDetails()
  }, [fetchAndSetTokenDetails])

  const addListingsToDb = useCallback(async () => {
    if (listingsAddedRef.current || fetchedListings.length === 0) return
    try {
      const detailObjs = await Promise.all(
        fetchedListings.map(async (listing) => {
          const details = await fetchTokenDetails(listing.transactionDigest ?? "")
          return {
            id: listing.id,
            tokenSymbol: details?.symbol || "Unknown",
            tokenIcon:
              details?.icon ||
              "https://res.cloudinary.com/dh0hcpmzk/image/upload/v1744934236/sui_p6ug5f.png",
            amount:
              details?.decimals !== undefined
                ? Number(listing.remainingAmount) / 10 ** 9
                : Number(listing.remainingAmount) / 10 ** 9,
            price: listing.price / 100,
            fiatCurrency: "USD",
            paymentMethod: listing.paymentMethod || "Unknown",
            createdAt: listing.createdAt
              ? new Date(Number(listing.createdAt) * 1000).toISOString()
              : "Unknown",
            orderType: "buy",
            address: listing.ownerAddress,
            sellerAddress: listing.ownerAddress,
            sellerRating: 0,
            description: listing.description || "No description provided",
            minAmount:
              Array.isArray(listing.metadata) &&
              listing.metadata[0]?.minAmount !== undefined
                ? listing.metadata[0].minAmount
                : undefined,
            maxAmount:
              listing.maxAmount !== undefined ? listing.maxAmount : undefined,
            expiry: listing.expiry
              ? new Date(Number(listing.expiry) * 1000).toISOString()
              : "Unknown",
            status: listing.status || "Unknown",
          }
        })
      )
      await addListings(detailObjs)
      listingsAddedRef.current = true
    } catch (e) {
      console.error("Error adding listings:", e)
    }
  }, [fetchedListings, fetchTokenDetails])

  useEffect(() => {
    addListingsToDb()
  }, [addListingsToDb])

  const fetchListingsFromDbCb = useCallback(async () => {
    try {
      const raw = await getListings()
      setFetchedListingsFromDb(raw)
    } catch {
      setFetchedListingsFromDb([])
    }
  }, [])

  useEffect(() => {
    fetchListingsFromDbCb()
  }, [fetchListingsFromDbCb])

  const fetchListings = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      let filteredListings = [...fetchedListingsFromDb]
      if (filters.orderType) {
        filteredListings = filteredListings.filter(
          (listing) => (listing.orderType || "sell") === filters.orderType
        )
      }

      if (filters.token) {
        filteredListings = filteredListings.filter(
          (listing) => listing.tokenSymbol === filters.token
        )
      }

      if (filters.fiatCurrency) {
        filteredListings = filteredListings.filter(
          (listing) => listing.fiatCurrency === filters.fiatCurrency
        )
      }

      if (filters.minPrice !== undefined) {
        filteredListings = filteredListings.filter(
          (listing) => listing.price >= filters.minPrice!
        )
      }

      if (filters.maxPrice !== undefined) {
        filteredListings = filteredListings.filter(
          (listing) => listing.price <= filters.maxPrice!
        )
      }

      if (filters.paymentMethods && filters.paymentMethods.length > 0) {
        filteredListings = filteredListings.filter((listing) =>
          filters.paymentMethods!.some((method) =>
            listing.paymentMethod?.includes(method)
          )
        )
      }

      setListings(filteredListings)
    } catch (e) {
      setError(e as Error)
    } finally {
      setIsLoading(false)
    }
  }, [filters, fetchedListingsFromDb])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const { lastMessage } = useWebSocket("/ws/listings")
  useEffect(() => {
    if (!lastMessage) return

    try {
      const data = JSON.parse(lastMessage.data)

      if (data.type === "new_listing") {
        setListings((prev) => [data.listing, ...prev])
      } else if (data.type === "update_listing") {
        setListings((prev) =>
          prev.map((listing) =>
            listing.id === data.listing.id ? data.listing : listing
          )
        )
      } else if (data.type === "remove_listing") {
        setListings((prev) =>
          prev.filter((listing) => listing.id !== data.listingId)
        )
      }
    } catch (err) {
      console.error("Failed to process WebSocket message", err)
    }
  }, [lastMessage])

  return {
    listings,
    isLoading,
    error,
    setFilters,
    refreshListings: fetchListings,
  }
}


