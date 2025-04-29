import { getFullnodeUrl } from "@mysten/sui/client";
import {
  TESTNET_MARKETPLACE_PACKAGE_ID,
  MAINNET_MARKETPLACE_PACKAGE_ID,
  ESCROWCONFIG_OBJECT_ID,
  TOKENREGISTRY_OBJECT_ID,
  ADMINCAP_OBJECT_ID
} from "./constant";
import { createNetworkConfig, useSuiClientContext } from "@mysten/dapp-kit";
import { createContext, useContext } from "react";

const NETWORK_CONFIG = {
  testnet : {
    MarketplacePackageId:
      "0x52aac053e77b411e6673d8656a317f4730f2cf6c7d3c891eca69a8b348980d69",
    EscrowConfigObjectId:
      "0x82473bfb9490f36fc2061ad8396c47049119251870265920398fd1d2f9ce3dfb",
    TokenRegistryObjectId:
      "0x8c76d91d2b3b878a811fd5bdaf96d3d39692fa68ea87d7241a9cbebbf96ad155",
    AdminCapObjectId:
      "0xa8b7b87b4039b9e65a5defe799e0b074427dcff83b15dbedba2e496fa492a280"
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
  testnet: {
    url: getFullnodeUrl("testnet"),
    variables: {
      MarketplacePackageId: TESTNET_MARKETPLACE_PACKAGE_ID,
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