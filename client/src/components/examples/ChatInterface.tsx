import { useState } from "react";
import { ChatInterface } from "../ChatInterface";
import mechanicAvatar from "@assets/generated_images/Professional_mechanic_avatar_53e71776.png";

export default function ChatInterfaceExample() {
  //TODO: remove mock functionality
  const [messages, setMessages] = useState([
    {
      id: "1",
      senderId: "provider-123",
      senderName: "Carlos Silva",
      content: "Olá! Estou a caminho do seu local. Chego em 10 minutos.",
      timestamp: "14:30",
      type: "text" as const,
    },
    {
      id: "2", 
      senderId: "client-456",
      senderName: "Ana Santos",
      content: "Perfeito! Estarei aguardando próximo ao poste azul.",
      timestamp: "14:32",
      type: "text" as const,
    },
    {
      id: "3",
      senderId: "provider-123", 
      senderName: "Carlos Silva",
      content: "Localização compartilhada",
      timestamp: "14:35",
      type: "location" as const,
    },
    {
      id: "4",
      senderId: "provider-123",
      senderName: "Carlos Silva", 
      content: "Serviço iniciado - Checando o problema",
      timestamp: "14:40",
      type: "status" as const,
    },
  ]);

  const handleSendMessage = (content: string) => {
    console.log("Sending message:", content);
    const newMessage = {
      id: Date.now().toString(),
      senderId: "client-456",
      senderName: "Ana Santos",
      content,
      timestamp: new Date().toLocaleTimeString("pt-BR", { 
        hour: "2-digit", 
        minute: "2-digit" 
      }),
      type: "text" as const,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendLocation = () => {
    console.log("Sending location");
    const newMessage = {
      id: Date.now().toString(),
      senderId: "client-456", 
      senderName: "Ana Santos",
      content: "Localização compartilhada",
      timestamp: new Date().toLocaleTimeString("pt-BR", { 
        hour: "2-digit", 
        minute: "2-digit" 
      }),
      type: "location" as const,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleCall = () => {
    console.log("Initiating call");
  };

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Chat Interface</h2>
      
      <ChatInterface
        serviceId="service-002"
        currentUserId="client-456"
        otherParticipant={{
          id: "provider-123",
          name: "Carlos Silva", 
          avatar: mechanicAvatar,
          role: "provider",
          status: "online",
        }}
        messages={messages}
        onSendMessage={handleSendMessage}
        onSendLocation={handleSendLocation}
        onCall={handleCall}
      />
    </div>
  );
}