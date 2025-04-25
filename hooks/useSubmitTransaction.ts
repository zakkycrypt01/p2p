import { useSuiClient } from "@mysten/dapp-kit";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useToast } from "@/components/ui/use-toast";
import { Transaction } from "@mysten/sui/transactions";

export const useSubmitTransaction = () => {
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { toast } = useToast();

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
      console.debug("Received transaction:", transaction);
      let transactionToExecute: Transaction;
      if (typeof transaction === "string") {
        try {
          transactionToExecute = Transaction.from(transaction);
        } catch (error) {
          console.error("Failed to parse transaction string:", error);
          throw new Error("Invalid transaction format");
        }
      } else if (transaction instanceof Transaction) {
        transactionToExecute = transaction;
      } else {
        throw new Error("Invalid transaction format: Expected a Transaction instance");
      }
      console.debug("Parsed transaction:", transactionToExecute);
      return new Promise((resolve) => {
        signAndExecute(
          { transaction: transactionToExecute },
          {
            onSuccess: async ({ digest }) => {
              try {
                const result = await suiClient.waitForTransaction({
                  digest,
                  options: { showEffects: true },
                });

                if (result?.effects?.status.status === "success") {
                  loadingToast.dismiss();
                  toast({
                    title: "Transaction Successful",
                    description: successMessage,
                  });
                  onSuccess();
                  resolve(digest);
                } else {
                  loadingToast.dismiss();
                  toast({
                    title: "Transaction Failed",
                    description: errorMessage,
                    variant: "destructive",
                  });
                  onError();
                  resolve(null);
                }
              } catch (error) {
                loadingToast.dismiss();
                toast({
                  title: "Transaction Error",
                  description: error instanceof Error ? error.message : "An unknown error occurred",
                  variant: "destructive",
                });
                console.error("Transaction verification error:", error);
                onError();
                resolve(null);
              }
            },
            onError: (error) => {
              loadingToast.dismiss();
              toast({
                title: "Transaction Error",
                description: error instanceof Error ? error.message : "An unknown error occurred",
                variant: "destructive",
              });
              console.error("Transaction error:", error);
              onError();
              resolve(null);
            },
          }
        );
      });
    } catch (error) {
      toast({
        title: "Transaction Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      console.error("Execute transaction error:", error);
      onError();
      return null;
    }
  };

  return { executeTransaction };
};