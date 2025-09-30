import { useAuth } from '@/lib/auth-context';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Mail, Phone } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  if (!user) {
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
      <h1 className="text-2xl font-bold mb-4" data-testid="text-title">Perfil</h1>
      
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

      <Button
        variant="destructive"
        className="w-full"
        onClick={handleLogout}
        data-testid="button-logout"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sair
      </Button>
    </div>
  );
}
