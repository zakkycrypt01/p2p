"use client"

import { useCurrentAccount, useSignAndExecuteTransaction, useConnectWallet, useSuiClient } from "@mysten/dapp-kit"
import { useState, useEffect, use } from "react"
import {SuiClient} from "@mysten/sui/client"

interface FetchCoinBalancesParams {
  address: string;
}

interface FetchCoinObjectIdParams {
  address: string;
}

async function fetchCoinObjectId({ address }: FetchCoinObjectIdParams): Promise<string> {
  const client = new SuiClient({ url: "https://fullnode.devnet.sui.io" });
  const coinObjects = await client.getCoins({ owner: address });
  const coinObjectId = coinObjects.data[0]?.coinObjectId || "";
  console.log('coinObjectId :>> ', coinObjectId);
  return coinObjectId;
}

export function useSuiWallet() {
  const currentAccount = useCurrentAccount()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const { mutate: connect } = useConnectWallet()
  const client = useSuiClient()
  const [balance, setBalance] = useState<
    | {
        symbol: string
        icon: string
        balance: number
        coinType : string
      }[]
    | null
  >(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)

  // Function to fetch real coin balances
  const fetchCoinBalances = async ({ address }: FetchCoinBalancesParams) => {
    if (!client) return []
    
    // Define coin types we want to fetch
    const coinTypes = [
      '0x2::sui::SUI',
      '0xTODO::usdc::USDC', // Replace with real USDC coin type when available
      'OXTODO::eth::ETH',   // Replace with real ETH coin type when available
    ]
    
    const balances = []
    
    for (const coinType of coinTypes) {
      try {
        // Skip placeholder coin types for now
        if (coinType.includes('TODO')) continue
        
        // Get all coins of this type owned by the address
        const coins = await client.getCoins({
          owner: address,
          coinType: coinType,
        })
        
        // Calculate total balance
        let totalBalance = 0
        for (const coin of coins.data) {
          totalBalance += Number(coin.balance)
        }
        
        // Convert from smallest unit (MIST for SUI) to standard unit
        const normalizedBalance = coinType === '0x2::sui::SUI' 
          ? totalBalance / 1_000_000_000 
          : totalBalance
        
        // Map coin type to symbol and icon
        let symbol = 'UNKNOWN'
        let icon = '/tokens/unknown.png'
        
        if (coinType === '0x2::sui::SUI') {
          symbol = 'SUI'
          icon = '/tokens/sui.png'
          balances.push({ 
            symbol, 
            icon, 
            balance: normalizedBalance,
            coinType
          })
        }
      } catch (error) {
        console.error(`Failed to fetch balance for ${coinType}:`, error)
      }
    }
    
    // Add placeholder balances for demo purposes
    // In production, remove these and use real coin types
    if (coinTypes.some(type => type.includes('TODO'))) {
      balances.push({ symbol: "USDC", icon: "/tokens/usdc.png", balance: 500.0, coinType: '0xTODO::usdc::USDC' })
      balances.push({ symbol: "ETH", icon: "/tokens/eth.png", balance: 0.5, coinType: 'OXTODO::eth::ETH' })
    }
    
    return balances
  }
   
  // Fetch balances when address changes
  useEffect(() => {
    if (!currentAccount?.address) return
    
    const loadBalances = async () => {
      setIsLoadingBalance(true)
      try {
        const balances = await fetchCoinBalances({ address: currentAccount.address })
        setBalance(balances)
      } catch (error) {
        console.error("Failed to fetch balances:", error)
      } finally {
        setIsLoadingBalance(false)
      }
    }

    loadBalances()
  }, [currentAccount?.address, client])

  return {
    address: currentAccount?.address || null,
    balance,
    isLoadingBalance,
    connect,
    signAndExecute,
    client,
    fetchCoinObjectId,
  }
}
