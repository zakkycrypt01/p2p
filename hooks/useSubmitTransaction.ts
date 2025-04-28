import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useToast } from "@/components/ui/use-toast";
import { Transaction } from "@mysten/sui/transactions";
import { useCallback } from "react";

export const useSubmitTransaction = () => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { toast } = useToast();

  // helper to call your /api/drip endpoint
  const dripGas = useCallback(async (to: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/drip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: to }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Drip failed");
      return body.txDigest;
    } catch (e) {
      console.error("Drip gas error:", e);
      return null;
    }
  }, []);

  const executeTransaction = async (
    transaction: Transaction | string,
    {
      onSuccess = () => {},
      onError = () => {},
      successMessage = "Transaction successful!",
      errorMessage = "Transaction failed. Please try again.",
      loadingMessage = "Processing transaction...",
    } = {}
  ): Promise<string | null> => {
    try {
      const loadingToast = toast({
        title: "Processing Transaction",
        description: loadingMessage,
      });

      // parse into Transaction instance
      let txToExec: Transaction;
      if (typeof transaction === "string") {
        txToExec = Transaction.from(transaction);
      } else if (transaction instanceof Transaction) {
        txToExec = transaction;
      } else {
        throw new Error("Invalid transaction format");
      }

      // === AUTO‑DRIP if gas < 0.02 SUI ===
      if (currentAccount?.address) {
        const MIN = BigInt(50_000_000);
        const coins = await suiClient.getCoins({
          owner: currentAccount.address,
          coinType: "0x2::sui::SUI",
        });
        const balance = coins.data
          .map((c) => BigInt(c.balance))
          .reduce((a, b) => a + b, BigInt(0));
        if (balance < MIN) {
          console.log("Low gas balance, triggering drip…");
          await dripGas(currentAccount.address);
        }
      }

      // set a standard gas budget (must be done before signAndExecute)
      txToExec.setGasBudget(BigInt(50_000_000));

      // now actually send
      return new Promise((resolve) => {
        signAndExecute(
          { transaction: txToExec },
          {
            onSuccess: async ({ digest }) => {
              try {
                const result = await suiClient.waitForTransaction({
                  digest,
                  options: { showEffects: true },
                });
                loadingToast.dismiss();
                if (result?.effects?.status.status === "success") {
                  toast({ title: "Transaction Successful", description: successMessage });
                  onSuccess();
                  resolve(digest);
                } else {
                  toast({ title: "Transaction Failed", description: errorMessage, variant: "destructive" });
                  onError();
                  resolve(null);
                }
              } catch (e) {
                loadingToast.dismiss();
                toast({
                  title: "Transaction Error",
                  description: e instanceof Error ? e.message : "Unknown error",
                  variant: "destructive",
                });
                console.error("Verification error:", e);
                onError();
                resolve(null);
              }
            },
            onError: (e) => {
              loadingToast.dismiss();
              toast({
                title: "Transaction Error",
                description: e instanceof Error ? e.message : "Unknown error",
                variant: "destructive",
              });
              console.error("Send error:", e);
              onError();
              resolve(null);
            },
          }
        );
      });
    } catch (e) {
      toast({
        title: "Transaction Error",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
      console.error("Execute transaction error:", e);
      onError();
      return null;
    }
  };

  return { executeTransaction };
};