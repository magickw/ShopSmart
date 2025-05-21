import { useState } from "react";
import Header from "@/components/layout/Header";
import BarcodeScanner from "@/components/scanner/BarcodeScanner";
import ScannerOverlay from "@/components/scanner/ScannerOverlay";
import { useLocation } from "wouter";
import { useBarcode } from "@/lib/hooks/useBarcode";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function ScannerPage() {
  const [_, setLocation] = useLocation();
  const [manualBarcode, setManualBarcode] = useState("");
  const { scanBarcode, isProcessing } = useBarcode();
  
  const handleScan = async (data: string) => {
    if (data && !isProcessing) {
      await scanBarcode(data);
      setLocation(`/result/${data}`);
    }
  };
  
  const handleManualSearch = async () => {
    if (manualBarcode && !isProcessing) {
      await scanBarcode(manualBarcode);
      setLocation(`/result/${manualBarcode}`);
    }
  };

  return (
    <>
      <Header />
      
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col p-4">
          <div className="text-center mb-4">
            <h2 className="text-lg font-medium text-neutral-700">Scan a product barcode</h2>
            <p className="text-sm text-neutral-500">Position the barcode within the box below</p>
          </div>
          
          <div className="scanner-container relative mx-auto w-full bg-black rounded-xl overflow-hidden flex items-center justify-center">
            <BarcodeScanner onDetect={handleScan} />
            <ScannerOverlay />
          </div>
          
          <div className="mt-6 flex flex-col items-center">
            <Button 
              variant="default" 
              className="bg-primary text-white px-8 py-3 rounded-full font-medium shadow-md flex items-center justify-center"
              disabled={isProcessing}
              onClick={() => {
                // In a real app, this would trigger the camera to capture
                // For this example, we'll use a sample barcode
                handleScan("9780201379624");
              }}
            >
              <span className="material-icons mr-2">photo_camera</span>
              Scan Barcode
            </Button>
            
            <p className="mt-3 text-sm text-neutral-500">Or enter barcode manually</p>
            <div className="mt-2 w-full max-w-xs">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Enter barcode number"
                  className="w-full pl-4 pr-10 py-2 border border-neutral-300 rounded-lg"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleManualSearch();
                    }
                  }}
                />
                <Button 
                  variant="ghost"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary p-1 h-auto"
                  onClick={handleManualSearch}
                  disabled={!manualBarcode || isProcessing}
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
