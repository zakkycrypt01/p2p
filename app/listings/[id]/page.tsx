'use client'

import { TradeDetail } from "@/components/trade/trade-detail"
import { notFound, useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { getListingsById } from "@/actions/getListingsbyId"

export default function ListingPage() {
  const params = useParams();
  const id = params.id as string;

  const [fetchedListings, setFetchedListings] = useState<any[]>([]);
  const [listing, setListing] = useState<any>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();


useEffect(() => {
  const loadListing = async () => {
    setIsLoading(true);
    try {
      const listing = await getListingsById(id);
      console.log('listing :>> ', listing);
      setListing(listing); 
    } catch (error) {
      console.error('Error loading listing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (id) loadListing();
}, [id]);



  if (isLoading) {
    return <div className="container mx-auto py-8 px-4 max-w-4xl">Loading...</div>;
  }

  if (!listing) {
    return <div className="container mx-auto py-8 px-4 max-w-4xl">Listing not found</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Listing Details</h1>
      <TradeDetail listing={listing} />
    </div>
  );
}
