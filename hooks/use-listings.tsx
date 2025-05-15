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
  const [fetchedListings, setFetchedListings] = useState<Listing[]>([]);
  const [fetchedListingsFromDb, setFetchedListingsFromDb] = useState<any[]>([]);
  const [fetchedAds, setFetchedAds] = useState<any[]>([]);

  const [filters, setFilters] = useState<ListingFilters>({
    orderType: defaultOrderType,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { getAllListings,getAllBuyAdverts } = useContract()
  const { address } = useSuiWallet()
  const fetchAttemptedRef = useRef(false)
  const adsFetchAttemptRef = useRef(false)

  useEffect (()=>{
    if (!adsFetchAttemptRef.current && address) {
      adsFetchAttemptRef.current = true
      const fetchAds = async () => {
        try {
          const rawAds = await getAllBuyAdverts()
          console.log('Raw Ads:', rawAds)
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
                return "Active";
                case 1:
                return "Sold";
                case 2:
                return "Partially Sold";
                case 3:
                return "Canceled";
                case 4:
                return "Expired";
                default:
                return "Unknown";
              }
              })(),
              description: metadataObj.description || "",
              paymentMethod: metadataObj.paymentMethods || "",
              minAmount: ad?.minSellAmount !== undefined ? Number(ad.minSellAmount) : undefined,
              maxAmount: ad?.maxSellAmount !== undefined ? Number(ad.maxSellAmount) : undefined,
            }
            })
            console.log('Mapped Ads:', mappedAds);
            setFetchedAds(mappedAds)
        } catch (err) {
          console.error('Error fetching listings:', err)
        }
      }
      fetchAds()
    }
  },[address, getAllBuyAdverts])
  const digests = fetchedAds.map((ad) => ad.transactionDigest);
  const [adTokenSymbol, setAdTokenSymbol] = useState<string[]>([])
  const [adTokenIcon, setAdTokenIcon]     = useState<string[]>([])
  useEffect(() => {
    const fetchAndSetAdTokenDetails = async () => {
      const details = await Promise.all(
        fetchedAds.map(async (ad) => {
          const info = ad.transactionDigest
            ? await fetchTokenDetails(ad.transactionDigest)
            : null
            console.log('Fetched token details:', info);
            return {
            symbol: info?.symbol || "Unknown",
            icon:   info?.icon   || "https://res.cloudinary.com/dh0hcpmzk/image/upload/v1744934236/sui_p6ug5f.png",
            }
        })
      )
      setAdTokenSymbol(details.map((d) => d.symbol))
      setAdTokenIcon(details.map((d) => d.icon))
    }

    if (fetchedAds.length > 0) {
      fetchAndSetAdTokenDetails()
    }
  }, [fetchedAds])
  useEffect(() => {
    const fetchAndSetAdTokenDetails = async () => {
      const details = await Promise.all(
        fetchedAds.map(async (ad) => {
          const info = ad.transactionDigest
            ? await fetchTokenDetails(ad.transactionDigest)
            : null
            console.log('Fetched token details:', info);
            return {
              id: ad.id,
            tokenSymbol: info?.symbol || "Unknown",
            tokenIcon:   info?.icon   || "https://res.cloudinary.com/dh0hcpmzk/image/upload/v1744934236/sui_p6ug5f.png",
            amount: info?.decimals !== undefined 
              ? Number(ad.remainingAmount) / (10 ** info.decimals) 
              : Number(ad.remainingAmount) / (10 ** 9),
            price: ad.price / 100,
            fiatCurrency: 'USD',
            paymentMethod: ad.paymentMethod || "Unknown",
            createdAt: ad.createdAt 
              ? new Date(Number(ad.createdAt) * 1000).toISOString()
              : "Unknown",
            orderType: "sell",
            address: ad.ownerAddress,
            buyerAddress: ad.ownerAddress,
            buyerRating: 0,
            description: ad.description || "No description provided",
            minAmount: ad.minAmount !== undefined
              ? ad.minAmount / (10 ** (info?.decimals ?? 0))
              : undefined,
            maxAmount: ad.maxAmount !== undefined
              ? ad.maxAmount / (10 ** (info?.decimals ?? 0))
              : undefined,
            expiry: ad.expiry? new Date(Number(ad.expiry) * 1000).toISOString()
            : "Unknown",
            status: ad.status || "Unknown",
            }
        })
      )
      setAdTokenSymbol(details.map((d) => d.tokenSymbol))
      setAdTokenIcon(details.map((d) => d.tokenIcon))
      console.log('Fetched ads settable details:', details);
    }
    if (fetchedAds.length > 0) {
      fetchAndSetAdTokenDetails()
    }
  }
  , [fetchedAds])

  useEffect (() => {
    const addAdsToDatabase = async () => {
      try {
        const details = await Promise.all(
          fetchedAds.map(async (ad) => {
            const info = ad.transactionDigest
              ? await fetchTokenDetails(ad.transactionDigest)
              : null
            return {
              id: ad.id,
              tokenSymbol: info?.symbol || "Unknown",
              tokenIcon:   info?.icon   || "https://res.cloudinary.com/dh0hcpmzk/image/upload/v1744934236/sui_p6ug5f.png",
              amount: info?.decimals !== undefined 
                ? Number(ad.remainingAmount) / (10 ** info.decimals) 
                : Number(ad.remainingAmount) / (10 ** 9),
              price: ad.price / 100,
              fiatCurrency: 'USD',
              paymentMethod: ad.paymentMethod || "Unknown",
              createdAt: ad.createdAt 
                ? new Date(Number(ad.createdAt) * 1000).toISOString()
                : "Unknown",
              orderType: "sell",
              address: ad.ownerAddress,
              buyerAddress: ad.ownerAddress,
              buyerRating: 0,
              description: ad.description || "No description provided",
              minAmount: ad.minAmount !== undefined
                ? ad.minAmount / (10 ** (info?.decimals ?? 0))
                : undefined,
              maxAmount: ad.maxAmount !== undefined
                ? ad.maxAmount / (10 ** (info?.decimals ?? 0))
                : undefined,
              expiry: ad.expiry? new Date(Number(ad.expiry) * 1000).toISOString()
              : "Unknown",
              status: ad.status || "Unknown",
            }
          })
        )
        await addListings(details)
        console.log("Ads added to the database successfully.");
      } catch (error) {
        console.error("Error adding ads to the database:", error)
      }
    }
    if (fetchedAds.length > 0) {
      addAdsToDatabase()
    }
  }
  , [fetchedAds, fetchTokenDetails])

  useEffect(() => {
    if (!fetchAttemptedRef.current && address) {
      fetchAttemptedRef.current = true

      const fetchListings = async () => {
        try {
          const rawListings = await getAllListings()
          console.log('Raw listings:', rawListings)

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
                return "Active";
                case 1:
                return "Sold";
                case 2:
                return "Partially Sold";
                case 3:
                return "Canceled";
                case 4:
                return "Expired";
                default:
                return "Unknown";
              }
              })(),
              description: metadataObj.description || "",
              paymentMethod: metadataObj.paymentMethods || "",
              minAmount: metadataObj.minAmount ? Number(metadataObj.minAmount) : undefined,
              maxAmount: metadataObj.maxAmount ? Number(metadataObj.maxAmount) : undefined,
              metadata: [
              {
                description: metadataObj.description,
                paymentMethods: metadataObj.paymentMethods,
                minAmount: metadataObj.minAmount ? Number(metadataObj.minAmount) : undefined,
                maxAmount: metadataObj.maxAmount ? Number(metadataObj.maxAmount) : undefined,
                createdAt: listing.createdAt ? Number(listing.createdAt) : undefined
              }
              ]
            }
          })

          setFetchedListings(mappedListings)
        } catch (err) {
          console.error('Error fetching listings:', err)
          setFetchedListings([])
        }
      }

      fetchListings()
    }
  }, [address, getAllListings])
   const digest = fetchedListings.map((listing) => listing.transactionDigest);
   const [tokenSymbol, setTokenSymbol] = useState<string[]>([]);
   const [tokenIcon, setTokenIcon] = useState<string[]>([]);
   async function fetchTokenDetails(digest: string) {
     const client = new SuiClient({
       url: getFullnodeUrl('testnet') 
     });
 
     try {
       const tx = await client.getTransactionBlock({
         digest,
         options: {
           showEvents: true,
           showObjectChanges: true
         },
       });
       const listingObjects = tx.objectChanges?.filter((change) => {
         return change.type === "created" && 
                'objectType' in change && 
                change.objectType.includes("::marketplace::Listing<");
       }) || [];
       if (listingObjects.length > 0) {
         const objectWithType = listingObjects[0] as { objectType: string };
         const match = objectWithType.objectType.match(/<(.+)>/);
         if (match) {
           const coinType = match[1];
           try {
             const metadata = await client.getCoinMetadata({ coinType });
             if (metadata) {
               return {
                 symbol: metadata.symbol || "",
                 icon: metadata.iconUrl || "https://res.cloudinary.com/dh0hcpmzk/image/upload/v1744934236/sui_p6ug5f.png"
               };
             }
           } catch (error) {
             console.warn(`Failed to fetch metadata for coin type ${coinType}:`, error);
           }
         }
       }
       const coinObjects = tx.objectChanges?.filter((change) => {
         return 'objectType' in change && 
                change.objectType?.includes("::coin::Coin<");
       }) || [];
       
       console.log("Found coin objects:", coinObjects);
       
       for (const obj of coinObjects) {
         const objectWithType = obj as { objectType: string };
         
         const match = objectWithType.objectType.match(/<(.+)>/);
         if (!match) continue;
         
         const coinType = match[1];
         // console.log(`Extracted coin type from coin object: ${coinType}`);
         
         try {
           const metadata = await client.getCoinMetadata({ coinType });
           // console.log(`Metadata for ${coinType}:`, metadata);
           
           if (metadata) {
             return {
               symbol: metadata.symbol || "",
               icon: metadata.iconUrl || "",
               decimals: metadata.decimals || 0
             };
           }
         } catch (error) {
           console.warn(`Failed to fetch metadata for coin type ${coinType}:`, error);
         }
       }
       
       const listingEvents = tx.events?.filter(event => 
         event.type.includes("::marketplace::ListingCreatedEvent")
       ) || [];
       
       console.log("Listing events:", listingEvents);
       
       if (listingEvents.length > 0 && listingEvents[0].parsedJson) {
         console.log("Listing event data:", listingEvents[0].parsedJson);
       }
       return null;
     } catch (error) {
       console.error(`Error processing transaction ${digest}:`, error);
       return null;
     }
   }

   useEffect(() => {
    const fetchAndSetTokenDetails = async () => {
      const tokenDetails = await Promise.all(
        fetchedListings.map(async (listing) => {
          const details = listing.transactionDigest 
            ? await fetchTokenDetails(listing.transactionDigest) 
            : null;
            return {
              id: listing.id,
              tokenSymbol: details?.symbol || "Unknown",
              tokenIcon: details?.icon || "https://res.cloudinary.com/dh0hcpmzk/image/upload/v1744934236/sui_p6ug5f.png",
              amount: details?.decimals !== undefined 
                ? Number(listing.remainingAmount) / (10 ** 9) 
                : Number(listing.remainingAmount) / (10 ** 9),
              price: listing.price / 100, 
              fiatCurrency: 'USD',
              paymentMethod: listing.paymentMethod || "Unknown",
              createdAt: listing.createdAt 
                ? new Date(Number(listing.createdAt) * 1000).toISOString()
                : "Unknown",
              orderType: "buy",
              address: listing.ownerAddress,
              sellerAddress: listing.ownerAddress,
              sellerRating: 0,
              description: listing.description || "No description provided",
              minAmount: Array.isArray(listing.metadata) && listing.metadata[0]?.minAmount !== undefined 
              ? listing.metadata[0].minAmount  
              : undefined,
              maxAmount: listing.maxAmount !== undefined 
              ? listing.maxAmount 
              : undefined,
              expiry: listing.expiry? new Date(Number(listing.expiry) * 1000).toISOString()
              : "Unknown",
              status: listing.status || "Unknown",
            };
        })
      );
      setTokenSymbol(tokenDetails.map((detail) => detail.tokenSymbol));
      setTokenIcon(tokenDetails.map((detail) => detail.tokenIcon));
      // console.log('Fetched token details:', tokenDetails);
    };
    if (fetchedListings.length > 0) {
      fetchAndSetTokenDetails();
    }
  }, [fetchedListings]);

  const listingsAddedRef = useRef(false);

  useEffect(() => {
    const addListingsToDatabase = async () => {
      if (listingsAddedRef.current) return; 
      
      try {
        // console.log('fetchedListings :>> ', fetchedListings);
        const tokenDetails = await Promise.all(
          fetchedListings.map(async (listing) => {
            const details = await fetchTokenDetails(listing.transactionDigest ?? "");
            return {
              id: listing.id,
              tokenSymbol: details?.symbol || "Unknown",
              tokenIcon: details?.icon || "https://res.cloudinary.com/dh0hcpmzk/image/upload/v1744934236/sui_p6ug5f.png",
              amount: details?.decimals !== undefined 
                ? Number(listing.remainingAmount) / (10 ** 9) 
                : Number(listing.remainingAmount) / (10 ** 9),
              price: listing.price / 100, 
              fiatCurrency: 'USD',
              paymentMethod: listing.paymentMethod || "Unknown",
              createdAt: listing.createdAt 
                ? new Date(Number(listing.createdAt) * 1000).toISOString()
                : "Unknown",
              orderType: "buy",
              address: listing.ownerAddress,
              sellerAddress: listing.ownerAddress,
              sellerRating: 0,
              description: listing.description || "No description provided",
              minAmount: Array.isArray(listing.metadata) && listing.metadata[0]?.minAmount !== undefined 
              ? listing.metadata[0].minAmount  
              : undefined,
              maxAmount: listing.maxAmount !== undefined 
              ? listing.maxAmount  
              : undefined,
              expiry: listing.expiry? new Date(Number(listing.expiry) * 1000).toISOString()
              : "Unknown",
              status: listing.status || "Unknown",
            };
          })
        );
        await addListings(tokenDetails);
        listingsAddedRef.current = true; 
        // console.log("Listings added to the database successfully.");
      } catch (error) {
        console.error("Error adding listings to the database:", error);
      }
    };

    if (fetchedListings.length > 0) {
      addListingsToDatabase();
    }
  }, [fetchedListings, fetchTokenDetails]);

  // get all listings
  useEffect(() => {
    const fetchListingsFromDb = async () => {
      try {
        const rawListings = await getListings();
        // console.log("Fetched listings:", rawListings);
        setFetchedListingsFromDb(rawListings);
        console.log('fetchedListings from db :>> ', rawListings);
      } catch (error) {
        console.error("Error fetching listings:", error);
        setFetchedListingsFromDb([]);
      }
    };
    
    fetchListingsFromDb();
    
  }, []);

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let filteredListings = [...fetchedListingsFromDb];
      if (filters.orderType) {
        filteredListings = filteredListings.filter(
          (listing) => (listing.orderType || "sell") === filters.orderType
        );
      }

      if (filters.token) {
        filteredListings = filteredListings.filter(
          (listing) => listing.tokenSymbol === filters.token
        );
      }

      if (filters.fiatCurrency) {
        filteredListings = filteredListings.filter(
          (listing) => listing.fiatCurrency === filters.fiatCurrency
        );
      }

      if (filters.minPrice !== undefined) {
        filteredListings = filteredListings.filter(
          (listing) => listing.price >= filters.minPrice!
        );
      }

      if (filters.maxPrice !== undefined) {
        filteredListings = filteredListings.filter(
          (listing) => listing.price <= filters.maxPrice!
        );
      }

      if (filters.paymentMethods && filters.paymentMethods.length > 0) {
        filteredListings = filteredListings.filter((listing) =>
          filters.paymentMethods!.some((method) =>
            listing.paymentMethod?.includes(method)
          )
        );
      }

      setListings(filteredListings);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [filters, fetchedListingsFromDb]);

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


