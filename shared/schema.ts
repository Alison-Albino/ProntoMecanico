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
  paymentStatus: text("payment_status").default("pending"),
  paymentIntentId: text("payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  completedAt: timestamp("completed_at"),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull().references(() => serviceRequests.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  message: text("message").notNull(),
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
  mechanicId: true,
  distance: true,
  distanceFee: true,
  totalPrice: true,
  paymentIntentId: true,
}).extend({
  serviceType: z.enum(["mechanic", "tow_truck", "road_assistance", "other"]),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
