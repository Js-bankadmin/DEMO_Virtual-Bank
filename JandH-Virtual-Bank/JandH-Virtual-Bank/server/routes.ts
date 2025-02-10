import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTransactionSchema, insertVirtualCardSchema } from "@shared/schema";
import { authenticator } from "otplib";
import QRCode from "qrcode";

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Admin Routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const { isAdmin, isActive } = req.body;
    const userId = parseInt(req.params.id);

    if (userId === req.user!.id) {
      return res.status(400).json({ message: "Cannot modify your own admin status" });
    }

    try {
      const user = await storage.updateUserStatus(userId, { isAdmin, isActive });
      res.json(user);
    } catch (error) {
      res.status(404).json({ message: "User not found" });
    }
  });

  app.get("/api/transactions", requireAuth, async (req, res) => {
    const transactions = await storage.getUserTransactions(req.user!.id);
    res.json(transactions);
  });

  app.post("/api/deposit", requireAuth, async (req, res) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const transaction = await storage.createTransaction({
      userId: req.user!.id,
      type: "deposit",
      amount: amount.toString(),
      description: "Deposit",
    });

    const user = await storage.updateUserBalance(req.user!.id, amount);
    res.json({ transaction, user });
  });

  app.post("/api/transfer", requireAuth, async (req, res) => {
    const { amount, recipientUsername, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const recipient = await storage.getUserByUsername(recipientUsername);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    if (parseFloat(req.user!.balance.toString()) < amount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    await storage.createTransaction({
      userId: req.user!.id,
      type: "transfer",
      amount: (-amount).toString(),
      description: `Transfer to ${recipient.username}: ${description}`,
    });

    await storage.createTransaction({
      userId: recipient.id,
      type: "transfer",
      amount: amount.toString(),
      description: `Transfer from ${req.user!.username}: ${description}`,
    });

    const sender = await storage.updateUserBalance(req.user!.id, -amount);
    await storage.updateUserBalance(recipient.id, amount);

    res.json({ user: sender });
  });

  app.post("/api/bill-payment", requireAuth, async (req, res) => {
    const { amount, billType } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (parseFloat(req.user!.balance.toString()) < amount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    const transaction = await storage.createTransaction({
      userId: req.user!.id,
      type: "bill_payment",
      amount: (-amount).toString(),
      description: `Bill payment - ${billType}`,
    });

    const user = await storage.updateUserBalance(req.user!.id, -amount);
    res.json({ transaction, user });
  });

  // Virtual Cards Routes
  app.get("/api/virtual-cards", requireAuth, async (req, res) => {
    const cards = await storage.getUserVirtualCards(req.user!.id);
    res.json(cards);
  });

  app.get("/api/virtual-cards/:id", requireAuth, async (req, res) => {
    const card = await storage.getVirtualCard(parseInt(req.params.id));
    if (!card || card.userId !== req.user!.id) {
      return res.status(404).json({ message: "Card not found" });
    }
    res.json(card);
  });

  app.post("/api/virtual-cards", requireAuth, async (req, res) => {
    const parseResult = insertVirtualCardSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: "Invalid card data" });
    }

    const card = await storage.createVirtualCard({
      ...parseResult.data,
      userId: req.user!.id,
    });
    res.status(201).json(card);
  });

  app.patch("/api/virtual-cards/:id/status", requireAuth, async (req, res) => {
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "Invalid status" });
    }

    const card = await storage.getVirtualCard(parseInt(req.params.id));
    if (!card || card.userId !== req.user!.id) {
      return res.status(404).json({ message: "Card not found" });
    }

    const updatedCard = await storage.updateVirtualCardStatus(card.id, isActive);
    res.json(updatedCard);
  });

  // 2FA Routes
  app.post("/api/2fa/setup", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.user!.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is already enabled" });
    }

    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(user.email, "J&H Virtual Bank", secret);

    try {
      const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);
      await storage.updateUserTwoFactorSecret(user.id, secret);

      // Generate recovery keys
      const recoveryKeys = Array.from({ length: 8 }, () =>
        Math.random().toString(36).substring(2, 15).toUpperCase()
      );
      await storage.updateUserRecoveryKeys(user.id, recoveryKeys);

      res.json({ qrCodeUrl, recoveryKeys });
    } catch (error) {
      res.status(500).json({ message: "Failed to setup 2FA" });
    }
  });

  app.post("/api/2fa/verify", requireAuth, async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required" });

    const user = await storage.getUser(req.user!.id);
    if (!user?.twoFactorSecret) {
      return res.status(400).json({ message: "2FA is not set up" });
    }

    const isValid = authenticator.verify({
      token,
      secret: user.twoFactorSecret
    });

    if (!isValid) {
      return res.status(400).json({ message: "Invalid token" });
    }

    await storage.enableTwoFactor(user.id);
    res.json({ message: "2FA enabled successfully" });
  });

  app.post("/api/2fa/disable", requireAuth, async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required" });

    const user = await storage.getUser(req.user!.id);
    if (!user?.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is not enabled" });
    }

    const isValid = authenticator.verify({
      token,
      secret: user.twoFactorSecret!
    });

    if (!isValid) {
      return res.status(400).json({ message: "Invalid token" });
    }

    await storage.disableTwoFactor(user.id);
    res.json({ message: "2FA disabled successfully" });
  });

  app.post("/api/2fa/recover", requireAuth, async (req, res) => {
    const { recoveryKey } = req.body;
    if (!recoveryKey) return res.status(400).json({ message: "Recovery key is required" });

    const user = await storage.getUser(req.user!.id);
    if (!user?.recoveryKeys?.includes(recoveryKey)) {
      return res.status(400).json({ message: "Invalid recovery key" });
    }

    // Remove used recovery key
    const newRecoveryKeys = user.recoveryKeys.filter(key => key !== recoveryKey);
    await storage.updateUserRecoveryKeys(user.id, newRecoveryKeys);
    await storage.disableTwoFactor(user.id);

    res.json({ message: "2FA disabled successfully using recovery key" });
  });

  app.get("/api/user", requireAuth, (req, res) => {
    res.json({ message: 'Usuário encontrado!', user: req.user });
  });


  const httpServer = createServer(app);
  return httpServer;
}