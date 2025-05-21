import { useLocation } from "wouter";

interface HeaderProps {
  title?: string;
  showHistory?: boolean;
  onHistoryClick?: () => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export default function Header({ 
  title = "PriceScan", 
  showHistory = true, 
  onHistoryClick, 
  showBackButton = false,
  onBackClick
}: HeaderProps) {
  const [_, setLocation] = useLocation();

  const handleHistoryClick = () => {
    if (onHistoryClick) {
      onHistoryClick();
    } else {
      setLocation("/history");
    }
  };

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      setLocation("/");
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-white shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          {showBackButton ? (
            <button 
              onClick={handleBackClick}
              className="mr-2 p-1 rounded-full hover:bg-neutral-200"
            >
              <span className="material-icons text-neutral-600">arrow_back</span>
            </button>
          ) : (
            <span className="material-icons text-primary mr-2">qr_code_scanner</span>
          )}
          <h1 className="text-xl font-bold text-neutral-800">{title}</h1>
        </div>
        {showHistory && (
          <div>
            <button 
              onClick={handleHistoryClick}
              className="p-2 rounded-full hover:bg-neutral-200"
            >
              <span className="material-icons text-neutral-600">history</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
