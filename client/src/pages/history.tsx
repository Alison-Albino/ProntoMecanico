import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Wrench, Truck, AlertCircle, Clock, CheckCircle, XCircle, Star, ChevronDown, MessageSquare, MapPin, User, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface ChatMessage {
  id: string;
  message: string;
  senderId: string;
  createdAt: string;
}

export default function HistoryPage() {
  const { token, user } = useAuth();
  const [expandedChats, setExpandedChats] = useState<Set<string>>(new Set());

  const { data: serviceRequests = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/service-requests/history'],
    enabled: !!token,
  });

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'mechanic': return <Wrench className="w-5 h-5" />;
      case 'tow_truck': return <Truck className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="border-orange-500/50 text-orange-600">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="outline" className="border-blue-500/50 text-blue-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aceito
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="border-green-500/50 text-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Concluído
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="border-red-500/50 text-red-600">
            <XCircle className="w-3 h-3 mr-1" />
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

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getChatMessages = async (serviceRequestId: string): Promise<ChatMessage[]> => {
    try {
      const response = await fetch(`/api/chat/messages/${serviceRequestId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }
  };

  const { data: chatMessages = {} } = useQuery({
    queryKey: ['/api/chat/messages', serviceRequests.map(r => r.id)],
    queryFn: async () => {
      const messagesMap: Record<string, ChatMessage[]> = {};
      for (const request of serviceRequests) {
        messagesMap[request.id] = await getChatMessages(request.id);
      }
      return messagesMap;
    },
    enabled: !!token && serviceRequests.length > 0,
  });

  const toggleChat = (requestId: string) => {
    const newExpanded = new Set(expandedChats);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedChats(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-title">Histórico</h1>
          <p className="text-muted-foreground">Todas as suas chamadas e conversas</p>
        </div>
      </div>
      
      {serviceRequests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground" data-testid="text-no-history">
              Você ainda não tem chamadas no histórico
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Suas chamadas concluídas e canceladas aparecerão aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {serviceRequests.map((request: any) => {
            const messages = chatMessages[request.id] || [];
            const hasMessages = messages.length > 0;
            const isChatExpanded = expandedChats.has(request.id);

            return (
              <Card key={request.id} data-testid={`card-history-${request.id}`} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded-full bg-primary/10">
                        {getServiceIcon(request.serviceType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">
                            {getServiceTypeLabel(request.serviceType)}
                          </CardTitle>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-mono text-xs">#{request.id.slice(0, 8)}</span>
                          <span>•</span>
                          <span>{formatDate(request.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    {request.totalPrice && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary" data-testid={`text-price-${request.id}`}>
                          R$ {parseFloat(request.totalPrice).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {request.status === 'cancelled' ? 'Reembolsado' : 'Pago'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">Local</p>
                          <p className="text-sm text-muted-foreground truncate" data-testid={`text-address-${request.id}`}>
                            {request.pickupAddress}
                          </p>
                        </div>
                      </div>
                      
                      {request.description && (
                        <div>
                          <p className="text-sm font-medium">Descrição</p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-description-${request.id}`}>
                            {request.description}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {request.mechanicId && (
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {user?.userType === 'client' ? 'Mecânico' : 'Cliente'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.mechanicName || 'Não definido'}
                            </p>
                          </div>
                        </div>
                      )}

                      {request.rating && (
                        <div className="flex items-center gap-2" data-testid={`text-rating-${request.id}`}>
                          <div className="flex items-center gap-1 text-yellow-500">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < request.rating ? 'fill-current' : ''}`} 
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{request.rating}/5</span>
                        </div>
                      )}

                      {request.ratingComment && (
                        <p className="text-sm italic text-muted-foreground" data-testid={`text-comment-${request.id}`}>
                          "{request.ratingComment}"
                        </p>
                      )}
                    </div>
                  </div>

                  {hasMessages && (
                    <Collapsible open={isChatExpanded} onOpenChange={() => toggleChat(request.id)}>
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          data-testid={`button-toggle-chat-${request.id}`}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          {isChatExpanded ? 'Ocultar' : 'Ver'} Conversa ({messages.length} mensagens)
                          <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isChatExpanded ? 'rotate-180' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-4">
                        <div className="border rounded-lg p-4 bg-muted/30 max-h-96 overflow-y-auto space-y-3">
                          {messages.map((msg: ChatMessage) => {
                            const isMyMessage = msg.senderId === user?.id;
                            return (
                              <div 
                                key={msg.id} 
                                className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                                data-testid={`message-${msg.id}`}
                              >
                                <div className={`max-w-[75%] rounded-lg px-3 py-2 ${
                                  isMyMessage 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-background border'
                                }`}>
                                  <p className="text-sm">{msg.message}</p>
                                  <p className={`text-xs mt-1 ${
                                    isMyMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                  }`}>
                                    {formatTime(msg.createdAt)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
