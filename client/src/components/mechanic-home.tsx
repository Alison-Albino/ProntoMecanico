import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocation } from 'wouter';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Wrench, Truck, AlertCircle } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetch-with-auth';
import { getBrandLabel } from '@shared/vehicles';

export function MechanicHome() {
  const { user, token, updateUser } = useAuth();
  const [, setLocation] = useLocation();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const { toast } = useToast();

  const isOnline = user?.isOnline || false;

  useEffect(() => {
    const handleWebSocketMessage = (event: any) => {
      const data = event.detail;
      
      if (data.type === 'mechanic_arrived') {
        toast({
          title: "Mecânico chegou!",
          description: "O mecânico chegou no local",
        });
      }

      if (data.type === 'service_request_cancelled' && data.data) {
        setPendingRequests(prev => prev.filter(req => req.id !== data.data.id));
        toast({
          title: "Chamada cancelada",
          description: "O cliente cancelou a chamada",
          variant: "destructive",
        });
      }

      if (data.type === 'service_request_accepted_by_other' && data.data) {
        setPendingRequests(prev => prev.filter(req => req.id !== data.data.id));
      }
    };

    window.addEventListener('websocket-message', handleWebSocketMessage);
    return () => window.removeEventListener('websocket-message', handleWebSocketMessage);
  }, [user, setLocation, toast]);

  useEffect(() => {
    if (user?.userType === 'mechanic') {
      if (user.baseLat && user.baseLng) {
        setUserLocation({
          lat: parseFloat(user.baseLat),
          lng: parseFloat(user.baseLng),
        });
      }
    }
  }, [user, token]);

  useEffect(() => {
    if (user?.userType === 'mechanic' && token && isOnline) {
      loadPendingRequests();
      const interval = setInterval(loadPendingRequests, 10000);
      return () => clearInterval(interval);
    }
  }, [user, token, isOnline]);

  const loadPendingRequests = async () => {
    try {
      const response = await fetchWithAuth('/api/service-requests/pending');
      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (user?.baseLat === undefined || user?.baseLat === null || user?.baseLng === undefined || user?.baseLng === null) {
      toast({
        title: "Erro",
        description: "Configure seu endereço base na página de Perfil antes de aceitar chamadas",
        variant: "destructive",
      });
      return;
    }

    try {
      const request = pendingRequests.find(r => r.id === requestId);
      if (!request) return;

      const distance = calculateDistance(
        parseFloat(user.baseLat),
        parseFloat(user.baseLng),
        parseFloat(request.pickupLat),
        parseFloat(request.pickupLng)
      );

      const response = await fetchWithAuth(`/api/service-requests/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ distance }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao aceitar chamada');
      }

      const acceptedRequest = await response.json();

      toast({
        title: "Sucesso",
        description: `Chamada aceita! Valor total: R$ ${parseFloat(acceptedRequest.totalPrice).toFixed(2)}`,
      });
      
      setLocation(`/ride/${requestId}`);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  const handleToggleOnline = async (checked: boolean) => {
    try {
      const response = await fetchWithAuth('/api/auth/toggle-online', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isOnline: checked }),
      });

      if (!response.ok) {
        throw new Error('Erro ao alterar status');
      }

      updateUser({ isOnline: checked });
      
      toast({
        title: checked ? "Online" : "Offline",
        description: checked 
          ? "Você está online e pode receber chamadas" 
          : "Você está offline e não receberá chamadas",
      });

      if (!checked) {
        setPendingRequests([]);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'mechanic': return <Wrench className="w-4 h-4" />;
      case 'tow_truck': return <Truck className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'} ${isOnline ? 'animate-pulse' : ''}`}></div>
            <span className="font-semibold text-gray-900 dark:text-white">
              {isOnline ? 'Online' : 'Offline'}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {isOnline ? '• Recebendo chamadas' : '• Não receberá chamadas'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="online-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isOnline ? 'Ficar Offline' : 'Ficar Online'}
            </Label>
            <Switch
              id="online-toggle"
              checked={isOnline}
              onCheckedChange={handleToggleOnline}
              data-testid="switch-online-status"
            />
          </div>
        </div>
      </div>
      <div className="flex-1 relative">
        <Map
          mapId="service-map"
          defaultZoom={15}
          defaultCenter={userLocation || { lat: -23.5505, lng: -46.6333 }}
          center={userLocation || { lat: -23.5505, lng: -46.6333 }}
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          fullscreenControl={false}
          streetViewControl={false}
          mapTypeControl={false}
          mapTypeId="roadmap"
          style={{ width: '100%', height: '100%' }}
          data-testid="map-container"
        >
          {userLocation && (
            <AdvancedMarker 
              position={userLocation}
              title="Seu endereço base"
            >
              <div className="relative">
                <div className="w-12 h-12 bg-black dark:bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white dark:border-black">
                  <div className="w-3 h-3 bg-white dark:bg-black rounded-full"></div>
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-black dark:border-t-white"></div>
              </div>
            </AdvancedMarker>
          )}
          
          {pendingRequests.map((request) => (
            <AdvancedMarker
              key={request.id}
              position={{
                lat: parseFloat(request.pickupLat),
                lng: parseFloat(request.pickupLng),
              }}
              title={`Chamada - ${request.serviceType}`}
            >
              <div className="relative animate-pulse">
                <div className="w-10 h-10 bg-red-500 rounded-full shadow-xl flex items-center justify-center border-2 border-white">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div className="absolute inset-0 w-10 h-10 bg-red-500 rounded-full animate-ping opacity-75"></div>
              </div>
            </AdvancedMarker>
          ))}
        </Map>

        {isOnline && pendingRequests.length > 0 && (
          <div className="absolute top-4 right-4 z-10 space-y-2 max-w-sm">
            {pendingRequests.map((request) => (
              <Card key={request.id} data-testid={`card-request-${request.id}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Nova Chamada
                  </CardTitle>
                  {getServiceIcon(request.serviceType)}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {request.pickupAddress}
                  </p>
                  {request.vehicleBrand && request.vehicleModel && (
                    <p className="text-sm mb-2">
                      <strong>Veículo:</strong> {getBrandLabel(request.vehicleBrand)} {request.vehicleModel}
                      {request.vehicleYear && ` ${request.vehicleYear}`}
                      {request.vehiclePlate && ` • ${request.vehiclePlate}`}
                    </p>
                  )}
                  {request.description && (
                    <p className="text-sm mb-2">{request.description}</p>
                  )}
                  {userLocation && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Distância: ~{calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        parseFloat(request.pickupLat),
                        parseFloat(request.pickupLng)
                      ).toFixed(1)} km
                    </p>
                  )}
                  <Button
                    onClick={() => handleAcceptRequest(request.id)}
                    className="w-full"
                    size="sm"
                    data-testid={`button-accept-${request.id}`}
                  >
                    Aceitar Chamada
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
