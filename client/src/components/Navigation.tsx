import { Home, MessageSquare, MapPin, User, Wrench, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NavigationProps {
  userType: "client" | "provider";
  activeTab: string;
  onTabChange: (tab: string) => void;
  unreadMessages?: number;
}

export function Navigation({ userType, activeTab, onTabChange, unreadMessages = 0 }: NavigationProps) {
  const clientTabs = [
    { id: "home", label: "Início", icon: Home },
    { id: "requests", label: "Pedidos", icon: Wrench },
    { id: "map", label: "Mapa", icon: MapPin },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "profile", label: "Perfil", icon: User },
  ];

  const providerTabs = [
    { id: "dashboard", label: "Painel", icon: Home },
    { id: "available", label: "Disponíveis", icon: Wrench },
    { id: "active", label: "Ativo", icon: MapPin },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "profile", label: "Perfil", icon: User },
  ];

  const tabs = userType === "client" ? clientTabs : providerTabs;

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center space-x-2">
          <Wrench className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Pronto Mecânico</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => onTabChange(tab.id)}
                className="relative"
                data-testid={`nav-${tab.id}`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
                {tab.id === "chat" && unreadMessages > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-service-notification">
                    {unreadMessages}
                  </Badge>
                )}
              </Button>
            );
          })}
          
          <Button variant="destructive" size="sm" data-testid="emergency-call">
            <Phone className="h-4 w-4 mr-2" />
            Emergência
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                  activeTab === tab.id ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid={`mobile-nav-${tab.id}`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {tab.id === "chat" && unreadMessages > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs bg-service-notification">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </Badge>
                  )}
                </div>
                <span className="text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}