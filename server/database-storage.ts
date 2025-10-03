import { eq, and, or, sql as drizzleSql, desc, asc } from "drizzle-orm";
import { db } from "./db";
import { 
  users,
  serviceRequests,
  chatMessages,
  transactions,
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
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByCpfCnpj(cpfCnpj: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.cpfCnpj, cpfCnpj));
    return user || undefined;
  }

  async getUserByIdentifier(identifier: string): Promise<User | undefined> {
    const cleanIdentifier = identifier.replace(/\D/g, '');
    
    if (cleanIdentifier.length === 11 || cleanIdentifier.length === 14) {
      return this.getUserByCpfCnpj(cleanIdentifier);
    }
    
    return this.getUserByEmail(identifier.toLowerCase());
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        baseAddress: insertUser.baseAddress || null,
        baseLat: insertUser.baseLat !== undefined && insertUser.baseLat !== null
          ? (typeof insertUser.baseLat === 'number' ? insertUser.baseLat.toString() : insertUser.baseLat)
          : null,
        baseLng: insertUser.baseLng !== undefined && insertUser.baseLng !== null
          ? (typeof insertUser.baseLng === 'number' ? insertUser.baseLng.toString() : insertUser.baseLng)
          : null,
      })
      .returning();
    return user;
  }

  async updateUserLocation(userId: string, lat: number, lng: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        currentLat: lat.toString(), 
        currentLng: lng.toString() 
      })
      .where(eq(users.id, userId));
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await db
      .update(users)
      .set({ isOnline })
      .where(eq(users.id, userId));
  }

  async updateUserBaseAddress(userId: string, addressData: BaseAddress): Promise<void> {
    await db
      .update(users)
      .set({
        baseAddress: addressData.baseAddress,
        baseLat: addressData.baseLat.toString(),
        baseLng: addressData.baseLng.toString(),
      })
      .where(eq(users.id, userId));
  }

  async updateUserBankData(userId: string, bankData: BankData): Promise<void> {
    await db
      .update(users)
      .set({
        bankAccountName: bankData.bankAccountName,
        bankAccountNumber: bankData.bankAccountNumber,
        bankName: bankData.bankName,
        bankBranch: bankData.bankBranch || null,
        pixKey: bankData.pixKey || null,
        pixKeyType: bankData.pixKeyType || null,
      })
      .where(eq(users.id, userId));
  }

  async updateUserRating(userId: string, newRating: number): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user) {
      const currentRating = parseFloat(user.rating || '0');
      const totalRatings = user.totalRatings || 0;
      const updatedAverage = ((currentRating * totalRatings) + newRating) / (totalRatings + 1);
      
      await db
        .update(users)
        .set({
          rating: updatedAverage.toFixed(2),
          totalRatings: totalRatings + 1,
        })
        .where(eq(users.id, userId));
    }
  }

  async updateWalletBalance(userId: string, amount: number): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user) {
      const currentBalance = parseFloat(user.walletBalance || "0");
      await db
        .update(users)
        .set({
          walletBalance: (currentBalance + amount).toFixed(2),
        })
        .where(eq(users.id, userId));
    }
  }

  async getOnlineMechanics(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.userType, "mechanic"),
          eq(users.isOnline, true)
        )
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
    const [request] = await db
      .insert(serviceRequests)
      .values({
        ...insertRequest,
        description: insertRequest.description ?? null,
      })
      .returning();
    return request;
  }

  async getServiceRequest(id: string): Promise<ServiceRequest | undefined> {
    const [request] = await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.id, id));
    return request || undefined;
  }

  async getUserServiceRequests(userId: string): Promise<ServiceRequest[]> {
    return await db
      .select()
      .from(serviceRequests)
      .where(
        or(
          eq(serviceRequests.clientId, userId),
          eq(serviceRequests.mechanicId, userId)
        )
      )
      .orderBy(desc(serviceRequests.createdAt));
  }

  async getPendingServiceRequests(): Promise<ServiceRequest[]> {
    return await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.status, "pending"))
      .orderBy(asc(serviceRequests.createdAt));
  }

  async getActiveServiceRequest(userId: string): Promise<ServiceRequest | undefined> {
    const [request] = await db
      .select()
      .from(serviceRequests)
      .where(
        and(
          or(
            eq(serviceRequests.clientId, userId),
            eq(serviceRequests.mechanicId, userId)
          ),
          or(
            eq(serviceRequests.status, "accepted"),
            eq(serviceRequests.status, "in_progress")
          )
        )
      )
      .orderBy(desc(serviceRequests.createdAt))
      .limit(1);
    return request || undefined;
  }

  async updateServiceRequest(id: string, data: Partial<ServiceRequest>): Promise<ServiceRequest | undefined> {
    const [updated] = await db
      .update(serviceRequests)
      .set(data)
      .where(eq(serviceRequests.id, id))
      .returning();
    return updated || undefined;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getChatMessages(serviceRequestId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.serviceRequestId, serviceRequestId))
      .orderBy(asc(chatMessages.createdAt));
  }

  async createTransaction(
    userId: string, 
    type: string, 
    amount: number, 
    description: string, 
    serviceRequestId?: string,
    availableAt?: Date
  ): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values({
        userId,
        serviceRequestId: serviceRequestId || null,
        type,
        amount: amount.toFixed(2),
        status: "completed",
        description,
        availableAt: availableAt || null,
      })
      .returning();
    return transaction;
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async updateTransactionStatus(id: string, status: string, completedAt?: Date): Promise<void> {
    await db
      .update(transactions)
      .set({
        status,
        completedAt: completedAt || null,
      })
      .where(eq(transactions.id, id));
  }

  async getAvailableBalance(userId: string): Promise<number> {
    const now = new Date();
    const userTransactions = await this.getUserTransactions(userId);
    
    const availableTransactions = userTransactions.filter(t => 
      t.status === "completed" && 
      (t.type === "mechanic_earnings" || t.type === "refund") &&
      (!t.availableAt || t.availableAt <= now)
    );
    
    const withdrawals = userTransactions.filter(t => 
      t.type === "withdrawal" && 
      (t.status === "completed" || t.status === "pending")
    );
    
    const totalEarnings = availableTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalWithdrawals = withdrawals.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
    
    return totalEarnings - totalWithdrawals;
  }

  async getPendingBalance(userId: string): Promise<number> {
    const now = new Date();
    const userTransactions = await this.getUserTransactions(userId);
    
    const pendingTransactions = userTransactions.filter(t => 
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
    const [transaction] = await db
      .insert(transactions)
      .values({
        userId,
        serviceRequestId: null,
        type: "withdrawal",
        amount: (-amount).toFixed(2),
        status: status || (pixPaymentId ? "completed" : "pending"),
        description: `Saque via ${method === 'pix' ? 'PIX' : 'Transferência Bancária'}`,
        availableAt: null,
        withdrawalMethod: method,
        withdrawalDetails: details,
        pixPaymentId: pixPaymentId || null,
        pixType: method === 'pix' ? 'withdrawal' : null,
        completedAt: pixPaymentId && !status ? new Date() : null,
      })
      .returning();
    return transaction;
  }

  async getPendingWithdrawals(): Promise<Array<Transaction & { user: User }>> {
    const withdrawals = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.type, "withdrawal"),
          eq(transactions.status, "pending")
        )
      )
      .orderBy(asc(transactions.createdAt));

    const withdrawalsWithUser = await Promise.all(
      withdrawals.map(async (withdrawal) => {
        const user = await this.getUser(withdrawal.userId);
        return { ...withdrawal, user: user! };
      })
    );

    return withdrawalsWithUser;
  }

  async completeWithdrawal(id: string): Promise<void> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));

    if (!transaction) {
      throw new Error("Transação não encontrada");
    }

    if (transaction.type !== "withdrawal") {
      throw new Error("Esta não é uma transação de saque");
    }

    if (transaction.status !== "pending") {
      throw new Error("Este saque já foi processado");
    }

    await db
      .update(transactions)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(transactions.id, id));
  }
}
