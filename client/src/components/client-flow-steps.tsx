import { useState, useEffect, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Wrench, Truck, AlertCircle, CreditCard, QrCode, ArrowLeft } from 'lucide-react';

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
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col justify-center p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold" data-testid="text-address-heading">
            Para onde você precisa de ajuda?
          </h2>
          <p className="text-muted-foreground">
            Digite o endereço onde você está ou onde precisa de assistência
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center pointer-events-none">
              <MapPin className="w-3 h-3 text-primary" />
            </div>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite um endereço..."
              data-testid="input-pickup-address"
              autoComplete="off"
              className="flex h-14 w-full rounded-lg border border-input bg-background pl-11 pr-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Button
            variant="outline"
            onClick={getUserLocation}
            disabled={isGettingLocation}
            className="w-full"
            data-testid="button-use-current-location"
          >
            <MapPin className="w-4 h-4 mr-2" />
            {isGettingLocation ? 'Obtendo localização...' : 'Usar localização atual'}
          </Button>
        </div>
      </div>

      <div className="p-6 border-t">
        <Button
          onClick={handleNext}
          disabled={!isValid}
          className="w-full h-12 text-base"
          data-testid="button-next-from-address"
        >
          Continuar
        </Button>
      </div>
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
      subtitle: 'Assistência mecânica no local',
    },
    {
      id: 'tow_truck',
      icon: Truck,
      title: 'Guincho',
      subtitle: 'Reboque do veículo',
    },
    {
      id: 'road_assistance',
      icon: AlertCircle,
      title: 'Assistência 24h',
      subtitle: 'Diversos serviços emergenciais',
    },
  ];

  const handleNext = () => {
    onNext({
      type: selectedType,
      description,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            data-testid="button-back-from-service"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold" data-testid="text-service-heading">
              Qual serviço você precisa?
            </h2>
          </div>
        </div>

        <div className="space-y-3">
          {serviceTypes.map((service) => {
            const Icon = service.icon;
            const isSelected = selectedType === service.id;
            
            return (
              <Card
                key={service.id}
                className={`cursor-pointer transition-all hover-elevate ${
                  isSelected ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setSelectedType(service.id)}
                data-testid={`card-service-${service.id}`}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{service.title}</h3>
                    <p className="text-sm text-muted-foreground">{service.subtitle}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descreva o problema (opcional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Pneu furado, bateria descarregada, motor não liga..."
            rows={3}
            data-testid="textarea-service-description"
          />
        </div>
      </div>

      <div className="p-6 border-t">
        <Button
          onClick={handleNext}
          className="w-full h-12 text-base"
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
  estimatedPrice?: number;
}

export function PaymentStep({ onNext, onBack, estimatedPrice }: PaymentStepProps) {
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'pix'>('pix');

  const paymentMethods = [
    {
      id: 'pix' as const,
      icon: QrCode,
      title: 'PIX',
      subtitle: 'Pagamento instantâneo via QR Code',
      recommended: true,
    },
    {
      id: 'card' as const,
      icon: CreditCard,
      title: 'Cartão de Crédito',
      subtitle: 'Pagamento com cartão',
      recommended: false,
    },
  ];

  const handleNext = () => {
    onNext({
      method: selectedMethod,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            data-testid="button-back-from-payment"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold" data-testid="text-payment-heading">
              Como você quer pagar?
            </h2>
          </div>
        </div>

        {estimatedPrice && (
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Valor estimado</span>
                <span className="text-2xl font-bold">
                  R$ {estimatedPrice.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Valor final pode variar baseado na distância
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedMethod === method.id;
            
            return (
              <Card
                key={method.id}
                className={`cursor-pointer transition-all hover-elevate ${
                  isSelected ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setSelectedMethod(method.id)}
                data-testid={`card-payment-${method.id}`}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{method.title}</h3>
                      {method.recommended && (
                        <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                          Recomendado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{method.subtitle}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• O pagamento só será processado após a confirmação do serviço</p>
          <p>• Você pode cancelar gratuitamente antes do mecânico aceitar</p>
        </div>
      </div>

      <div className="p-6 border-t">
        <Button
          onClick={handleNext}
          className="w-full h-12 text-base"
          data-testid="button-confirm-request"
        >
          Solicitar Serviço
        </Button>
      </div>
    </div>
  );
}
