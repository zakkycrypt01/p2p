module escrow::marketplace {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::clock::{Self, Clock};
    use sui::event;
    use std::type_name::{Self, TypeName};
    // Add import for the official SUI token
    use 0x2::sui::SUI as SUI_TOKEN;

    // Error codes - renamed for better context
    const ENotOwner: u64 = 0;
    const EInsufficientFunds: u64 = 1;
    const EInvalidAmount: u64 = 5;
    const EInvalidParameters: u64 = 6;
    const ENotParticipant: u64 = 10;
    const EPaymentNotMade: u64 = 12;
    const EOrderNotOpen: u64 = 4;
    const EOrderExpired: u64 = 3;
    const EOrderNotExpired: u64 = 13;
    const EInvalidListing: u64 = 14;
    const ESelfTrading: u64 = 15;
    const EMetadataTooLarge: u64 = 16;
    const EDisputeNotOpen: u64 = 21;
    const EInvalidStateTransition: u64 = 22;
    const ETokenNotFound: u64 = 23;
    const EInsufficientTokensInListing: u64 = 24;
    const ENotImplemented: u64 = 25; // Error code for unimplemented functionality

    // Order status
    const STATUS_ACTIVE: u8 = 0;
    const STATUS_PAYMENT_MADE: u8 = 1;
    const STATUS_COMPLETED: u8 = 2;
    const STATUS_CANCELED: u8 = 3;
    const STATUS_DISPUTED: u8 = 4;
    const STATUS_EXPIRED: u8 = 5;

    // Listing status
    const LISTING_ACTIVE: u8 = 0;
    const LISTING_SOLD: u8 = 1;
    const LISTING_PARTIALLY_SOLD: u8 = 2;
    const LISTING_CANCELED: u8 = 3;
    const LISTING_EXPIRED: u8 = 4;

    // Dispute status
    const DISPUTE_OPEN: u8 = 0;
    const DISPUTE_RESOLVED_FOR_BUYER: u8 = 1;
    const DISPUTE_RESOLVED_FOR_SELLER: u8 = 2;

    // Platform fee percentage (1%)
    const PLATFORM_FEE_PERCENT: u64 = 100; // Basis points (1% = 100)
    
    // Maximum metadata entries
    const MAX_METADATA_ENTRIES: u64 = 20;

    // Type witnesses for different tokens
    // Keep this for backward compatibility but use 0x2::sui::SUI for actual SUI tokens
    public struct SUI {}
    public struct USDC {}
    public struct USDT {}

    // Admin capability to control the marketplace
    public struct AdminCap has key, store {
        id: UID,
    }

    // Metadata entry type for storing key-value pairs
    public struct MetadataEntry has store, copy, drop {
        key: vector<u8>,
        value: vector<u8>,
    }

    // Token information structure
    public struct TokenInfo has store, copy, drop {
        is_active: bool,
        min_amount: u64,
        max_amount: u64,
    }

    // Token registry entry to map TypeName to TokenInfo
    public struct TokenRegistryEntry has store, copy, drop {
        token_type: TypeName,
        info: TokenInfo,
    }

    // Seller's listing that buyers can choose from
    public struct Listing<phantom CoinType> has key, store {
        id: UID,
        seller: address,
        token_amount: u64,     // Total token amount initially listed
        remaining_amount: u64, // Remaining tokens available for purchase
        price: u64,            // Price per token unit
        expiry: u64,
        created_at: u64,
        status: u8,
        escrowed_coin: Balance<CoinType>,
        metadata: vector<MetadataEntry>,
    }

    // Order created when a buyer selects a listing
    public struct Order<phantom CoinType> has key, store {
        id: UID,
        buyer: address,
        seller: address,
        token_amount: u64,
        price: u64,
        fee_amount: u64,
        expiry: u64,
        status: u8,
        created_at: u64,
        escrowed_coin: Balance<CoinType>,
        payment_made: bool,
        payment_received: bool,
        metadata: vector<MetadataEntry>,
        listing_id: ID,
    }

    // Dispute struct
    public struct Dispute<phantom CoinType> has key, store {
        id: UID,
        order_id: ID,
        buyer: address,
        seller: address,
        token_amount: u64,
        price: u64,
        buyer_reason: vector<u8>,
        seller_response: vector<u8>,
        status: u8,
        created_at: u64,
        escrowed_coin: Balance<CoinType>,
    }

    public struct EscrowConfig has key {
        id: UID,
        fee_collector: address,
        min_expiry: u64,
        max_expiry: u64,
    }

    // Token registry
    public struct TokenRegistry has key, store {
        id: UID,
        tokens: vector<TokenRegistryEntry>, // Map of type name to TokenInfo
    }

    // Event for when a seller creates a listing
    public struct ListingCreatedEvent has copy, drop {
        listing_id: ID,
        seller: address,
        token_amount: u64,
        price: u64,
        expiry: u64,
    }

    // Event for when a listing is canceled
    public struct ListingCanceledEvent has copy, drop {
        listing_id: ID,
        by: address,
    }

    // Event for when a listing is partially sold
    public struct ListingPartiallySoldEvent has copy, drop {
        listing_id: ID,
        seller: address,
        amount_sold: u64,
        remaining_amount: u64,
    }

    // Event for when a buyer selects a listing and creates an order
    public struct OrderCreatedEvent has copy, drop {
        order_id: ID,
        listing_id: ID,
        buyer: address,
        seller: address,
        token_amount: u64,
        price: u64,
        expiry: u64,
    }

    public struct PaymentMadeEvent has copy, drop {
        order_id: ID,
        by: address,
    }

    public struct PaymentReceivedEvent has copy, drop {
        order_id: ID,
        by: address,
    }

    public struct OrderCompletedEvent has copy, drop {
        order_id: ID,
        buyer_received: u64,
        fee_collected: u64,
    }

    public struct OrderCanceledEvent has copy, drop {
        order_id: ID,
        by: address,
    }

    public struct OrderExpiredEvent has copy, drop {
        order_id: ID,
    }

    // Events for dispute system
    public struct DisputeCreatedEvent has copy, drop {
        dispute_id: ID,
        order_id: ID,
        buyer: address,
        seller: address,
        created_at: u64,
    }

    public struct DisputeResolvedEvent has copy, drop {
        dispute_id: ID,
        resolved_for: address,
        resolved_by: address,
    }

    fun init(ctx: &mut TxContext) {
        let config = EscrowConfig {
            id: object::new(ctx),
            fee_collector: tx_context::sender(ctx),
            min_expiry: 3600, // 1 hour
            max_expiry: 2592000, // 30 days
        };

        let mut token_registry = TokenRegistry {
            id: object::new(ctx),
            tokens: vector::empty(),
        };
        
        // Add default token types
        let sui_info = TokenInfo {
            is_active: true,
            min_amount: 1,
            max_amount: 1000000000000, // 1M SUI
        };
        
        let usdc_info = TokenInfo {
            is_active: true,
            min_amount: 1,
            max_amount: 1000000000000, // 1M USDC
        };
        
        // Use the official SUI token type instead of local SUI type witness
        add_token_registry_entry(&mut token_registry.tokens, type_name::get<SUI_TOKEN>(), sui_info);
        add_token_registry_entry(&mut token_registry.tokens, type_name::get<USDC>(), usdc_info);

        // Create admin capability
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };

        // Share the config instead of transferring it to the deployer
        transfer::share_object(config);
        transfer::share_object(token_registry);
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    /// Helper function to refund escrowed tokens to a recipient
    fun refund_balance<CoinType>(
        escrow: &mut Balance<CoinType>, 
        recipient: address, 
        ctx: &mut TxContext
    ) {
        let recipient_coin = coin::from_balance(
            balance::withdraw_all(escrow), 
            ctx
        );
        transfer::public_transfer(recipient_coin, recipient);
    }

    /// Helper function to add metadata
    fun add_metadata(
        metadata: &mut vector<MetadataEntry>,
        key: vector<u8>,
        value: vector<u8>
    ) {
        vector::push_back(metadata, MetadataEntry { key, value });
    }

    /// Helper function to add a token registry entry
    fun add_token_registry_entry(
        registry: &mut vector<TokenRegistryEntry>,
        token_type: TypeName,
        info: TokenInfo
    ) {
        vector::push_back(registry, TokenRegistryEntry { token_type, info });
    }

    /// Helper function to get token info from registry
    fun get_token_info(
        registry: &vector<TokenRegistryEntry>,
        token_type: TypeName
    ): (bool, TokenInfo) {  // Return value type, not reference
        let mut i = 0;
        let len = vector::length(registry);
        
        while (i < len) {
            let entry = vector::borrow(registry, i);
            if (type_name::get_address(&entry.token_type) == type_name::get_address(&token_type) && 
                type_name::get_module(&entry.token_type) == type_name::get_module(&token_type) &&
                true) { 
                return (true, entry.info) // Return a copy, not reference
            };
            i = i + 1;
        };
        
        (false, TokenInfo { is_active: false, min_amount: 0, max_amount: 0 })
    }


    /// Copy metadata from source to destination
    fun copy_metadata(
        source: &vector<MetadataEntry>,
        destination: &mut vector<MetadataEntry>
    ) {
        let mut i = 0;
        let len = vector::length(source);
        
        while (i < len) {
            let entry = vector::borrow(source, i);
            add_metadata(destination, entry.key, entry.value);
            i = i + 1;
        }
    }

    /// Helper to validate state transitions for orders
    fun validate_order_status_change(
        current: u8,
        new: u8
    ): bool {
        if (current == STATUS_ACTIVE) {
            return new == STATUS_PAYMENT_MADE || 
                   new == STATUS_CANCELED || 
                   new == STATUS_EXPIRED ||
                   new == STATUS_DISPUTED
        } else if (current == STATUS_PAYMENT_MADE) {
            return new == STATUS_COMPLETED || 
                   new == STATUS_CANCELED ||
                   new == STATUS_EXPIRED ||
                   new == STATUS_DISPUTED
        };
        false
    }

    /// Creates a new listing by a seller, escrowing their tokens
    /// @param config - The platform configuration
    /// @param registry - The token registry
    /// @param token_coin - The tokens to be escrowed
    /// @param token_amount - The specified token amount (can be different from coin value)
    /// @param price - The price required from the buyer
    /// @param expiry - Duration in seconds until listing expires
    /// @param metadata_keys - Keys for metadata entries
    /// @param metadata_values - Values for metadata entries
    public entry fun create_listing<CoinType>(
        config: &EscrowConfig,
        registry: &TokenRegistry,
        token_coin: Coin<CoinType>,
        token_amount: u64,  // Allow specifying an arbitrary token amount
        price: u64,
        expiry: u64,
        metadata_keys: vector<vector<u8>>,
        metadata_values: vector<vector<u8>>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let coin_value = coin::value(&token_coin);
        assert!(coin_value > 0, EInsufficientFunds);
        assert!(token_amount > 0, EInvalidAmount);
        assert!(price > 0, EInvalidAmount);
        assert!(expiry >= config.min_expiry && expiry <= config.max_expiry, EInvalidParameters);
        
        // Check that metadata keys and values have the same length
        assert!(vector::length(&metadata_keys) == vector::length(&metadata_values), EInvalidParameters);
        assert!(vector::length(&metadata_keys) <= MAX_METADATA_ENTRIES, EMetadataTooLarge);
        
        // Check token type is supported and active
        let token_type = type_name::get<CoinType>();
        let (found, token_info) = get_token_info(&registry.tokens, token_type);
        assert!(found, ETokenNotFound);
        assert!(token_info.is_active, EInvalidParameters);
        assert!(token_amount >= token_info.min_amount && token_amount <= token_info.max_amount, EInvalidAmount);
        
        // Convert flat metadata vectors to structured metadata
        let mut metadata = vector::empty<MetadataEntry>();
        let mut i = 0;
        let len = vector::length(&metadata_keys);
        
        while (i < len) {
            let key = *vector::borrow(&metadata_keys, i);
            let value = *vector::borrow(&metadata_values, i);
            add_metadata(&mut metadata, key, value);
            i = i + 1;
        };

        let now = clock::timestamp_ms(clock) / 1000;
        let seller = tx_context::sender(ctx);
        
        // Create the object directly in this function
        let listing = Listing<CoinType> {
            id: object::new(ctx),
            seller,
            token_amount,
            remaining_amount: token_amount,
            price,
            expiry: now + expiry,
            created_at: now,
            status: LISTING_ACTIVE,
            escrowed_coin: coin::into_balance(token_coin),
            metadata,
        };

        event::emit(ListingCreatedEvent {
            listing_id: object::id(&listing),
            seller: listing.seller,
            token_amount: listing.token_amount,
            price: listing.price,
            expiry: listing.expiry,
        });

        // Share the object
        transfer::share_object(listing);
    }
    
    /// Allows a seller to cancel their own listing and reclaim tokens
    public entry fun cancel_listing<CoinType>(
        listing: &mut Listing<CoinType>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == listing.seller, ENotOwner);
        assert!(listing.status == LISTING_ACTIVE || listing.status == LISTING_PARTIALLY_SOLD, EInvalidListing);
        
        // Mark as canceled
        listing.status = LISTING_CANCELED;
        
        // Return tokens to seller
        refund_balance(&mut listing.escrowed_coin, sender, ctx);
        
        event::emit(ListingCanceledEvent { 
            listing_id: object::id(listing), 
            by: sender 
        });
    }
    
    /// Allows reclaiming of expired listings
    public entry fun reclaim_expired_listing<CoinType>(
        listing: &mut Listing<CoinType>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == listing.seller, ENotOwner);
        assert!(listing.status == LISTING_ACTIVE || listing.status == LISTING_PARTIALLY_SOLD, EInvalidListing);
        assert!(clock::timestamp_ms(clock) / 1000 > listing.expiry, EOrderNotExpired);
        
        // Mark as expired
        listing.status = LISTING_EXPIRED;
        
        // Return tokens to seller
        refund_balance(&mut listing.escrowed_coin, sender, ctx);
        
        event::emit(ListingCanceledEvent { 
            listing_id: object::id(listing), 
            by: sender 
        });
    }
    
     /// Business logic for creating an order
    public fun create_order_internal<CoinType>(
        buyer: address,
        seller: address,
        token_amount: u64,
        price: u64,
        _expiry: u64,   // Not used directly, fixed 1-hour expiry is set below
        created_at: u64,
        escrowed_coin: Balance<CoinType>,
        metadata: vector<MetadataEntry>,
        listing_id: ID,
        ctx: &mut TxContext
    ): Order<CoinType> {
        let fee_amount = (token_amount * PLATFORM_FEE_PERCENT) / 10000;
        
        Order<CoinType> {
            id: object::new(ctx),
            buyer,
            seller,
            token_amount,
            price,
            fee_amount,
            expiry: created_at + 3600, // Fixed 1-hour order expiry
            status: STATUS_ACTIVE,
            created_at,
            escrowed_coin,
            payment_made: false,
            payment_received: false,
            metadata,
            listing_id,
        }
    }
    
    /// Buyer creates an order from an existing listing with a specified token amount
    /// @param listing - The listing to purchase from
    /// @param token_amount - The amount of tokens to purchase
    /// @param clock - For timestamp verification
    public entry fun create_order_from_listing<CoinType>(
        listing: &mut Listing<CoinType>,
        token_amount: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let now = clock::timestamp_ms(clock) / 1000;
        let buyer = tx_context::sender(ctx);
        
        // First check: Prevent seller from buying their own listing
        assert!(buyer != listing.seller, ESelfTrading);
        
        // Verify the listing is still valid
        assert!(now <= listing.expiry, EOrderExpired);
        assert!(listing.status == LISTING_ACTIVE || listing.status == LISTING_PARTIALLY_SOLD, EInvalidListing);
        
        // Verify the requested amount is available
        assert!(token_amount > 0, EInvalidAmount);
        assert!(token_amount <= listing.remaining_amount, EInsufficientTokensInListing);
        
        // Create an empty vector for metadata
        let mut metadata = vector::empty();
        
        // Copy relevant metadata from the listing
        copy_metadata(&listing.metadata, &mut metadata);
        
        // Take specified amount of tokens from the listing
        let escrowed_coin = balance::split(&mut listing.escrowed_coin, token_amount);
        
        // Update the remaining amount in the listing
        listing.remaining_amount = listing.remaining_amount - token_amount;
        
        // Update listing status based on remaining tokens
        if (listing.remaining_amount == 0) {
            listing.status = LISTING_SOLD;
        } else {
            listing.status = LISTING_PARTIALLY_SOLD;
            
            // Emit event for partial sale
            event::emit(ListingPartiallySoldEvent {
                listing_id: object::id(listing),
                seller: listing.seller,
                amount_sold: token_amount,
                remaining_amount: listing.remaining_amount,
            });
        };

        // Calculate total price for the purchased amount (price per token * token amount)
        let total_price = listing.price * token_amount;
        
        let order = create_order_internal<CoinType>(
            buyer,
            listing.seller,
            token_amount,
            total_price, // Total price for the purchased amount
            3600, // Fixed 1-hour order expiry
            now,
            escrowed_coin,
            metadata,
            object::id(listing),
            ctx
        );

        event::emit(OrderCreatedEvent {
            order_id: object::id(&order),
            listing_id: object::id(listing),
            buyer: order.buyer,
            seller: order.seller,
            token_amount: order.token_amount,
            price: order.price,
            expiry: order.expiry,
        });

        transfer::share_object(order);
    }

    /// Buyer marks payment as made (off-chain transaction)
    public entry fun mark_payment_made<CoinType>(
        order: &mut Order<CoinType>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == order.buyer, ENotOwner);
        assert!(order.status == STATUS_ACTIVE, EOrderNotOpen);
        
        // Validate state transition
        assert!(validate_order_status_change(order.status, STATUS_PAYMENT_MADE), EInvalidStateTransition);
        
        order.payment_made = true;
        order.status = STATUS_PAYMENT_MADE;

        event::emit(PaymentMadeEvent {
            order_id: object::id(order),
            by: order.buyer,
        });
    }

    /// Seller confirms payment received and tokens are released to the buyer
    public entry fun mark_payment_received<CoinType>(
        config: &EscrowConfig,
        order: &mut Order<CoinType>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == order.seller, ENotOwner);
        assert!(order.status == STATUS_PAYMENT_MADE, EPaymentNotMade);
        assert!(clock::timestamp_ms(clock) / 1000 <= order.expiry, EOrderExpired);

        // Validate state transition
        assert!(validate_order_status_change(order.status, STATUS_COMPLETED), EInvalidStateTransition);

        order.payment_received = true;
        order.status = STATUS_COMPLETED;

        // Calculate amounts
        let total_amount = balance::value(&order.escrowed_coin);
        assert!(total_amount >= order.fee_amount, EInsufficientFunds);
        let buyer_amount = total_amount - order.fee_amount;

        // Transfer fee to platform
        let fee_coin = coin::take(&mut order.escrowed_coin, order.fee_amount, ctx);
        transfer::public_transfer(fee_coin, config.fee_collector);

        // Transfer remaining to buyer
        refund_balance(&mut order.escrowed_coin, order.buyer, ctx);

        event::emit(PaymentReceivedEvent {
            order_id: object::id(order),
            by: order.seller,
        });

        event::emit(OrderCompletedEvent {
            order_id: object::id(order),
            buyer_received: buyer_amount,
            fee_collected: order.fee_amount,
        });
    }

    /// Buyer can cancel the order before expiry
    public entry fun cancel_order<CoinType>(
        order: &mut Order<CoinType>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Only buyer can cancel orders
        assert!(sender == order.buyer, ENotOwner);
        
        // Order must be active or in payment made status
        assert!(order.status == STATUS_ACTIVE || order.status == STATUS_PAYMENT_MADE, EOrderNotOpen);
        
        // Check that order has not expired
        assert!(clock::timestamp_ms(clock) / 1000 <= order.expiry, EOrderExpired);

        // Validate state transition
        assert!(validate_order_status_change(order.status, STATUS_CANCELED), EInvalidStateTransition);

        order.status = STATUS_CANCELED;

        // Refund all funds to seller
        refund_balance(&mut order.escrowed_coin, order.seller, ctx);

        event::emit(OrderCanceledEvent {
            order_id: object::id(order),
            by: sender,
        });
    }

    /// Process an order that has passed its expiry time
    public entry fun process_expired_order<CoinType>(
        order: &mut Order<CoinType>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(clock::timestamp_ms(clock) / 1000 > order.expiry, EOrderNotExpired);
        assert!(order.status == STATUS_ACTIVE || order.status == STATUS_PAYMENT_MADE, EOrderNotOpen);

        // Validate state transition
        assert!(validate_order_status_change(order.status, STATUS_EXPIRED), EInvalidStateTransition);

        order.status = STATUS_EXPIRED;

        // Return escrowed tokens to seller
        refund_balance(&mut order.escrowed_coin, order.seller, ctx);

        event::emit(OrderExpiredEvent {
            order_id: object::id(order),
        });
    }

    /// Admin can force cancel any order
    public entry fun admin_force_cancel_order<CoinType>(
        _: &AdminCap,
        order: &mut Order<CoinType>,
        ctx: &mut TxContext
    ) {
        // Order must not be already completed or canceled
        assert!(order.status != STATUS_COMPLETED && order.status != STATUS_CANCELED, EOrderNotOpen);

        order.status = STATUS_CANCELED;

        // Return escrowed tokens to seller
        refund_balance(&mut order.escrowed_coin, order.seller, ctx);

        event::emit(OrderCanceledEvent {
            order_id: object::id(order),
            by: tx_context::sender(ctx),
        });
    }

    /// Admin can update fee collector address
    public entry fun update_fee_collector(
        _: &AdminCap,
        config: &mut EscrowConfig,
        new_collector: address
    ) {
        config.fee_collector = new_collector;
    }

    /// Admin can update expiry parameters
    public entry fun update_expiry_params(
        _: &AdminCap,
        config: &mut EscrowConfig,
        min_expiry: u64,
        max_expiry: u64
    ) {
        assert!(min_expiry > 0 && max_expiry > min_expiry, EInvalidParameters);
        config.min_expiry = min_expiry;
        config.max_expiry = max_expiry;
    }

    /// Admin can add new token types
    public entry fun add_token_type<CoinType>(
        _: &AdminCap,
        registry: &mut TokenRegistry,
        min_amount: u64,
        max_amount: u64,
        _ctx: &mut TxContext
    ) {
        let token_info = TokenInfo {
            is_active: true,
            min_amount,
            max_amount,
        };
        
        add_token_registry_entry(&mut registry.tokens, type_name::get<CoinType>(), token_info);
    }

    /// Admin can deactivate or reactivate token types
    public entry fun set_token_status<CoinType>(
        _: &AdminCap,
        registry: &mut TokenRegistry,
        is_active: bool
    ) {
        let token_type = type_name::get<CoinType>();
        let mut i = 0;
        let len = vector::length(&registry.tokens);
        
        while (i < len) {
            let entry = vector::borrow_mut(&mut registry.tokens, i);
            // Use string representation to compare TypeNames
            if (type_name::get_address(&entry.token_type) == type_name::get_address(&token_type) && 
                type_name::get_module(&entry.token_type) == type_name::get_module(&token_type) &&
                type_name::into_string(entry.token_type) == type_name::into_string(token_type)) {
                entry.info.is_active = is_active;
                return
            };
            i = i + 1;
        };
        
        assert!(false, ETokenNotFound);
    }

    /// Buyer creates a dispute
    public entry fun create_dispute<CoinType>(
        order: &mut Order<CoinType>,
        reason: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == order.buyer, ENotOwner);
        assert!(order.status == STATUS_PAYMENT_MADE, EOrderNotOpen);
        
        // Validate state transition
        assert!(validate_order_status_change(order.status, STATUS_DISPUTED), EInvalidStateTransition);
        
        let now = clock::timestamp_ms(clock) / 1000;
        
        // Take escrowed tokens from order
        let escrowed_coin = balance::withdraw_all(&mut order.escrowed_coin);
        
        // Mark order as disputed
        order.status = STATUS_DISPUTED;
        
        let dispute = Dispute<CoinType> {
            id: object::new(ctx),
            order_id: object::id(order),
            buyer: order.buyer,
            seller: order.seller,
            token_amount: order.token_amount,
            price: order.price,
            buyer_reason: reason,
            seller_response: vector::empty(),
            status: DISPUTE_OPEN,
            created_at: now,
            escrowed_coin,
        };
        
        event::emit(DisputeCreatedEvent {
            dispute_id: object::id(&dispute),
            order_id: object::id(order),
            buyer: order.buyer,
            seller: order.seller,
            created_at: now,
        });
        
        transfer::share_object(dispute);
    }

    /// Seller responds to dispute
    public entry fun respond_to_dispute<CoinType>(
        dispute: &mut Dispute<CoinType>,
        response: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == dispute.seller, ENotParticipant);
        assert!(dispute.status == DISPUTE_OPEN, EDisputeNotOpen);
        
        dispute.seller_response = response;
    }

    /// Admin resolves dispute for buyer
    public entry fun resolve_dispute_for_buyer<CoinType>(
        _: &AdminCap,
        dispute: &mut Dispute<CoinType>,
        ctx: &mut TxContext
    ) {
        assert!(dispute.status == DISPUTE_OPEN, EDisputeNotOpen);
        
        dispute.status = DISPUTE_RESOLVED_FOR_BUYER;
        
        // Transfer tokens to buyer
        refund_balance(&mut dispute.escrowed_coin, dispute.buyer, ctx);
        
        event::emit(DisputeResolvedEvent {
            dispute_id: object::id(dispute),
            resolved_for: dispute.buyer,
            resolved_by: tx_context::sender(ctx),
        });
    }

    /// Admin resolves dispute for seller
    public entry fun resolve_dispute_for_seller<CoinType>(
        _: &AdminCap,
        dispute: &mut Dispute<CoinType>,
        ctx: &mut TxContext
    ) {
        assert!(dispute.status == DISPUTE_OPEN, EDisputeNotOpen);
        
        dispute.status = DISPUTE_RESOLVED_FOR_SELLER;
        
        // Transfer tokens to seller
        refund_balance(&mut dispute.escrowed_coin, dispute.seller, ctx);
        
        event::emit(DisputeResolvedEvent {
            dispute_id: object::id(dispute),
            resolved_for: dispute.seller,
            resolved_by: tx_context::sender(ctx),
        });
    }

    /// Returns the current status of an order
    public fun get_order_status<CoinType>(order: &Order<CoinType>): u8 {
        order.status
    }

    /// Checks if payment has been marked as made
    public fun is_payment_made<CoinType>(order: &Order<CoinType>): bool {
        order.payment_made
    }

    /// Checks if payment has been marked as received
    public fun is_payment_received<CoinType>(order: &Order<CoinType>): bool {
        order.payment_received
    }
    
    /// Returns the current status of a listing
    public fun get_listing_status<CoinType>(listing: &Listing<CoinType>): u8 {
        listing.status
    }

    /// Returns the status of a dispute
    public fun get_dispute_status<CoinType>(dispute: &Dispute<CoinType>): u8 {
        dispute.status
    }

    /// Returns whether a token type is supported and active
    public fun is_token_supported<CoinType>(registry: &TokenRegistry): bool {
        let token_type = type_name::get<CoinType>();
        let (found, token_info) = get_token_info(&registry.tokens, token_type);
        
        if (!found) {
            return false
        };
        
        token_info.is_active
    }

    // ============== Query Functions ==============

    /// Get listing details by its ID
    /// @return seller address, token amount, remaining amount, price, expiry, created time, status, listing ID
    public fun get_listing_by_id<CoinType>(listing: &Listing<CoinType>): (address, u64, u64, u64, u64, u64, u8, ID) {
        (
            listing.seller,
            listing.token_amount,
            listing.remaining_amount,
            listing.price,
            listing.expiry,
            listing.created_at,
            listing.status,
            object::id(listing)
        )
    }

    /// Get all listings for a seller
    /// Not implemented directly in Move - must be done via indexer or RPC query
    /// This is a placeholder for documentation purposes
    public fun get_listings_by_seller(_seller: address): vector<ID> {
        abort ENotImplemented
    }

    /// Get listing metadata
    public fun get_listing_metadata<CoinType>(listing: &Listing<CoinType>): &vector<MetadataEntry> {
        &listing.metadata
    }

    /// Get order details by its ID
    /// @return buyer, seller, token amount, price, fee amount, expiry, status, created time, payment status, order ID
    public fun get_order_by_id<CoinType>(order: &Order<CoinType>): (address, address, u64, u64, u64, u64, u8, u64, bool, bool, ID) {
        (
            order.buyer,
            order.seller,
            order.token_amount,
            order.price,
            order.fee_amount,
            order.expiry,
            order.status,
            order.created_at,
            order.payment_made,
            order.payment_received,
            object::id(order)
        )
    }

    /// Get order metadata
    public fun get_order_metadata<CoinType>(order: &Order<CoinType>): &vector<MetadataEntry> {
        &order.metadata
    }

    /// Get listing ID associated with an order
    public fun get_order_listing_id<CoinType>(order: &Order<CoinType>): ID {
        order.listing_id
    }

    /// Get dispute details by its ID
    /// @return order ID, buyer, seller, token amount, price, status, created time, dispute ID
    public fun get_dispute_by_id<CoinType>(dispute: &Dispute<CoinType>): (ID, address, address, u64, u64, u8, u64, ID) {
        (
            dispute.order_id,
            dispute.buyer,
            dispute.seller,
            dispute.token_amount,
            dispute.price,
            dispute.status,
            dispute.created_at,
            object::id(dispute)
        )
    }

    /// Get buyer's reason for dispute
    public fun get_dispute_buyer_reason<CoinType>(dispute: &Dispute<CoinType>): &vector<u8> {
        &dispute.buyer_reason
    }

    /// Get seller's response to dispute
    public fun get_dispute_seller_response<CoinType>(dispute: &Dispute<CoinType>): &vector<u8> {
        &dispute.seller_response
    }
}