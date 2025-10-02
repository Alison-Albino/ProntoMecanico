import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, Clock } from 'lucide-react';

export default function WaitingPage() {
  const [, params] = useRoute('/waiting/:id');
  const [, setLocation] = useLocation();
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [serviceRequest, setServiceRequest] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!params?.id) {
      setLocation('/');
      return;
    }

    loadServiceRequest();
    const interval = setInterval(loadServiceRequest, 3000);
    return () => clearInterval(interval);
  }, [params?.id, token]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleWebSocketMessage = (event: any) => {
      const data = event.detail;
      
      if (data.type === 'service_request_accepted' && params?.id && data.data?.id === params.id) {
        toast({
          title: "Mecânico encontrado!",
          description: `${data.mechanic?.fullName || 'Um mecânico'} aceitou sua chamada`,
        });
        
        setTimeout(() => {
          setLocation(`/ride/${params.id}`);
        }, 1500);
      }
    };

    window.addEventListener('websocket-message', handleWebSocketMessage);
    return () => window.removeEventListener('websocket-message', handleWebSocketMessage);
  }, [params?.id, setLocation, toast]);

  const loadServiceRequest = async () => {
    if (!params?.id) return;

    try {
      const response = await fetch(`/api/service-requests/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setServiceRequest(data);
        
        if (data.status === 'accepted') {
          setLocation(`/ride/${params.id}`);
        } else if (data.status === 'cancelled') {
          toast({
            title: "Chamada cancelada",
            description: "A chamada foi cancelada",
            variant: "destructive",
          });
          setLocation('/');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar chamada:', error);
    }
  };

  const handleCancel = async () => {
    if (!params?.id) return;

    try {
      const response = await fetch(`/api/service-requests/${params.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao cancelar chamada');
      }

      const result = await response.json();

      toast({
        title: "Chamada cancelada",
        description: result.refundCreated 
          ? "✅ Reembolso processado automaticamente via PIX" 
          : "Sua chamada foi cancelada",
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!serviceRequest) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle data-testid="text-title">
            Procurando Mecânicos Próximos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin text-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 animate-ping" />
              </div>
            </div>
            
            <p className="text-lg font-medium mt-6" data-testid="text-status">
              Aguardando resposta dos mecânicos...
            </p>
            
            <div className="flex items-center gap-2 mt-4 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span data-testid="text-elapsed">{formatTime(elapsedTime)}</span>
            </div>
          </div>

          <div className="space-y-3 p-4 bg-muted rounded-md">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Local de atendimento:</p>
                <p className="text-sm text-muted-foreground" data-testid="text-address">
                  {serviceRequest.pickupAddress}
                </p>
              </div>
            </div>

            {serviceRequest.vehicleBrand && serviceRequest.vehicleModel && (
              <div>
                <p className="text-sm font-medium">Veículo:</p>
                <p className="text-sm text-muted-foreground" data-testid="text-vehicle">
                  {serviceRequest.vehicleBrand} {serviceRequest.vehicleModel}
                  {serviceRequest.vehiclePlate && ` • ${serviceRequest.vehiclePlate}`}
                </p>
              </div>
            )}

            {serviceRequest.description && (
              <div>
                <p className="text-sm font-medium">Descrição do problema:</p>
                <p className="text-sm text-muted-foreground" data-testid="text-description">
                  {serviceRequest.description}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium">Valor pago:</p>
              <p className="text-lg font-bold text-primary" data-testid="text-price">
                R$ {parseFloat(serviceRequest.totalPrice || '50.00').toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                Valor final pode variar com base na distância
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-center text-muted-foreground">
              Estamos notificando os mecânicos mais próximos de você.
              Isso pode levar alguns minutos.
            </p>
            
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleCancel}
              data-testid="button-cancel"
            >
              Cancelar Chamada
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
