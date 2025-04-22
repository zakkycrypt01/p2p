import { useSuiClientContext } from "@mysten/dapp-kit";

const NETWORK_CONFIG = {
  devnet: {
    MarketplacePackageId:
    "0x921cde254120512c5703884cf378c35a732b73e2da6eac1243529aeee293515b",
    EscrowConfigObjectId:
    "0xbcda594728ed973a5bf91b5494965bea5db82394613dec975de456fc4f619959",
    TokenRegistryObjectId:
    "0x660f7be3cacbc126ec23a1213f44e59886a1a9c3dcc34b3c133d23023bdf1321",
    AdminCapObjectId:
    "0xca549e80cb18f8bc51c50bcac0bb78c51bc14e224ff4aa99891f7f7bed0fd148"
  },
  mainnet: {
    MarketplacePackageId: "0x0TODO", // Replace with mainnet package ID
    EscrowConfigObjectId: "0x0TODO", // Replace with mainnet token ID
    TokenRegistryObjectId: "0x0TODO",
    AdminCapObjectId: "0x0TODO"
  },
} as const;

type Network = keyof typeof NETWORK_CONFIG;

export function useNetworkVariables() {
  const { network } = useSuiClientContext();
  return NETWORK_CONFIG[network as Network];
}