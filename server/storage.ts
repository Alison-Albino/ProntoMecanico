import { 
  type User, 
  type InsertUser,
  type ServiceRequest,
  type InsertServiceRequest,
  type ChatMessage,
  type InsertChatMessage,
  type Transaction,
  type BankData,
  type BaseAddress
} from "@shared/schema";
import { randomUUID } from "crypto";
import { DatabaseStorage } from "./database-storage";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLocation(userId: string, lat: number, lng: number): Promise<void>;
  updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void>;
  updateUserBaseAddress(userId: string, addressData: BaseAddress): Promise<void>;
  updateUserBankData(userId: string, bankData: BankData): Promise<void>;
  updateUserRating(userId: string, rating: number): Promise<void>;
  updateWalletBalance(userId: string, amount: number): Promise<void>;
  getOnlineMechanics(): Promise<User[]>;
  getOnlineMechanicsNearby(lat: number, lng: number, radiusKm: number): Promise<User[]>;
  
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  getServiceRequest(id: string): Promise<ServiceRequest | undefined>;
  getUserServiceRequests(userId: string): Promise<ServiceRequest[]>;
  getPendingServiceRequests(): Promise<ServiceRequest[]>;
  getActiveServiceRequest(userId: string): Promise<ServiceRequest | undefined>;
  updateServiceRequest(id: string, data: Partial<ServiceRequest>): Promise<ServiceRequest | undefined>;
  
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(serviceRequestId: string): Promise<ChatMessage[]>;
  
  createTransaction(userId: string, type: string, amount: number, description: string, serviceRequestId?: string, availableAt?: Date): Promise<Transaction>;
  getUserTransactions(userId: string): Promise<Transaction[]>;
  getAvailableBalance(userId: string): Promise<number>;
  getPendingBalance(userId: string): Promise<number>;
  updateTransactionStatus(id: string, status: string, completedAt?: Date): Promise<void>;
  createWithdrawalRequest(userId: string, amount: number, method: string, details: string, pixPaymentId?: string, status?: string): Promise<Transaction>;
  getPendingWithdrawals(): Promise<Array<Transaction & { user: User }>>;
  completeWithdrawal(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private serviceRequests: Map<string, ServiceRequest>;
  private chatMessages: Map<string, ChatMessage>;
  private transactions: Map<string, Transaction>;

  constructor() {
    this.users = new Map();
    this.serviceRequests = new Map();
    this.chatMessages = new Map();
    this.transactions = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    
    const user: User = { 
      id,
      isOnline: false,
      currentLat: null,
      currentLng: null,
      rating: "5.00",
      totalRatings: 0,
      bankAccountName: null,
      bankAccountNumber: null,
      bankName: null,
      bankBranch: null,
      pixKey: null,
      pixKeyType: null,
      walletBalance: "0.00",
      stripeCustomerId: null,
      createdAt: new Date(),
      ...insertUser,
      baseAddress: insertUser.baseAddress || null,
      baseLat: insertUser.baseLat !== undefined && insertUser.baseLat !== null
        ? (typeof insertUser.baseLat === 'number' ? insertUser.baseLat.toString() : insertUser.baseLat)
        : null,
      baseLng: insertUser.baseLng !== undefined && insertUser.baseLng !== null
        ? (typeof insertUser.baseLng === 'number' ? insertUser.baseLng.toString() : insertUser.baseLng)
        : null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserLocation(userId: string, lat: number, lng: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.currentLat = lat.toString();
      user.currentLng = lng.toString();
      this.users.set(userId, user);
    }
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.isOnline = isOnline;
      this.users.set(userId, user);
    }
  }

  async updateUserBaseAddress(userId: string, addressData: BaseAddress): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.baseAddress = addressData.baseAddress;
      user.baseLat = addressData.baseLat.toString();
      user.baseLng = addressData.baseLng.toString();
      this.users.set(userId, user);
    }
  }

  async updateUserBankData(userId: string, bankData: BankData): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.bankAccountName = bankData.bankAccountName;
      user.bankAccountNumber = bankData.bankAccountNumber;
      user.bankName = bankData.bankName;
      user.bankBranch = bankData.bankBranch || null;
      user.pixKey = bankData.pixKey || null;
      user.pixKeyType = bankData.pixKeyType || null;
      this.users.set(userId, user);
    }
  }

  async updateUserRating(userId: string, newRating: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      const totalRatings = user.totalRatings || 0;
      user.rating = newRating.toFixed(2);
      user.totalRatings = totalRatings + 1;
      this.users.set(userId, user);
    }
  }

  async updateWalletBalance(userId: string, amount: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      const currentBalance = parseFloat(user.walletBalance || "0");
      user.walletBalance = (currentBalance + amount).toFixed(2);
      this.users.set(userId, user);
    }
  }

  async getOnlineMechanics(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.userType === "mechanic" && user.isOnline,
    );
  }

  async getOnlineMechanicsNearby(lat: number, lng: number, radiusKm: number): Promise<User[]> {
    const mechanics = await this.getOnlineMechanics();
    return mechanics.filter(mechanic => {
      if (!mechanic.currentLat || !mechanic.currentLng) return false;
      
      const mechanicLat = parseFloat(mechanic.currentLat);
      const mechanicLng = parseFloat(mechanic.currentLng);
      const distance = this.calculateDistance(lat, lng, mechanicLat, mechanicLng);
      
      return distance <= radiusKm;
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async createServiceRequest(insertRequest: InsertServiceRequest): Promise<ServiceRequest> {
    const id = randomUUID();
    const request: ServiceRequest = {
      ...insertRequest,
      description: insertRequest.description ?? null,
      id,
      mechanicId: null,
      status: "pending",
      distance: null,
      isAfterHours: false,
      baseFee: "50.00",
      distanceFee: null,
      totalPrice: null,
      platformFee: null,
      mechanicEarnings: null,
      paymentStatus: "pending",
      paymentMethod: "card",
      paymentIntentId: null,
      pixQrCode: null,
      pixPaymentId: null,
      pixExpiration: null,
      clientConfirmed: false,
      mechanicConfirmed: false,
      clientRating: null,
      clientRatingComment: null,
      mechanicRating: null,
      mechanicRatingComment: null,
      rating: null,
      ratingComment: null,
      createdAt: new Date(),
      acceptedAt: null,
      completedAt: null,
      arrivedAt: null,
      cancelledAt: null,
    };
    this.serviceRequests.set(id, request);
    return request;
  }

  async getServiceRequest(id: string): Promise<ServiceRequest | undefined> {
    return this.serviceRequests.get(id);
  }

  async getUserServiceRequests(userId: string): Promise<ServiceRequest[]> {
    return Array.from(this.serviceRequests.values()).filter(
      (request) => request.clientId === userId || request.mechanicId === userId,
    );
  }

  async getPendingServiceRequests(): Promise<ServiceRequest[]> {
    return Array.from(this.serviceRequests.values()).filter(
      (request) => request.status === "pending",
    );
  }

  async getActiveServiceRequest(userId: string): Promise<ServiceRequest | undefined> {
    return Array.from(this.serviceRequests.values()).find(
      (request) => 
        (request.clientId === userId || request.mechanicId === userId) &&
        (request.status === "accepted" || request.status === "in_progress")
    );
  }

  async updateServiceRequest(id: string, data: Partial<ServiceRequest>): Promise<ServiceRequest | undefined> {
    const request = this.serviceRequests.get(id);
    if (request) {
      const updated = { ...request, ...data };
      this.serviceRequests.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getChatMessages(serviceRequestId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter((msg) => msg.serviceRequestId === serviceRequestId)
      .sort((a, b) => {
        const aTime = a.createdAt?.getTime() ?? 0;
        const bTime = b.createdAt?.getTime() ?? 0;
        return aTime - bTime;
      });
  }

  async createTransaction(
    userId: string, 
    type: string, 
    amount: number, 
    description: string, 
    serviceRequestId?: string,
    availableAt?: Date
  ): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      id,
      userId,
      serviceRequestId: serviceRequestId || null,
      type,
      amount: amount.toFixed(2),
      status: "pending",
      description,
      availableAt: availableAt || null,
      withdrawalMethod: null,
      withdrawalDetails: null,
      pixQrCode: null,
      pixPaymentId: null,
      pixExpiration: null,
      pixType: null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => {
        const aTime = a.createdAt?.getTime() ?? 0;
        const bTime = b.createdAt?.getTime() ?? 0;
        return bTime - aTime;
      });
  }

  async updateTransactionStatus(id: string, status: string, completedAt?: Date): Promise<void> {
    const transaction = this.transactions.get(id);
    if (transaction) {
      transaction.status = status;
      if (completedAt) {
        transaction.completedAt = completedAt;
      }
      this.transactions.set(id, transaction);
    }
  }

  async getAvailableBalance(userId: string): Promise<number> {
    const now = new Date();
    const transactions = await this.getUserTransactions(userId);
    
    const availableTransactions = transactions.filter(t => 
      t.status === "completed" && 
      (t.type === "mechanic_earnings" || t.type === "refund") &&
      (!t.availableAt || t.availableAt <= now)
    );
    
    const withdrawals = transactions.filter(t => 
      t.type === "withdrawal" && 
      (t.status === "completed" || t.status === "pending")
    );
    
    const totalEarnings = availableTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalWithdrawals = withdrawals.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return totalEarnings - totalWithdrawals;
  }

  async getPendingBalance(userId: string): Promise<number> {
    const now = new Date();
    const transactions = await this.getUserTransactions(userId);
    
    const pendingTransactions = transactions.filter(t => 
      t.status === "completed" &&
      (t.type === "mechanic_earnings" || t.type === "refund") &&
      t.availableAt && t.availableAt > now
    );
    
    return pendingTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  }

  async createWithdrawalRequest(
    userId: string, 
    amount: number, 
    method: string, 
    details: string,
    pixPaymentId?: string,
    status?: string
  ): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      id,
      userId,
      serviceRequestId: null,
      type: "withdrawal",
      amount: (-amount).toFixed(2),
      status: status || (pixPaymentId ? "completed" : "pending"),
      description: `Saque via ${method === 'pix' ? 'PIX' : 'Transferência Bancária'}`,
      availableAt: null,
      withdrawalMethod: method,
      withdrawalDetails: details,
      pixQrCode: null,
      pixPaymentId: pixPaymentId || null,
      pixExpiration: null,
      pixType: method === 'pix' ? 'withdrawal' : null,
      createdAt: new Date(),
      completedAt: pixPaymentId && !status ? new Date() : null,
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getPendingWithdrawals(): Promise<Array<Transaction & { user: User }>> {
    const withdrawals = Array.from(this.transactions.values()).filter(
      t => t.type === "withdrawal" && t.status === "pending"
    );

    const withdrawalsWithUser = await Promise.all(
      withdrawals.map(async (withdrawal) => {
        const user = await this.getUser(withdrawal.userId);
        return { ...withdrawal, user: user! };
      })
    );

    return withdrawalsWithUser.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : (a.createdAt ? new Date(a.createdAt) : new Date());
      const dateB = b.createdAt instanceof Date ? b.createdAt : (b.createdAt ? new Date(b.createdAt) : new Date());
      return dateA.getTime() - dateB.getTime();
    });
  }

  async completeWithdrawal(id: string): Promise<void> {
    const transaction = this.transactions.get(id);
    if (!transaction) {
      throw new Error("Transação não encontrada");
    }

    if (transaction.type !== "withdrawal") {
      throw new Error("Esta não é uma transação de saque");
    }

    if (transaction.status !== "pending") {
      throw new Error("Este saque já foi processado");
    }

    transaction.status = "completed";
    transaction.completedAt = new Date();
    this.transactions.set(id, transaction);
  }
}

export const storage = new DatabaseStorage();
