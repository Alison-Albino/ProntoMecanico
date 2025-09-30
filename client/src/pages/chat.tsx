import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, ArrowLeft, Star, User as UserIcon } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface ChatPageProps {
  serviceRequestId: string;
}

export default function ChatPage({ serviceRequestId }: ChatPageProps) {
  const { user, token } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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

  const handleViewProfile = () => {
    if (otherUserId) {
      setLocation(`/profile/${otherUserId}`);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation(`/ride/${serviceRequestId}`)}
              data-testid="button-back-to-ride"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-3 flex-1 cursor-pointer hover-elevate p-2 rounded-lg transition-colors" onClick={handleViewProfile}>
              <Avatar className="w-10 h-10">
                <AvatarFallback>
                  {otherUser ? getInitials(otherUser.username) : '?'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h3 className="font-semibold" data-testid="text-other-user-name">
                  {otherUser?.username || 'Carregando...'}
                </h3>
                {otherUser?.rating && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
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
              >
                <UserIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg: any) => {
            const isOwnMessage = msg.senderId === user?.id;
            
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                data-testid={`message-${msg.id}`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    {getInitials(msg.senderName || 'U')}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              data-testid="input-message"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!message.trim() || sendMessageMutation.isPending}
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
