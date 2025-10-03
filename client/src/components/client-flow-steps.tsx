import { useState, useEffect, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Wrench, Truck, AlertCircle, CreditCard, QrCode, ArrowLeft, Navigation, Key, Zap, CircleDot, Battery, Bike } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export interface AddressData {
  address: string;
  lat: number;
  lng: number;
}

export interface ServiceData {
  type: string;
  description: string;
}

export interface PaymentData {
  method: 'card' | 'pix';
}

interface AddressStepProps {
  onNext: (data: AddressData) => void;
  initialAddress?: string;
}

export function AddressStep({ onNext, initialAddress = '' }: AddressStepProps) {
  const places = useMapsLibrary('places');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(initialAddress);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

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
        setSelectedPlace(place);
      }
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [places]);

  const handleInputFocus = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getUserLocation = async () => {
    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results[0]) {
        const address = data.results[0].formatted_address;
        setInputValue(address);
        setSelectedPlace({
          formatted_address: address,
          geometry: {
            location: new google.maps.LatLng(latitude, longitude),
          },
        } as google.maps.places.PlaceResult);
      }
    } catch (error) {
      console.error('Erro ao obter localização:', error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const geocodeAddress = async (addressText: string): Promise<{ lat: number; lng: number } | null> => {
    if (!GOOGLE_MAPS_API_KEY) return null;
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressText)}&key=${GOOGLE_MAPS_API_KEY}&components=country:BR`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      }
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', error);
    }
    
    return null;
  };

  const handleNext = async () => {
    let lat: number | undefined;
    let lng: number | undefined;

    if (selectedPlace?.geometry?.location) {
      lat = selectedPlace.geometry.location.lat();
      lng = selectedPlace.geometry.location.lng();
    } else if (inputValue) {
      const coords = await geocodeAddress(inputValue);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    }

    if (lat && lng && inputValue) {
      onNext({
        address: inputValue,
        lat,
        lng,
      });
    }
  };

  const isValid = inputValue.length > 0;

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20 overflow-y-auto pb-24">
      <div className="flex-1 flex flex-col justify-center p-6 space-y-8 max-w-md mx-auto w-full min-h-[calc(100vh-6rem)]">
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-address-heading">
            Onde você está?
          </h2>
          <p className="text-muted-foreground text-lg">
            Informe sua localização para encontrar mecânicos próximos
          </p>
        </div>

        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-150">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center pointer-events-none transition-transform group-focus-within:scale-110">
              <MapPin className="w-4 h-4 text-primary-foreground" />
            </div>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={handleInputFocus}
              placeholder="Informe seu endereço..."
              data-testid="input-pickup-address"
              autoComplete="off"
              className="flex h-16 w-full rounded-2xl border-2 border-input bg-background pl-16 pr-4 py-2 text-lg shadow-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <button
            onClick={getUserLocation}
            disabled={isGettingLocation}
            className="w-full h-14 rounded-2xl bg-muted hover:bg-muted/80 transition-all flex items-center justify-center gap-3 text-base font-medium disabled:opacity-50 group"
            data-testid="button-use-current-location"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Navigation className="w-4 h-4 text-primary" />
            </div>
            {isGettingLocation ? 'Obtendo sua localização...' : 'Usar minha localização atual'}
          </button>
        </div>
      </div>

      {isValid && (
        <div className="fixed bottom-20 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent animate-in slide-in-from-bottom-4 fade-in duration-300">
          <Button
            onClick={handleNext}
            className="w-full max-w-md mx-auto h-14 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all"
            data-testid="button-next-from-address"
          >
            Próximo
          </Button>
        </div>
      )}
    </div>
  );
}

interface ServiceTypeStepProps {
  onNext: (data: ServiceData) => void;
  onBack: () => void;
}

export function ServiceTypeStep({ onNext, onBack }: ServiceTypeStepProps) {
  const [selectedType, setSelectedType] = useState<string>('mechanic');
  const [description, setDescription] = useState('');

  const serviceTypes = [
    {
      id: 'mechanic',
      icon: Wrench,
      title: 'Mecânico',
      subtitle: 'Reparo no local',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'tow_truck',
      icon: Truck,
      title: 'Guincho',
      subtitle: 'Reboque do veículo',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      id: 'road_assistance',
      icon: AlertCircle,
      title: 'Assistência',
      subtitle: 'Ajuda na estrada',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      id: 'locksmith',
      icon: Key,
      title: 'Chaveiro',
      subtitle: 'Chaves e fechaduras',
      gradient: 'from-yellow-500 to-amber-500',
    },
    {
      id: 'electrician',
      icon: Zap,
      title: 'Eletricista',
      subtitle: 'Serviços elétricos',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      id: 'tire_service',
      icon: CircleDot,
      title: 'Borracheiro',
      subtitle: 'Pneus e calibragem',
      gradient: 'from-gray-600 to-slate-700',
    },
    {
      id: 'battery_support',
      icon: Battery,
      title: 'Suporte Bateria',
      subtitle: 'Carga e troca de bateria',
      gradient: 'from-teal-500 to-cyan-600',
    },
    {
      id: 'motorcycle_mechanic',
      icon: Bike,
      title: 'Mecânico de Moto',
      subtitle: 'Especialista em motos',
      gradient: 'from-indigo-500 to-blue-600',
    },
  ];

  const handleNext = () => {
    onNext({
      type: selectedType,
      description: description,
    });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
      <div className="flex-1 overflow-y-auto pb-52">
        <div className="sticky top-0 bg-background/80 backdrop-blur-lg border-b z-10 p-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-back-from-service"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </button>
        </div>

        <div className="p-6 space-y-8 max-w-md mx-auto w-full">
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold tracking-tight" data-testid="text-service-heading">
              Qual serviço você precisa?
            </h2>
            <p className="text-muted-foreground text-lg">
              Selecione o tipo de assistência necessária
            </p>
          </div>

          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100">
            {serviceTypes.map((service, index) => {
              const Icon = service.icon;
              const isSelected = selectedType === service.id;
              
              return (
                <button
                  key={service.id}
                  onClick={() => setSelectedType(service.id)}
                  data-testid={`button-service-${service.id}`}
                  className={`w-full p-5 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]'
                      : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-semibold">{service.title}</h3>
                      <p className="text-sm text-muted-foreground">{service.subtitle}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                    }`}>
                      {isSelected && (
                        <div className="w-3 h-3 rounded-full bg-primary-foreground"></div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
            <Label htmlFor="description" className="text-base font-medium">
              Descreva o problema (opcional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Pneu furado, bateria descarregada..."
              rows={4}
              data-testid="textarea-description"
              className="resize-none rounded-2xl border-2 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          onClick={handleNext}
          className="w-full max-w-md mx-auto h-14 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all"
          data-testid="button-next-from-service"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}

interface PaymentStepProps {
  onNext: (data: PaymentData) => void;
  onBack: () => void;
}

export function PaymentStep({ onNext, onBack }: PaymentStepProps) {
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'pix'>('pix');

  const paymentMethods = [
    {
      id: 'pix' as const,
      icon: QrCode,
      title: 'PIX',
      subtitle: 'Pagamento instantâneo',
      recommended: true,
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      id: 'card' as const,
      icon: CreditCard,
      title: 'Cartão de Crédito',
      subtitle: 'Pagamento seguro',
      recommended: false,
      gradient: 'from-blue-500 to-indigo-500',
    },
  ];

  const handleNext = () => {
    onNext({ method: selectedMethod });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="sticky top-0 bg-background/80 backdrop-blur-lg border-b z-10 p-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-back-from-payment"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </button>
        </div>

        <div className="p-6 space-y-8 max-w-md mx-auto w-full">
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold tracking-tight" data-testid="text-payment-heading">
              Forma de pagamento
            </h2>
            <p className="text-muted-foreground text-lg">
              Escolha como deseja pagar pelo serviço
            </p>
          </div>

          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100">
            {paymentMethods.map((method, index) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  data-testid={`button-payment-${method.id}`}
                  className={`w-full p-5 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]'
                      : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {method.recommended && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                      Recomendado
                    </div>
                  )}
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${method.gradient} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-semibold">{method.title}</h3>
                      <p className="text-sm text-muted-foreground">{method.subtitle}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                    }`}>
                      {isSelected && (
                        <div className="w-3 h-3 rounded-full bg-primary-foreground"></div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-4 bg-muted/50 rounded-2xl animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
            <p className="text-sm text-muted-foreground text-center">
              💡 O valor do serviço será calculado após um mecânico aceitar sua chamada
            </p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          onClick={handleNext}
          className="w-full max-w-md mx-auto h-14 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all"
          data-testid="button-confirm-payment"
        >
          Solicitar Mecânico
        </Button>
      </div>
    </div>
  );
}
