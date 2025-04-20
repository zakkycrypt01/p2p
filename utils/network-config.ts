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
      "0x0821a5bf51104bc36366d923a85f3305e8ac8f4ebdde3508a41cf525d0e0af3a",
    EscrowConfigObjectId:
      "0xdc60e13b6d607770e30f9014c6b49077d675a7871c8a7831c10d7451d754e899",
    TokenRegistryObjectId:
      "0xfec7a7774aab9ac7bfa2688df8e6f059f19a2b16e91e005b32666da0ed92f538",
    AdminCapObjectId:
      "0x049326c6e4781540174b6cfccb800b2625371b42b3e7964d1f095fc1dd55cc1f"
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