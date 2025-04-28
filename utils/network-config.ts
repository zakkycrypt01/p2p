import { getFullnodeUrl } from "@mysten/sui/client";
import {
  DEVNET_MARKETPLACE_PACKAGE_ID,
  MAINNET_MARKETPLACE_PACKAGE_ID,
  ESCROWCONFIG_OBJECT_ID,
  TOKENREGISTRY_OBJECT_ID,
  ADMINCAP_OBJECT_ID
} from "./constant";
import { createNetworkConfig, useSuiClientContext } from "@mysten/dapp-kit";
import { createContext, useContext } from "react";

const NETWORK_CONFIG = {
  devnet : {
    MarketplacePackageId:
      "0x5a4401f6f1b16492b3bfdfb95059ddbd234d75782c18c4bf5fe1566b4e44c7e9",
    EscrowConfigObjectId:
      "0x6c7d7bd4beddec6e6fbfc557165dafa45df2c317df61409ebbf84f354caa54ba",
    TokenRegistryObjectId:
      "0xeedb17f2415c1dc2efe9a920ed1d8aedbe7ffe995562dc864a48d973452cea2e",
    AdminCapObjectId:
      "0x616ccd1c557d95bb695b428f5edc4d6f59997f68d7dbf9de5b7baffd851785f2"
  },
  mainnet : {
    MarketplacePackageId: "0x0TODO", // Replace with mainnet package ID
    EscrowConfigObjectId: "0x0TODO", // Replace with mainnet token ID
  },
} as const;
type Network = keyof typeof NETWORK_CONFIG;
export function useNetworkVariables() {
const { network } = useSuiClientContext();
return NETWORK_CONFIG[network as Network];
}
  const {networkConfig, useNetworkVariable} = createNetworkConfig({
  devnet: {
    url: getFullnodeUrl("devnet"),
    variables: {
      MarketplacePackageId: DEVNET_MARKETPLACE_PACKAGE_ID,
      TokenRegistryObjectId: TOKENREGISTRY_OBJECT_ID,
      EscrowConfigObjectId:ESCROWCONFIG_OBJECT_ID,
      AdminCapObjectId:ADMINCAP_OBJECT_ID
    },
  },
  mainnet: {
    url: getFullnodeUrl("mainnet"),
    variables: {
      MarketplacePackageId: MAINNET_MARKETPLACE_PACKAGE_ID,
      TokenRegistryObjectId: TOKENREGISTRY_OBJECT_ID,
    },
  },
  });


export { useNetworkVariable, networkConfig };