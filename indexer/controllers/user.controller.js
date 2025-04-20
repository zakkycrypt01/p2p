import pkg from 'http-status-codes';
import Listing from '../models/listingDb.js';

const {StatusCodes} = pkg;
class UserController {
    static async HttpAddListing(request, response) {
        try {
            if (!request.body) {
                return response.status(StatusCodes.BAD_REQUEST).json({
                    error: "Request body is missing"
                });
            }
            const listingData = typeof request.body === 'string' 
                ? JSON.parse(request.body) 
                : request.body;
                if (Array.isArray(listingData)) {
                const processedListings = [];
               for (const item of listingData) {
                    const {
                        id, 
                        tokenSymbol, 
                        tokenIcon,
                        amount, 
                        price, 
                        fiatCurrency, 
                        paymentMethod, 
                        createdAt, 
                        orderType, 
                        address,
                        sellerAddress,
                        sellerRating,
                        description,
                        minAmount,
                        maxAmount,
                        expiry, 
                        status
                    } = item;
                    
                    if (!id || !tokenSymbol || !amount || !price) {
                        return response.status(StatusCodes.BAD_REQUEST).json({
                            error: "Missing required fields in item",
                            item
                        });
                    }
                    const listing = await Listing.findOneAndUpdate(
                        { id }, 
                        {
                            tokenSymbol,
                            tokenIcon,
                            amount,
                            price,
                            fiatCurrency,
                            paymentMethod,
                            createdAt,
                            orderType,
                            address,
                            sellerAddress,
                            sellerRating,
                            description,
                            minAmount,
                            maxAmount,
                            expiry,
                            status
                        },
                        {
                            new: true,
                            upsert: true,
                            runValidators: true 
                        }
                    );
                    
                    processedListings.push(listing);
                }
                
                return response.status(StatusCodes.OK).json({
                    message: "Listings processed successfully",
                    count: processedListings.length,
                    listings: processedListings
                });
            } else {
                const {
                    id, 
                    tokenSymbol, 
                    tokenIcon,
                    amount, 
                    price, 
                    fiatCurrency, 
                    paymentMethod, 
                    createdAt, 
                    orderType, 
                    address,
                    sellerAddress,
                    sellerRating,
                    description,
                    minAmount,
                    maxAmount,
                    expiry, 
                    status
                } = listingData;
                
                if (!id || !tokenSymbol || !amount || !price) {
                    return response.status(StatusCodes.BAD_REQUEST).json({
                        error: "Missing required fields"
                    });
                }
                
                const listing = await Listing.findOneAndUpdate(
                    { id }, 
                    {
                        tokenSymbol,
                        tokenIcon,
                        amount,
                        price,
                        fiatCurrency,
                        paymentMethod,
                        createdAt,
                        orderType,
                        address,
                        sellerAddress,
                        sellerRating,
                        description,
                        minAmount,
                        maxAmount,
                        expiry,
                        status
                    },
                    {
                        new: true, 
                        upsert: true,
                        runValidators: true 
                    }
                );
                
                return response.status(StatusCodes.OK).json(listing);
            }
        } catch (error) {
            response.status(StatusCodes.BAD_REQUEST).json({error: error.message});
        }
    } 
    
    static async HttpGetListings(request, response) {
        try {
            const listings = await Listing.find();
            response.status(StatusCodes.OK).json(listings);
        } catch (error) {
            console.error('Error fetching listings:', error);
            response.status(StatusCodes.BAD_REQUEST).json({error: error.message});
        }
    }
    
    static async HttpGetListingsbyAddress(request, response) {
        try {
            const { address } = request.params;
            
            if (!address) {
                return response.status(StatusCodes.BAD_REQUEST).json({
                    error: "Address is required"
                });
            }
            
            const sanitizedAddress = address.trim();
            console.log("Requested address:", sanitizedAddress);
            
            const listings = await Listing.find({ address: sanitizedAddress });
            
            if (!listings || listings.length === 0) {
                console.log(`No listings found for address: ${sanitizedAddress}`);
                return response.status(StatusCodes.NOT_FOUND).json({
                    error: "No listings found for this address"
                });
            }
            
            console.log(`Found ${listings.length} listings for address: ${sanitizedAddress}`);
            return response.status(StatusCodes.OK).json(listings);
        } catch (error) {
            console.error('Error fetching listings by address:', error);
            if (error.name === 'CastError') {
                return response.status(StatusCodes.BAD_REQUEST).json({ 
                    error: "Invalid address format" 
                });
            } else if (error.name === 'ValidationError') {
                return response.status(StatusCodes.BAD_REQUEST).json({ 
                    error: "Validation error", details: error.message 
                });
            }
            
            return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
                error: "Failed to fetch listings" 
            });
        }
    }

    static async HttpGetListingById(request, response) {
        try {
            const { id } = request.params;
            
            if (!id) {
                return response.status(StatusCodes.BAD_REQUEST).json({
                    error: "Listing ID is required"
                });
            }
           const sanitizedId = id.trim();
            console.log("Requested ID:", sanitizedId);
            const listing = await Listing.findOne({ id: sanitizedId });
            
            if (!listing) {
                console.log(`Listing not found for ID: ${sanitizedId}`);
                return response.status(StatusCodes.NOT_FOUND).json({
                    error: "Listing not found"
                });
            }
            console.log(`Listing found for ID: ${sanitizedId}`);
            return response.status(StatusCodes.OK).json(listing);
        } catch (error) {
            console.error('Error fetching listing:', error);
            if (error.name === 'CastError') {
                return response.status(StatusCodes.BAD_REQUEST).json({ 
                    error: "Invalid listing ID format" 
                });
            } else if (error.name === 'ValidationError') {
                return response.status(StatusCodes.BAD_REQUEST).json({ 
                    error: "Validation error", details: error.message 
                });
            }
            
            return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
                error: "Failed to fetch listing" 
            });
        }
    }
}

export default UserController