import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ChatPageProps {
  serviceRequestId: string;
}

export default function ChatPage({ serviceRequestId }: ChatPageProps) {
  const { user, token } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: messages = [] } = useQuery<any[]>({
    queryKey: [`/api/chat/messages/${serviceRequestId}`],
    enabled: !!token && !!serviceRequestId,
  });

  const { data: serviceRequest } = useQuery<any>({
    queryKey: [`/api/service-requests/${serviceRequestId}`],
    enabled: !!token && !!serviceRequestId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/chat/messages`, {
        method: 'POST',
        body: JSON.stringify({
          serviceRequestId,
          message: content,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/messages/${serviceRequestId}`] });
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
        queryClient.invalidateQueries({ queryKey: [`/api/chat/messages/${serviceRequestId}`] });
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

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b">
          <CardTitle data-testid="text-chat-title">
            Chat - {serviceRequest?.serviceType}
          </CardTitle>
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
