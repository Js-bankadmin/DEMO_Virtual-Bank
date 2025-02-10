import { pgTable, text, serial, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  recoveryKeys: text("recovery_keys").array(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // deposit, transfer, bill_payment
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const virtualCards = pgTable("virtual_cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  cardName: text("card_name").notNull(),
  lastFourDigits: text("last_four_digits").notNull(),
  expirationDate: timestamp("expiration_date").notNull(),
  cvv: text("cvv").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  cardLimit: decimal("card_limit", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).extend({
  confirmPassword: z.string(),
}).omit({ 
  id: true,
  balance: true,
  twoFactorSecret: true,
  twoFactorEnabled: true,
  recoveryKeys: true,
  isAdmin: true
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({ 
  id: true,
  createdAt: true 
});

export const insertVirtualCardSchema = createInsertSchema(virtualCards).omit({
  id: true,
  lastFourDigits: true,
  cvv: true,
  createdAt: true,
  isActive: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type VirtualCard = typeof virtualCards.$inferSelect;
export type InsertVirtualCard = z.infer<typeof insertVirtualCardSchema>;