import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PaymentElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ArrowLeft, Loader2 } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentFormProps {
  serviceData: {
    serviceType: string;
    pickupLat: string;
    pickupLng: string;
    pickupAddress: string;
    description?: string;
  };
}

function PaymentForm({ serviceData }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const { token } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent) {
        if (paymentIntent.status === 'succeeded') {
          const response = await fetch('/api/service-requests', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              ...serviceData,
              paymentIntentId: paymentIntent.id,
            }),
          });

          if (!response.ok) {
            throw new Error('Erro ao criar chamada');
          }

          const serviceRequest = await response.json();
          toast({
            title: "Pagamento confirmado",
            description: "Procurando mecânicos próximos...",
          });
          
          localStorage.removeItem('pendingServiceRequest');
          setLocation(`/waiting/${serviceRequest.id}`);
        } else if (paymentIntent.status === 'processing') {
          toast({
            title: "Pagamento em processamento",
            description: "Seu pagamento está sendo processado. Por favor, aguarde...",
          });
          setIsProcessing(false);
        } else if (paymentIntent.status === 'requires_action') {
          toast({
            title: "Ação necessária",
            description: "Por favor, complete a autenticação do pagamento",
          });
          setIsProcessing(false);
        } else {
          throw new Error(`Status de pagamento inesperado: ${paymentIntent.status}`);
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro no pagamento",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setLocation('/')}
          disabled={isProcessing}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
          data-testid="button-pay"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            'Pagar e Solicitar'
          )}
        </Button>
      </div>
    </form>
  );
}

export default function PaymentPage() {
  const [, setLocation] = useLocation();
  const { token } = useAuth();
  const { toast } = useToast();
  const [serviceData, setServiceData] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    const storedData = localStorage.getItem('pendingServiceRequest');
    if (storedData) {
      const data = JSON.parse(storedData);
      setServiceData(data);
      preparePayment(data);
    } else {
      setLocation('/');
    }
  }, []);

  const preparePayment = async (data: any) => {
    try {
      const response = await fetch('/api/payments/prepare-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao preparar pagamento');
      }

      const result = await response.json();
      setClientSecret(result.clientSecret);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      setLocation('/');
    }
  };

  if (!serviceData || !clientSecret) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle data-testid="text-title">Pagamento do Serviço</CardTitle>
          <p className="text-sm text-muted-foreground">
            Valor estimado: R$ 50,00 base + R$ 6,00/km
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-muted rounded-md">
            <p className="text-sm font-medium mb-2">Detalhes do serviço:</p>
            <p className="text-sm text-muted-foreground">{serviceData.pickupAddress}</p>
            {serviceData.description && (
              <p className="text-sm text-muted-foreground mt-1">{serviceData.description}</p>
            )}
          </div>

          <Elements stripe={stripePromise} options={options}>
            <PaymentForm serviceData={serviceData} />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}
