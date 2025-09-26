import { ServiceRequestCard } from "../ServiceRequestCard";
import mechanicAvatar from "@assets/generated_images/Professional_mechanic_avatar_53e71776.png";

export default function ServiceRequestCardExample() {
  const handleAction = (action: string, id: string) => {
    console.log(`${action} triggered for service ${id}`);
  };

  //TODO: remove mock functionality
  const mockServices = [
    {
      id: "service-001",
      serviceType: "tow" as const,
      status: "pending" as const,
      fromAddress: "Rua das Flores, 123 - Vila Madalena, São Paulo",
      toAddress: "Oficina AutoCare - Rua Augusta, 456",
      description: "Carro não liga após tempestade. Bateria pode estar descarregada.",
      requestTime: "Há 5 minutos",
      estimatedPrice: "R$ 120,00",
      distance: "2.3 km",
      viewType: "provider" as const,
    },
    {
      id: "service-002", 
      serviceType: "mechanic" as const,
      status: "accepted" as const,
      fromAddress: "Av. Paulista, 1000 - Bela Vista, São Paulo",
      description: "Pneu furado no meio da Paulista. Preciso trocar urgente.",
      requestTime: "Há 15 minutos",
      providerName: "Carlos Silva",
      providerAvatar: mechanicAvatar,
      providerRating: 4.8,
      estimatedArrival: "10 min",
      estimatedPrice: "R$ 80,00",
      viewType: "client" as const,
    },
    {
      id: "service-003",
      serviceType: "emergency" as const,
      status: "in-transit" as const,
      fromAddress: "Marginal Pinheiros, km 15 - Sentido Interior",
      toAddress: "Hospital São Luiz - Unidade Morumbi",
      description: "Acidente leve, carro bateu na mureta. Preciso de guincho urgente.",
      requestTime: "Há 3 minutos",
      providerName: "João Mecânico",
      providerAvatar: mechanicAvatar,
      providerRating: 4.9,
      estimatedArrival: "5 min",
      viewType: "client" as const,
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold">Service Request Cards</h2>
      
      {mockServices.map((service) => (
        <ServiceRequestCard
          key={service.id}
          {...service}
          onAccept={() => handleAction("Accept", service.id)}
          onReject={() => handleAction("Reject", service.id)}
          onChat={() => handleAction("Chat", service.id)}
          onCall={() => handleAction("Call", service.id)}
        />
      ))}
    </div>
  );
}