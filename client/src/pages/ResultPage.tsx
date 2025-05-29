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
import { useToast } from "@/hooks/use-toast";

export default function ResultPage() {
  const { barcode } = useParams() as { barcode: string };
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSave = () => {
    // Save to local favorites/bookmarks
    toast({
      title: "Product Saved",
      description: "This product has been saved to your favorites",
    });
  };

  const handleShare = async () => {
    if (productData) {
      const shareData = {
        title: productData.title,
        text: `Check out this product: ${productData.title} by ${productData.brand}`,
        url: window.location.href,
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          // Fallback to clipboard
          await navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
          toast({
            title: "Link Copied",
            description: "Product link copied to clipboard",
          });
        }
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
        toast({
          title: "Link Copied",
          description: "Product link copied to clipboard",
        });
      }
    }
  };

  const handleNearby = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast({
            title: "Finding Nearby Stores",
            description: "Searching for stores near your location...",
          });
          // In a real app, you would use the coordinates to find nearby stores
          // For now, just show a placeholder message
          setTimeout(() => {
            toast({
              title: "Feature Coming Soon",
              description: "Nearby store search will be available soon!",
            });
          }, 2000);
        },
        (error) => {
          toast({
            title: "Location Access Denied",
            description: "Please enable location access to find nearby stores",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
    }
  };

  const { data: product, isLoading, error } = useQuery<ProductResponse>({
    queryKey: [`/api/lookup/${barcode}`],
    enabled: !!barcode,
    retry: 1,
  });

  // Added productData variable to access product data in handlers
  const productData = product;

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
              <Button variant="outline" size="sm" className="flex items-center justify-center px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-700 text-sm" onClick={handleSave}>
                <BookmarkIcon className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button variant="outline" size="sm" className="flex items-center justify-center px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-700 text-sm" onClick={handleShare}>
                <Share2Icon className="h-4 w-4 mr-1" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="flex items-center justify-center px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-700 text-sm" onClick={handleNearby}>
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