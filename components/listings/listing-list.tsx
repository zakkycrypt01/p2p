"use client"
import { useListings } from "@/hooks/use-listings"
import { ListingCard } from "./listing-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState, useRef, use } from "react"
import { useSuiWallet } from "@/hooks/use-sui-wallet"
import { useContract } from "@/hooks/useContract"
import { addListings } from "../../actions/addListings"
import { getListings } from "@/actions/getListings"
import { SuiClient,getFullnodeUrl } from "@mysten/sui/client"
import { object } from "zod"

interface ListingListProps {
  orderType?: "buy" | "sell"
}

export function ListingList({ orderType = "buy" }: ListingListProps) {
  interface Listing {
    id: string
    ownerAddress: string
    transactionDigest: string
    price: number
    remainingAmount: bigint
    paymentMethod?: string
    description?: string
    minAmount?: number
    maxAmount?: number
    expiry?: number
    status?: string
    createdAt?: number
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
  
  const [fetchedListings, setFetchedListings] = useState<Listing[]>([]);
  const [fetchedListingsFromDb, setFetchedListingsFromDb] = useState<any[]>([]);
  const address = useSuiWallet();
  const { getAllListings } = useContract();
  const fetchAttemptedRef = useRef(false);
  
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

  //fetch token symbol and icon from transactionDigest
  const digest = fetchedListings.map((listing) => listing.transactionDigest);
  const [tokenSymbol, setTokenSymbol] = useState<string[]>([]);
  const [tokenIcon, setTokenIcon] = useState<string[]>([]);
  async function fetchTokenDetails(digest: string) {
    const client = new SuiClient({
      url: getFullnodeUrl('devnet') // Consider making this configurable
    });

    try {
      const tx = await client.getTransactionBlock({
        digest,
        options: {
          showEvents: true,
          showObjectChanges: true
        },
      });
      
      // console.log(`Transaction for ${digest}:`, tx);
      const listingObjects = tx.objectChanges?.filter((change) => {
        return change.type === "created" && 
               'objectType' in change && 
               change.objectType.includes("::marketplace::Listing<");
      }) || [];
      
      // console.log("Found listing objects:", listingObjects);
      if (listingObjects.length > 0) {
        const objectWithType = listingObjects[0] as { objectType: string };
        const match = objectWithType.objectType.match(/<(.+)>/);
        if (match) {
          const coinType = match[1];
          // console.log(`Extracted coin type from listing: ${coinType}`);
          
          try {
            const metadata = await client.getCoinMetadata({ coinType });
            // console.log(`Metadata for ${coinType}:`, metadata);
            
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
          const details = await fetchTokenDetails(listing.transactionDigest);
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
              ? listing.metadata[0].minAmount / (10 ** (details?.decimals || 0)) 
              : undefined,
              maxAmount: listing.maxAmount !== undefined 
              ? listing.maxAmount / (10 ** (details?.decimals || 0)) 
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
      if (listingsAddedRef.current) return; // Skip if already added
      
      try {
        // console.log('fetchedListings :>> ', fetchedListings);
        const tokenDetails = await Promise.all(
          fetchedListings.map(async (listing) => {
            const details = await fetchTokenDetails(listing.transactionDigest);
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
              ? listing.metadata[0].minAmount / (10 ** (details?.decimals || 0)) 
              : undefined,
              maxAmount: listing.maxAmount !== undefined 
              ? listing.maxAmount / (10 ** (details?.decimals || 0)) 
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

  const { listings, isLoading, error } = useListings(orderType)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Failed to load listings. Please try again.</p>
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No merchant listings found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {fetchedListingsFromDb.map((listing) => (
        <ListingCard
          key={listing.id}
          id={listing.id}
          tokenSymbol={listing.tokenSymbol}
          tokenIcon={listing.tokenIcon}
          amount={listing.amount}
          price={listing.price}
          fiatCurrency={listing.fiatCurrency}
          sellerRating={listing.sellerRating}
          paymentMethods={listing.paymentMethods || []} // Ensure paymentMethods is always an array
          orderType={listing.orderType || orderType}
          isMerchant={true}
        />
      ))}
    </div>
  )
}

