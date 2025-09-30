import { 
  type User, 
  type InsertUser,
  type ServiceRequest,
  type InsertServiceRequest,
  type ChatMessage,
  type InsertChatMessage
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLocation(userId: string, lat: number, lng: number): Promise<void>;
  updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void>;
  getOnlineMechanics(): Promise<User[]>;
  
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  getServiceRequest(id: string): Promise<ServiceRequest | undefined>;
  getUserServiceRequests(userId: string): Promise<ServiceRequest[]>;
  getPendingServiceRequests(): Promise<ServiceRequest[]>;
  updateServiceRequest(id: string, data: Partial<ServiceRequest>): Promise<ServiceRequest | undefined>;
  
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(serviceRequestId: string): Promise<ChatMessage[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private serviceRequests: Map<string, ServiceRequest>;
  private chatMessages: Map<string, ChatMessage>;

  constructor() {
    this.users = new Map();
    this.serviceRequests = new Map();
    this.chatMessages = new Map();
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      isOnline: false,
      currentLat: null,
      currentLng: null,
      createdAt: new Date()
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

  async getOnlineMechanics(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.userType === "mechanic" && user.isOnline,
    );
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
      baseFee: "50.00",
      distanceFee: null,
      totalPrice: null,
      paymentStatus: "pending",
      paymentIntentId: null,
      createdAt: new Date(),
      acceptedAt: null,
      completedAt: null,
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
}

export const storage = new MemStorage();
