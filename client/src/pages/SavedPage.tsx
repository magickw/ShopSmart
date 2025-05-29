
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import LoadingSpinner from "@/components/ui/loading-spinner";
import ErrorDisplay from "@/components/ui/error-display";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { ProductResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Trash2Icon } from "lucide-react";

export default function SavedPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: savedItems, isLoading, error } = useQuery<ProductResponse[]>({
    queryKey: ["/api/saved"],
  });
  
  const removeSavedMutation = useMutation({
    mutationFn: async (barcode: string) => {
      await apiRequest("DELETE", `/api/saved/${barcode}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved"] });
      toast({
        title: "Product removed",
        description: "Product has been removed from your saved items",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove product",
        variant: "destructive",
      });
    }
  });
  
  const clearSavedMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/saved/clear");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved"] });
      toast({
        title: "Saved items cleared",
        description: "All saved items have been removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear saved items",
        variant: "destructive",
      });
    }
  });
  
  const handleBackClick = () => {
    setLocation("/");
  };
  
  const handleViewItem = (barcode: string) => {
    setLocation(`/result/${barcode}`);
  };
  
  const handleRemoveItem = (barcode: string) => {
    removeSavedMutation.mutate(barcode);
  };
  
  const handleClearSaved = () => {
    clearSavedMutation.mutate();
  };
  
  return (
    <>
      <Header 
        title="Saved Products"
        showHistory={false}
        showBackButton={true}
        onBackClick={handleBackClick}
      />
      
      <main className="flex-1 flex flex-col p-4">
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <ErrorDisplay 
            title="Error Loading Saved Items"
            message="We encountered a problem loading your saved products."
            onRetry={() => queryClient.invalidateQueries({ queryKey: ["/api/saved"] })}
          />
        ) : (
          <>
            {savedItems && savedItems.length > 0 ? (
              <div className="space-y-4 mb-4">
                {savedItems.map((product) => (
                  <div key={product.barcode} className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="p-4">
                      <ProductCard product={product} />
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-neutral-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewItem(product.barcode)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveItem(product.barcode)}
                          disabled={removeSavedMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2Icon className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <span className="material-icons text-neutral-400 text-5xl mb-4">bookmark_border</span>
                <h3 className="text-lg font-medium text-neutral-800 mb-2">No Saved Products</h3>
                <p className="text-neutral-600 mb-6">You haven't saved any products yet. Save products from search results to view them here.</p>
                <Button
                  variant="default"
                  onClick={handleBackClick}
                >
                  Start Scanning
                </Button>
              </div>
            )}
            
            {savedItems && savedItems.length > 0 && (
              <div className="text-center mt-2 mb-8">
                <Button 
                  variant="link" 
                  className="text-red-600 text-sm font-medium hover:text-red-700"
                  onClick={handleClearSaved}
                  disabled={clearSavedMutation.isPending}
                >
                  {clearSavedMutation.isPending ? "Clearing..." : "Clear All Saved"}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
