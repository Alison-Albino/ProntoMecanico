import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";

// Import all components for the prototype
import { LoginScreen } from "@/components/LoginScreen";
import { Navigation } from "@/components/Navigation";
import { ServiceRequestForm } from "@/components/ServiceRequestForm";
import { ServiceRequestCard } from "@/components/ServiceRequestCard";
import { ChatInterface } from "@/components/ChatInterface";
import { MapView } from "@/components/MapView";
import { ProviderDashboard } from "@/components/ProviderDashboard";

// Import images
import mechanicAvatar from "@assets/generated_images/Professional_mechanic_avatar_53e71776.png";

interface User {
  id: string;
  name: string;
  email: string;
  type: "client" | "provider";
}

function ClientDashboard({ user, activeTab, onTabChange }: { 
  user: User; 
  activeTab: string; 
  onTabChange: (tab: string) => void;
}) {
  const [showRequestForm, setShowRequestForm] = useState(false);
  
  // TODO: remove mock functionality
  const mockServices = [
    {
      id: "service-001",
      serviceType: "mechanic" as const,
      status: "accepted" as const,
      fromAddress: "Rua das Flores, 123 - Vila Madalena, São Paulo",
      description: "Pneu furado no meio da rua. Preciso trocar urgente.",
      requestTime: "Há 15 minutos",
      providerName: "Carlos Silva",
      providerAvatar: mechanicAvatar,
      providerRating: 4.8,
      estimatedArrival: "10 min",
      estimatedPrice: "R$ 80,00",
      viewType: "client" as const,
    },
  ];

  const mockMessages = [
    {
      id: "1",
      senderId: "provider-123",
      senderName: "Carlos Silva", 
      content: "Olá! Estou a caminho do seu local. Chego em 10 minutos.",
      timestamp: "14:30",
      type: "text" as const,
    },
    {
      id: "2",
      senderId: user.id,
      senderName: user.name,
      content: "Perfeito! Estarei aguardando próximo ao poste azul.",
      timestamp: "14:32", 
      type: "text" as const,
    },
  ];

  const mockCurrentLocation = {
    id: "client-current",
    name: "Cliente",
    type: "client" as const,
    latitude: -23.550520,
    longitude: -46.633308,
    address: "Rua das Flores, 123 - Vila Madalena, São Paulo, SP",
  };

  const mockProviderLocation = {
    id: "provider-carlos",
    name: "Carlos Silva",
    type: "provider" as const, 
    latitude: -23.545520,
    longitude: -46.643308,
    address: "Av. Paulista, 1000",
    avatar: mechanicAvatar,
    status: "in-transit" as const,
    estimatedArrival: "8 minutos",
  };

  const handleAction = (action: string, id?: string) => {
    console.log(`${action} triggered`, id ? `for ${id}` : '');
  };

  const handleSendMessage = (content: string) => {
    console.log("Sending message:", content);
  };

  const handleRequestSubmit = (requestData: any) => {
    console.log("Service request submitted:", requestData);
    setShowRequestForm(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold mb-4">Bem-vindo, {user.name}!</h2>
              <p className="text-muted-foreground mb-6">
                Precisa de ajuda com seu veículo? Solicite um serviço agora.
              </p>
              <button
                onClick={() => setShowRequestForm(true)}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover-elevate"
                data-testid="request-service-button"
              >
                Solicitar Serviço
              </button>
            </div>
            
            {showRequestForm && (
              <div className="flex justify-center">
                <ServiceRequestForm
                  onSubmit={handleRequestSubmit}
                  onCancel={() => setShowRequestForm(false)}
                />
              </div>
            )}
          </div>
        );
        
      case "requests":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Meus Pedidos</h2>
            {mockServices.map((service) => (
              <ServiceRequestCard
                key={service.id}
                {...service}
                onChat={() => handleAction("Chat", service.id)}
                onCall={() => handleAction("Call", service.id)}
              />
            ))}
          </div>
        );
        
      case "map":
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Rastreamento</h2>
            <MapView
              currentLocation={mockCurrentLocation}
              providerLocation={mockProviderLocation}
              serviceId="service-001"
              onCallProvider={() => handleAction("Call Provider")}
              onShareLocation={() => handleAction("Share Location")}
            />
          </div>
        );
        
      case "chat":
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Chat</h2>
            <ChatInterface
              serviceId="service-001"
              currentUserId={user.id}
              otherParticipant={{
                id: "provider-123",
                name: "Carlos Silva",
                avatar: mechanicAvatar,
                role: "provider",
                status: "online",
              }}
              messages={mockMessages}
              onSendMessage={handleSendMessage}
              onSendLocation={() => handleAction("Send Location")}
              onCall={() => handleAction("Call")}
            />
          </div>
        );
        
      case "profile":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Perfil</h2>
            <div className="bg-card p-6 rounded-lg">
              <p><strong>Nome:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Tipo:</strong> Cliente</p>
            </div>
          </div>
        );
        
      default:
        return <div>Página não encontrada</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        userType="client"
        activeTab={activeTab}
        onTabChange={onTabChange}
        unreadMessages={2}
      />
      <main className="container mx-auto p-4 pb-20 md:pb-4">
        {renderContent()}
      </main>
    </div>
  );
}

function ProviderDashboardView({ user }: { user: User }) {
  const [isOnline, setIsOnline] = useState(true);
  const [activeService, setActiveService] = useState<any>(undefined);
  
  // TODO: remove mock functionality
  const availableRequests = [
    {
      id: "req-001",
      clientName: "João Silva",
      serviceType: "tow" as const,
      location: "Av. Paulista, 1000 - Bela Vista, São Paulo", 
      description: "Carro não liga. Bateria descarregada, preciso de guincho.",
      distance: "1.2 km",
      estimatedPay: "R$ 150,00",
      urgency: "medium" as const,
      requestTime: "Há 3 min",
    },
    {
      id: "req-002",
      clientName: "Maria Oliveira", 
      serviceType: "emergency" as const,
      location: "Marginal Pinheiros, km 18 - Sentido Interior",
      description: "Acidente leve, carro bateu na mureta. Preciso de guincho urgente.",
      distance: "3.8 km",
      estimatedPay: "R$ 280,00",
      urgency: "high" as const,
      requestTime: "Há 1 min",
    },
  ];

  const handleAction = (action: string, id?: string) => {
    console.log(`${action} triggered`, id ? `for ${id}` : '');
    
    if (action === "Accept" && id) {
      const request = availableRequests.find(r => r.id === id);
      if (request) {
        setActiveService({
          id: id,
          clientName: request.clientName,
          serviceType: request.serviceType,
          fromLocation: request.location,
          description: request.description,
          status: "accepted",
          startTime: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          estimatedCompletion: "Em 60 min",
        });
      }
    }
    
    if (action === "Complete") {
      setActiveService(undefined);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <ProviderDashboard
        providerName={user.name}
        isOnline={isOnline}
        onToggleStatus={setIsOnline}
        availableRequests={activeService ? [] : availableRequests}
        activeService={activeService}
        onAcceptRequest={(id) => handleAction("Accept", id)}
        onRejectRequest={(id) => handleAction("Reject", id)}
        onUpdateStatus={(status) => handleAction(`Update status to ${status}`)}
        onCompleteService={() => handleAction("Complete")}
        onChat={() => handleAction("Chat")}
        onCall={() => handleAction("Call")}
      />
    </div>
  );
}

function Router() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("home");

  const handleLogin = (credentials: { 
    email: string; 
    password: string; 
    userType: "client" | "provider" 
  }) => {
    console.log("Login successful:", credentials);
    // TODO: remove mock functionality
    setUser({
      id: "user-123",
      name: credentials.userType === "client" ? "Ana Santos" : "Carlos Mecânico",
      email: credentials.email,
      type: credentials.userType,
    });
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (user.type === "provider") {
    return <ProviderDashboardView user={user} />;
  }

  return (
    <ClientDashboard 
      user={user} 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
    />
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;