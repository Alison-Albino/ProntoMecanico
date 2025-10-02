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
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 z-50 pb-safe">
      <div className="max-w-screen-lg mx-auto">
        <div className="flex justify-around items-center h-20 px-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            const isChatItem = item.label === 'Chat';
            
            return (
              <Link
                key={item.path}
                href={item.path}
                data-testid={`link-nav-${item.label.toLowerCase()}`}
                className="flex-1 max-w-[100px]"
              >
                <button
                  className={`w-full h-16 flex flex-col items-center justify-center gap-1.5 relative transition-all duration-300 group ${
                    isActive
                      ? 'scale-105'
                      : 'hover:scale-105'
                  }`}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full animate-in slide-in-from-top-2 duration-300" />
                  )}
                  
                  {/* Icon container */}
                  <div className="relative">
                    <div className={`p-2 rounded-2xl transition-all duration-300 ${
                      isActive
                        ? 'bg-primary/10 scale-110'
                        : 'bg-transparent group-hover:bg-muted'
                    }`}>
                      <Icon className={`w-6 h-6 transition-colors duration-300 ${
                        isActive
                          ? 'text-primary'
                          : 'text-muted-foreground group-hover:text-foreground'
                      }`} />
                    </div>
                    
                    {/* Unread badge */}
                    {isChatItem && unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-bold shadow-lg animate-in zoom-in-50 duration-200"
                        data-testid="badge-mobile-nav-unread"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={`text-xs font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-primary scale-105'
                      : 'text-muted-foreground group-hover:text-foreground'
                  }`}>
                    {item.label}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
