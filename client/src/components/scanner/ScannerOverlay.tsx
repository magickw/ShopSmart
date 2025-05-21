export default function ScannerOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-8 z-20">
      <div className="relative w-full max-w-xs aspect-square border-2 border-white rounded-lg">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
        
        {/* Scanning line animation */}
        <div className="scan-line absolute left-0 w-full h-0.5 bg-primary opacity-70"></div>
      </div>
    </div>
  );
}
