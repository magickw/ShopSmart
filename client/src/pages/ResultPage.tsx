import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import Header from "@/components/layout/Header";
import ProductCard from "@/components/product/ProductCard";
import StoreComparison from "@/components/product/StoreComparison";
import ErrorDisplay from "@/components/ui/error-display";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, Share2Icon, MapIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ProductResponse } from "@/lib/types";

export default function ResultPage() {
  const { barcode } = useParams<{ barcode: string }>();
  const [_, setLocation] = useLocation();
  
  const { data: product, isLoading, error } = useQuery<ProductResponse>({
    queryKey: [`/api/lookup/${barcode}`],
    enabled: !!barcode,
    retry: 1,
  });
  
  const handleBackClick = () => {
    setLocation("/");
  };
  
  return (
    <>
      <Header 
        title="Product Details"
        showHistory={false}
        showBackButton={true}
        onBackClick={handleBackClick}
      />
      
      <main className="flex-1 flex flex-col p-4">
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <LoadingSpinner />
            <p className="text-neutral-600 text-lg mt-4">Searching product information...</p>
          </div>
        )}
        
        {error && (
          <ErrorDisplay 
            title="Product Not Found"
            message="We couldn't find any information for this barcode. Please try again or enter the barcode manually."
            onRetry={handleBackClick}
          />
        )}
        
        {product && !isLoading && !error && (
          <div className="result-content">
            <ProductCard product={product} />
            
            <h3 className="font-medium text-neutral-700 mb-3">Price Comparison</h3>
            
            {product.stores.map((store) => (
              <StoreComparison 
                key={store.id}
                store={store}
              />
            ))}
            
            <div className="flex items-center justify-center space-x-3 mt-2 mb-10">
              <Button variant="outline" size="sm" className="flex items-center justify-center px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-700 text-sm">
                <BookmarkIcon className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button variant="outline" size="sm" className="flex items-center justify-center px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-700 text-sm">
                <Share2Icon className="h-4 w-4 mr-1" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="flex items-center justify-center px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-700 text-sm">
                <MapIcon className="h-4 w-4 mr-1" />
                Nearby
              </Button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
