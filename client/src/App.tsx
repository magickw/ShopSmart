import { Switch, Route } from "wouter";
import ScannerPage from "@/pages/ScannerPage";
import ResultPage from "@/pages/ResultPage";
import HistoryPage from "@/pages/HistoryPage";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/not-found";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { User, UserPlus, LogOut, Settings, Scan, History, BookmarkCheck } from "lucide-react";

function App() {
  const [activeTab, setActiveTab] = useState("scan");
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  // Sync navigation state with current route
  useEffect(() => {
    if (location === "/") setActiveTab("scan");
    else if (location === "/history") setActiveTab("history");
    else if (location.startsWith("/result")) setActiveTab("scan");
    else if (location === "/auth") setActiveTab("profile");
  }, [location]);

  const handleNavChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "scan") setLocation("/");
    else if (tab === "history") setLocation("/history");
    else if (tab === "profile") setLocation("/auth");
  };

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">
      <div className="flex-1 flex flex-col">
        <Switch>
          <Route path="/" component={ScannerPage} />
          <Route path="/result/:barcode" component={ResultPage} />
          <Route path="/history" component={HistoryPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
      
      <nav className="bg-white border-t border-neutral-200 py-2 px-4">
        <div className="flex justify-around">
          <button 
            onClick={() => handleNavChange("scan")} 
            className={`flex flex-col items-center p-2 ${activeTab === "scan" ? "text-primary" : "text-neutral-500"}`}
          >
            <span className="material-icons">qr_code_scanner</span>
            <span className="text-xs mt-1">Scan</span>
          </button>
          <button 
            onClick={() => handleNavChange("history")} 
            className={`flex flex-col items-center p-2 ${activeTab === "history" ? "text-primary" : "text-neutral-500"}`}
          >
            <span className="material-icons">history</span>
            <span className="text-xs mt-1">History</span>
          </button>
          <button 
            className="flex flex-col items-center p-2 text-neutral-500"
          >
            <span className="material-icons">favorite_border</span>
            <span className="text-xs mt-1">Saved</span>
          </button>
          <button 
            className="flex flex-col items-center p-2 text-neutral-500"
          >
            <span className="material-icons">settings</span>
            <span className="text-xs mt-1">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
