import { useAuth } from '@/lib/auth-context';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Mail, Phone, Star, ArrowLeft, Bell, BellOff, MapPin, Shield } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNotifications } from '@/lib/use-notifications';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { queryClient } from '@/lib/queryClient';
import { getFirstName } from '@/lib/utils';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function AddressAutocomplete({ 
  onPlaceSelect,
  value,
  onChange
}: { 
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const places = useMapsLibrary('places');
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    if (value !== undefined && value !== inputValue) {
      setInputValue(value);
      if (inputRef.current) {
        inputRef.current.value = value;
      }
    }
  }, [value, inputValue]);

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const options = {
      componentRestrictions: { country: 'br' },
      fields: ['formatted_address', 'geometry', 'name', 'address_components'],
      types: ['address'],
    };

    autocompleteRef.current = new places.Autocomplete(inputRef.current, options);

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (place?.formatted_address) {
        setInputValue(place.formatted_address);
        if (onChange) {
          onChange(place.formatted_address);
        }
      }
      onPlaceSelect(place || null);
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [places, onPlaceSelect, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center pointer-events-none">
        <MapPin className="w-3 h-3 text-primary" />
      </div>
      <input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Digite seu endereço base..."
        data-testid="input-base-address"
        autoComplete="off"
        className="flex h-9 w-full rounded-md border border-input bg-background pl-11 pr-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

function ProfilePageContent() {
  const [, params] = useRoute('/profile/:id');
  const { user: currentUser, token, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { requestNotificationPermission, hasNotificationPermission } = useNotifications();
  const { toast } = useToast();
  
  const userId = params?.id;
  const isOwnProfile = !userId || userId === currentUser?.id;

  const [baseAddressData, setBaseAddressData] = useState({
    baseAddress: currentUser?.baseAddress || '',
    baseLat: currentUser?.baseLat ? parseFloat(currentUser.baseLat) : 0,
    baseLng: currentUser?.baseLng ? parseFloat(currentUser.baseLng) : 0,
  });
  
  const { data: profileUser, isLoading } = useQuery<any>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!token && !!userId && !isOwnProfile,
  });
  
  const user = isOwnProfile ? currentUser : profileUser;

  const updateBaseAddressMutation = useMutation({
    mutationFn: async (data: typeof baseAddressData) => {
      const response = await fetch('/api/user/base-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao atualizar endereço base');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Endereço atualizado",
        description: "Seu endereço base foi salvo com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePlaceSelect = (place: google.maps.places.PlaceResult | null) => {
    if (place?.geometry?.location && place?.formatted_address) {
      setBaseAddressData({
        baseAddress: place.formatted_address,
        baseLat: place.geometry.location.lat(),
        baseLng: place.geometry.location.lng()
      });
    }
  };

  const handleBaseAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseAddressData.baseAddress || baseAddressData.baseLat === undefined || baseAddressData.baseLng === undefined) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um endereço válido",
        variant: "destructive",
      });
      return;
    }
    updateBaseAddressMutation.mutate(baseAddressData);
  };

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
              <CardTitle data-testid="text-fullname">
                {isOwnProfile ? user.fullName : getFirstName(user.fullName)}
              </CardTitle>
              {isOwnProfile && <CardDescription>@{user.username}</CardDescription>}
            </div>
            <Badge variant={user.userType === 'mechanic' ? 'default' : 'secondary'} data-testid="badge-usertype">
              {user.userType === 'mechanic' ? 'Mecânico' : 'Cliente'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isOwnProfile && (
            <>
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
            </>
          )}

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
          {currentUser?.userType === 'mechanic' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Endereço Base
                </CardTitle>
                <CardDescription>
                  Configure o endereço de onde você atenderá as chamadas. Você receberá chamados próximos a este endereço.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBaseAddressSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="baseAddress">Seu Endereço</Label>
                    <AddressAutocomplete
                      value={baseAddressData.baseAddress}
                      onChange={(value) => setBaseAddressData({...baseAddressData, baseAddress: value})}
                      onPlaceSelect={handlePlaceSelect}
                    />
                    <p className="text-xs text-muted-foreground">
                      A distância até os clientes será calculada a partir deste endereço
                    </p>
                  </div>

                  {baseAddressData.baseAddress && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">Endereço atual:</p>
                      <p className="text-sm text-muted-foreground">{baseAddressData.baseAddress}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={updateBaseAddressMutation.isPending || !baseAddressData.baseAddress}
                    className="w-full"
                    data-testid="button-save-address"
                  >
                    {updateBaseAddressMutation.isPending ? "Salvando..." : "Salvar Endereço"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

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
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation('/admin/withdrawals')}
                data-testid="button-admin-withdrawals"
              >
                <Shield className="w-4 h-4 mr-2" />
                Processar Saques (Admin)
              </Button>
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

export default function ProfilePage() {
  if (!GOOGLE_MAPS_API_KEY) {
    return <ProfilePageContent />;
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <ProfilePageContent />
    </APIProvider>
  );
}
