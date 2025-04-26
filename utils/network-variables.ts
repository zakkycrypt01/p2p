import { useSuiClientContext } from "@mysten/dapp-kit";

const NETWORK_CONFIG = {
  devnet: {
    MarketplacePackageId:
    "0x91b726490989f4b3ea355619a913c33ce88dc17dbd38288ac64fd280be811322",
    EscrowConfigObjectId:
    "0x19115ff0160789ba0f5bd7dcc112c9ea4add80f0584f6bba8396fa5b3541e4fa",
    TokenRegistryObjectId:
    "0x2c0922d6ab6cb9e838e5eab33fdb41c5f0025a7b0da115b129fbaeb7ab373528",
    AdminCapObjectId:
    "0x3ccb219cae6f9602326a06d3ee639e86dda905ed598b72409923603b73610532"
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