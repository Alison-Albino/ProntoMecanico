import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocation } from 'wouter';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Wrench, Truck, AlertCircle, MapPin, Loader2 } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export default function HomePage() {
  const { user, token, updateUser } = useAuth();
  const [, setLocation] = useLocation();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [serviceType, setServiceType] = useState<string>('mechanic');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [nearbyMechanics, setNearbyMechanics] = useState<any[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const { toast } = useToast();

  const isOnline = user?.isOnline || false;

  useEffect(() => {
    const handleWebSocketMessage = (event: any) => {
      const data = event.detail;
      
      if (data.type === 'service_request_accepted' && user?.userType === 'client') {
        toast({
          title: "Mecânico encontrado!",
          description: `${data.mechanic.fullName} aceitou sua chamada`,
        });
        
        setTimeout(() => {
          setLocation(`/ride/${data.data.id}`);
        }, 1500);
      }
      
      if (data.type === 'mechanic_arrived') {
        toast({
          title: "Mecânico chegou!",
          description: "O mecânico chegou no local",
        });
      }
    };

    window.addEventListener('websocket-message', handleWebSocketMessage);
    return () => window.removeEventListener('websocket-message', handleWebSocketMessage);
  }, [user, setLocation, toast]);

  useEffect(() => {
    getCurrentLocation();
  }, [token]);

  useEffect(() => {
    if (user?.userType === 'mechanic' && token && isOnline) {
      loadPendingRequests();
      const interval = setInterval(loadPendingRequests, 10000);
      return () => clearInterval(interval);
    }
  }, [user, token, isOnline]);

  useEffect(() => {
    if (user?.userType === 'client' && userLocation && token) {
      loadNearbyMechanics();
      const interval = setInterval(loadNearbyMechanics, 15000);
      return () => clearInterval(interval);
    }
  }, [user, userLocation, token]);


  const loadNearbyMechanics = async () => {
    if (!userLocation) return;
    
    try {
      const response = await fetch(
        `/api/mechanics/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=20`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const mechanics = await response.json();
        setNearbyMechanics(mechanics);
      }
    } catch (error) {
      console.error('Erro ao carregar mecânicos:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          
          await reverseGeocode(location.lat, location.lng);
          
          if (token) {
            fetch('/api/location/update', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(location),
            }).catch(console.error);
          }
          
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLoadingLocation(false);
          
          let errorMessage = "Não foi possível obter sua localização";
          if (error.code === 1) {
            errorMessage = "Permissão de localização negada. Por favor, permita o acesso à localização nas configurações do navegador.";
          } else if (error.code === 2) {
            errorMessage = "Localização indisponível. Verifique se o GPS está ativado.";
          } else if (error.code === 3) {
            errorMessage = "Tempo esgotado ao tentar obter localização.";
          }
          
          toast({
            title: "Erro de localização",
            description: errorMessage,
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      toast({
        title: "Erro",
        description: "Seu navegador não suporta geolocalização",
        variant: "destructive",
      });
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!GOOGLE_MAPS_API_KEY) return;
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setAddress(data.results[0].formatted_address);
      }
    } catch (error) {
      console.error('Erro ao obter endereço:', error);
    }
  };

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
        description: "Localização não disponível. Clique no ícone de localização para obter sua posição.",
        variant: "destructive",
      });
      return;
    }

    if (!address.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o endereço",
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
          clientId: user?.id,
          serviceType,
          pickupLat: userLocation.lat.toString(),
          pickupLng: userLocation.lng.toString(),
          pickupAddress: address,
          description: description || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar chamada');
      }

      toast({
        title: "Sucesso",
        description: "Chamada criada com sucesso! Aguardando mecânico aceitar.",
      });
      
      setIsRequestDialogOpen(false);
      setDescription('');
    } catch (error: any) {
      console.error('Error creating request:', error);
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
      const response = await fetch('/api/auth/toggle-online', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
      {user?.userType === 'mechanic' && (
        <div className="bg-card border-b p-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="font-medium">
                {isOnline ? 'Online - Recebendo Chamadas' : 'Offline - Não Receberá Chamadas'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="online-toggle" className="text-sm">
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
      )}
      <div className="flex-1 relative">
        {userLocation ? (
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <Map
              mapId="service-map"
              defaultZoom={16}
              defaultCenter={userLocation}
              center={userLocation}
              gestureHandling="greedy"
              disableDefaultUI={false}
              mapTypeId="roadmap"
              style={{ width: '100%', height: '100%' }}
              data-testid="map-container"
            >
              <AdvancedMarker 
                position={userLocation}
                title={user?.userType === 'client' ? 'Sua localização' : 'Você'}
              />
              
              {user?.userType === 'client' && nearbyMechanics.map((mechanic) => (
                mechanic.currentLat && mechanic.currentLng && (
                  <AdvancedMarker
                    key={mechanic.id}
                    position={{
                      lat: parseFloat(mechanic.currentLat),
                      lng: parseFloat(mechanic.currentLng),
                    }}
                    title={`${mechanic.fullName} - ⭐ ${parseFloat(mechanic.rating || '5').toFixed(1)}`}
                  >
                    <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-lg">
                      <Wrench className="w-5 h-5" />
                    </div>
                  </AdvancedMarker>
                )
              ))}
              
              {user?.userType === 'mechanic' && pendingRequests.map((request) => (
                <AdvancedMarker
                  key={request.id}
                  position={{
                    lat: parseFloat(request.pickupLat),
                    lng: parseFloat(request.pickupLng),
                  }}
                  title={`Chamada - ${request.serviceType}`}
                >
                  <div className="bg-destructive text-destructive-foreground p-2 rounded-full shadow-lg animate-pulse">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </AdvancedMarker>
              ))}
            </Map>
          </APIProvider>
        ) : (
          <div className="flex items-center justify-center h-full bg-muted">
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  Obtendo sua localização...
                </p>
                <Button onClick={getCurrentLocation} variant="outline" size="sm">
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {user?.userType === 'client' && nearbyMechanics.length > 0 && (
          <div className="absolute top-4 left-4 z-10">
            <Card className="shadow-lg">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="bg-green-100 p-2 rounded-full">
                  <Wrench className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{nearbyMechanics.length} mecânico{nearbyMechanics.length > 1 ? 's' : ''} online</p>
                  <p className="text-xs text-muted-foreground">Próximos a você</p>
                </div>
              </CardContent>
            </Card>
          </div>
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
                  <DialogDescription>
                    Preencha os dados para solicitar um serviço
                  </DialogDescription>
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
                    <div className="flex gap-2">
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        data-testid="input-address"
                        placeholder="Digite o endereço ou use o botão de localização"
                        required
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={getCurrentLocation}
                        disabled={isLoadingLocation}
                        data-testid="button-get-location"
                        title="Obter minha localização atual"
                      >
                        {isLoadingLocation ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <MapPin className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {userLocation && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Lat: {userLocation.lat.toFixed(6)}, Lng: {userLocation.lng.toFixed(6)}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição do Problema</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      data-testid="input-description"
                      placeholder="Descreva o problema (opcional)"
                    />
                  </div>

                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    <p className="font-semibold mb-1">Valores:</p>
                    <p>• Taxa de acionamento: R$ 50,00</p>
                    <p>• Taxa por km rodado: R$ 6,00/km</p>
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

        {user?.userType === 'mechanic' && isOnline && pendingRequests.length > 0 && (
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
