import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useLocation } from 'wouter';

interface UnreadMessages {
  [serviceRequestId: string]: number;
}

interface NotificationsContextType {
  unreadMessages: UnreadMessages;
  markAsRead: (serviceRequestId: string) => void;
  totalUnread: number;
  requestNotificationPermission: () => Promise<void>;
  hasNotificationPermission: boolean;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessages>({});
  const [hasNotificationPermission, setHasNotificationPermission] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );

  const totalUnread = Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      toast({
        title: "Notificações não suportadas",
        description: "Seu navegador não suporta notificações",
        variant: "destructive",
      });
      return;
    }

    if (Notification.permission === 'granted') {
      setHasNotificationPermission(true);
      return;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setHasNotificationPermission(true);
        toast({
          title: "Notificações ativadas",
          description: "Você receberá notificações de novas mensagens",
        });
      }
    } else {
      toast({
        title: "Permissão negada",
        description: "Ative as notificações nas configurações do navegador",
        variant: "destructive",
      });
    }
  }, [toast]);

  const markAsRead = useCallback((serviceRequestId: string) => {
    setUnreadMessages(prev => {
      const updated = { ...prev };
      delete updated[serviceRequestId];
      return updated;
    });
  }, []);

  const showBrowserNotification = useCallback((title: string, body: string, serviceRequestId: string) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: `chat-${serviceRequestId}`,
        requireInteraction: false,
        silent: false,
      });

      notification.onclick = () => {
        window.focus();
        setLocation(`/ride/${serviceRequestId}/chat`);
        notification.close();
      };
    }
  }, [setLocation]);

  useEffect(() => {
    if (!user) return;

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setHasNotificationPermission(true);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const handleWebSocketMessage = (event: any) => {
      const data = event.detail;
      
      if (data.type === 'new_chat_message') {
        const messageData = data.data;
        const serviceRequestId = messageData.serviceRequestId;
        
        if (messageData.senderId !== user.id) {
          const isOnChatPage = window.location.pathname === `/ride/${serviceRequestId}/chat`;
          
          if (!isOnChatPage) {
            setUnreadMessages(prev => ({
              ...prev,
              [serviceRequestId]: (prev[serviceRequestId] || 0) + 1
            }));

            toast({
              title: "Nova mensagem",
              description: messageData.message.length > 50 
                ? messageData.message.substring(0, 50) + '...' 
                : messageData.message,
              action: (
                <ToastAction 
                  altText="Ver mensagem" 
                  onClick={() => {
                    setLocation(`/ride/${serviceRequestId}/chat`);
                  }}
                >
                  Ver
                </ToastAction>
              )
            });

            showBrowserNotification(
              "Nova mensagem no chat",
              messageData.message,
              serviceRequestId
            );
          }
        }
      }
    };

    window.addEventListener('websocket-message', handleWebSocketMessage);
    return () => window.removeEventListener('websocket-message', handleWebSocketMessage);
  }, [user, toast, showBrowserNotification, setLocation]);

  return (
    <NotificationsContext.Provider
      value={{
        unreadMessages,
        markAsRead,
        totalUnread,
        requestNotificationPermission,
        hasNotificationPermission,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
}
