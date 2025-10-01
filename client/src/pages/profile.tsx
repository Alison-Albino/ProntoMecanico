import { useAuth } from '@/lib/auth-context';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Mail, Phone, Star, ArrowLeft, Bell, BellOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNotifications } from '@/lib/use-notifications';

export default function ProfilePage() {
  const [, params] = useRoute('/profile/:id');
  const { user: currentUser, token, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { requestNotificationPermission, hasNotificationPermission } = useNotifications();
  
  const userId = params?.id;
  const isOwnProfile = !userId || userId === currentUser?.id;
  
  const { data: profileUser, isLoading } = useQuery<any>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!token && !!userId && !isOwnProfile,
  });
  
  const user = isOwnProfile ? currentUser : profileUser;

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  if (!user || (isLoading && !isOwnProfile)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        {!isOwnProfile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <h1 className="text-2xl font-bold" data-testid="text-title">
          {isOwnProfile ? 'Meu Perfil' : 'Perfil'}
        </h1>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback data-testid="text-avatar">
                {getInitials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle data-testid="text-fullname">{user.fullName}</CardTitle>
              <CardDescription>@{user.username}</CardDescription>
            </div>
            <Badge variant={user.userType === 'mechanic' ? 'default' : 'secondary'} data-testid="badge-usertype">
              {user.userType === 'mechanic' ? 'Mecânico' : 'Cliente'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span data-testid="text-email">{user.email}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span data-testid="text-phone">{user.phone}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span data-testid="text-username">Usuário: {user.username}</span>
          </div>

          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Avaliação</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= parseFloat(user.rating || '5')
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium" data-testid="text-rating">
                  {parseFloat(user.rating || '5').toFixed(1)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total de avaliações</span>
              <span className="text-sm font-medium" data-testid="text-total-ratings">
                {user.totalRatings || 0}
              </span>
            </div>
          </div>

          {user.userType === 'mechanic' && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={user.isOnline ? 'default' : 'outline'} data-testid="badge-online-status">
                  {user.isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isOwnProfile && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Receba alertas de novas mensagens no chat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {hasNotificationPermission ? (
                    <Bell className="w-5 h-5 text-primary" />
                  ) : (
                    <BellOff className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {hasNotificationPermission ? 'Notificações ativadas' : 'Notificações desativadas'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {hasNotificationPermission 
                        ? 'Você receberá notificações de novas mensagens'
                        : 'Ative para receber alertas no navegador'
                      }
                    </p>
                  </div>
                </div>
                {!hasNotificationPermission && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestNotificationPermission}
                    data-testid="button-enable-notifications"
                  >
                    Ativar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
