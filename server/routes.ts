import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  loginSchema, 
  insertServiceRequestSchema,
  insertChatMessageSchema,
  type User 
} from "@shared/schema";
import bcrypt from "bcrypt";
import { WebSocketServer } from "ws";
import { createPaymentIntent, confirmPayment } from "./stripe";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const sessions = new Map<string, User>();

function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

async function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Não autorizado" });
  }

  const token = authHeader.substring(7);
  const user = sessions.get(token);

  if (!user) {
    return res.status(401).json({ message: "Sessão inválida" });
  }

  req.user = user;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const clients = new Map<string, any>();

  wss.on('connection', (ws, req) => {
    const token = new URL(req.url || '', `http://${req.headers.host}`).searchParams.get('token');
    
    if (token) {
      const user = sessions.get(token);
      if (user) {
        clients.set(user.id, ws);
        
        ws.on('close', () => {
          clients.delete(user.id);
          storage.updateUserOnlineStatus(user.id, false);
        });

        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message.toString());
            
            if (data.type === 'location_update') {
              storage.updateUserLocation(user.id, data.lat, data.lng);
            }
          } catch (e) {
            console.error('WebSocket message error:', e);
          }
        });
      }
    }
  });

  function broadcastToUser(userId: string, data: any) {
    const client = clients.get(userId);
    if (client && client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  }

  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Usuário já existe" });
      }

      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }

      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      const { password, ...userWithoutPassword } = user;
      const token = generateSessionToken();
      sessions.set(token, user);

      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        return res.status(401).json({ message: "Usuário ou senha inválidos" });
      }

      const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Usuário ou senha inválidos" });
      }

      await storage.updateUserOnlineStatus(user.id, true);

      const { password, ...userWithoutPassword } = user;
      const token = generateSessionToken();
      sessions.set(token, user);

      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", authMiddleware, async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);
    
    if (token) {
      if (req.user) {
        await storage.updateUserOnlineStatus(req.user.id, false);
      }
      sessions.delete(token);
    }

    res.json({ message: "Logout realizado com sucesso" });
  });

  app.get("/api/auth/me", authMiddleware, (req, res) => {
    const { password, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });

  app.post("/api/location/update", authMiddleware, async (req, res) => {
    try {
      const { lat, lng } = req.body;
      await storage.updateUserLocation(req.user!.id, lat, lng);
      res.json({ message: "Localização atualizada" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/mechanics/online", authMiddleware, async (req, res) => {
    try {
      const mechanics = await storage.getOnlineMechanics();
      const mechanicsWithoutPassword = mechanics.map(({ password, ...m }) => m);
      res.json(mechanicsWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/service-requests", authMiddleware, async (req, res) => {
    try {
      const validatedData = insertServiceRequestSchema.parse({
        ...req.body,
        clientId: req.user!.id,
      });
      
      const serviceRequest = await storage.createServiceRequest(validatedData);

      const mechanics = await storage.getOnlineMechanics();
      mechanics.forEach(mechanic => {
        broadcastToUser(mechanic.id, {
          type: 'new_service_request',
          data: serviceRequest,
        });
      });

      res.json(serviceRequest);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/service-requests/pending", authMiddleware, async (req, res) => {
    try {
      if (req.user!.userType !== 'mechanic') {
        return res.status(403).json({ message: "Apenas mecânicos podem ver chamadas pendentes" });
      }

      const requests = await storage.getPendingServiceRequests();
      res.json(requests);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/service-requests/my", authMiddleware, async (req, res) => {
    try {
      const requests = await storage.getUserServiceRequests(req.user!.id);
      res.json(requests);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/service-requests/:id", authMiddleware, async (req, res) => {
    try {
      const request = await storage.getServiceRequest(req.params.id);
      
      if (!request) {
        return res.status(404).json({ message: "Chamada não encontrada" });
      }

      if (request.clientId !== req.user!.id && request.mechanicId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      res.json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/service-requests/:id/accept", authMiddleware, async (req, res) => {
    try {
      if (req.user!.userType !== 'mechanic') {
        return res.status(403).json({ message: "Apenas mecânicos podem aceitar chamadas" });
      }

      if (!req.user!.isOnline) {
        return res.status(400).json({ message: "Você precisa estar online para aceitar chamadas" });
      }

      const request = await storage.getServiceRequest(req.params.id);
      
      if (!request) {
        return res.status(404).json({ message: "Chamada não encontrada" });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ message: "Chamada já foi aceita ou finalizada" });
      }

      const { distance } = req.body;
      const distanceFee = distance * 6;
      const totalPrice = 50 + distanceFee;

      const updated = await storage.updateServiceRequest(req.params.id, {
        mechanicId: req.user!.id,
        status: 'accepted',
        acceptedAt: new Date(),
        distance: distance.toString(),
        distanceFee: distanceFee.toString(),
        totalPrice: totalPrice.toString(),
      });

      broadcastToUser(request.clientId, {
        type: 'service_request_accepted',
        data: updated,
      });

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/service-requests/:id/complete", authMiddleware, async (req, res) => {
    try {
      const request = await storage.getServiceRequest(req.params.id);
      
      if (!request) {
        return res.status(404).json({ message: "Chamada não encontrada" });
      }

      if (request.mechanicId !== req.user!.id) {
        return res.status(403).json({ message: "Apenas o mecânico responsável pode finalizar" });
      }

      const updated = await storage.updateServiceRequest(req.params.id, {
        status: 'completed',
        completedAt: new Date(),
      });

      broadcastToUser(request.clientId, {
        type: 'service_request_completed',
        data: updated,
      });

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/chat/messages", authMiddleware, async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse({
        ...req.body,
        senderId: req.user!.id,
      });

      const serviceRequest = await storage.getServiceRequest(validatedData.serviceRequestId);
      if (!serviceRequest) {
        return res.status(404).json({ message: "Chamada não encontrada" });
      }

      if (serviceRequest.clientId !== req.user!.id && serviceRequest.mechanicId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const message = await storage.createChatMessage(validatedData);

      const recipientId = serviceRequest.clientId === req.user!.id 
        ? serviceRequest.mechanicId 
        : serviceRequest.clientId;

      if (recipientId) {
        broadcastToUser(recipientId, {
          type: 'new_chat_message',
          data: message,
        });
      }

      res.json(message);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/chat/messages/:serviceRequestId", authMiddleware, async (req, res) => {
    try {
      const serviceRequest = await storage.getServiceRequest(req.params.serviceRequestId);
      
      if (!serviceRequest) {
        return res.status(404).json({ message: "Chamada não encontrada" });
      }

      if (serviceRequest.clientId !== req.user!.id && serviceRequest.mechanicId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const messages = await storage.getChatMessages(req.params.serviceRequestId);
      res.json(messages);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/payments/create-intent", authMiddleware, async (req, res) => {
    try {
      const { serviceRequestId } = req.body;
      
      const serviceRequest = await storage.getServiceRequest(serviceRequestId);
      
      if (!serviceRequest) {
        return res.status(404).json({ message: "Chamada não encontrada" });
      }

      if (serviceRequest.clientId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      if (!serviceRequest.totalPrice) {
        return res.status(400).json({ message: "Preço total não calculado" });
      }

      const amount = parseFloat(serviceRequest.totalPrice);
      const paymentIntent = await createPaymentIntent(
        amount,
        `Serviço: ${serviceRequest.serviceType} - ${serviceRequest.pickupAddress}`
      );

      await storage.updateServiceRequest(serviceRequestId, {
        paymentIntentId: paymentIntent.id,
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/payments/confirm", authMiddleware, async (req, res) => {
    try {
      const { serviceRequestId } = req.body;
      
      const serviceRequest = await storage.getServiceRequest(serviceRequestId);
      
      if (!serviceRequest) {
        return res.status(404).json({ message: "Chamada não encontrada" });
      }

      if (serviceRequest.clientId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      if (!serviceRequest.paymentIntentId) {
        return res.status(400).json({ message: "Payment intent não encontrado" });
      }

      const paymentIntent = await confirmPayment(serviceRequest.paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        await storage.updateServiceRequest(serviceRequestId, {
          paymentStatus: 'paid',
        });

        res.json({ status: 'success', message: 'Pagamento confirmado' });
      } else {
        res.json({ status: paymentIntent.status });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  return httpServer;
}
