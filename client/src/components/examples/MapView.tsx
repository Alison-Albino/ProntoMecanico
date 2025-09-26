import { MapView } from "../MapView";
import mechanicAvatar from "@assets/generated_images/Professional_mechanic_avatar_53e71776.png";

export default function MapViewExample() {
  const handleAction = (action: string) => {
    console.log(`${action} triggered`);
  };

  // TODO: remove mock functionality
  const mockLocations = {
    currentLocation: {
      id: "client-current",
      name: "Cliente",
      type: "client" as const,
      latitude: -23.550520,
      longitude: -46.633308,
      address: "Rua das Flores, 123 - Vila Madalena, São Paulo, SP",
    },
    providerLocation: {
      id: "provider-carlos",
      name: "Carlos Silva",
      type: "provider" as const,
      latitude: -23.545520,
      longitude: -46.643308,
      address: "Av. Paulista, 1000",
      avatar: mechanicAvatar,
      status: "in-transit" as const,
      estimatedArrival: "8 minutos",
    },
    destinationLocation: {
      id: "destination",
      name: "Oficina AutoCare",
      type: "destination" as const,
      latitude: -23.552520,
      longitude: -46.623308,
      address: "Rua Augusta, 456 - Consolação, São Paulo, SP",
    },
  };

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">Map View</h2>
      
      <MapView
        currentLocation={mockLocations.currentLocation}
        providerLocation={mockLocations.providerLocation}
        destinationLocation={mockLocations.destinationLocation}
        serviceId="service-123"
        onCallProvider={() => handleAction("Call Provider")}
        onShareLocation={() => handleAction("Share Location")}
      />
    </div>
  );
}