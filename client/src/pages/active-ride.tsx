import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRoute, useLocation } from 'wouter';
import { APIProvider, Map, AdvancedMarker, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Wrench, Navigation, Phone, MessageCircle, MapPin, CheckCircle } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

function ActiveRideContent({ requestId }: { requestId: string }) {
  const { user, token } = useAuth();
  const [, setLocation] = useLocation();
  const [serviceRequest, setServiceRequest] = useState<any>(null);
  const [mechanicLocation, setMechanicLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeDistance, setRouteDistance] = useState<string>('');
  const [routeDuration, setRouteDuration] = useState<string>('');
  const [routePath, setRoutePath] = useState<Array<{ lat: number; lng: number }>>([]);
  const { toast } = useToast();
  const routesLibrary = useMapsLibrary('routes');

  useEffect(() => {
    if (requestId && token) {
      loadServiceRequest();
      const interval = setInterval(loadServiceRequest, 5000);
      return () => clearInterval(interval);
    }
  }, [requestId, token]);

  useEffect(() => {
    if (serviceRequest && user?.userType === 'mechanic') {
      updateMechanicLocation();
      const interval = setInterval(updateMechanicLocation, 10000);
      return () => clearInterval(interval);
    }
  }, [serviceRequest, user]);

  useEffect(() => {
    if (serviceRequest && mechanicLocation && routesLibrary) {
      loadDirections();
    }
  }, [serviceRequest, mechanicLocation, routesLibrary]);

  const loadServiceRequest = async () => {
    try {
      const response = await fetch(`/api/service-requests/${requestId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setServiceRequest(data);
        
        if (data.status === 'completed') {
          toast({
            title: "Serviço concluído",
            description: "Obrigado por usar nossos serviços!",
          });
          setTimeout(() => setLocation('/'), 2000);
        }
        
        if (data.mechanicId && user?.userType === 'client') {
          loadMechanicLocation(data.mechanicId);
        }
      }
    } catch (error) {
      console.error('Error loading service request:', error);
    }
  };

  const loadMechanicLocation = async (mechanicId: string) => {
    try {
      const response = await fetch(`/api/users/${mechanicId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const mechanic = await response.json();
        if (mechanic.currentLat && mechanic.currentLng) {
          setMechanicLocation({
            lat: parseFloat(mechanic.currentLat),
            lng: parseFloat(mechanic.currentLng),
          });
        }
      }
    } catch (error) {
      console.error('Error loading mechanic location:', error);
    }
  };

  const updateMechanicLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMechanicLocation(location);
          
          await fetch('/api/location/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(location),
          });
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    }
  };

  const loadDirections = async () => {
    if (!mechanicLocation || !serviceRequest || !routesLibrary) return;

    try {
      const directionsService = new routesLibrary.DirectionsService();
      
      const result = await directionsService.route({
        origin: new google.maps.LatLng(mechanicLocation.lat, mechanicLocation.lng),
        destination: new google.maps.LatLng(
          parseFloat(serviceRequest.pickupLat),
          parseFloat(serviceRequest.pickupLng)
        ),
        travelMode: google.maps.TravelMode.DRIVING,
      });
      
      if (result.routes && result.routes.length > 0) {
        const route = result.routes[0];
        const leg = route.legs[0];
        
        setRouteDistance(leg.distance?.text || '');
        setRouteDuration(leg.duration?.text || '');
        
        const path: Array<{ lat: number; lng: number }> = [];
        route.overview_path.forEach((point: any) => {
          path.push({
            lat: point.lat(),
            lng: point.lng(),
          });
        });
        setRoutePath(path);
      }
    } catch (error) {
      console.error('Error loading directions:', error);
    }
  };

  const handleArrived = async () => {
    try {
      const response = await fetch(`/api/service-requests/${requestId}/arrived`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao marcar chegada');

      toast({
        title: "Chegada registrada",
        description: "Cliente foi notificado da sua chegada",
      });

      loadServiceRequest();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleComplete = async () => {
    try {
      const response = await fetch(`/api/service-requests/${requestId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao finalizar serviço');

      toast({
        title: "Serviço finalizado",
        description: "Você receberá o pagamento em sua carteira",
      });

      setLocation('/');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!serviceRequest || !mechanicLocation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const clientLocation = {
    lat: parseFloat(serviceRequest.pickupLat),
    lng: parseFloat(serviceRequest.pickupLng),
  };

  const mapCenter = user?.userType === 'mechanic' ? mechanicLocation : clientLocation;

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 relative">
        <Map
          defaultCenter={mapCenter}
          defaultZoom={16}
          mapId="active-ride-map"
          gestureHandling="greedy"
          mapTypeId="roadmap"
          style={{ width: '100%', height: '100%' }}
          data-testid="map-active-ride"
        >
          <AdvancedMarker
            position={mechanicLocation}
            title="Mecânico"
          >
            <div className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg">
              <Wrench className="w-6 h-6" />
            </div>
          </AdvancedMarker>

          <AdvancedMarker
            position={clientLocation}
            title="Cliente"
          >
            <div className="bg-destructive text-destructive-foreground p-3 rounded-full shadow-lg">
              <MapPin className="w-6 h-6" />
            </div>
          </AdvancedMarker>

          {routePath.length > 1 && routePath.map((point, index) => (
            <AdvancedMarker
              key={index}
              position={point}
            >
              <div className="w-1 h-1 bg-primary rounded-full opacity-70" />
            </AdvancedMarker>
          ))}
        </Map>

        <Card className="absolute top-4 left-4 right-4 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {user?.userType === 'mechanic' ? 'Indo para o cliente' : 'Mecânico a caminho'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {routeDistance && routeDuration && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  <span className="font-medium">{routeDistance}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span className="font-medium">{routeDuration}</span>
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>{serviceRequest.pickupAddress}</span>
              </div>
            </div>

            {serviceRequest.description && (
              <div className="text-sm">
                <strong>Problema:</strong> {serviceRequest.description}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {user?.userType === 'mechanic' && serviceRequest.status === 'accepted' && (
                <Button onClick={handleArrived} className="flex-1" data-testid="button-arrived">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Cheguei
                </Button>
              )}
              
              {user?.userType === 'mechanic' && serviceRequest.status === 'arrived' && (
                <Button onClick={handleComplete} className="flex-1" data-testid="button-complete">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Finalizar Serviço
                </Button>
              )}

              <Button variant="outline" size="icon" data-testid="button-call">
                <Phone className="w-4 h-4" />
              </Button>
              
              <Button variant="outline" size="icon" data-testid="button-message">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ActiveRidePage() {
  const [, params] = useRoute('/ride/:id');

  if (!params?.id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Chamada não encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <ActiveRideContent requestId={params.id} />
    </APIProvider>
  );
}
