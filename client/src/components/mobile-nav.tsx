import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { Home, History, User, Wallet, Navigation, MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNotifications } from '@/lib/use-notifications';
import { Badge } from '@/components/ui/badge';

export function MobileNav() {
  const [location] = useLocation();
  const { token, user } = useAuth();
  const { unreadMessages } = useNotifications();

  const { data: activeRequest } = useQuery<any>({
    queryKey: ['/api/service-requests/active'],
    enabled: !!token && !!user,
    refetchInterval: 10000,
  });
  
  const unreadCount = activeRequest?.id ? (unreadMessages[activeRequest.id] || 0) : 0;

  const baseNavItems = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/history', icon: History, label: 'Histórico' },
    { path: '/wallet', icon: Wallet, label: 'Carteira' },
    { path: '/profile', icon: User, label: 'Perfil' },
  ];

  const navItems = activeRequest?.id
    ? [
        { path: '/', icon: Home, label: 'Início' },
        { path: `/ride/${activeRequest.id}`, icon: Navigation, label: 'Corrida' },
        { path: `/ride/${activeRequest.id}/chat`, icon: MessageCircle, label: 'Chat' },
        { path: '/profile', icon: User, label: 'Perfil' },
      ]
    : baseNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          const isChatItem = item.label === 'Chat';
          
          return (
            <Link
              key={item.path}
              href={item.path}
              data-testid={`link-nav-${item.label.toLowerCase()}`}
            >
              <button
                className={`flex flex-col items-center justify-center w-16 h-full gap-1 relative ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover-elevate'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {isChatItem && unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                      data-testid="badge-mobile-nav-unread"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </div>
                <span className="text-xs">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
