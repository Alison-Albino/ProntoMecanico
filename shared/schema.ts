import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  cpfCnpj: text("cpf_cnpj").notNull().unique(),
  birthDate: timestamp("birth_date").notNull(),
  phone: text("phone").notNull(),
  userType: text("user_type").notNull(),
  serviceCategories: text("service_categories").array(),
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
  pixKeyType: text("pix_key_type"),
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
  vehicleBrand: text("vehicle_brand"),
  vehicleModel: text("vehicle_model"),
  vehiclePlate: text("vehicle_plate"),
  vehicleYear: text("vehicle_year"),
  distance: decimal("distance", { precision: 10, scale: 2 }),
  isAfterHours: boolean("is_after_hours").default(false),
  baseFee: decimal("base_fee", { precision: 10, scale: 2 }).default("50.00"),
  distanceFee: decimal("distance_fee", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }),
  mechanicEarnings: decimal("mechanic_earnings", { precision: 10, scale: 2 }),
  paymentStatus: text("payment_status").default("pending"),
  paymentMethod: text("payment_method").default("card"),
  paymentIntentId: text("payment_intent_id"),
  pixQrCode: text("pix_qr_code"),
  pixPaymentId: text("pix_payment_id"),
  pixExpiration: timestamp("pix_expiration"),
  clientConfirmed: boolean("client_confirmed").default(false),
  mechanicConfirmed: boolean("mechanic_confirmed").default(false),
  clientRating: integer("client_rating"),
  clientRatingComment: text("client_rating_comment"),
  mechanicRating: integer("mechanic_rating"),
  mechanicRatingComment: text("mechanic_rating_comment"),
  rating: integer("rating"),
  ratingComment: text("rating_comment"),
  createdAt: timestamp("created_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  completedAt: timestamp("completed_at"),
  arrivedAt: timestamp("arrived_at"),
  cancelledAt: timestamp("cancelled_at"),
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
  availableAt: timestamp("available_at"),
  withdrawalMethod: text("withdrawal_method"),
  withdrawalDetails: text("withdrawal_details"),
  pixQrCode: text("pix_qr_code"),
  pixPaymentId: text("pix_payment_id"),
  pixExpiration: timestamp("pix_expiration"),
  pixType: text("pix_type"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const SERVICE_CATEGORIES = [
  { value: "mechanic", label: "Mecânico" },
  { value: "tow_truck", label: "Guincho" },
  { value: "road_assistance", label: "Assistência 24h" },
  { value: "locksmith", label: "Chaveiro" },
  { value: "electrician", label: "Eletricista" },
  { value: "tire_service", label: "Borracheiro" },
] as const;

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  username: true,
}).extend({
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string().optional(),
  email: z.string().email("Email inválido"),
  cpfCnpj: z.string().min(11, "CPF ou CNPJ é obrigatório"),
  birthDate: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
  userType: z.enum(["client", "mechanic"], {
    required_error: "Tipo de usuário é obrigatório",
  }),
  serviceCategories: z.array(z.string()).optional(),
  baseAddress: z.string().optional(),
  baseLat: z.union([z.string(), z.number()]).optional(),
  baseLng: z.union([z.string(), z.number()]).optional(),
}).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.userType === "mechanic") {
    return data.serviceCategories && data.serviceCategories.length > 0;
  }
  return true;
}, {
  message: "Prestadores devem selecionar pelo menos 1 categoria de serviço",
  path: ["serviceCategories"],
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "CPF/Email é obrigatório"),
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
  serviceType: z.enum(["mechanic", "tow_truck", "road_assistance", "locksmith", "electrician", "tire_service"]),
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
  pixKeyType: z.enum(["cpf", "cnpj", "email", "phone", "random"]).optional(),
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

export const withdrawalSchema = z.object({
  amount: z.number().positive("Valor deve ser positivo"),
  method: z.enum(["bank_transfer", "pix"], {
    required_error: "Método de saque é obrigatório",
  }),
  pixKey: z.string().optional(),
  pixKeyType: z.enum(["cpf", "cnpj", "email", "phone", "random"]).optional(),
});

export const paymentMethodSchema = z.object({
  method: z.enum(["card", "pix"], {
    required_error: "Método de pagamento é obrigatório",
  }),
  serviceRequestId: z.string(),
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
export type WithdrawalRequest = z.infer<typeof withdrawalSchema>;
export type PaymentMethodSelection = z.infer<typeof paymentMethodSchema>;
