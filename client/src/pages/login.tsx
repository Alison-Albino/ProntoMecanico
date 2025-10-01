import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';

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
  }, [value]);

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
        placeholder="Digite seu endereço..."
        data-testid="input-address-mechanic"
        autoComplete="off"
        className="flex h-9 w-full rounded-md border border-input bg-background pl-11 pr-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<'client' | 'mechanic'>('client');
  const [isLoading, setIsLoading] = useState(false);
  const [mechanicAddress, setMechanicAddress] = useState('');
  const [mechanicCoords, setMechanicCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  const { login, register } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handlePlaceSelect = (place: google.maps.places.PlaceResult | null) => {
    if (place?.geometry?.location) {
      setMechanicCoords({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
        setLocation('/');
      } else {
        if (userType === 'mechanic' && (!mechanicAddress || !mechanicCoords)) {
          toast({
            title: "Erro",
            description: "Por favor, informe seu endereço base",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const registerData: any = { 
          username, 
          password, 
          email, 
          fullName, 
          phone, 
          userType 
        };

        if (userType === 'mechanic' && mechanicAddress && mechanicCoords) {
          registerData.baseAddress = mechanicAddress;
          registerData.baseLat = mechanicCoords.lat;
          registerData.baseLng = mechanicCoords.lng;
        }

        await register(registerData);
        
        setLocation('/');
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle data-testid="text-title">{isLogin ? 'Login' : 'Cadastro'}</CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Entre com sua conta para continuar' 
              : 'Crie sua conta para começar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                data-testid="input-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    data-testid="input-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    data-testid="input-fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    data-testid="input-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>Tipo de Usuário</Label>
                  <div className="flex gap-4 mt-2">
                    <Button
                      type="button"
                      variant={userType === 'client' ? 'default' : 'outline'}
                      onClick={() => setUserType('client')}
                      data-testid="button-usertype-client"
                      className="flex-1"
                    >
                      Cliente
                    </Button>
                    <Button
                      type="button"
                      variant={userType === 'mechanic' ? 'default' : 'outline'}
                      onClick={() => setUserType('mechanic')}
                      data-testid="button-usertype-mechanic"
                      className="flex-1"
                    >
                      Mecânico
                    </Button>
                  </div>
                </div>

                {userType === 'mechanic' && (
                  <div>
                    <Label>Endereço Base</Label>
                    <div className="mt-2">
                      <AddressAutocomplete
                        value={mechanicAddress}
                        onChange={setMechanicAddress}
                        onPlaceSelect={handlePlaceSelect}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      De onde você atenderá as chamadas
                    </p>
                  </div>
                )}
              </>
            )}

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                data-testid="input-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? 'Carregando...' : isLogin ? 'Entrar' : 'Cadastrar'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              data-testid="button-toggle-mode"
              className="text-sm text-primary hover:underline"
            >
              {isLogin 
                ? 'Não tem uma conta? Cadastre-se' 
                : 'Já tem uma conta? Entre'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  if (!GOOGLE_MAPS_API_KEY) {
    return <div>Erro: Google Maps API key não configurada</div>;
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <LoginForm />
    </APIProvider>
  );
}
