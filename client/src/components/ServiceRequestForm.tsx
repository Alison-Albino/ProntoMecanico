import { useState } from "react";
import { MapPin, Wrench, Phone, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface ServiceRequestFormProps {
  onSubmit: (requestData: ServiceRequestData) => void;
  onCancel: () => void;
}

export interface ServiceRequestData {
  serviceType: "tow" | "mechanic" | "emergency";
  fromAddress: string;
  toAddress?: string;
  description: string;
  urgency: "normal" | "urgent";
  needsDestination: boolean;
  contactPhone: string;
}

export function ServiceRequestForm({ onSubmit, onCancel }: ServiceRequestFormProps) {
  const [formData, setFormData] = useState<ServiceRequestData>({
    serviceType: "mechanic",
    fromAddress: "",
    toAddress: "",
    description: "",
    urgency: "normal",
    needsDestination: false,
    contactPhone: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    console.log("Submitting service request:", formData);
    
    try {
      // TODO: Remove mock functionality
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ServiceRequestData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getCurrentLocation = () => {
    // TODO: Integrate with geolocation API
    console.log("Getting current location");
    handleInputChange("fromAddress", "Sua localização atual (GPS)");
  };

  const serviceTypes = [
    {
      id: "mechanic",
      label: "Mecânico",
      description: "Reparo no local",
      icon: Wrench,
    },
    {
      id: "tow", 
      label: "Guincho",
      description: "Remoção do veículo",
      icon: Wrench,
    },
    {
      id: "emergency",
      label: "Emergência",
      description: "Atendimento urgente",
      icon: Phone,
    },
  ];

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wrench className="h-6 w-6 text-primary" />
          <span>Solicitar Serviço</span>
        </CardTitle>
        <p className="text-muted-foreground">
          Preencha os dados para solicitar um serviço
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Type */}
          <div>
            <Label className="text-base font-medium">Tipo de Serviço</Label>
            <RadioGroup
              value={formData.serviceType}
              onValueChange={(value) => handleInputChange("serviceType", value)}
              className="mt-2"
            >
              {serviceTypes.map((service) => {
                const Icon = service.icon;
                return (
                  <div 
                    key={service.id}
                    className="flex items-center space-x-3 rounded-lg border p-4 hover-elevate"
                    data-testid={`service-type-${service.id}`}
                  >
                    <RadioGroupItem value={service.id} id={service.id} />
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <Label htmlFor={service.id} className="font-medium cursor-pointer">
                          {service.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* From Address */}
          <div>
            <Label htmlFor="fromAddress">Local Atual</Label>
            <div className="flex space-x-2 mt-1">
              <Input
                id="fromAddress"
                value={formData.fromAddress}
                onChange={(e) => handleInputChange("fromAddress", e.target.value)}
                placeholder="Digite o endereço ou use GPS"
                required
                data-testid="input-from-address"
              />
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                data-testid="get-location"
              >
                <MapPin className="h-4 w-4" />
                GPS
              </Button>
            </div>
          </div>

          {/* Destination Address */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="needsDestination"
                checked={formData.needsDestination}
                onCheckedChange={(checked) => handleInputChange("needsDestination", checked)}
                data-testid="needs-destination"
              />
              <Label htmlFor="needsDestination">Preciso de transporte para outro local</Label>
            </div>
            
            {formData.needsDestination && (
              <Input
                value={formData.toAddress || ""}
                onChange={(e) => handleInputChange("toAddress", e.target.value)}
                placeholder="Endereço de destino"
                data-testid="input-to-address"
              />
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Descrição do Problema</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descreva detalhadamente o problema com seu veículo..."
              className="mt-1"
              rows={4}
              required
              data-testid="input-description"
            />
          </div>

          {/* Contact Phone */}
          <div>
            <Label htmlFor="contactPhone">Telefone de Contato</Label>
            <Input
              id="contactPhone"
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => handleInputChange("contactPhone", e.target.value)}
              placeholder="(11) 99999-9999"
              required
              data-testid="input-phone"
            />
          </div>

          {/* Urgency */}
          <div>
            <Label className="text-base font-medium">Urgência</Label>
            <RadioGroup
              value={formData.urgency}
              onValueChange={(value) => handleInputChange("urgency", value)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="normal" />
                <Label htmlFor="normal">Normal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="urgent" id="urgent" />
                <Label htmlFor="urgent" className="flex items-center space-x-2">
                  <span>Urgente</span>
                  <AlertCircle className="h-4 w-4 text-service-emergency" />
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Emergency Warning */}
          {formData.serviceType === "emergency" && (
            <div className="p-4 bg-service-emergency/10 border border-service-emergency/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-service-emergency mt-0.5" />
                <div>
                  <p className="font-medium text-service-emergency">Serviço de Emergência</p>
                  <p className="text-sm text-muted-foreground">
                    Este pedido será tratado com prioridade máxima. Você será contactado em até 2 minutos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              data-testid="cancel-request"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
              data-testid="submit-request"
            >
              {isSubmitting ? "Enviando..." : "Solicitar Serviço"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}