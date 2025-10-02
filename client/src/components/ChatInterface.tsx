import { useState } from "react";
import { Send, Phone, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getFirstName } from "@/lib/utils";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: "text" | "location" | "status";
}

interface ChatInterfaceProps {
  serviceId: string;
  currentUserId: string;
  otherParticipant: {
    id: string;
    name: string;
    avatar?: string;
    role: "client" | "provider";
    status: "online" | "offline";
  };
  messages: Message[];
  onSendMessage: (content: string) => void;
  onSendLocation?: () => void;
  onCall?: () => void;
}

export function ChatInterface({
  serviceId,
  currentUserId,
  otherParticipant,
  messages,
  onSendMessage,
  onSendLocation,
  onCall,
}: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col h-full max-h-[600px]" data-testid={`chat-${serviceId}`}>
      {/* Chat Header */}
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipant.avatar} />
              <AvatarFallback>
                {otherParticipant.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{getFirstName(otherParticipant.name)}</h3>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    otherParticipant.status === "online" 
                      ? "text-service-available border-service-available" 
                      : "text-muted-foreground"
                  }`}
                >
                  {otherParticipant.status === "online" ? "Online" : "Offline"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {otherParticipant.role === "provider" ? "Prestador" : "Cliente"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            {onSendLocation && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onSendLocation}
                data-testid="send-location"
              >
                <MapPin className="h-4 w-4" />
              </Button>
            )}
            {onCall && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onCall}
                data-testid="call-button"
              >
                <Phone className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>Nenhuma mensagem ainda.</p>
            <p className="text-sm">Inicie a conversa!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === currentUserId;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isOwnMessage
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {!isOwnMessage && (
                    <p className="text-xs font-medium mb-1">{getFirstName(message.senderName)}</p>
                  )}
                  
                  {message.type === "location" ? (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Localização compartilhada</span>
                    </div>
                  ) : message.type === "status" ? (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{message.content}</span>
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                  
                  <p className={`text-xs mt-1 ${
                    isOwnMessage 
                      ? "text-primary-foreground/70" 
                      : "text-muted-foreground"
                  }`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1"
            data-testid="message-input"
          />
          <Button 
            onClick={handleSend}
            disabled={!newMessage.trim()}
            data-testid="send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}