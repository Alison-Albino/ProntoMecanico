import { useState } from "react";
import { Navigation } from "../Navigation";

export default function NavigationExample() {
  const [activeTab, setActiveTab] = useState("home");
  const [userType, setUserType] = useState<"client" | "provider">("client");
  
  return (
    <div className="h-screen bg-background">
      <div className="p-4 space-y-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setUserType("client")}
            className={`px-4 py-2 rounded ${userType === "client" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >
            Cliente
          </button>
          <button
            onClick={() => setUserType("provider")}
            className={`px-4 py-2 rounded ${userType === "provider" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >
            Prestador
          </button>
        </div>
        <p className="text-muted-foreground">Active tab: {activeTab}</p>
      </div>
      
      <Navigation 
        userType={userType}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadMessages={3}
      />
      
      <div className="pb-20 md:pb-0">
        <div className="p-4">
          <h3 className="text-lg font-semibold">Content Area</h3>
          <p className="text-muted-foreground">This would contain the main content for the {activeTab} tab.</p>
        </div>
      </div>
    </div>
  );
}