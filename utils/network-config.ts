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
      "0xa5a7a1408879bbcd7826a1a814a73fda2c2d5152cb6c461d37c257953cbd30ed",
    EscrowConfigObjectId:
      "0x97c4d982dde274a422ebe93efffb66c2149ea1670ec6b4f6fb6b2987849f4e17",
    TokenRegistryObjectId:
      "0x43ae0eef6ed27ca25b9e5407d2e8fd5b7bcb6ef0b4bbb0b2dae7242beb4fba33",
    AdminCapObjectId:
      "0x9ab7cf69db14159adee78d5a71f0a7aff6d560f7ea12f9a17bd01b445351de13"
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