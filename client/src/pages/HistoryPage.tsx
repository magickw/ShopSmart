import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import HistoryItem from "@/components/product/HistoryItem";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import LoadingSpinner from "@/components/ui/loading-spinner";
import ErrorDisplay from "@/components/ui/error-display";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { ScanHistory, ProductResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function HistoryPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: historyItems, isLoading, error } = useQuery<ScanHistory[]>({
    queryKey: ["/api/history"],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      
      // Add auth token if available
      const token = localStorage.getItem("authToken");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/history", { headers });
      if (!response.ok) {
        throw new Error("Failed to fetch history");
      }
      return response.json();
    },
  });
  
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/history/clear");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
      toast({
        title: "History cleared",
        description: "Your scan history has been cleared",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear history",
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
  
  const handleClearHistory = () => {
    clearHistoryMutation.mutate();
  };
  
  return (
    <>
      <Header 
        title="Scan History"
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
            title="Error Loading History"
            message="We encountered a problem loading your scan history."
            onRetry={() => queryClient.invalidateQueries({ queryKey: ["/api/history"] })}
          />
        ) : (
          <>
            {historyItems && historyItems.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                <div className="divide-y divide-neutral-200">
                  {historyItems.map((item) => (
                    <HistoryItem 
                      key={item.id}
                      item={item}
                      onView={() => handleViewItem(item.barcode)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <span className="material-icons text-neutral-400 text-5xl mb-4">history</span>
                <h3 className="text-lg font-medium text-neutral-800 mb-2">No Scan History</h3>
                <p className="text-neutral-600 mb-6">You haven't scanned any products yet. Start scanning to build your history.</p>
                <Button
                  variant="default"
                  onClick={handleBackClick}
                >
                  Start Scanning
                </Button>
              </div>
            )}
            
            {historyItems && historyItems.length > 0 && (
              <div className="text-center mt-2 mb-8">
                <Button 
                  variant="link" 
                  className="text-primary text-sm font-medium"
                  onClick={handleClearHistory}
                  disabled={clearHistoryMutation.isPending}
                >
                  {clearHistoryMutation.isPending ? "Clearing..." : "Clear All History"}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
