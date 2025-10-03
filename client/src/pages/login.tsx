import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, Eye, EyeOff } from 'lucide-react';

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

function formatCPFCNPJ(value: string): string {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
}

function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [birthDate, setBirthDate] = useState('');
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

  const handleCpfCnpjChange = (value: string) => {
    const formatted = formatCPFCNPJ(value);
    setCpfCnpj(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(identifier, password);
        setLocation('/');
      } else {
        if (password !== confirmPassword) {
          toast({
            title: "Erro",
            description: "As senhas não coincidem",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

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
          password, 
          confirmPassword,
          email, 
          fullName,
          cpfCnpj: cpfCnpj.replace(/\D/g, ''),
          birthDate: new Date(birthDate).toISOString(),
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
            {isLogin ? (
              <>
                <div>
                  <Label htmlFor="identifier">CPF ou Email</Label>
                  <Input
                    id="identifier"
                    data-testid="input-identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value.toLowerCase())}
                    placeholder="Seu CPF ou email"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      data-testid="input-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    data-testid="input-fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    data-testid="input-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
                  <Input
                    id="cpfCnpj"
                    data-testid="input-cpfcnpj"
                    value={cpfCnpj}
                    onChange={(e) => handleCpfCnpjChange(e.target.value)}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    maxLength={18}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    data-testid="input-birthdate"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
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
                    placeholder="(00) 00000-0000"
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

                <div>
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      data-testid="input-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      data-testid="input-confirmpassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Digite a senha novamente"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

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
