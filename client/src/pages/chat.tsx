import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, ArrowLeft, Star, User as UserIcon, Calendar, Award } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useRoute, Redirect } from 'wouter';
import { useNotifications } from '@/lib/use-notifications';

export default function ChatPage() {
  const { user, token } = useAuth();
  const [message, setMessage] = useState('');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/ride/:id/chat');
  const { markAsRead } = useNotifications();
  
  const serviceRequestId = params?.id;
  
  if (!serviceRequestId) {
    return <Redirect to="/" />;
  }

  useEffect(() => {
    if (serviceRequestId) {
      markAsRead(serviceRequestId);
    }
  }, [serviceRequestId, markAsRead]);

  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ['/api/chat/messages', serviceRequestId],
    enabled: !!token && !!serviceRequestId,
  });

  const { data: serviceRequest } = useQuery<any>({
    queryKey: [`/api/service-requests/${serviceRequestId}`],
    enabled: !!token && !!serviceRequestId,
  });

  const otherUserId = user?.userType === 'client' 
    ? serviceRequest?.mechanicId 
    : serviceRequest?.clientId;

  const { data: otherUser } = useQuery<any>({
    queryKey: [`/api/users/${otherUserId}`],
    enabled: !!token && !!otherUserId,
  });

  useEffect(() => {
    if (otherUserId) {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${otherUserId}`] });
    }
  }, [otherUserId]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest('POST', '/api/chat/messages', {
        serviceRequestId,
        message: content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/messages', serviceRequestId] });
      setMessage('');
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleWebSocketMessage = (event: any) => {
      const data = event.detail;
      
      if (data.type === 'new_chat_message' && data.data?.serviceRequestId === serviceRequestId) {
        queryClient.invalidateQueries({ queryKey: ['/api/chat/messages', serviceRequestId] });
      }
    };

    window.addEventListener('websocket-message', handleWebSocketMessage);
    return () => window.removeEventListener('websocket-message', handleWebSocketMessage);
  }, [serviceRequestId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeOnApp = (createdAt: string | Date | null | undefined) => {
    if (!createdAt) return 'Tempo desconhecido';
    
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMs = now.getTime() - created.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 1) return 'Menos de 1 dia';
    if (diffInDays < 7) return `${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`;
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    }
    if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    }
    const years = Math.floor(diffInDays / 365);
    return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  };

  const handleViewProfile = () => {
    setProfileModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col">
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Perfil do Usuário</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 py-4">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-2xl">
                {otherUser ? getInitials(otherUser.username) : '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center">
              <h3 className="text-xl font-semibold" data-testid="text-profile-name">
                {otherUser?.username || 'Carregando...'}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid="text-profile-user-type">
                {otherUser?.userType === 'mechanic' ? 'Mecânico' : 'Cliente'}
              </p>
            </div>
            
            <div className="w-full space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Calendar className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Tempo no app</p>
                  <p className="font-medium" data-testid="text-profile-time-on-app">
                    {getTimeOnApp(otherUser?.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Award className="w-5 h-5 text-yellow-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Avaliações</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-medium" data-testid="text-profile-rating">
                        {otherUser?.rating != null ? parseFloat(otherUser.rating).toFixed(1) : 'N/A'}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground" data-testid="text-profile-total-ratings">
                      ({otherUser?.totalRatings || 0} {otherUser?.totalRatings === 1 ? 'avaliação' : 'avaliações'})
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => setProfileModalOpen(false)} 
              className="w-full"
              data-testid="button-close-profile"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b py-3 px-3 sm:py-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation(`/ride/${serviceRequestId}`)}
              data-testid="button-back-to-ride"
              className="shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            
            <div className="flex items-center gap-2 sm:gap-3 flex-1 cursor-pointer hover-elevate p-1.5 sm:p-2 rounded-lg transition-colors min-w-0" onClick={handleViewProfile}>
              <Avatar className="w-9 h-9 sm:w-10 sm:h-10 shrink-0">
                <AvatarFallback>
                  {otherUser ? getInitials(otherUser.username) : '?'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate" data-testid="text-other-user-name">
                  {otherUser?.username || 'Carregando...'}
                </h3>
                {otherUser?.rating != null && (
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500 shrink-0" />
                    <span>{parseFloat(otherUser.rating).toFixed(1)}</span>
                    <span>({otherUser.totalRatings || 0})</span>
                  </div>
                )}
              </div>

              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewProfile();
                }}
                data-testid="button-view-profile"
                className="shrink-0"
              >
                <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
          {messages.map((msg: any) => {
            const isOwnMessage = msg.senderId === user?.id;
            
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-1.5 sm:gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                data-testid={`message-${msg.id}`}
              >
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8 shrink-0">
                  <AvatarFallback className="text-xs">
                    {getInitials(msg.senderName || 'U')}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[75%] sm:max-w-[70%]`}>
                  <div
                    className={`rounded-lg px-3 py-2 sm:px-4 sm:py-2 ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm break-words">{msg.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="border-t p-3 sm:p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              data-testid="input-message"
              disabled={sendMessageMutation.isPending}
              className="text-sm sm:text-base"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!message.trim() || sendMessageMutation.isPending}
              data-testid="button-send-message"
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
