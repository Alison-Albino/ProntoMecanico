import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Wrench, Truck, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function HistoryPage() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/service-requests/my', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'mechanic': return <Wrench className="w-4 h-4" />;
      case 'tow_truck': return <Truck className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getServiceName = (type: string) => {
    switch (type) {
      case 'mechanic': return 'Mecânico';
      case 'tow_truck': return 'Guincho';
      case 'road_assistance': return 'Assistência na Estrada';
      default: return 'Outro';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" data-testid={`badge-status-pending`}><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'accepted':
        return <Badge variant="default" data-testid={`badge-status-accepted`}><CheckCircle className="w-3 h-3 mr-1" />Aceito</Badge>;
      case 'completed':
        return <Badge variant="secondary" data-testid={`badge-status-completed`}><CheckCircle className="w-3 h-3 mr-1" />Finalizado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" data-testid={`badge-status-cancelled`}><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4" data-testid="text-title">Histórico de Chamadas</h1>
      
      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center">
              Nenhuma chamada encontrada
            </p>
          </CardContent>
        </Card>
      ) : (
        requests.map((request) => (
          <Card key={request.id} data-testid={`card-request-${request.id}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                {getServiceIcon(request.serviceType)}
                <CardTitle className="text-base">
                  {getServiceName(request.serviceType)}
                </CardTitle>
              </div>
              {getStatusBadge(request.status)}
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-2">
                {request.pickupAddress}
              </CardDescription>
              
              {request.description && (
                <p className="text-sm mb-2">{request.description}</p>
              )}

              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  {format(new Date(request.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
                {request.totalPrice && (
                  <span className="font-semibold text-foreground" data-testid={`text-price-${request.id}`}>
                    R$ {parseFloat(request.totalPrice).toFixed(2)}
                  </span>
                )}
              </div>

              {request.distance && (
                <p className="text-sm text-muted-foreground mt-1">
                  Distância: {parseFloat(request.distance).toFixed(2)} km
                </p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
