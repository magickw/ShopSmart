import { useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useBarcode() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const scanBarcode = async (barcode: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Prefetch the data so it's available when the ResultPage loads
      await queryClient.prefetchQuery({
        queryKey: [`/api/lookup/${barcode}`],
        retry: 2,
      });
      
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
