import { Clock, MapPin, User, Wrench, Phone, MessageSquare } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type ServiceStatus = "pending" | "accepted" | "in-transit" | "completed";
export type ServiceType = "tow" | "mechanic" | "emergency";

interface ServiceRequestCardProps {
  id: string;
  serviceType: ServiceType;
  status: ServiceStatus;
  fromAddress: string;
  toAddress?: string;
  description: string;
  requestTime: string;
  estimatedPrice?: string;
  providerName?: string;
  providerAvatar?: string;
  providerRating?: number;
  estimatedArrival?: string;
  distance?: string;
  onAccept?: () => void;
  onReject?: () => void;
  onChat?: () => void;
  onCall?: () => void;
  viewType: "client" | "provider";
}

const statusConfig = {
  pending: { label: "Pendente", color: "bg-muted-foreground" },
  accepted: { label: "Aceito", color: "bg-service-available" },
  "in-transit": { label: "Em Trânsito", color: "bg-service-transit" },
  completed: { label: "Concluído", color: "bg-service-available" },
};

const serviceConfig = {
  tow: { label: "Guincho", icon: Wrench },
  mechanic: { label: "Mecânico", icon: Wrench },
  emergency: { label: "Emergência", icon: Phone },
};

export function ServiceRequestCard({
  id,
  serviceType,
  status,
  fromAddress,
  toAddress,
  description,
  requestTime,
  estimatedPrice,
  providerName,
  providerAvatar,
  providerRating,
  estimatedArrival,
  distance,
  onAccept,
  onReject,
  onChat,
  onCall,
  viewType,
}: ServiceRequestCardProps) {
  const statusStyle = statusConfig[status];
  const serviceStyle = serviceConfig[serviceType];
  const ServiceIcon = serviceStyle.icon;

  return (
    <Card className="w-full hover-elevate" data-testid={`service-card-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <ServiceIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{serviceStyle.label}</h3>
              <p className="text-sm text-muted-foreground">#{id.slice(-6)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`${statusStyle.color} text-white`}>
              {statusStyle.label}
            </Badge>
            {serviceType === "emergency" && (
              <Badge className="bg-service-emergency text-white">
                Urgente
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Origem</p>
              <p className="text-sm text-muted-foreground">{fromAddress}</p>
            </div>
          </div>
          {toAddress && (
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Destino</p>
                <p className="text-sm text-muted-foreground">{toAddress}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm">{description}</p>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{requestTime}</span>
          </div>
          {distance && (
            <div className="flex items-center space-x-1">
              <MapPin className="h-3 w-3" />
              <span>{distance}</span>
            </div>
          )}
        </div>

        {providerName && (
          <div className="flex items-center space-x-3 p-3 bg-card rounded-lg border">
            <Avatar className="h-10 w-10">
              <AvatarImage src={providerAvatar} />
              <AvatarFallback>
                {providerName.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{providerName}</p>
              <div className="flex items-center space-x-1">
                <span className="text-sm text-muted-foreground">
                  ⭐ {providerRating}/5.0
                </span>
                {estimatedArrival && (
                  <span className="text-sm text-service-transit">
                    • Chega em {estimatedArrival}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {estimatedPrice && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Preço estimado</p>
            <p className="text-lg font-bold text-primary">{estimatedPrice}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        {viewType === "provider" && status === "pending" && (
          <div className="flex space-x-2 w-full">
            <Button 
              variant="outline" 
              onClick={onReject}
              className="flex-1"
              data-testid={`reject-${id}`}
            >
              Recusar
            </Button>
            <Button 
              onClick={onAccept}
              className="flex-1"
              data-testid={`accept-${id}`}
            >
              Aceitar
            </Button>
          </div>
        )}

        {(status === "accepted" || status === "in-transit") && (
          <div className="flex space-x-2 w-full">
            <Button 
              variant="outline" 
              onClick={onChat}
              className="flex-1"
              data-testid={`chat-${id}`}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </Button>
            <Button 
              variant="outline" 
              onClick={onCall}
              className="flex-1"
              data-testid={`call-${id}`}
            >
              <Phone className="h-4 w-4 mr-2" />
              Ligar
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}