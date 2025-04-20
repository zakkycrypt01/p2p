import { useSuiClient } from "@mysten/dapp-kit";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useToast } from "@/components/ui/use-toast";
import { Transaction } from "@mysten/sui/transactions";
import { SUI_TYPE_ARG } from "@mysten/sui/utils"; // Add this import

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
  ) => {
    try {
      const loadingToast = toast({
        title: "Processing Transaction",
        description: loadingMessage,
      });

      // Convert transaction to the expected format if it's not already a TransactionBlock
      let transactionToExecute = transaction;
      if (typeof transaction === 'string') {
        try {
          // If it's a serialized transaction string
          transactionToExecute = Transaction.from(transaction);
        } catch (error) {
          console.error("Failed to parse transaction string:", error);
          throw new Error("Invalid transaction format");
        }
      }

      // Validate transaction before sending
      try {
        // You might need to add additional validation here depending on your use case
        if (transactionToExecute instanceof Transaction) {
          // Perform custom validation logic here if needed
          if (!(transactionToExecute instanceof Transaction)) {
            throw new Error("Invalid transaction format: Expected a Transaction instance");
          }
        } else {
          throw new Error("Invalid transaction format: Expected a Transaction instance");
        }
      } catch (error) {
        console.error("Transaction validation error:", error);
        throw new Error(`Invalid transaction: ${error instanceof Error ? error.message : String(error)}`);
      }

      const result = await signAndExecute(
        { transaction: transactionToExecute },
        {
          onSuccess: async ({ digest }) => {
            try {
              const result = await suiClient.waitForTransaction({
                digest: digest,
                options: { showEffects: true },
              });

              if (result?.effects?.status.status === "success") {
                loadingToast.dismiss();
                toast({
                  title: "Transaction Successful",
                  description: successMessage,
                });
              } else {
                loadingToast.dismiss();
                toast({
                  title: "Transaction Failed",
                  description: errorMessage,
                  variant: "destructive",
                });
              }

              onSuccess();
            } catch (error) {
              loadingToast.dismiss();
              toast({
                title: "Transaction Error",
                description:
                  error instanceof Error
                    ? error.message
                    : "An unknown error occurred",
                variant: "destructive",
              });
              console.error("Transaction verification error:", error);
            }
          },
          onError: (error) => {
            loadingToast.dismiss();
            toast({
              title: "Transaction Error",
              description:
                error instanceof Error
                  ? error.message
                  : "An unknown error occurred",
              variant: "destructive",
            });
            console.error("Transaction error:", error);

            onError();
          },
        }
      );

      return result;
    } catch (error) {
      toast({
        title: "Transaction Error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      console.error("Execute transaction error:", error);
      onError();
      return null;
    }
  };

  return { executeTransaction };
};