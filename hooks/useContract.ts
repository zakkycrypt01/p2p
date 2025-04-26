import { Transaction } from "@mysten/sui/transactions";
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { useNetworkVariables } from "@/utils/network-variables";
import { useSubmitTransaction } from "./useSubmitTransaction";
import { MODULE_NAME } from "@/utils/constant";
import { bcs } from "@mysten/sui/bcs";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { useCallback } from 'react';
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { graphql } from '@mysten/sui/graphql/schemas/latest';

const listingInfoReturn = bcs.struct('ListingInfoReturn', {
  seller: bcs.string(),
  token_amount: bcs.u64(),
  remaining_amount: bcs.u64(),
  price: bcs.u64(),
  expiry: bcs.u64(),
  created_at: bcs.u64(),
  status: bcs.u8(),
  listing_id: bcs.string(), // Changed to string for ID type
});

const orderInfoReturn = bcs.struct('OrderInfoReturn', {
  buyer: bcs.string(),
  seller: bcs.string(),
  token_amount: bcs.u64(),
  price: bcs.u64(),
  fee_amount: bcs.u64(),
  expiry: bcs.u64(),
  status: bcs.u8(),
  created_at: bcs.u64(),
  payment_made: bcs.bool(),
  payment_received: bcs.bool(),
  listing_id: bcs.string(),
});

const disputeInfoReturn = bcs.struct('DisputeInfoReturn', {
  order_id: bcs.string(),
  buyer: bcs.string(),
  seller: bcs.string(),
  token_amount: bcs.u64(),
  price: bcs.u64(),
  buyer_reason: bcs.vector(bcs.u8()),
  seller_response: bcs.vector(bcs.u8()),
  status: bcs.u8(),
  created_at: bcs.u64(),
});

const OptionListingInfoReturn = bcs.option(listingInfoReturn);
const OptionOrderInfoReturn = bcs.option(orderInfoReturn);
const OptionDisputeInfoReturn = bcs.option(disputeInfoReturn);
const PACKAGE_ADDRESS = '0x91b726490989f4b3ea355619a913c33ce88dc17dbd38288ac64fd280be811322'; // Replace with your actual package address

const gqlClient = new SuiGraphQLClient({
  url: 'https://sui-devnet.mystenlabs.com/graphql',
});

// Query to fetch all listings from the contract
const fetchListingsQuery = graphql(`
  query FetchListings {
    objects(
      filter: {
        type: "${PACKAGE_ADDRESS}::marketplace::Listing"
      },
      first: 10  # Reduced to meet Sui's max page size
    ) {
      nodes {
        address
        version
        owner {
          __typename
          ... on AddressOwner {
            owner {
              address
            }
          }
          ... on Shared {
            initialSharedVersion
          }
        }
        asMoveObject {
          contents {
            json
          }
        }
        previousTransactionBlock {
          digest
        }
        status
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);

// Query to fetch order by ID
const fetchOrderByIdQuery = graphql(`
  query FetchOrderById($orderId: String!) {
    objects(
      filter: {
        type: "${PACKAGE_ADDRESS}::marketplace::Order",
        objectIds: [$orderId]
      },
      first: 1
    ) {
      nodes {
        address
        version
        owner {
          __typename
          ... on AddressOwner { owner { address } }
          ... on Shared { initialSharedVersion }
        }
        asMoveObject { contents { json } }
        previousTransactionBlock { digest }
        status
      }
    }
  }
`);

async function getAllListings() {
  const result = await gqlClient.query({
    query: fetchListingsQuery,
  });

  // Process the results to extract listing details
  type FetchListingsResult = {
    data: {
      objects: {
        nodes: Array<{
          address: string;
          version: number;
          owner: {
            __typename: string;
            owner?: {
              address: string;
            };
            initialSharedVersion?: number;
          };
          asMoveObject: {
            contents: {
              json: {
                id: string;
                seller: string;
                token_amount: string;
                remaining_amount: string;
                price: string;
                expiry: string;
                created_at: string;
                status: number;
                escrowed_coin: {
                  value: string;
                };
                metadata?: Array<{
                  key: number[];
                  value: number[];
                }>;
              };
            };
          };
          previousTransactionBlock: {
            digest: string;
          };
          status: string;
        }>;
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string;
        };
      };
    };
  };

  const listings = ((result as unknown) as FetchListingsResult).data?.objects?.nodes.map(node => {
    const json = node?.asMoveObject?.contents?.json;
    if (!json) return null;

    // Parse metadata to readable format
    const parsedMetadata: Record<string, string> = {};
    if (json.metadata && Array.isArray(json.metadata)) {
      json.metadata.forEach(item => {
        const key = new TextDecoder().decode(new Uint8Array(item.key));
        const value = new TextDecoder().decode(new Uint8Array(item.value));
        parsedMetadata[key] = value;
      });
    }

    return {
      id: node.address,
      seller: json.seller,
      tokenAmount: BigInt(json.token_amount),
      remainingAmount: BigInt(json.remaining_amount),
      price: BigInt(json.price),
      expiry: Number(json.expiry),
      createdAt: Number(json.created_at),
      status: json.status,
      metadata: parsedMetadata,
      ownerAddress: node.owner.__typename === "AddressOwner" ? node.owner.owner?.address : null,
      transactionDigest: node.previousTransactionBlock?.digest
    };
  }).filter(listing => listing !== null);

  return listings;
}

// Function to get listings from a specific seller
async function getListingsBySeller(sellerAddress: string) {
  const allListings = await getAllListings();
  return allListings.filter(listing => listing.seller === sellerAddress);
}

// Query to fetch all orders from the contract
const fetchOrdersQuery = graphql(`
  query FetchOrders {
    objects(
      filter: {
        type: "${PACKAGE_ADDRESS}::marketplace::Order"
      },
      last: 10
    ) {
      nodes {
        address
        version
        owner {
          __typename
          ... on AddressOwner {
            owner {
              address
            }
          }
          ... on Shared {
            initialSharedVersion
          }
        }
        asMoveObject {
          contents {
            json
          }
        }
        previousTransactionBlock {
          digest
        }
        status
      }
      pageInfo {
        hasNextPage
        startCursor
      }
    }
  }
`);

async function getAllOrders() {
  const result = await gqlClient.query({
    query: fetchOrdersQuery,
  });

  // Process the results to extract order details
  type FetchOrdersResult = {
    data: {
      objects: {
        nodes: Array<{
          address: string;
          version: number;
          owner: {
            __typename: string;
            owner?: {
              address: string;
            };
            initialSharedVersion?: number;
          };
          asMoveObject: {
            contents: {
              json: {
                id: string;
                buyer: string;
                seller: string;
                token_amount: string;
                price: string;
                fee_amount: string;
                expiry: string;
                status: number;
                created_at: string;
                escrowed_coin: {
                  value: string;
                };
                payment_made: boolean;
                payment_received: boolean;
                metadata?: Array<{
                  key: number[];
                  value: number[];
                }>;
                listing_id: string;
              };
            };
          };
          previousTransactionBlock: {
            digest: string;
          };
          status: string;
        }>;
        pageInfo: {
          hasNextPage: boolean;
          startCursor: string;
        };
      };
    };
  };

  const orders = ((result as unknown) as FetchOrdersResult).data?.objects?.nodes.map(node => {
    const json = node?.asMoveObject?.contents?.json;
    if (!json) return null;

    // Parse metadata to readable format
    const parsedMetadata: Record<string, string> = {};
    if (json.metadata && Array.isArray(json.metadata)) {
      json.metadata.forEach(item => {
        const key = new TextDecoder().decode(new Uint8Array(item.key));
        const value = new TextDecoder().decode(new Uint8Array(item.value));
        parsedMetadata[key] = value;
      });
    }

    return {
      id: node.address,
      buyer: json.buyer,
      seller: json.seller,
      tokenAmount: BigInt(json.token_amount),
      price: BigInt(json.price),
      feeAmount: BigInt(json.fee_amount),
      expiry: Number(json.expiry),
      createdAt: Number(json.created_at),
      status: json.status,
      paymentMade: json.payment_made,
      paymentReceived: json.payment_received,
      listingId: json.listing_id,
      metadata: parsedMetadata,
      ownerAddress: node.owner.__typename === "AddressOwner" ? node.owner.owner?.address : null,
      transactionDigest: node.previousTransactionBlock?.digest
    };
  }).filter(order => order !== null);

  return orders;
}

// Function to get orders for a specific buyer
async function getOrdersByBuyer(buyerAddress: string) {
  const allOrders = await getAllOrders();
  return allOrders.filter(order => order.buyer === buyerAddress);
}

// Function to get orders for a specific seller
async function getOrdersBySeller(sellerAddress: string) {
  const allOrders = await getAllOrders();
  return allOrders.filter(order => order.seller === sellerAddress);
}

// Function to get an order by orderId
async function getOrderByOrderId(orderId: string): Promise<any | null> {
  try {
    const response = await gqlClient.query({
      query: fetchOrderByIdQuery,
      variables: { orderId }
    });
    const node = (response as any).data.objects.nodes[0];
    if (!node) return null;

    const json = node.asMoveObject.contents.json;
    // parse metadata if present
    const parsedMetadata: Record<string, string> = {};
    if (Array.isArray(json.metadata)) {
      for (const { key, value } of json.metadata) {
        parsedMetadata[new TextDecoder().decode(new Uint8Array(key))] =
          new TextDecoder().decode(new Uint8Array(value));
      }
    }

    return {
      id: node.address,
      buyer: json.buyer,
      seller: json.seller,
      tokenAmount: BigInt(json.token_amount),
      price: BigInt(json.price),
      feeAmount: BigInt(json.fee_amount),
      expiry: Number(json.expiry),
      createdAt: Number(json.created_at),
      status: json.status,
      paymentMade: json.payment_made,
      paymentReceived: json.payment_received,
      listingId: json.listing_id,
      metadata: parsedMetadata,
      ownerAddress:
        node.owner.__typename === "AddressOwner"
          ? node.owner.owner?.address
          : null,
      transactionDigest: node.previousTransactionBlock?.digest
    };
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    return null;
  }
}

export function useContract() {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { executeTransaction } = useSubmitTransaction();
  const { 
    MarketplacePackageId,
    EscrowConfigObjectId, 
    TokenRegistryObjectId, 
  } = useNetworkVariables();

  // Add a utility function to handle the return type of executeTransaction
  const handleTransaction = async (transaction: Transaction): Promise<string | null> => {
    // Set a fixed gas budget that should cover most operations
    transaction.setGasBudget(BigInt(50000000)); // 0.05 SUI
    
    try {
      const result = await executeTransaction(transaction);
      return result || null;
    } catch (error) {
      console.error('Transaction error:', error);
      return null;
    }
  };

  // Create a listing
  interface CreateListingParams {
    token_coin: string; // Object ID for the coin object
    price: number; 
    expiry: number; // Duration in seconds
    token_amount: number; // Amount of tokens to list
    metadataKeys?: string[];
    metadataValues?: string[];
  }

  const createListing = async ({ 
    token_amount,
    price,
    token_coin,
    expiry, 
    metadataKeys = [], 
    metadataValues = []
  }: CreateListingParams): Promise<string | null> => {
    if (!currentAccount?.address) {
        console.error("No connected wallet");
        return null;
    }

    try {
        // Check if the account has SUI to pay for gas
        const coins = await suiClient.getCoins({
            owner: currentAccount.address,
            coinType: "0x2::sui::SUI"
        });
        if (!coins || coins.data.length === 0) {
            throw new Error("Your wallet doesn't have any SUI tokens for gas payment. Please add some SUI to your wallet.");
        }

        const tx = new Transaction();

        // Verify ownership of the token_coin
        const objectData = await suiClient.getObject({
            id: token_coin,
            options: { showOwner: true }
        });
        if (!objectData.data || !objectData.data.owner) {
            console.error('Token coin object not found or has no owner data');
            return null;
        }
        if (typeof objectData.data.owner === 'object' && 'AddressOwner' in objectData.data.owner) {
            const ownerAddress = objectData.data.owner.AddressOwner;
            if (currentAccount?.address !== ownerAddress) {
                console.error(`Wallet address (${currentAccount?.address}) does not match token owner (${ownerAddress})`);
                return null;
            }
        } else {
            console.error('Token is not owned by an address (could be shared or immutable)');
            return null;
        }

        // Split the coin to only use the exact amount needed
        const [splitCoin] = tx.splitCoins(tx.object(token_coin), [tx.pure.u64(token_amount)]);

        // Encode metadata as arrays of Uint8Arrays
        const encodedKeys = metadataKeys.map(key => new TextEncoder().encode(key));
        const encodedValues = metadataValues.map(value => new TextEncoder().encode(value));
        const keyVectors = encodedKeys.map(k => Array.from(k));
        const valueVectors = encodedValues.map(v => Array.from(v));
        const keysVector = bcs.vector(bcs.vector(bcs.u8())).serialize(keyVectors);
        const valuesVector = bcs.vector(bcs.vector(bcs.u8())).serialize(valueVectors);

        tx.moveCall({
            target: `${MarketplacePackageId}::${MODULE_NAME}::create_listing`,
            typeArguments: ['0x2::sui::SUI'],
            arguments: [
                tx.object(EscrowConfigObjectId),
                tx.object(TokenRegistryObjectId),
                splitCoin,
                tx.pure.u64(token_amount),
                tx.pure.u64(price),
                tx.pure.u64(expiry),
                tx.pure(keysVector),
                tx.pure(valuesVector),
                tx.object(SUI_CLOCK_OBJECT_ID),
            ],
        });

        return handleTransaction(tx);
    } catch (error) {
        console.error("Error creating listing:", error);
        return null;
    }
  };

  // Cancel a listing
  const cancelListing = async (listingId: string): Promise<string | null> => {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${MarketplacePackageId}::${MODULE_NAME}::cancel_listing`,
      arguments: [
        tx.object(listingId),
      ]
    });

    return handleTransaction(tx);
  };

  // Reclaim an expired listing
  const reclaimExpiredListing = async (listingId: string): Promise<string | null> => {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${MarketplacePackageId}::${MODULE_NAME}::reclaim_expired_listing`,
      arguments: [
        tx.object(listingId),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ]
    });

    return handleTransaction(tx);
  };

  // Create an order from a listing
  interface CreateOrderParams {
    listingId: string;
    tokenAmount: number;
  }

  const createOrderFromListing = async ({ 
    listingId, 
    tokenAmount 
    }: CreateOrderParams): Promise<Transaction> => {
    if (!currentAccount?.address) {
      throw new Error("No connected wallet");
    }
  
    // First check if the account has SUI to pay for gas
    const coins = await suiClient.getCoins({
      owner: currentAccount.address,
      coinType: "0x2::sui::SUI"
    });
    
    if (!coins || coins.data.length === 0) {
      throw new Error("Your wallet doesn't have any SUI tokens for gas payment. Please add some SUI to your wallet.");
    }
  
    // Create the transaction with the gas coin already set
    const tx = new Transaction();
    
    // Add the moveCall to create the order
    tx.moveCall({
      target: `${MarketplacePackageId}::${MODULE_NAME}::create_order_from_listing`,
      typeArguments: ["0x2::sui::SUI"],
      arguments: [
        tx.object(listingId),
        tx.pure.u64(tokenAmount),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ]
    });
  
    return tx;
  };
  // Mark payment made (by buyer)
  const markPaymentMade = async (orderId: string): Promise<string | null> => {
   
    
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${MarketplacePackageId}::${MODULE_NAME}::mark_payment_made`,
      typeArguments: ['0x2::sui::SUI'],
      arguments: [
        tx.object(orderId),
      ]
    });

    return handleTransaction(tx);
  };

  // Mark payment received (by seller)
  const markPaymentReceived = async (orderId: string): Promise<string | null> => {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${MarketplacePackageId}::${MODULE_NAME}::mark_payment_received`,
      typeArguments: ['0x2::sui::SUI'],
      arguments: [
        tx.object(EscrowConfigObjectId),
        tx.object(orderId),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ]
    });

    return handleTransaction(tx);
  };

  // Cancel order (by buyer)
  const cancelOrder = async (orderId: string): Promise<string | null> => {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${MarketplacePackageId}::${MODULE_NAME}::cancel_order`,
      arguments: [
        tx.object(orderId),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ]
    });

    return handleTransaction(tx);
  };

  // Process expired order
  const processExpiredOrder = async (orderId: string): Promise<string | null> => {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${MarketplacePackageId}::${MODULE_NAME}::process_expired_order`,
      arguments: [
        tx.object(orderId),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ]
    });

    return handleTransaction(tx);
  };

  // Create dispute
  interface CreateDisputeParams {
    orderId: string;
    reason: string;
  }

  const createDispute = async ({ 
    orderId, 
    reason 
  }: CreateDisputeParams): Promise<string | null> => {
    const tx = new Transaction();
    
    // Convert the string to a Uint8Array instead of number[]
    const encodedReason = new TextEncoder().encode(reason);
    
    tx.moveCall({
      target: `${MarketplacePackageId}::${MODULE_NAME}::create_dispute`,
      arguments: [
        tx.object(orderId),
        tx.pure(encodedReason), // Pass the Uint8Array directly
        tx.object(SUI_CLOCK_OBJECT_ID),
      ]
    });

    return handleTransaction(tx);
  };

  // Respond to dispute
  interface RespondToDisputeParams {
    disputeId: string;
    response: string;
  }

  const respondToDispute = async ({ 
    disputeId, 
    response 
  }: RespondToDisputeParams): Promise<string | null> => {
    const tx = new Transaction();
    
    // Convert the string to a Uint8Array instead of number[]
    const encodedResponse = new TextEncoder().encode(response);
    
    tx.moveCall({
      target: `${MarketplacePackageId}::${MODULE_NAME}::respond_to_dispute`,
      arguments: [
        tx.object(disputeId),
        tx.pure(encodedResponse), // Pass the Uint8Array directly
      ]
    });

    return handleTransaction(tx);
  };
  
  // Utility function to get order status by calling view function
  const getOrderStatus = async (orderId: string): Promise<number> => {
    // Create a transaction instance
    const tx = new Transaction();
    
    // Add the move call to the transaction
    tx.moveCall({
      target: `${MarketplacePackageId}::${MODULE_NAME}::get_order_status`,
      arguments: [tx.object(orderId)]
    });

    // Pass the whole transaction to devInspectTransactionBlock
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: "0x0" // Placeholder address
    });
    
    // Extract the status from the result
    if (result.results?.[0]?.returnValues?.[0]) {
      const statusBytes = result.results[0].returnValues[0][0];
      // If statusBytes is a number array, convert it directly
      if (Array.isArray(statusBytes)) {
        // For a single byte status, just return the first element
        return statusBytes[0];
      }
      // If it's a hex string, parse it
      else if (typeof statusBytes === 'string') {
        return parseInt(statusBytes, 16);
      }
    }
    return -1; // Error case
  };

  // Utility function to get listing status by calling view function
  const getListingStatus = async (listingId: string): Promise<number> => {
    // Create a transaction instance
    const tx = new Transaction();
    
    // Add the move call to the transaction
    tx.moveCall({
      target: `${MarketplacePackageId}::${MODULE_NAME}::get_listing_status`,
      arguments: [tx.object(listingId)]
    });

    // Pass the whole transaction to devInspectTransactionBlock
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: "0x0" // Placeholder address
    });
    
    // Extract the status from the result
    if (result.results?.[0]?.returnValues?.[0]) {
      const statusBytes = result.results[0].returnValues[0][0];
      // If statusBytes is a number array, convert it directly
      if (Array.isArray(statusBytes)) {
        // For a single byte status, just return the first element
        return statusBytes[0];
      }
      // If it's a hex string, parse it
      else if (typeof statusBytes === 'string') {
        return parseInt(statusBytes, 16);
      }
    }
    return -1; // Error case
  };

  // Utility function to check if a token type is supported
  const isTokenSupported = async (tokenType: string): Promise<boolean> => {
    // Create a transaction instance
    const tx = new Transaction();
    
    // Add the move call to the transaction
    tx.moveCall({
      target: `${MarketplacePackageId}::${MODULE_NAME}::is_token_supported`,
      typeArguments: [tokenType],
      arguments: [tx.object(TokenRegistryObjectId)]
    });
    
    // Pass the whole transaction to devInspectTransactionBlock
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: "0x0" // Placeholder address
    });
    
    // Extract the boolean result
    if (result.results?.[0]?.returnValues?.[0]) {
      const supported = result.results[0].returnValues[0][0];
      // If it's a number array, check the first element
      if (Array.isArray(supported)) {
        return supported[0] === 1;
      }
      // If it's a hex string, compare it with "01"
      else if (typeof supported === 'string') {
        return supported === "01"; // "01" is true in BCS encoding
      }
    }
    return false;
  };

  // Get listing details by ID
  const getListingById = async (listingId: string): Promise<any | null> => {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${MarketplacePackageId}::${MODULE_NAME}::get_listing_by_id`,
      arguments: [tx.object(listingId)],
      typeArguments: ['0x2::sui::SUI'], // Assuming SUI token, adjust if needed
    });
    
    try {
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: currentAccount?.address || "0x0"
      });
      
      if (result.results?.[0]?.returnValues) {
        const returnData = result.results[0].returnValues;
        
        // Deserialize from BCS
        try {
          const data = listingInfoReturn.parse(new Uint8Array(returnData[0][0]));
          
          // Convert byte vectors to strings if needed
          // Format and return the data
          return {
            seller: data.seller,
            tokenAmount: BigInt(data.token_amount.toString()),
            remainingAmount: BigInt(data.remaining_amount.toString()),
            price: BigInt(data.price.toString()),
            expiry: Number(data.expiry),
            createdAt: Number(data.created_at),
            status: Number(data.status),
            id: data.listing_id
          };
        } catch (error) {
          console.error("Error parsing listing data:", error);
          return null;
        }
      }
    } catch (error) {
      console.error("Error querying listing:", error);
    }
    
    return null;
  };

  // Get order details by ID
  const getOrderById = async (orderId: string): Promise<any | null> => {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${MarketplacePackageId}::${MODULE_NAME}::get_order_by_id`,
      arguments: [tx.object(orderId)],
      typeArguments: ['0x2::sui::SUI'], // Assuming SUI token, adjust if needed
    });
    
    try {
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: currentAccount?.address || "0x0"
      });
      
      if (result.results?.[0]?.returnValues) {
        const returnData = result.results[0].returnValues;
        
        // Deserialize from BCS
        try {
          const data = orderInfoReturn.parse(new Uint8Array(returnData[0][0]));
          
          // Format and return the data
          return {
            buyer: data.buyer,
            seller: data.seller,
            tokenAmount: BigInt(data.token_amount.toString()),
            price: BigInt(data.price.toString()),
            feeAmount: BigInt(data.fee_amount.toString()),
            expiry: Number(data.expiry),
            status: Number(data.status),
            createdAt: Number(data.created_at),
            paymentMade: Boolean(data.payment_made),
            paymentReceived: Boolean(data.payment_received),
            listingId: data.listing_id,
            id: orderId
          };
        } catch (error) {
          console.error("Error parsing order data:", error);
          return null;
        }
      }
    } catch (error) {
      console.error("Error querying order:", error);
    }
    
    return null;
  };

  // Get dispute details by ID
  const getDisputeById = async (disputeId: string): Promise<any | null> => {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${MarketplacePackageId}::${MODULE_NAME}::get_dispute_by_id`,
      arguments: [tx.object(disputeId)],
      typeArguments: ['0x2::sui::SUI'], // Assuming SUI token, adjust if needed
    });
    
    try {
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: currentAccount?.address || "0x0"
      });
      
      if (result.results?.[0]?.returnValues) {
        const returnData = result.results[0].returnValues;
        
        // Deserialize from BCS
        try {
          const data = disputeInfoReturn.parse(new Uint8Array(returnData[0][0]));
          
          // Convert byte vectors to strings
          const buyerReason = new TextDecoder().decode(new Uint8Array(data.buyer_reason));
          const sellerResponse = new TextDecoder().decode(new Uint8Array(data.seller_response));
          
          // Format and return the data
          return {
            orderId: data.order_id,
            buyer: data.buyer,
            seller: data.seller,
            tokenAmount: BigInt(data.token_amount.toString()),
            price: BigInt(data.price.toString()),
            buyerReason,
            sellerResponse,
            status: Number(data.status),
            createdAt: Number(data.created_at),
            id: disputeId
          };
        } catch (error) {
          console.error("Error parsing dispute data:", error);
          return null;
        }
      }
    } catch (error) {
      console.error("Error querying dispute:", error);
    }
    
    return null;
  };

  // Get user's listings
  const getUserListings = useCallback(async (userAddress: string): Promise<any[]> => {
    // This requires an indexer or backend service to get user listings
    // For a basic implementation, we can search owned objects
    try {
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: userAddress,
        options: { showContent: true, showType: true }
      });
      
      const listings = [];
      const listingType = `${MarketplacePackageId}::${MODULE_NAME}::Listing`;
      
      // Filter for listing objects
      for (const obj of ownedObjects.data) {
        if (obj.data?.type && obj.data.type.includes(listingType)) {
          // For each listing, get detailed information
          const listingDetails = await getListingById(obj.data.objectId);
          if (listingDetails) {
            listings.push(listingDetails);
          }
        }
      }
      
      return listings;
    } catch (error) {
      console.error("Error getting user listings:", error);
      return [];
    }
  }, []);

  // Get user's orders (as buyer)
  const getUserOrders = useCallback(async (userAddress: string): Promise<any[]> => {
    try {
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: userAddress,
        options: { showContent: true, showType: true }
      });
      
      const orders = [];
      const orderType = `${MarketplacePackageId}::${MODULE_NAME}::Order`;
      
      // Filter for order objects
      for (const obj of ownedObjects.data) {
        if (obj.data?.type && obj.data.type.includes(orderType)) {
          // For each order, get detailed information
          const orderDetails = await getOrderById(obj.data.objectId);
          if (orderDetails) {
            orders.push(orderDetails);
          }
        }
      }
      
      return orders;
    } catch (error) {
      console.error("Error getting user orders:", error);
      return [];
    }
  }, []);

  // Check if payment has been made for an order
  const isPaymentMade = async (orderId: string): Promise<boolean> => {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${MarketplacePackageId}::${MODULE_NAME}::is_payment_made`,
      arguments: [tx.object(orderId)],
      typeArguments: ['0x2::sui::SUI'], // Assuming SUI token
    });
    
    try {
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: "0x0" // Placeholder address
      });
      
      if (result.results?.[0]?.returnValues?.[0]) {
        const value = result.results[0].returnValues[0][0];
        
        // If it's a number array, check the first element
        if (Array.isArray(value)) {
          return value[0] === 1;
        }
        // If it's a hex string, compare it with "01"
        else if (typeof value === 'string') {
          return value === "01"; // "01" is true in BCS encoding
        }
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    }
    
    return false;
  };

  // Check if payment has been received
  const isPaymentReceived = async (orderId: string): Promise<boolean> => {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${MarketplacePackageId}::${MODULE_NAME}::is_payment_received`,
      arguments: [tx.object(orderId)],
      typeArguments: ['0x2::sui::SUI'], // Assuming SUI token
    });
    
    try {
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: "0x0" // Placeholder address
      });
      
      if (result.results?.[0]?.returnValues?.[0]) {
        const value = result.results[0].returnValues[0][0];
        
        // If it's a number array, check the first element
        if (Array.isArray(value)) {
          return value[0] === 1;
        }
        // If it's a hex string, compare it with "01"
        else if (typeof value === 'string') {
          return value === "01"; // "01" is true in BCS encoding
        }
      }
    } catch (error) {
      console.error("Error checking payment received status:", error);
    }
    
    return false;
  };

  // Get dispute status
  const getDisputeStatus = async (disputeId: string): Promise<number> => {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${MarketplacePackageId}::${MODULE_NAME}::get_dispute_status`,
      arguments: [tx.object(disputeId)],
      typeArguments: ['0x2::sui::SUI'], // Assuming SUI token
    });
    
    try {
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: "0x0" // Placeholder address
      });
      
      if (result.results?.[0]?.returnValues?.[0]) {
        const statusBytes = result.results[0].returnValues[0][0];
        
        // If statusBytes is a number array, convert it directly
        if (Array.isArray(statusBytes)) {
          return statusBytes[0];
        }
        // If it's a hex string, parse it
        else if (typeof statusBytes === 'string') {
          return parseInt(statusBytes, 16);
        }
      }
    } catch (error) {
      console.error("Error getting dispute status:", error);
    }
    
    return -1; // Error case
  };

  return {
    // Existing mutation functions
    createListing,
    cancelListing,
    reclaimExpiredListing,
    createOrderFromListing,
    markPaymentMade,
    markPaymentReceived,
    cancelOrder,
    processExpiredOrder,
    createDispute,
    respondToDispute,
    
    // Existing query functions
    getOrderStatus,
    getListingStatus,
    isTokenSupported,
    
    // New query functions
    getListingById,
    getOrderById,
    getDisputeById,
    getUserListings,
    getUserOrders,
    isPaymentMade,
    isPaymentReceived,
    getDisputeStatus,
    getAllListings,
    getListingsBySeller,
    getAllOrders,
    getOrdersByBuyer,
    getOrdersBySeller,
    getOrderByOrderId
  };
}