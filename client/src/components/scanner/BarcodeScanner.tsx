import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface BarcodeScannerProps {
  onDetect: (data: string) => void;
}

export default function BarcodeScanner({ onDetect }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    let mounted = true;
    
    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Browser doesn't support camera access");
        }
        
        const constraints = {
          video: {
            facingMode: "environment", // Use back camera on mobile
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current && mounted) {
          videoRef.current.srcObject = stream;
          
          // In a real app, we'd set up the barcode scanning library here
          // For example with quagga.js or zbar.wasm
          
          // For this demo version, we'll just simulate barcode detection
          // We'd implement the actual barcode detection in a real app
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        toast({
          title: "Camera Error",
          description: "Could not access the camera. Please ensure you've granted camera permissions.",
          variant: "destructive",
        });
      }
    };
    
    startCamera();
    
    return () => {
      mounted = false;
      
      // Clean up video stream
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [toast]);
  
  return (
    <>
      <video 
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-80"
        autoPlay
        playsInline
        muted
      />
      <div className="absolute inset-0 bg-black opacity-10"></div>
      <div className="text-white text-center z-10">
        <span className="material-icons text-5xl mb-2 opacity-25">qr_code_scanner</span>
        <p className="text-sm opacity-70">Camera preview</p>
      </div>
    </>
  );
}
