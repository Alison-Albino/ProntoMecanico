import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocation } from 'wouter';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth } from '@/lib/fetch-with-auth';
import {
  AddressStep,
  ServiceTypeStep,
  PaymentStep,
  type AddressData,
  type ServiceData,
  type PaymentData,
} from '@/components/client-flow-steps';
import { VehicleSelection } from '@/components/VehicleSelection';
import { MechanicHome } from '@/components/mechanic-home';


const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

type Step = 'address' | 'service' | 'vehicle' | 'payment';

export interface VehicleData {
  brand: string;
  model: string;
  plate: string;
  year: string;
}

function ClientHome() {
  const { token } = useAuth();
  const [, setLocationPath] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('address');
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);

  const handleAddressNext = (data: AddressData) => {
    setAddressData(data);
    setCurrentStep('service');
  };

  const handleServiceNext = (data: ServiceData) => {
    setServiceData(data);
    setCurrentStep('vehicle');
  };

  const handleVehicleNext = (data: VehicleData) => {
    setVehicleData(data);
    setCurrentStep('payment');
  };

  const handlePaymentNext = async (paymentData: PaymentData) => {
    if (!addressData || !serviceData || !vehicleData) return;

    if (paymentData.method === 'pix') {
      localStorage.setItem('pendingServiceRequest', JSON.stringify({
        pickupLat: addressData.lat.toString(),
        pickupLng: addressData.lng.toString(),
        pickupAddress: addressData.address,
        serviceType: serviceData.type,
        description: serviceData.description || undefined,
        vehicleBrand: vehicleData.brand,
        vehicleModel: vehicleData.model,
        vehiclePlate: vehicleData.plate,
        vehicleYear: vehicleData.year,
      }));
      
      setLocationPath('/payment');
      return;
    }

    setIsCreatingRequest(true);

    try {
      const requestBody = {
        pickupLat: addressData.lat.toString(),
        pickupLng: addressData.lng.toString(),
        pickupAddress: addressData.address,
        serviceType: serviceData.type,
        description: serviceData.description || undefined,
        vehicleBrand: vehicleData.brand,
        vehicleModel: vehicleData.model,
        vehiclePlate: vehicleData.plate,
        vehicleYear: vehicleData.year,
        paymentMethod: paymentData.method,
      };

      const response = await fetchWithAuth('/api/service-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar solicitação');
      }

      const serviceRequest = await response.json();

      toast({
        title: 'Solicitação criada!',
        description: 'Procurando mecânicos disponíveis...',
      });

      setLocationPath(`/ride/${serviceRequest.id}`);
    } catch (error: any) {
      console.error('Error creating request:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar a solicitação',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingRequest(false);
    }
  };

  const handleBackFromService = () => {
    setCurrentStep('address');
  };

  const handleBackFromVehicle = () => {
    setCurrentStep('service');
  };

  const handleBackFromPayment = () => {
    setCurrentStep('vehicle');
  };

  return (
    <div className="h-full bg-background flex flex-col">
      {currentStep === 'address' && (
        <AddressStep onNext={handleAddressNext} initialAddress={addressData?.address} />
      )}
      {currentStep === 'service' && (
        <ServiceTypeStep onNext={handleServiceNext} onBack={handleBackFromService} />
      )}
      {currentStep === 'vehicle' && (
        <VehicleSelection onNext={handleVehicleNext} onBack={handleBackFromVehicle} />
      )}
      {currentStep === 'payment' && !isCreatingRequest && (
        <PaymentStep onNext={handlePaymentNext} onBack={handleBackFromPayment} />
      )}
      {isCreatingRequest && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-lg font-semibold">Criando solicitação...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-destructive">
          Chave da API do Google Maps não configurada
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places', 'geocoding']}>
      {user.userType === 'client' ? <ClientHome /> : <MechanicHome />}
    </APIProvider>
  );
}
