import { useLocation } from "wouter";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="bg-white border-t border-neutral-200 py-2 px-4">
      <div className="flex justify-around">
        <button 
          onClick={() => onTabChange("scan")} 
          className={`flex flex-col items-center p-2 ${activeTab === "scan" ? "text-primary" : "text-neutral-500"}`}
        >
          <span className="material-icons">qr_code_scanner</span>
          <span className="text-xs mt-1">Scan</span>
        </button>
        <button 
          onClick={() => onTabChange("history")} 
          className={`flex flex-col items-center p-2 ${activeTab === "history" ? "text-primary" : "text-neutral-500"}`}
        >
          <span className="material-icons">history</span>
          <span className="text-xs mt-1">History</span>
        </button>
        <button 
          onClick={() => onTabChange("saved")} 
          className={`flex flex-col items-center p-2 ${activeTab === "saved" ? "text-primary" : "text-neutral-500"}`}
        >
          <span className="material-icons">favorite_border</span>
          <span className="text-xs mt-1">Saved</span>
        </button>
        <button 
          onClick={() => onTabChange("settings")} 
          className={`flex flex-col items-center p-2 ${activeTab === "settings" ? "text-primary" : "text-neutral-500"}`}
        >
          <span className="material-icons">settings</span>
          <span className="text-xs mt-1">Settings</span>
        </button>
      </div>
    </nav>
  );
}
