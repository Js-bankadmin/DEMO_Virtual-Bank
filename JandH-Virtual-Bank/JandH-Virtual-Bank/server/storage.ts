import { InsertUser, User, Transaction, InsertTransaction, VirtualCard, InsertVirtualCard } from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, transactions, virtualCards } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, amount: number): Promise<User>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  createVirtualCard(card: InsertVirtualCard): Promise<VirtualCard>;
  getUserVirtualCards(userId: number): Promise<VirtualCard[]>;
  getVirtualCard(cardId: number): Promise<VirtualCard | undefined>;
  updateVirtualCardStatus(cardId: number, isActive: boolean): Promise<VirtualCard>;
  updateUserTwoFactorSecret(userId: number, secret: string): Promise<User>;
  updateUserRecoveryKeys(userId: number, keys: string[]): Promise<User>;
  enableTwoFactor(userId: number): Promise<User>;
  disableTwoFactor(userId: number): Promise<User>;

  // Admin methods
  getAllUsers(): Promise<User[]>;
  updateUserStatus(userId: number, status: { isAdmin?: boolean; isActive?: boolean }): Promise<User>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        balance: "0",
      })
      .returning();
    return user;
  }

  async updateUserBalance(userId: number, amount: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const newBalance = parseFloat(user.balance.toString()) + amount;
    const [updatedUser] = await db
      .update(users)
      .set({ balance: newBalance.toString() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(transactions.createdAt);
  }

  async createVirtualCard(insertCard: InsertVirtualCard): Promise<VirtualCard> {
    const lastFourDigits = Math.floor(1000 + Math.random() * 9000).toString();
    const cvv = Math.floor(100 + Math.random() * 900).toString();

    const [card] = await db
      .insert(virtualCards)
      .values({
        ...insertCard,
        lastFourDigits,
        cvv,
        isActive: true,
      })
      .returning();
    return card;
  }

  async getUserVirtualCards(userId: number): Promise<VirtualCard[]> {
    return await db
      .select()
      .from(virtualCards)
      .where(eq(virtualCards.userId, userId))
      .orderBy(virtualCards.createdAt);
  }

  async getVirtualCard(cardId: number): Promise<VirtualCard | undefined> {
    const [card] = await db
      .select()
      .from(virtualCards)
      .where(eq(virtualCards.id, cardId));
    return card;
  }

  async updateVirtualCardStatus(cardId: number, isActive: boolean): Promise<VirtualCard> {
    const [card] = await db
      .update(virtualCards)
      .set({ isActive })
      .where(eq(virtualCards.id, cardId))
      .returning();
    return card;
  }

  async updateUserTwoFactorSecret(userId: number, secret: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ twoFactorSecret: secret })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserRecoveryKeys(userId: number, keys: string[]): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ recoveryKeys: keys })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async enableTwoFactor(userId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ twoFactorEnabled: true })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async disableTwoFactor(userId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        twoFactorEnabled: false,
        twoFactorSecret: null,
        recoveryKeys: [],
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Admin methods implementation
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserStatus(
    userId: number,
    status: { isAdmin?: boolean; isActive?: boolean }
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set(status)
      .where(eq(users.id, userId))
      .returning();

    if (!user) throw new Error("User not found");
    return user;
  }
}

export const storage = new DatabaseStorage();