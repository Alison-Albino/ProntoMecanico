import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  loginSchema, 
  insertServiceRequestSchema,
  insertChatMessageSchema,
  bankDataSchema,
  ratingSchema,
  baseAddressSchema,
  type User 
} from "@shared/schema";
import bcrypt from "bcrypt";
import { WebSocketServer } from "ws";
import { createPixPayment, getPaymentStatus, createPixPayout, simulatePaymentApproval } from "./mercadopago";

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

      if (user.userType === 'mechanic') {
        await storage.updateUserOnlineStatus(user.id, true);
      }

      const updatedUser = await storage.getUser(user.id);
      const finalUser = updatedUser || user;

      const { password, ...userWithoutPassword } = finalUser;
      const token = generateSessionToken();
      sessions.set(token, finalUser);

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

      if (user.userType === 'mechanic') {
        await storage.updateUserOnlineStatus(user.id, true);
      }

      const updatedUser = await storage.getUser(user.id);
      const finalUser = updatedUser || user;

      const { password, ...userWithoutPassword } = finalUser;
      const token = generateSessionToken();
      sessions.set(token, finalUser);

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

  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.post("/api/auth/toggle-online", authMiddleware, async (req, res) => {
    try {
      if (req.user!.userType !== 'mechanic') {
        return res.status(403).json({ message: "Apenas mecânicos podem alterar status online" });
      }

      const { isOnline } = req.body;
      await storage.updateUserOnlineStatus(req.user!.id, isOnline);
      
      const authHeader = req.headers.authorization;
      const token = authHeader?.substring(7);
      
      const updatedUser = await storage.getUser(req.user!.id);
      if (updatedUser && token) {
        sessions.set(token, updatedUser);
      }

      res.json({ isOnline });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
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

  app.get("/api/mechanics/nearby", authMiddleware, async (req, res) => {
    try {
      const { lat, lng, radius = 10 } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude e longitude são obrigatórias" });
      }

      const mechanics = await storage.getOnlineMechanicsNearby(
        parseFloat(lat as string),
        parseFloat(lng as string),
        parseFloat(radius as string)
      );
      
      const mechanicsWithoutPassword = mechanics.map(({ password, ...m }) => m);
      res.json(mechanicsWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/service-requests", authMiddleware, async (req, res) => {
    try {
      const { paymentId, ...requestData } = req.body;

      if (!paymentId) {
        return res.status(400).json({ message: "Pagamento obrigatório" });
      }

      const paymentStatus = await getPaymentStatus(paymentId);
      
      if (paymentStatus.status !== 'approved') {
        return res.status(400).json({ message: "Pagamento não confirmado" });
      }

      const validatedData = insertServiceRequestSchema.parse({
        ...requestData,
        clientId: req.user!.id,
        pixPaymentId: paymentId,
        paymentStatus: 'paid',
        paymentMethod: 'pix',
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

      if (!req.user!.baseLat || !req.user!.baseLng) {
        return res.json([]);
      }

      const mechanicLat = parseFloat(req.user!.baseLat);
      const mechanicLng = parseFloat(req.user!.baseLng);
      const MAX_RADIUS_KM = 50;

      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };

      const allRequests = await storage.getPendingServiceRequests();
      
      const nearbyRequests = allRequests.filter(request => {
        const requestLat = parseFloat(request.pickupLat);
        const requestLng = parseFloat(request.pickupLng);
        const distance = calculateDistance(mechanicLat, mechanicLng, requestLat, requestLng);
        return distance <= MAX_RADIUS_KM;
      });

      res.json(nearbyRequests);
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

  app.get("/api/service-requests/active", authMiddleware, async (req, res) => {
    try {
      const requests = await storage.getUserServiceRequests(req.user!.id);
      const activeRequest = requests.find(r => 
        r.status === 'accepted' || r.status === 'arrived'
      );
      
      if (!activeRequest) {
        return res.json(null);
      }

      res.json(activeRequest);
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

  app.get("/api/users/:id", authMiddleware, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
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
      const baseFee = 50;
      const distanceFee = distance * 6;
      const totalPrice = baseFee + distanceFee;
      const platformFee = distanceFee * 0.10;
      const mechanicEarnings = baseFee + (distanceFee - platformFee);

      const updated = await storage.updateServiceRequest(req.params.id, {
        mechanicId: req.user!.id,
        status: 'accepted',
        acceptedAt: new Date(),
        distance: distance.toString(),
        baseFee: baseFee.toString(),
        distanceFee: distanceFee.toString(),
        totalPrice: totalPrice.toString(),
        platformFee: platformFee.toString(),
        mechanicEarnings: mechanicEarnings.toString(),
        paymentStatus: 'paid',
      });

      if (!updated) {
        return res.status(404).json({ message: "Erro ao atualizar chamada" });
      }

      broadcastToUser(request.clientId, {
        type: 'service_request_accepted',
        data: updated,
        mechanic: {
          id: req.user!.id,
          fullName: req.user!.fullName,
          rating: req.user!.rating,
          phone: req.user!.phone,
        },
      });

      broadcastToUser(req.user!.id, {
        type: 'service_request_started',
        data: updated,
      });

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/service-requests/:id/arrived", authMiddleware, async (req, res) => {
    try {
      if (req.user!.userType !== 'mechanic') {
        return res.status(403).json({ message: "Apenas mecânicos podem marcar chegada" });
      }

      const request = await storage.getServiceRequest(req.params.id);
      
      if (!request) {
        return res.status(404).json({ message: "Chamada não encontrada" });
      }

      if (request.mechanicId !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      if (request.status !== 'accepted') {
        return res.status(400).json({ message: "Chamada não está em andamento" });
      }

      const updated = await storage.updateServiceRequest(req.params.id, {
        status: 'arrived',
        arrivedAt: new Date(),
      });

      broadcastToUser(request.clientId, {
        type: 'mechanic_arrived',
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

      const isClient = request.clientId === req.user!.id;
      const isMechanic = request.mechanicId === req.user!.id;

      if (!isClient && !isMechanic) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      if (request.status !== 'arrived' && request.status !== 'accepted') {
        return res.status(400).json({ message: "Chamada não está em andamento" });
      }

      const completedAt = new Date();
      const updated = await storage.updateServiceRequest(req.params.id, {
        status: 'completed',
        completedAt,
      });

      if (request.mechanicId && request.mechanicEarnings) {
        const availableAt = new Date(completedAt.getTime() + 12 * 60 * 60 * 1000);
        
        await storage.createTransaction(
          request.mechanicId,
          'mechanic_earnings',
          parseFloat(request.mechanicEarnings),
          `Ganho do serviço - ${request.serviceType} (${parseFloat(request.distance || '0').toFixed(1)}km)`,
          req.params.id,
          availableAt
        );
        
        await storage.updateTransactionStatus(
          req.params.id,
          'completed',
          completedAt
        );
      }

      if (isClient && request.mechanicId) {
        broadcastToUser(request.mechanicId, {
          type: 'service_request_completed',
          data: updated,
        });
      } else if (isMechanic) {
        broadcastToUser(request.clientId, {
          type: 'service_request_completed',
          data: updated,
        });
      }

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/service-requests/:id/rate", authMiddleware, async (req, res) => {
    try {
      const request = await storage.getServiceRequest(req.params.id);
      
      if (!request) {
        return res.status(404).json({ message: "Chamada não encontrada" });
      }

      if (request.clientId !== req.user!.id) {
        return res.status(403).json({ message: "Apenas o cliente pode avaliar" });
      }

      if (request.status !== 'completed') {
        return res.status(400).json({ message: "Serviço ainda não foi finalizado" });
      }

      const { rating, comment } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Avaliação deve ser entre 1 e 5" });
      }

      const updated = await storage.updateServiceRequest(req.params.id, {
        rating: parseInt(rating.toString()),
        ratingComment: comment || '',
      });

      if (request.mechanicId) {
        const mechanic = await storage.getUser(request.mechanicId);
        if (mechanic) {
          const currentRating = parseFloat(mechanic.rating || '0');
          const totalRatings = parseInt(mechanic.totalRatings?.toString() || '0');
          const newTotal = totalRatings + 1;
          const newRating = ((currentRating * totalRatings) + parseInt(rating.toString())) / newTotal;
          
          await storage.updateUserRating(request.mechanicId, parseFloat(newRating.toFixed(2)));
        }
      }

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/service-requests/history", authMiddleware, async (req, res) => {
    try {
      const requests = await storage.getUserServiceRequests(req.user!.id);
      const history = requests.filter(r => r.status === 'completed' || r.status === 'cancelled');
      res.json(history);
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
      
      const messageWithSender = {
        ...message,
        senderName: req.user!.fullName,
      };

      const recipientId = serviceRequest.clientId === req.user!.id 
        ? serviceRequest.mechanicId 
        : serviceRequest.clientId;

      if (recipientId) {
        broadcastToUser(recipientId, {
          type: 'new_chat_message',
          data: messageWithSender,
        });
      }

      res.json(messageWithSender);
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
      
      const messagesWithSender = await Promise.all(messages.map(async (msg: any) => {
        const sender = await storage.getUser(msg.senderId);
        return {
          ...msg,
          senderName: sender?.fullName || 'Usuário',
        };
      }));
      
      res.json(messagesWithSender);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/payments/create-pix", authMiddleware, async (req, res) => {
    try {
      const { amount, description } = req.body;
      
      const payment = await createPixPayment(
        amount,
        description,
        req.user!.email
      );

      res.json({
        qrCode: payment.qrCode,
        qrCodeBase64: payment.qrCodeBase64,
        paymentId: payment.id,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/payments/status/:paymentId", authMiddleware, async (req, res) => {
    try {
      const status = await getPaymentStatus(req.params.paymentId);
      res.json(status);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/payments/simulate-approval/:paymentId", authMiddleware, async (req, res) => {
    try {
      const isTestMode = process.env.MERCADOPAGO_ACCESS_TOKEN?.includes('TEST') || 
                         process.env.NODE_ENV === 'development';
      
      if (!isTestMode) {
        return res.status(403).json({ message: "Simulação disponível apenas em modo teste" });
      }

      simulatePaymentApproval(req.params.paymentId);

      res.json({ 
        message: "Pagamento aprovado (simulado)", 
        status: "approved" 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });



  app.get("/api/wallet/transactions", authMiddleware, async (req, res) => {
    try {
      const transactions = await storage.getUserTransactions(req.user!.id);
      res.json(transactions);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/user/base-address", authMiddleware, async (req, res) => {
    try {
      if (req.user!.userType !== 'mechanic') {
        return res.status(403).json({ message: "Apenas mecânicos podem cadastrar endereço base" });
      }

      const validatedData = baseAddressSchema.parse(req.body);
      await storage.updateUserBaseAddress(req.user!.id, validatedData);

      res.json({ message: "Endereço base atualizado" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/wallet/bank-data", authMiddleware, async (req, res) => {
    try {
      if (req.user!.userType !== 'mechanic') {
        return res.status(403).json({ message: "Apenas mecânicos podem adicionar dados bancários" });
      }

      const validatedData = bankDataSchema.parse(req.body);
      await storage.updateUserBankData(req.user!.id, validatedData);

      res.json({ message: "Dados bancários atualizados" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/wallet/balance", authMiddleware, async (req, res) => {
    try {
      if (req.user!.userType !== 'mechanic') {
        return res.status(403).json({ message: "Apenas mecânicos têm carteira" });
      }

      const availableBalance = await storage.getAvailableBalance(req.user!.id);
      const pendingBalance = await storage.getPendingBalance(req.user!.id);

      res.json({
        available: availableBalance,
        pending: pendingBalance,
        total: availableBalance + pendingBalance,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/wallet/withdraw", authMiddleware, async (req, res) => {
    try {
      if (req.user!.userType !== 'mechanic') {
        return res.status(403).json({ message: "Apenas mecânicos podem solicitar saque" });
      }

      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      if (!user.pixKey || !user.pixKeyType) {
        return res.status(400).json({ message: "Configure sua chave PIX primeiro em Configurações" });
      }

      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valor inválido" });
      }

      const availableBalance = await storage.getAvailableBalance(user.id);
      
      if (availableBalance < amount) {
        return res.status(400).json({ 
          message: `Saldo disponível insuficiente. Você tem R$ ${availableBalance.toFixed(2)} disponível.` 
        });
      }

      const payout = await createPixPayout(
        amount,
        user.pixKey,
        user.pixKeyType,
        `Saque via PIX - ${user.fullName}`
      );

      await storage.createWithdrawalRequest(
        user.id,
        amount,
        'pix',
        `PIX: ${user.pixKey} (${user.pixKeyType})`,
        payout.id
      );

      res.json({ 
        message: "Saque solicitado com sucesso! Processaremos em até 2 dias úteis.",
        amount,
        pixKey: user.pixKey
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/withdrawals", authMiddleware, async (req, res) => {
    try {
      const withdrawals = await storage.getPendingWithdrawals();
      res.json(withdrawals);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/withdrawals/:id/complete", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.completeWithdrawal(id);
      res.json({ message: "Saque confirmado com sucesso!" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  return httpServer;
}
