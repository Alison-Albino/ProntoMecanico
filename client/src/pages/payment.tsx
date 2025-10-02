import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, QrCode, Copy, CheckCircle2 } from 'lucide-react';

interface ServiceData {
  serviceType: string;
  pickupLat: string;
  pickupLng: string;
  pickupAddress: string;
  description?: string;
}

export default function PaymentPage() {
  const [, setLocation] = useLocation();
  const { token } = useAuth();
  const { toast } = useToast();
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string; paymentId: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'failed'>('pending');
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    if (pixData && paymentStatus === 'pending') {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/payments/status/${pixData.paymentId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const result = await response.json();
            
            if (result.status === 'approved') {
              setPaymentStatus('approved');
              clearInterval(interval);
              
              const serviceResponse = await fetch('/api/service-requests', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  ...serviceData,
                  paymentId: pixData.paymentId,
                }),
              });

              if (!serviceResponse.ok) {
                throw new Error('Erro ao criar chamada');
              }

              const serviceRequest = await serviceResponse.json();
              toast({
                title: "Pagamento confirmado!",
                description: "Procurando mecânicos próximos...",
              });
              
              localStorage.removeItem('pendingServiceRequest');
              setLocation(`/waiting/${serviceRequest.id}`);
            }
          }
        } catch (error) {
          console.error('Erro ao verificar status do pagamento:', error);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [pixData, paymentStatus, serviceData, token, toast, setLocation]);

  const preparePayment = async (data: ServiceData) => {
    try {
      const response = await fetch('/api/payments/create-pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: 50,
          description: `Serviço de ${data.serviceType} - ${data.pickupAddress}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao preparar pagamento');
      }

      const result = await response.json();
      setPixData({
        qrCode: result.qrCode,
        qrCodeBase64: result.qrCodeBase64,
        paymentId: result.paymentId,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      setLocation('/');
    }
  };

  const copyToClipboard = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "Código PIX copiado para a área de transferência",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!serviceData || !pixData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle data-testid="text-title">Pagamento PIX</CardTitle>
          <p className="text-sm text-muted-foreground">
            Valor: R$ 50,00
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

          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg">
              {pixData.qrCodeBase64 ? (
                <img 
                  src={`data:image/png;base64,${pixData.qrCodeBase64}`} 
                  alt="QR Code PIX"
                  className="w-64 h-64"
                  data-testid="img-qrcode"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-muted rounded">
                  <QrCode className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-center">
                Ou copie o código PIX:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pixData.qrCode}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                  data-testid="input-pix-code"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  data-testid="button-copy"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {paymentStatus === 'pending' && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Aguardando pagamento...</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  localStorage.removeItem('pendingServiceRequest');
                  setLocation('/');
                }}
                disabled={isProcessing}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
