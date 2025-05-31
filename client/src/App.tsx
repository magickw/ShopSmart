import { Switch, Route } from "wouter";
import ScannerPage from "@/pages/ScannerPage";
import ResultPage from "@/pages/ResultPage";
import HistoryPage from "@/pages/HistoryPage";
import SavedPage from "@/pages/SavedPage";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import NotFound from "@/pages/not-found";
import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { User, UserPlus, Scan, History, BookmarkCheck } from "lucide-react";

function App() {
  const [activeTab, setActiveTab] = useState("scan");
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  // Define routes and their corresponding tabs
  const routeTabMap = useMemo(
    () => ({
      "/": "scan",
      "/history": "history",
      "/saved": "saved",
      "/auth/login": "profile",
    }),
    []
  );

  // Sync navigation state with current route
  useEffect(() => {
    setActiveTab(routeTabMap[location] || "scan");
  }, [location, routeTabMap]);

  const handleNavChange = (tab: string) => {
    setActiveTab(tab);
    const route = Object.keys(routeTabMap).find((key) => routeTabMap[key] === tab);
    if (route) setLocation(route);
  };

  const Navigation = useMemo(() => (
    <nav className="bg-white border-t border-neutral-200 py-2 px-4">
      <div className="flex justify-around">
        <button
          onClick={() => handleNavChange("scan")}
          className={`flex flex-col items-center p-2 ${activeTab === "scan" ? "text-primary" : "text-neutral-500"}`}
          aria-label="Scan"
        >
          <Scan className="h-5 w-5" />
          <span className="text-xs mt-1">Scan</span>
        </button>
        <button
          onClick={() => handleNavChange("history")}
          className={`flex flex-col items-center p-2 ${activeTab === "history" ? "text-primary" : "text-neutral-500"}`}
          aria-label="History"
        >
          <History className="h-5 w-5" />
          <span className="text-xs mt-1">History</span>
        </button>
        <button
          onClick={() => handleNavChange("saved")}
          className={`flex flex-col items-center p-2 ${activeTab === "saved" ? "text-primary" : "text-neutral-500"}`}
          aria-label="Saved"
        >
          <BookmarkCheck className="h-5 w-5" />
          <span className="text-xs mt-1">Saved</span>
        </button>
        <button
          onClick={() => handleNavChange("profile")}
          className={`flex flex-col items-center p-2 ${activeTab === "profile" ? "text-primary" : "text-neutral-500"}`}
          aria-label={isAuthenticated ? "Profile" : "Sign In"}
        >
          {isAuthenticated ? (
            <>
              <User className="h-5 w-5" />
              <span className="text-xs mt-1">Profile</span>
            </>
          ) : (
            <>
              <UserPlus className="h-5 w-5" />
              <span className="text-xs mt-1">Sign In</span>
            </>
          )}
        </button>
      </div>
    </nav>
  ), [activeTab, isAuthenticated]);

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">
      <div className="flex-1 flex flex-col">
        <Switch>
          <Route path="/" component={ScannerPage} />
          <Route path="/result/:barcode" component={ResultPage} />
          <Route path="/history" component={HistoryPage} />
          <Route path="/saved" component={SavedPage} />
          <Route path="/auth/login" component={LoginForm} />
          <Route path="/auth/register" component={RegisterForm} />
          <Route component={NotFound} />
        </Switch>
      </div>
      {Navigation}
    </div>
  );
}

export default App;