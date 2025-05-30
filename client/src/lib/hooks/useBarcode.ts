import { useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useBarcode() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const scanBarcode = async (barcode: string, productData: any) => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
// Actually call the lookup API which will save to history
      const response = await fetch(`/api/lookup/${barcode}`);
      if (!response.ok) {
        throw new Error("Failed to fetch product");
      }
      
      const productData = await response.json();
      
      // Also prefetch for the result page
      queryClient.setQueryData([`/api/lookup/${barcode}`], productData);
      
      // Invalidate history to refresh it
      queryClient.invalidateQueries({ queryKey: ["/api/history"] 
      });

      // Save scan history after successful data fetch
      const historyResponse = await fetch(`/api/history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          barcode,
          productData,
        }),
      });

      if (!historyResponse.ok) {
        throw new Error("Failed to save scan history");
      }

      return true;
    } catch (error) {
      toast({
        title: "Scan Error",
        description: "Unable to retrieve product information. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    scanBarcode,
    isProcessing,
  };
}