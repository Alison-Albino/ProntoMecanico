import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  userType: text("user_type").notNull(),
  isOnline: boolean("is_online").default(false),
  currentLat: decimal("current_lat", { precision: 10, scale: 7 }),
  currentLng: decimal("current_lng", { precision: 10, scale: 7 }),
  baseAddress: text("base_address"),
  baseLat: decimal("base_lat", { precision: 10, scale: 7 }),
  baseLng: decimal("base_lng", { precision: 10, scale: 7 }),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("5.00"),
  totalRatings: integer("total_ratings").default(0),
  bankAccountName: text("bank_account_name"),
  bankAccountNumber: text("bank_account_number"),
  bankName: text("bank_name"),
  bankBranch: text("bank_branch"),
  pixKey: text("pix_key"),
  walletBalance: decimal("wallet_balance", { precision: 10, scale: 2 }).default("0.00"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const serviceRequests = pgTable("service_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id),
  mechanicId: varchar("mechanic_id").references(() => users.id),
  serviceType: text("service_type").notNull(),
  status: text("status").notNull().default("pending"),
  pickupLat: decimal("pickup_lat", { precision: 10, scale: 7 }).notNull(),
  pickupLng: decimal("pickup_lng", { precision: 10, scale: 7 }).notNull(),
  pickupAddress: text("pickup_address").notNull(),
  description: text("description"),
  distance: decimal("distance", { precision: 10, scale: 2 }),
  baseFee: decimal("base_fee", { precision: 10, scale: 2 }).default("50.00"),
  distanceFee: decimal("distance_fee", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }),
  mechanicEarnings: decimal("mechanic_earnings", { precision: 10, scale: 2 }),
  paymentStatus: text("payment_status").default("pending"),
  paymentIntentId: text("payment_intent_id"),
  rating: integer("rating"),
  ratingComment: text("rating_comment"),
  createdAt: timestamp("created_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  completedAt: timestamp("completed_at"),
  arrivedAt: timestamp("arrived_at"),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull().references(() => serviceRequests.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  serviceRequestId: varchar("service_request_id").references(() => serviceRequests.id),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  email: z.string().email("Email inválido"),
  userType: z.enum(["client", "mechanic"], {
    required_error: "Tipo de usuário é obrigatório",
  }),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({
  id: true,
  createdAt: true,
  acceptedAt: true,
  completedAt: true,
  arrivedAt: true,
  mechanicId: true,
  distance: true,
  distanceFee: true,
  totalPrice: true,
  platformFee: true,
  mechanicEarnings: true,
  paymentIntentId: true,
  rating: true,
  ratingComment: true,
}).extend({
  serviceType: z.enum(["mechanic", "tow_truck", "road_assistance", "other"]),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const bankDataSchema = z.object({
  bankAccountName: z.string().min(1, "Nome do titular é obrigatório"),
  bankAccountNumber: z.string().min(1, "Número da conta é obrigatório"),
  bankName: z.string().min(1, "Nome do banco é obrigatório"),
  bankBranch: z.string().optional(),
  pixKey: z.string().optional(),
});

export const ratingSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const baseAddressSchema = z.object({
  baseAddress: z.string().min(1, "Endereço é obrigatório"),
  baseLat: z.number({ required_error: "Coordenadas são obrigatórias" }),
  baseLng: z.number({ required_error: "Coordenadas são obrigatórias" }),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type BankData = z.infer<typeof bankDataSchema>;
export type Rating = z.infer<typeof ratingSchema>;
export type BaseAddress = z.infer<typeof baseAddressSchema>;
