import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, Truck, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function HistoryPage() {
  const { token } = useAuth();

  const { data: serviceRequests = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/service-requests/my'],
    enabled: !!token,
  });

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'mechanic': return <Wrench className="w-4 h-4" />;
      case 'tow_truck': return <Truck className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="flex items-center gap-1" data-testid={`badge-status-pending`}>
            <Clock className="w-3 h-3" />
            Pendente
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="default" className="flex items-center gap-1" data-testid={`badge-status-accepted`}>
            <CheckCircle className="w-3 h-3" />
            Aceito
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="flex items-center gap-1 bg-green-600" data-testid={`badge-status-completed`}>
            <CheckCircle className="w-3 h-3" />
            Concluído
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive" className="flex items-center gap-1" data-testid={`badge-status-cancelled`}>
            <XCircle className="w-3 h-3" />
            Cancelado
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'mechanic': return 'Mecânico';
      case 'tow_truck': return 'Guincho';
      case 'road_assistance': return 'Assistência na Estrada';
      default: return 'Outro';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <h1 className="text-2xl font-bold" data-testid="text-title">Histórico de Chamadas</h1>
      
      {serviceRequests.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground" data-testid="text-no-history">
              Você ainda não tem chamadas no histórico
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {serviceRequests.map((request: any) => (
            <Card key={request.id} data-testid={`card-history-${request.id}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  {getServiceIcon(request.serviceType)}
                  <CardTitle className="text-base">
                    {getServiceTypeLabel(request.serviceType)}
                  </CardTitle>
                </div>
                {getStatusBadge(request.status)}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground" data-testid={`text-address-${request.id}`}>
                    {request.pickupAddress}
                  </p>
                  
                  {request.description && (
                    <p data-testid={`text-description-${request.id}`}>
                      {request.description}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-muted-foreground" data-testid={`text-date-${request.id}`}>
                      {formatDate(request.createdAt)}
                    </span>
                    
                    {request.totalPrice && (
                      <span className="font-semibold" data-testid={`text-price-${request.id}`}>
                        R$ {parseFloat(request.totalPrice).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
