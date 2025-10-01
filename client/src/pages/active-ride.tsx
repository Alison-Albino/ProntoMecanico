import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRoute, useLocation } from 'wouter';
import { APIProvider, Map, AdvancedMarker, useMapsLibrary, useMap } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/lib/use-notifications';
import { Badge } from '@/components/ui/badge';
import { Wrench, Navigation, Phone, MessageCircle, MapPin, CheckCircle, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { fetchWithAuth } from '@/lib/fetch-with-auth';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

function RoutePolyline({ path }: { path: Array<{ lat: number; lng: number }> }) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || path.length < 2) return;

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    polylineRef.current = new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map: map,
    });

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, path]);

  return null;
}

function ActiveRideContent({ requestId }: { requestId: string }) {
  const { user, token } = useAuth();
  const [, setLocation] = useLocation();
  const [serviceRequest, setServiceRequest] = useState<any>(null);
  const [mechanicLocation, setMechanicLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeDistance, setRouteDistance] = useState<string>('');
  const [routeDuration, setRouteDuration] = useState<string>('');
  const [routePath, setRoutePath] = useState<Array<{ lat: number; lng: number }>>([]);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const { toast } = useToast();
  const { unreadMessages } = useNotifications();
  const routesLibrary = useMapsLibrary('routes');
  
  const unreadCount = unreadMessages[requestId] || 0;

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

  useEffect(() => {
    if (mechanicLocation && serviceRequest && user?.userType === 'client') {
      const interval = setInterval(() => {
        loadMechanicLocation(serviceRequest.mechanicId);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [mechanicLocation, serviceRequest, user]);

  const loadServiceRequest = async () => {
    try {
      const response = await fetchWithAuth(`/api/service-requests/${requestId}`);
      
      if (response.ok) {
        const data = await response.json();
        setServiceRequest(data);
        
        if (data.status === 'completed' && user?.userType === 'mechanic') {
          toast({
            title: "Serviço concluído",
            description: "O pagamento foi adicionado à sua carteira",
          });
          setTimeout(() => setLocation('/'), 2000);
        }
        
        if (data.status === 'completed' && user?.userType === 'client' && !data.rating) {
          setShowRatingDialog(true);
        } else if (data.status === 'completed' && user?.userType === 'client' && data.rating) {
          toast({
            title: "Serviço concluído",
            description: "Obrigado por usar nossos serviços!",
          });
          setTimeout(() => setLocation('/'), 2000);
        }
        
        if (data.mechanicId && user?.userType === 'client') {
          loadMechanicLocation(data.mechanicId);
        }
        
        if (data.clientId && user?.userType === 'mechanic') {
          loadClientData(data.clientId);
        }
      }
    } catch (error) {
      console.error('Error loading service request:', error);
    }
  };

  const loadMechanicLocation = async (mechanicId: string) => {
    try {
      const response = await fetchWithAuth(`/api/users/${mechanicId}`);
      
      if (response.ok) {
        const mechanic = await response.json();
        if (user?.userType === 'client') {
          setOtherUser(mechanic);
        }
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

  const loadClientData = async (clientId: string) => {
    try {
      const response = await fetchWithAuth(`/api/users/${clientId}`);
      
      if (response.ok) {
        const client = await response.json();
        if (user?.userType === 'mechanic') {
          setOtherUser(client);
        }
      }
    } catch (error) {
      console.error('Error loading client data:', error);
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
          
          await fetchWithAuth('/api/location/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
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
      const response = await fetchWithAuth(`/api/service-requests/${requestId}/arrived`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      const response = await fetchWithAuth(`/api/service-requests/${requestId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Erro ao finalizar serviço');

      if (user?.userType === 'client') {
        setShowRatingDialog(true);
        loadServiceRequest();
      } else {
        toast({
          title: "Serviço finalizado",
          description: "Você receberá o pagamento em sua carteira",
        });
        setLocation('/');
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast({
        title: "Avaliação obrigatória",
        description: "Por favor, selecione uma avaliação",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/service-requests/${requestId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, comment: comment }),
      });

      if (!response.ok) throw new Error('Erro ao enviar avaliação');

      toast({
        title: "Avaliação enviada",
        description: "Obrigado pelo feedback!",
      });

      setShowRatingDialog(false);
      setTimeout(() => setLocation('/'), 1000);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!serviceRequest) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!mechanicLocation && user?.userType === 'client' && serviceRequest.status === 'pending') {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-lg font-medium mb-2">Aguardando mecânico...</p>
            <p className="text-muted-foreground">Procurando um mecânico próximo a você</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const clientLocation = {
    lat: parseFloat(serviceRequest.pickupLat),
    lng: parseFloat(serviceRequest.pickupLng),
  };

  const mapCenter = mechanicLocation || clientLocation;

  return (
    <div className="h-full flex flex-col">
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
          {routePath.length > 1 && <RoutePolyline path={routePath} />}

          {mechanicLocation && (
            <AdvancedMarker
              position={mechanicLocation}
              title="Mecânico"
            >
              <div className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg animate-pulse">
                <Wrench className="w-6 h-6" />
              </div>
            </AdvancedMarker>
          )}

          <AdvancedMarker
            position={clientLocation}
            title="Local do Acionamento"
          >
            <div className="bg-destructive text-destructive-foreground p-3 rounded-full shadow-lg">
              <MapPin className="w-6 h-6" />
            </div>
          </AdvancedMarker>
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
              
              {user?.userType === 'client' && (serviceRequest.status === 'arrived' || serviceRequest.status === 'accepted') && (
                <Button onClick={handleComplete} className="flex-1" data-testid="button-client-complete">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Finalizar
                </Button>
              )}

              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => {
                  if (otherUser?.phone) {
                    window.location.href = `tel:${otherUser.phone}`;
                  } else {
                    toast({
                      title: "Número não disponível",
                      description: "Não foi possível obter o número de telefone",
                      variant: "destructive",
                    });
                  }
                }}
                data-testid="button-call"
              >
                <Phone className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setLocation(`/ride/${requestId}/chat`)}
                data-testid="button-message"
                className="relative"
              >
                <MessageCircle className="w-4 h-4" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    data-testid="badge-unread-count"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent data-testid="dialog-rating">
          <DialogHeader>
            <DialogTitle>Avaliar Serviço</DialogTitle>
            <DialogDescription>
              Como foi sua experiência com o mecânico?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Avaliação</label>
              <div className="flex gap-2" data-testid="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-colors"
                    data-testid={`star-${star}`}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Comentário (opcional)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Conte-nos sobre sua experiência..."
                rows={4}
                data-testid="input-comment"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmitRating}
                className="flex-1"
                data-testid="button-submit-rating"
              >
                Enviar Avaliação
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRatingDialog(false);
                  setLocation('/');
                }}
                data-testid="button-skip-rating"
              >
                Pular
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
