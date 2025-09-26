import { useState } from "react";
import { ProviderDashboard } from "../ProviderDashboard";

export default function ProviderDashboardExample() {
  const [isOnline, setIsOnline] = useState(true);
  const [activeService, setActiveService] = useState<{
    id: string;
    clientName: string;
    serviceType: "tow" | "mechanic" | "emergency";
    fromLocation: string;
    toLocation?: string;
    description: string;
    status: "accepted" | "in-transit" | "working";
    startTime: string;
    estimatedCompletion: string;
  } | undefined>({
    id: "service-active-001",
    clientName: "Ana Santos",
    serviceType: "mechanic",
    fromLocation: "Rua das Flores, 123 - Vila Madalena, São Paulo",
    toLocation: undefined,
    description: "Pneu furado na rua. Preciso trocar o pneu do carro.",
    status: "in-transit",
    startTime: "14:30",
    estimatedCompletion: "15:30",
  });

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
    {
      id: "req-003",
      clientName: "Carlos Santos",
      serviceType: "mechanic" as const,
      location: "Rua Augusta, 500 - Consolação, São Paulo",
      description: "Motor esquentando muito. Pode ser problema no radiador.",
      distance: "2.1 km", 
      estimatedPay: "R$ 120,00",
      urgency: "low" as const,
      requestTime: "Há 8 min",
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
    <div className="p-6 max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">Provider Dashboard</h2>
      
      <ProviderDashboard
        providerName="Carlos Mecânico"
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