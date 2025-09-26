import { useState } from "react";
import { MapPin, Clock, Phone, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ServiceRequest {
  id: string;
  clientName: string;
  serviceType: "tow" | "mechanic" | "emergency";
  location: string;
  description: string;
  distance: string;
  estimatedPay: string;
  urgency: "low" | "medium" | "high";
  requestTime: string;
}

interface ActiveService {
  id: string;
  clientName: string;
  serviceType: "tow" | "mechanic" | "emergency";
  fromLocation: string;
  toLocation?: string;
  description: string;
  status: "accepted" | "in-transit" | "working";
  startTime: string;
  estimatedCompletion: string;
}

interface ProviderDashboardProps {
  providerName: string;
  isOnline: boolean;
  onToggleStatus: (online: boolean) => void;
  availableRequests: ServiceRequest[];
  activeService?: ActiveService;
  onAcceptRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onUpdateStatus: (status: string) => void;
  onCompleteService: () => void;
  onChat: () => void;
  onCall: () => void;
}

const urgencyConfig = {
  low: { label: "Baixa", color: "bg-muted-foreground" },
  medium: { label: "Média", color: "bg-service-transit" },
  high: { label: "Alta", color: "bg-service-emergency" },
};

const serviceTypeLabels = {
  tow: "Guincho",
  mechanic: "Mecânico", 
  emergency: "Emergência",
};

export function ProviderDashboard({
  providerName,
  isOnline,
  onToggleStatus,
  availableRequests,
  activeService,
  onAcceptRequest,
  onRejectRequest,
  onUpdateStatus,
  onCompleteService,
  onChat,
  onCall,
}: ProviderDashboardProps) {
  const [selectedTab, setSelectedTab] = useState("available");

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bem-vindo, {providerName}</CardTitle>
              <p className="text-muted-foreground">
                {isOnline ? "Você está online e disponível" : "Você está offline"}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="status-toggle">Status</Label>
              <Switch
                id="status-toggle"
                checked={isOnline}
                onCheckedChange={onToggleStatus}
                data-testid="status-toggle"
              />
              <Badge className={isOnline ? "bg-service-available" : "bg-muted-foreground"}>
                {isOnline ? "Online" : "Offline"}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Active Service */}
      {activeService && (
        <Card className="border-service-available">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-service-available" />
              <span>Serviço Ativo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">{activeService.clientName}</p>
                <p className="text-sm text-muted-foreground">
                  {serviceTypeLabels[activeService.serviceType]} • #{activeService.id.slice(-6)}
                </p>
              </div>
              <div className="text-right">
                <Badge className="bg-service-available">
                  {activeService.status === "accepted" && "Aceito"}
                  {activeService.status === "in-transit" && "Em Trânsito"}
                  {activeService.status === "working" && "Trabalhando"}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Origem</p>
                  <p className="text-sm text-muted-foreground">{activeService.fromLocation}</p>
                </div>
              </div>
              {activeService.toLocation && (
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Destino</p>
                    <p className="text-sm text-muted-foreground">{activeService.toLocation}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">{activeService.description}</p>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Iniciado às {activeService.startTime}</span>
              </div>
              <span className="text-muted-foreground">
                Previsão: {activeService.estimatedCompletion}
              </span>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={onChat}
                className="flex-1"
                data-testid="active-chat"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </Button>
              <Button
                variant="outline"
                onClick={onCall}
                className="flex-1"
                data-testid="active-call"
              >
                <Phone className="h-4 w-4 mr-2" />
                Ligar
              </Button>
              {activeService.status === "working" && (
                <Button
                  onClick={onCompleteService}
                  className="flex-1"
                  data-testid="complete-service"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Concluir
                </Button>
              )}
            </div>

            {activeService.status !== "working" && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => onUpdateStatus("in-transit")}
                  disabled={activeService.status !== "accepted"}
                  data-testid="start-transit"
                >
                  Iniciar Trânsito
                </Button>
                <Button
                  onClick={() => onUpdateStatus("working")}
                  disabled={activeService.status !== "in-transit"}
                  data-testid="start-working"
                >
                  Iniciar Trabalho
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Requests */}
      {!activeService && (
        <Card>
          <CardHeader>
            <CardTitle>Solicitações Disponíveis</CardTitle>
            <p className="text-muted-foreground">
              {availableRequests.length} solicitações próximas a você
            </p>
          </CardHeader>
          <CardContent>
            {availableRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma solicitação disponível no momento.</p>
                <p className="text-sm">Novas solicitações aparecerão aqui automaticamente.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableRequests.map((request) => {
                  const urgencyStyle = urgencyConfig[request.urgency];
                  
                  return (
                    <Card key={request.id} className="hover-elevate">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{request.clientName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {serviceTypeLabels[request.serviceType]} • #{request.id.slice(-6)}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Badge className={`${urgencyStyle.color} text-white`}>
                              {urgencyStyle.label}
                            </Badge>
                            {request.serviceType === "emergency" && (
                              <Badge className="bg-service-emergency text-white">
                                Urgente
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Local</p>
                              <p className="text-sm text-muted-foreground">{request.location}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-2 bg-muted rounded text-sm mb-3">
                          {request.description}
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{request.distance}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{request.requestTime}</span>
                            </div>
                          </div>
                          <span className="font-medium text-foreground">
                            {request.estimatedPay}
                          </span>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => onRejectRequest(request.id)}
                            className="flex-1"
                            data-testid={`reject-${request.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Recusar
                          </Button>
                          <Button
                            onClick={() => onAcceptRequest(request.id)}
                            className="flex-1"
                            data-testid={`accept-${request.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aceitar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}