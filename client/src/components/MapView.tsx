import { MapPin, Navigation, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LocationData {
  id: string;
  name: string;
  type: "client" | "provider" | "destination";
  latitude: number;
  longitude: number;
  address: string;
  avatar?: string;
  status?: "online" | "offline" | "in-transit";
  estimatedArrival?: string;
}

interface MapViewProps {
  currentLocation?: LocationData;
  providerLocation?: LocationData;
  destinationLocation?: LocationData;
  serviceId?: string;
  onCallProvider?: () => void;
  onShareLocation?: () => void;
}

export function MapView({
  currentLocation,
  providerLocation,
  destinationLocation,
  serviceId,
  onCallProvider,
  onShareLocation,
}: MapViewProps) {
  // TODO: Integrate with real map service (Google Maps, OpenStreetMap, etc.)
  
  return (
    <div className="space-y-4">
      {/* Map Container */}
      <Card className="h-96 md:h-[500px]">
        <CardContent className="p-0 h-full relative overflow-hidden rounded-lg">
          {/* Placeholder Map */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/20 dark:to-green-900/20">
            <div className="absolute inset-0 opacity-10">
              <svg viewBox="0 0 400 300" className="w-full h-full">
                {/* Simulated street lines */}
                <line x1="0" y1="100" x2="400" y2="100" stroke="currentColor" strokeWidth="2" />
                <line x1="0" y1="200" x2="400" y2="200" stroke="currentColor" strokeWidth="2" />
                <line x1="100" y1="0" x2="100" y2="300" stroke="currentColor" strokeWidth="2" />
                <line x1="200" y1="0" x2="200" y2="300" stroke="currentColor" strokeWidth="2" />
                <line x1="300" y1="0" x2="300" y2="300" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* Current Location Pin */}
          {currentLocation && (
            <div 
              className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: "30%", top: "70%" }}
              data-testid="current-location-pin"
            >
              <div className="relative">
                <div className="w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-card border rounded-lg px-2 py-1 shadow-lg whitespace-nowrap">
                  <p className="text-xs font-medium">Você está aqui</p>
                </div>
              </div>
            </div>
          )}

          {/* Provider Location Pin */}
          {providerLocation && (
            <div 
              className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: "50%", top: "40%" }}
              data-testid="provider-location-pin"
            >
              <div className="relative">
                <div className="w-8 h-8 bg-service-available rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <Navigation className="w-4 h-4 text-white" />
                </div>
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white dark:bg-card border rounded-lg px-2 py-1 shadow-lg">
                  <p className="text-xs font-medium">{providerLocation.name}</p>
                  {providerLocation.estimatedArrival && (
                    <p className="text-xs text-muted-foreground">
                      Chega em {providerLocation.estimatedArrival}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Destination Pin */}
          {destinationLocation && (
            <div 
              className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: "70%", top: "30%" }}
              data-testid="destination-pin"
            >
              <div className="relative">
                <div className="w-6 h-6 bg-destructive rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-white" />
                </div>
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-card border rounded-lg px-2 py-1 shadow-lg whitespace-nowrap">
                  <p className="text-xs font-medium">Destino</p>
                </div>
              </div>
            </div>
          )}

          {/* Route Line (simulated) */}
          {currentLocation && providerLocation && (
            <svg className="absolute inset-0 w-full h-full z-5">
              <line 
                x1="30%" 
                y1="70%" 
                x2="50%" 
                y2="40%" 
                stroke="rgb(59 130 246)" 
                strokeWidth="3" 
                strokeDasharray="5,5"
                className="opacity-70"
              />
            </svg>
          )}

          {/* Map Controls */}
          <div className="absolute top-4 right-4 space-y-2 z-20">
            <Button size="sm" variant="secondary" className="w-10 h-10 p-0">
              +
            </Button>
            <Button size="sm" variant="secondary" className="w-10 h-10 p-0">
              −
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Location Info Panel */}
      {providerLocation && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Prestador a Caminho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={providerLocation.avatar} />
                <AvatarFallback>
                  {providerLocation.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-medium">{providerLocation.name}</h4>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge 
                    className={`text-xs ${
                      providerLocation.status === "in-transit" 
                        ? "bg-service-transit" 
                        : "bg-service-available"
                    }`}
                  >
                    {providerLocation.status === "in-transit" ? "Em Trânsito" : "Online"}
                  </Badge>
                  {providerLocation.estimatedArrival && (
                    <span className="text-sm text-muted-foreground">
                      Chega em {providerLocation.estimatedArrival}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                {onShareLocation && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onShareLocation}
                    data-testid="share-location"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Compartilhar
                  </Button>
                )}
                {onCallProvider && (
                  <Button 
                    size="sm"
                    onClick={onCallProvider}
                    data-testid="call-provider"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Ligar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Location Card */}
      {currentLocation && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Sua localização atual</p>
                <p className="text-sm text-muted-foreground">{currentLocation.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}