import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Wrench, Truck, AlertCircle } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export default function HomePage() {
  const { user, token } = useAuth();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [serviceType, setServiceType] = useState<string>('mechanic');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          
          if (token) {
            fetch('/api/location/update', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(location),
            });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast({
            title: "Erro de localização",
            description: "Não foi possível obter sua localização",
            variant: "destructive",
          });
        }
      );
    }
  }, [token, toast]);

  useEffect(() => {
    if (user?.userType === 'mechanic' && token) {
      loadPendingRequests();
      const interval = setInterval(loadPendingRequests, 10000);
      return () => clearInterval(interval);
    }
  }, [user, token]);

  const loadPendingRequests = async () => {
    try {
      const response = await fetch('/api/service-requests/pending', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const handleCreateRequest = async () => {
    if (!userLocation) {
      toast({
        title: "Erro",
        description: "Localização não disponível",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/service-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceType,
          pickupLat: userLocation.lat,
          pickupLng: userLocation.lng,
          pickupAddress: address,
          description,
          status: 'pending',
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar chamada');
      }

      toast({
        title: "Sucesso",
        description: "Chamada criada com sucesso",
      });
      
      setIsRequestDialogOpen(false);
      setDescription('');
      setAddress('');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!userLocation) {
      toast({
        title: "Erro",
        description: "Localização não disponível",
        variant: "destructive",
      });
      return;
    }

    try {
      const request = pendingRequests.find(r => r.id === requestId);
      if (!request) return;

      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        parseFloat(request.pickupLat),
        parseFloat(request.pickupLng)
      );

      const response = await fetch(`/api/service-requests/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ distance }),
      });

      if (!response.ok) {
        throw new Error('Erro ao aceitar chamada');
      }

      toast({
        title: "Sucesso",
        description: "Chamada aceita com sucesso",
      });
      
      loadPendingRequests();
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

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'mechanic': return <Wrench className="w-4 h-4" />;
      case 'tow_truck': return <Truck className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Configure VITE_GOOGLE_MAPS_API_KEY nas variáveis de ambiente
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative">
        {userLocation && (
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <Map
              defaultZoom={14}
              defaultCenter={userLocation}
              gestureHandling="greedy"
              disableDefaultUI={false}
              style={{ width: '100%', height: '100%' }}
              data-testid="map-container"
            >
              <AdvancedMarker position={userLocation} />
              
              {pendingRequests.map((request) => (
                <AdvancedMarker
                  key={request.id}
                  position={{
                    lat: parseFloat(request.pickupLat),
                    lng: parseFloat(request.pickupLng),
                  }}
                />
              ))}
            </Map>
          </APIProvider>
        )}

        {user?.userType === 'client' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" data-testid="button-new-request">
                  Solicitar Serviço
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Solicitação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Tipo de Serviço</Label>
                    <Select value={serviceType} onValueChange={setServiceType}>
                      <SelectTrigger data-testid="select-service-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mechanic">Mecânico</SelectItem>
                        <SelectItem value="tow_truck">Guincho</SelectItem>
                        <SelectItem value="road_assistance">Assistência na Estrada</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      data-testid="input-address"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição do Problema</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      data-testid="input-description"
                    />
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>Taxa de acionamento: R$ 50,00</p>
                    <p>Taxa por km: R$ 6,00</p>
                  </div>

                  <Button 
                    onClick={handleCreateRequest} 
                    className="w-full"
                    data-testid="button-submit-request"
                  >
                    Solicitar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {user?.userType === 'mechanic' && pendingRequests.length > 0 && (
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
                  {request.description && (
                    <p className="text-sm mb-2">{request.description}</p>
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
