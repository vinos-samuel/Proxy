import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { logger } from "./logger";
import { registerSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import session from "express-session";
import { processQuestionnaire, parseResumeWithGemini, generateQuestionnaireDraft } from "./ai-processor";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import pgSession from "connect-pg-simple";
import { pool } from "./db";
import Fuse from "fuse.js";
import { buildSystemPrompt } from "./system-prompt-builder";
import type { KnowledgeEntry } from "@shared/schema";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import Stripe from "stripe";
import Anthropic from "@anthropic-ai/sdk";
import { verifyEmailTemplate, welcomeEmailTemplate, passwordResetTemplate } from "./emails";

// Tier → Stripe Price ID mapping
const STRIPE_PRICE_IDS: Record<string, string> = {
  pro: "price_1TGcOtPzBwfwKXgh2Ka7ye3e",
  concierge: "price_1TAQ57PzBwfwKXgh162qiUU2",
};

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// ==================== VALIDATION SCHEMAS ====================

const patchProfileSchema = z.object({
  displayName: z.string().max(100).optional(),
  roleTitle: z.string().max(150).optional(),
  positioning: z.string().max(1000).optional(),
  persona: z.string().max(500).optional(),
  tone: z.string().max(200).optional(),
  heroSubtitle: z.string().max(300).optional(),
  stats: z.array(
    z.object({ label: z.string().max(50), value: z.string().max(50) })
  ).max(6).optional(),
  howIWork: z.string().max(2000).optional(),
  whyAiCv: z.string().max(2000).optional(),
  skillTags: z.array(z.string().max(50)).max(30).optional(),
  careerTimeline: z.array(z.record(z.unknown())).max(20).optional(),
  whereImMostUseful: z.string().max(2000).optional(),
  portfolioSuggestedQuestions: z.array(z.string().max(200)).max(10).optional(),
  achievements: z.array(z.record(z.unknown())).max(20).optional(),
});

// Recursively checks that every string in a value is ≤ 5000 chars
function noLongStrings(val: unknown): boolean {
  if (typeof val === "string") return val.length <= 5000;
  if (Array.isArray(val)) return val.every(noLongStrings);
  if (val !== null && typeof val === "object") {
    return Object.values(val as Record<string, unknown>).every(noLongStrings);
  }
  return true;
}

const questionnaireDataSchema = z
  .record(z.unknown())
  .refine((data) => Object.keys(data).length <= 50, {
    message: "Questionnaire has too many keys (max 50)",
  })
  .refine((data) => noLongStrings(data), {
    message: "A questionnaire value exceeds the maximum length of 5000 characters",
  });

const PgStore = pgSession(session);

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

declare module "express-session" {
  interface SessionData {
    customerId?: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.customerId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.customerId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const customer = await storage.getCustomer(req.session.customerId);
  if (!customer?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Session middleware
  app.use(
    session({
      store: new PgStore({
        pool: pool as any,
        createTableIfMissing: true,
        pruneSessionInterval: false, // Disable auto-prune: table.sql missing from dist/ in Replit
      }),
      secret: process.env.SESSION_SECRET || "digital-twin-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    }),
  );

  // ==================== OBJECT STORAGE ====================
  registerObjectStorageRoutes(app);

  // ==================== AUTH ====================

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: parsed.error.errors[0]?.message || "Validation error",
        });
      }

      const { email, password, name, username } = parsed.data;

      const existingEmail = await storage.getCustomerByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const existingUsername = await storage.getCustomerByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const customer = await storage.createCustomer({
        email,
        passwordHash,
        name,
        username,
        emailVerified: false,
      });

      // Send verification email
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await storage.setEmailVerificationToken(customer.id, hashedToken, expiry);

      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = `Proxy <${process.env.FROM_EMAIL || "noreply@myproxy.work"}>`;
        const appUrl = process.env.APP_URL ||
          `${req.headers["x-forwarded-proto"] || "https"}://${req.headers["x-forwarded-host"] || req.headers.host}`;
        const verifyUrl = `${appUrl}/verify-email?token=${rawToken}`;

        const { error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: customer.email,
          subject: "Confirm your email — one click to activate",
          html: verifyEmailTemplate(customer.name, verifyUrl),
        });
        if (emailError) {
          logger.error("Failed to send verification email", { error: JSON.stringify(emailError), to: customer.email });
        } else {
          logger.info("Verification email sent", { to: customer.email });
        }
      }

      res.status(201).json({ message: "Account created. Please check your email to verify your account." });
    } catch (error: any) {
      logger.error("Register error", { error: String(error) });
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: parsed.error.errors[0]?.message || "Validation error",
        });
      }

      const customer = await storage.getCustomerByEmail(parsed.data.email);
      if (!customer) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(
        parsed.data.password,
        customer.passwordHash,
      );
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!customer.emailVerified) {
        return res.status(403).json({ message: "Please verify your email before logging in.", unverified: true });
      }

      req.session.customerId = customer.id;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => (err ? reject(err) : resolve()));
      });
      const { passwordHash: _, ...safeCustomer } = customer;
      res.json(safeCustomer);
    } catch (error) {
      logger.error("Login error", { error: String(error) });
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "Invalid token." });
      }

      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
      const customer = await storage.getCustomerByVerificationToken(hashedToken);

      if (!customer || !customer.emailVerificationTokenExpiry || customer.emailVerificationTokenExpiry < new Date()) {
        return res.status(400).json({ error: "This verification link is invalid or has expired." });
      }

      await storage.markEmailVerified(customer.id);
      req.session.customerId = customer.id;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => (err ? reject(err) : resolve()));
      });
      logger.info("Email verified", { customerId: customer.id });

      // Send welcome email (fire and forget — don't block the response)
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = `Proxy <${process.env.FROM_EMAIL || "noreply@myproxy.work"}>`;
        const appUrl = process.env.APP_URL ||
          `${req.headers["x-forwarded-proto"] || "https"}://${req.headers["x-forwarded-host"] || req.headers.host}`;
        resend.emails.send({
          from: fromEmail,
          to: customer.email,
          subject: "You're verified — start building your Digital Twin",
          html: welcomeEmailTemplate(customer.name, `${appUrl}/dashboard`),
        }).then(({ error }) => {
          if (error) logger.error("Failed to send welcome email", { error: JSON.stringify(error), to: customer.email });
          else logger.info("Welcome email sent", { to: customer.email });
        }).catch((err) => {
          logger.error("Welcome email exception", { error: String(err) });
        });
      }

      return res.json({ success: true });
    } catch (err) {
      logger.error("Verify-email error", { error: String(err) });
      return res.status(500).json({ error: "Something went wrong." });
    }
  });

  app.post("/api/auth/resend-verification", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const successMsg = { message: "If that account exists and is unverified, a new verification email has been sent." };
      if (!email || typeof email !== "string") return res.json(successMsg);

      const customer = await storage.getCustomerByEmail(email.toLowerCase().trim());
      if (!customer || customer.emailVerified) return res.json(successMsg);

      if (!process.env.RESEND_API_KEY) return res.json(successMsg);

      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await storage.setEmailVerificationToken(customer.id, hashedToken, expiry);

      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = `Proxy <${process.env.FROM_EMAIL || "noreply@myproxy.work"}>`;
      const appUrl = process.env.APP_URL ||
        `${req.headers["x-forwarded-proto"] || "https"}://${req.headers["x-forwarded-host"] || req.headers.host}`;
      const verifyUrl = `${appUrl}/verify-email?token=${rawToken}`;

      await resend.emails.send({
        from: fromEmail,
        to: customer.email,
        subject: "Confirm your email — one click to activate",
        html: verifyEmailTemplate(customer.name, verifyUrl),
      });

      logger.info("Resent verification email", { to: customer.email });
      return res.json(successMsg);
    } catch (err) {
      logger.error("Resend-verification error", { error: String(err) });
      return res.json({ message: "If that account exists and is unverified, a new verification email has been sent." });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.customerId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const customer = await storage.getCustomer(req.session.customerId);
    if (!customer) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { passwordHash: _, ...safeCustomer } = customer;
    res.json(safeCustomer);
  });

  // ==================== PASSWORD RESET ====================

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const successMsg = { message: "If that email exists, a reset link has been sent." };
      if (!email || typeof email !== "string") return res.json(successMsg);

      const customer = await storage.getCustomerByEmail(email.toLowerCase().trim());
      if (!customer) return res.json(successMsg);

      if (!process.env.RESEND_API_KEY) {
        logger.error("RESEND_API_KEY not set — cannot send reset email");
        return res.json(successMsg);
      }

      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.setResetToken(customer.id, hashedToken, expiry);
      logger.info("[Reset] token stored in DB", { customerId: customer.id, hashedPrefix: hashedToken.slice(0, 8), expiry });

      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = `Proxy <${process.env.FROM_EMAIL || "noreply@myproxy.work"}>`;
      const appUrl = process.env.APP_URL ||
        `${req.headers["x-forwarded-proto"] || "https"}://${req.headers["x-forwarded-host"] || req.headers.host}`;
      const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: fromEmail,
        to: customer.email,
        subject: "Reset your Proxy password",
        html: passwordResetTemplate(resetUrl),
      });

      if (emailError) {
        logger.error("Resend failed to send reset email", {
          error: JSON.stringify(emailError),
          to: customer.email,
          from: fromEmail,
        });
      } else {
        logger.info("Reset email sent", { emailId: emailData?.id, to: customer.email });
      }

      return res.json(successMsg);
    } catch (err) {
      logger.error("Forgot-password error", { error: String(err) });
      return res.json({ message: "If that email exists, a reset link has been sent." });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || typeof token !== "string" || !newPassword || typeof newPassword !== "string") {
        return res.status(400).json({ error: "Token and new password are required." });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters." });
      }

      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
      const customer = await storage.getCustomerByResetToken(hashedToken);

      if (!customer || !customer.resetTokenExpiry || customer.resetTokenExpiry < new Date()) {
        return res.status(400).json({ error: "Invalid or expired reset token." });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await storage.updatePasswordHash(customer.id, passwordHash);
      await storage.clearResetToken(customer.id);

      return res.json({ message: "Password reset successful." });
    } catch (err) {
      logger.error("Reset-password error", { error: String(err) });
      return res.status(500).json({ error: "Something went wrong." });
    }
  });

  app.get("/api/auth/verify-reset-token", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        logger.info("[Reset] verify called with no token");
        return res.json({ valid: false });
      }

      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
      logger.info("[Reset] verify lookup", { tokenLen: token.length, hashedPrefix: hashedToken.slice(0, 8) });

      // Use raw SQL to bypass any potential Drizzle schema mapping issue
      const result = await pool.query(
        "SELECT id, reset_token_expiry FROM customers WHERE reset_token = $1",
        [hashedToken]
      );
      logger.info("[Reset] raw SQL result", { rowCount: result.rowCount, hashedPrefix: hashedToken.slice(0, 8) });

      if (result.rowCount === 0) {
        logger.info("[Reset] no customer found for token", { hashedPrefix: hashedToken.slice(0, 8) });
        return res.json({ valid: false, reason: "not_found" });
      }
      const expiry = result.rows[0].reset_token_expiry;
      if (!expiry || new Date(expiry) < new Date()) {
        logger.info("[Reset] token expired", { expiry });
        return res.json({ valid: false, reason: "expired" });
      }
      logger.info("[Reset] token valid", { customerId: result.rows[0].id });
      return res.json({ valid: true });
    } catch (err) {
      logger.info("[Reset] verify-reset-token error", { error: String(err) });
      return res.json({ valid: false, reason: "error", detail: String(err) });
    }
  });

  // ==================== PROFILE ====================

  app.get("/api/profile", requireAuth, async (req: Request, res: Response) => {
    const profile = await storage.getProfileByCustomerId(
      req.session.customerId!,
    );
    if (!profile) {
      return res.status(404).json({ message: "No profile found" });
    }
    res.json(profile);
  });

  app.post(
    "/api/profile/publish",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const profile = await storage.getProfileByCustomerId(
          req.session.customerId!,
        );
        if (!profile) {
          return res.status(404).json({ message: "No profile found" });
        }
        if (profile.status !== "ready") {
          return res
            .status(400)
            .json({ message: "Profile is not ready to publish" });
        }

        if (profile.paymentStatus !== "paid") {
          return res.status(402).json({ message: "Payment required. Please select a plan on the dashboard first." });
        }

        const customer = await storage.getCustomer(req.session.customerId!);
        const publicDomain = customer ? `myproxy.work/portfolio/${customer.username}` : undefined;

        await storage.updateProfileById(profile.id, {
          isPublic: true,
          publicDomain,
        });
        await storage.updateProfileStatus(profile.id, "published");
        await storage.updateCustomerStatus(req.session.customerId!, "paid");
        res.json({ message: "Published successfully" });
      } catch (error) {
        logger.error("Publish error", { error: String(error) });
        res.status(500).json({ message: "Failed to publish" });
      }
    },
  );

  // Status endpoint for polling during AI processing
  app.get("/api/profile/status", requireAuth, async (req: Request, res: Response) => {
    const profile = await storage.getProfileByCustomerId(req.session.customerId!);
    if (!profile) {
      return res.status(404).json({ status: "not_found" });
    }
    res.json({ status: profile.status, paymentStatus: profile.paymentStatus });
  });

  app.patch(
    "/api/profile",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const validation = patchProfileSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            error: "Invalid profile data",
            details: validation.error.flatten(),
          });
        }

        const profile = await storage.getProfileByCustomerId(
          req.session.customerId!,
        );
        if (!profile) {
          return res.status(404).json({ message: "No profile found" });
        }

        // Free tier edit gating — 48hr window
        if (profile.tier === "free" && profile.freePublishedAt) {
          const hoursSincePublish = (Date.now() - new Date(profile.freePublishedAt).getTime()) / (1000 * 60 * 60);
          if (hoursSincePublish > 48) {
            return res.status(403).json({ message: "Free plan edit window has expired. Upgrade to Pro for unlimited edits." });
          }
        }

        const textFields = [
          "displayName",
          "roleTitle",
          "positioning",
          "persona",
          "tone",
          "heroSubtitle",
        ];
        const jsonFields = [
          "stats",
          "howIWork",
          "whyAiCv",
          "skillsMatrix",
          "skillTags",
          "careerTimeline",
          "whereImMostUseful",
          "portfolioSuggestedQuestions",
        ];
        const updates: Record<string, any> = {};
        for (const field of textFields) {
          if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
          }
        }
        for (const field of jsonFields) {
          if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
          }
        }

        if (req.body.achievements !== undefined) {
          const qData = (profile.questionnaireData as any) || {};
          qData.step5 = { ...qData.step5, achievements: req.body.achievements };
          updates.questionnaireData = qData;
        }

        if (Object.keys(updates).length === 0) {
          return res.status(400).json({ message: "No valid fields to update" });
        }

        await storage.updateProfileById(profile.id, updates);
        const updated = await storage.getProfileByCustomerId(
          req.session.customerId!,
        );
        res.json(updated);
      } catch (error) {
        logger.error("Profile update error", { error: String(error) });
        res.status(500).json({ message: "Failed to update profile" });
      }
    },
  );

  // ==================== RESUME PARSING ====================

  const resumeUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  app.post(
    "/api/parse-resume",
    requireAuth,
    resumeUpload.single("resume"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        if (req.file.mimetype !== "application/pdf") {
          return res.status(400).json({
            error: "Only PDF resumes are supported. Please convert your document to PDF first.",
          });
        }

        const pdfBuffer = req.file.buffer;
        const extractedData = await parseResumeWithGemini(pdfBuffer);

        logger.debug("[Resume Parse] Successfully extracted data", {
          name: extractedData.name,
          rolesCount: extractedData.roles?.length || 0,
        });

        // Generate full questionnaire draft and save to DB so the
        // questionnaire page auto-loads it when the user navigates there.
        let questionnaireDraft: any = null;
        try {
          questionnaireDraft = await generateQuestionnaireDraft(extractedData);
          // Stamp as AI draft so the frontend can show the review banner
          questionnaireDraft._aiDraft = true;
          questionnaireDraft._aiDraftGeneratedAt = new Date().toISOString();

          await storage.upsertProfile({
            customerId: req.session.customerId!,
            questionnaireData: questionnaireDraft,
          });

          logger.info("[Resume Parse] Questionnaire draft saved to DB", {
            customerId: req.session.customerId,
          });
        } catch (draftErr) {
          // Non-fatal: log and continue — client still gets extractedData for basic pre-fill
          logger.warn("[Resume Parse] Draft generation failed, continuing without full draft", {
            error: String(draftErr),
          });
        }

        res.json({ extractedData, questionnaireDraft });
      } catch (error: any) {
        logger.error("[Resume Parse] Error", { error: String(error) });
        res.status(500).json({
          error: error.message || "Failed to parse resume. Please try again or fill the form manually.",
        });
      }
    },
  );

  // ==================== QUESTIONNAIRE ====================

  app.post(
    "/api/questionnaire/save",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const validation = questionnaireDataSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({ error: "Invalid questionnaire data" });
        }

        const existing = await storage.getProfileByCustomerId(
          req.session.customerId!,
        );
        const updateData: any = {
          customerId: req.session.customerId!,
          questionnaireData: req.body,
        };
        if (!existing || existing.status === "draft") {
          updateData.status = "draft";
        }
        await storage.upsertProfile(updateData);
        res.json({ message: "Saved" });
      } catch (error) {
        logger.error("Save error", { error: String(error) });
        res.status(500).json({ message: "Failed to save" });
      }
    },
  );

  app.post(
    "/api/questionnaire/submit",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const validation = questionnaireDataSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({ error: "Invalid questionnaire data" });
        }

        const existingProfile = await storage.getProfileByCustomerId(req.session.customerId!);
        const profile = await storage.upsertProfile({
          customerId: req.session.customerId!,
          questionnaireData: req.body,
          status: existingProfile?.status === "published" ? "reprocessing" : "processing",
        });

        // Process in background
        res.json({ message: "Processing started" });

        processQuestionnaire(profile.id, req.body).catch((err) => {
          logger.error("AI Processing error", { error: String(err) });
          storage.updateProfileStatus(profile.id, existingProfile?.status === "published" ? "published" : "draft");
        });
      } catch (error) {
        logger.error("Submit error", { error: String(error) });
        res.status(500).json({ message: "Failed to submit" });
      }
    },
  );

  // ==================== PORTFOLIO (PUBLIC) ====================

  app.get("/api/portfolio/:username", async (req: Request, res: Response) => {
    try {
      const customer = await storage.getCustomerByUsername(req.params.username);
      if (!customer) {
        return res.status(404).json({ message: "Portfolio not found" });
      }

      const profile = await storage.getProfileByCustomerId(customer.id);
      if (!profile) {
        return res.status(404).json({ message: "Portfolio not found" });
      }

      const isOwner = req.session.customerId === customer.id;

      if (profile.status !== "published" && profile.status !== "ready" && profile.status !== "reprocessing") {
        return res.status(404).json({ message: "Portfolio not found" });
      }

      if (!profile.isPublic && !isOwner) {
        return res.status(403).json({
          message: "This portfolio is private",
          paymentRequired: true,
        });
      }

      const factBanksList = await storage.getFactBanksByProfileId(profile.id);
      const entries = await storage.getKnowledgeEntriesByProfileId(profile.id);
      const questionnaireData = profile.questionnaireData as any;

      const contact = questionnaireData?.step1
        ? {
            email: questionnaireData.step1.email || null,
            phone: questionnaireData.step1.phone || null,
            linkedin: questionnaireData.step1.linkedinUrl || null,
            location: questionnaireData.step1.location || null,
          }
        : {
            email: questionnaireData?.step4?.contactEmail || null,
            phone: questionnaireData?.step4?.contactPhone || null,
            linkedin: questionnaireData?.step4?.contactLinkedin || null,
            location: null,
          };

      const suggestedQuestions = questionnaireData?.step11?.suggestedQuestions
        ? questionnaireData.step11.suggestedQuestions
            .split("\n")
            .map((q: string) => q.trim())
            .filter(Boolean)
            .slice(0, 8)
        : [];

      res.json({
        profile: {
          displayName: profile.displayName,
          roleTitle: profile.roleTitle,
          positioning: profile.positioning,
          persona: profile.persona,
          tone: profile.tone,
          photoUrl:
            profile.photoUrl ||
            questionnaireData?.step10?.headshot ||
            questionnaireData?.step10?.photoUrl ||
            null,
          videoUrl:
            profile.videoUrl || questionnaireData?.step10?.introVideo || null,
          resumeUrl:
            profile.resumeUrl || questionnaireData?.step3?.resumeUrl || null,
          cvResumeUrl:
            profile.cvResumeUrl || questionnaireData?.step10?.cvResume || null,
          brandingTheme:
            profile.brandingTheme ||
            questionnaireData?.step10?.brandingTheme ||
            "corporate",
          technicalSkills: questionnaireData?.step6?.technicalSkills || null,
          achievements: questionnaireData?.step5?.achievements || null,
          communicationStyle:
            questionnaireData?.step7?.communicationStyle || null,
          heroSubtitle: profile.heroSubtitle || null,
          stats: profile.stats || [],
          problemFit: profile.problemFit || [],
          howIWork: profile.howIWork || null,
          whyAiCv: profile.whyAiCv || [],
          portfolioSuggestedQuestions:
            profile.portfolioSuggestedQuestions || suggestedQuestions,
          careerTimeline: profile.careerTimeline || [],
          skillsMatrix: (profile as any).skillsMatrix || null,
          skillTags: (profile as any).skillTags || null,
          whereImMostUseful: (profile as any).whereImMostUseful || null,
        },
        factBanks: factBanksList,
        knowledgeEntries: entries,
        contact,
        suggestedQuestions:
          profile.portfolioSuggestedQuestions || suggestedQuestions,
      });
    } catch (error) {
      logger.error("Portfolio error", { error: String(error) });
      res.status(500).json({ message: "Failed to load portfolio" });
    }
  });

  // ==================== CHAT (PUBLIC) ====================

  app.post("/api/chat/:username", async (req: Request, res: Response) => {
    try {
      const customer = await storage.getCustomerByUsername(req.params.username);
      if (!customer) {
        return res.status(404).json({ message: "Not found" });
      }

      const profile = await storage.getProfileByCustomerId(customer.id);
      if (
        !profile ||
        (profile.status !== "published" && profile.status !== "ready")
      ) {
        return res.status(404).json({ message: "Not found" });
      }

      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message required" });
      }

      const entries = await storage.getKnowledgeEntriesByProfileId(profile.id);
      const factBanksList = await storage.getFactBanksByProfileId(profile.id);

      // Use Fuse.js for fuzzy matching
      const fuse = new Fuse(entries, {
        keys: [
          { name: "keywords", weight: 0.35 },
          { name: "title", weight: 0.2 },
          { name: "content", weight: 0.15 },
          { name: "challenge", weight: 0.1 },
          { name: "approach", weight: 0.1 },
          { name: "result", weight: 0.08 },
          { name: "scale", weight: 0.02 },
        ],
        threshold: 0.4,
        includeScore: true,
      });

      const searchResults = fuse.search(message);
      const relevantEntries = searchResults.slice(0, 5).map((r) => r.item);

      // Build knowledge context
      let knowledgeContext = "";

      for (const entry of relevantEntries) {
        knowledgeContext += `\n--- ${entry.title} (${entry.type}) ---\n`;
        if (entry.content) knowledgeContext += `${entry.content}\n`;
        if (entry.challenge)
          knowledgeContext += `Challenge: ${entry.challenge}\n`;
        if (entry.approach) knowledgeContext += `Approach: ${entry.approach}\n`;
        if (entry.result) knowledgeContext += `Result: ${entry.result}\n`;
        if (entry.scale) knowledgeContext += `Scale: ${entry.scale}\n`;
      }

      // Add fact bank context
      let factContext = "\nCareer History:\n";
      for (const fb of factBanksList) {
        factContext += `${fb.roleName} at ${fb.companyName}`;
        if (fb.duration) factContext += ` (${fb.duration})`;
        factContext += `: ${fb.facts.join("; ")}\n`;
      }

      const toneInstructions: Record<string, string> = {
        direct:
          "Be direct, confident, and concise. Speak with authority and seniority.",
        warm: "Be warm, approachable, and friendly. Explain clearly with empathy.",
        technical:
          "Be technical, precise, and detail-oriented. Use specific terminology where appropriate.",
        strategic:
          "Be strategic, consultative, and big-picture. Think in frameworks and trade-offs.",
        casual:
          "Be casual, conversational, and relatable. Speak naturally as if chatting with a friend.",
      };

      const questionnaireData = profile.questionnaireData as any;
      const wordsUsed = questionnaireData?.step7?.wordsUsedOften || "";
      const wordsAvoided = questionnaireData?.step7?.wordsAvoided || "";
      const specialInstructions =
        questionnaireData?.step11?.specialInstructions || "";

      // Detect if the question mentions a specific company from the user's career history
      const mentionedCompany = factBanksList.find(fb =>
        message.toLowerCase().includes(fb.companyName.toLowerCase())
      )?.companyName || null;

      const systemPrompt = await buildSystemPrompt(profile.id, {
        displayName: profile.displayName || "Unknown Professional",
        roleTitle: profile.roleTitle || "Professional",
        positioning: profile.positioning || "",
        tone: profile.tone || "direct",
        answerStyle:
          profile.answerStyle ||
          toneInstructions[profile.tone || "direct"] ||
          "Professional and clear",
        fallbackResponse:
          profile.fallbackResponse ||
          "That's outside my expertise, but I'm happy to discuss my background in detail.",
        wordsUsedOften: questionnaireData?.step7?.wordsUsedOften || "",
        wordsAvoided: questionnaireData?.step7?.wordsAvoided || "",
        portfolioData: questionnaireData?.portfolioData || null,
        mentionedCompany,
      });

      // Use Claude Haiku for chat — better quality, less hallucination
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const result = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: message }],
      });

      const responseText = result.content[0].type === "text"
        ? result.content[0].text
        : "I'm not sure how to answer that. Could you rephrase?";
      res.json({ content: responseText });

      // Fire-and-forget: save question for analytics
      storage.saveChatMessage(profile.id, message).catch(() => {});
    } catch (error) {
      logger.error("Chat error", { error: String(error) });
      res.status(500).json({ message: String(error) });
    }
  });

  // ==================== ANALYTICS ====================

  // Public: increment view count when portfolio page loads
  app.post("/api/analytics/view/:username", async (req: Request, res: Response) => {
    try {
      const customer = await storage.getCustomerByUsername(req.params.username);
      if (!customer) return res.json({ ok: true });
      const profile = await storage.getProfileByCustomerId(customer.id);
      if (profile?.status === "published") {
        storage.incrementViewCount(profile.id).catch(() => {});
      }
      res.json({ ok: true });
    } catch {
      res.json({ ok: true });
    }
  });

  // Authenticated: get analytics for logged-in user's profile
  app.get("/api/analytics/my", requireAuth, async (req: Request, res: Response) => {
    try {
      const profile = await storage.getProfileByCustomerId(req.session.customerId!);
      if (!profile) return res.json({ viewCount: 0, recentQuestions: [] });
      const analytics = await storage.getAnalytics(profile.id);
      res.json(analytics);
    } catch (error) {
      logger.error("Analytics error", { error: String(error) });
      res.status(500).json({ message: "Could not load analytics" });
    }
  });

  // ==================== PAYMENTS ====================

  // Free tier publish — no payment required
  app.post("/api/publish-free", requireAuth, async (req: Request, res: Response) => {
    try {
      const profile = await storage.getProfileByCustomerId(req.session.customerId!);
      if (!profile) return res.status(404).json({ message: "No profile found" });
      if (profile.paymentStatus === "paid" && profile.tier !== "free") {
        return res.status(400).json({ message: "Already published with a paid plan" });
      }
      if (profile.status !== "ready" && profile.status !== "published") {
        return res.status(400).json({ message: "Profile is not ready to publish" });
      }

      const customer = await storage.getCustomer(req.session.customerId!);
      await storage.updateProfileById(profile.id, {
        paymentStatus: "paid",
        tier: "free",
        isPublic: true,
        freePublishedAt: new Date(),
        publicDomain: `myproxy.work/portfolio/${customer?.username}`,
      });

      // Process if has questionnaire data and never been processed before
      if (profile.questionnaireData && profile.status === "draft") {
        await storage.updateProfileStatus(profile.id, "processing");
        processQuestionnaire(profile.id, profile.questionnaireData as any)
          .then(() => storage.updateProfileStatus(profile.id, "published"))
          .catch((err) => {
            logger.error("[Free] Publish processing error", { error: String(err) });
            storage.updateProfileStatus(profile.id, "published");
          });
      } else {
        await storage.updateProfileStatus(profile.id, "published");
      }

      // Send profile live email
      try {
        const { profileLiveTemplate } = await import("./emails");
        const resendApiKey = process.env.RESEND_API_KEY;
        const fromEmail = process.env.FROM_EMAIL || "noreply@myproxy.work";
        if (resendApiKey && customer?.email) {
          const profileUrl = `https://myproxy.work/portfolio/${customer.username}`;
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: `Proxy <${fromEmail}>`,
              to: customer.email,
              subject: "Your Digital Twin is Live!",
              html: profileLiveTemplate(customer.name || customer.username, profileUrl),
            }),
          });
        }
      } catch (emailErr) {
        logger.info("[Free] Profile live email failed (non-blocking)", { error: String(emailErr) });
      }

      res.json({ success: true, username: customer?.username });
    } catch (error) {
      logger.error("[Free] Publish error", { error: String(error) });
      res.status(500).json({ message: "Failed to publish" });
    }
  });

  app.post(
    "/api/create-checkout-session",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { tier } = req.body;
        if (!tier || !Object.keys(STRIPE_PRICE_IDS).includes(tier)) {
          return res.status(400).json({ message: "Invalid tier. Must be pro or concierge." });
        }

        const profile = await storage.getProfileByCustomerId(req.session.customerId!);
        if (!profile) {
          return res.status(404).json({ message: "No profile found" });
        }
        if (profile.paymentStatus === "paid" && profile.tier !== "free") {
          return res.status(400).json({ message: "Already paid" });
        }
        if (profile.status !== "ready" && profile.status !== "published") {
          return res.status(400).json({ message: "Profile is not ready to publish" });
        }

        const customer = await storage.getCustomer(req.session.customerId!);
        const stripe = getStripe();

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [{ price: STRIPE_PRICE_IDS[tier], quantity: 1 }],
          mode: "payment",
          success_url: `https://myproxy.work/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `https://myproxy.work/payment/cancelled`,
          customer_email: customer?.email,
          metadata: {
            profileId: profile.id,
            customerId: req.session.customerId!,
            tier,
            username: customer?.username || "",
          },
        });

        await storage.updateProfileById(profile.id, {
          stripeSessionId: session.id,
          tier,
        });

        res.json({ url: session.url });
      } catch (error) {
        logger.error("[Stripe] Checkout error", { error: String(error) });
        res.status(500).json({ message: "Failed to create checkout session" });
      }
    },
  );

  app.get(
    "/api/payment/status",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const sessionId = req.query.session_id as string;
        if (!sessionId) {
          return res.status(400).json({ message: "Missing session_id" });
        }

        const stripe = getStripe();
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === "paid") {
          const profileId = session.metadata?.profileId;
          const tier = session.metadata?.tier || "pro";
          const username = session.metadata?.username || "";
          const customerId = session.metadata?.customerId || "";

          if (profileId) {
            await storage.updateProfileById(profileId, {
              paymentStatus: "paid",
              paidAt: new Date(),
              isPublic: true,
              tier,
              publicDomain: `myproxy.work/portfolio/${username}`,
            });
            await storage.updateProfileStatus(profileId, "published");
            await storage.updateCustomerStatus(customerId, "paid");
          }

          return res.json({ status: "paid", tier, domain: `myproxy.work/portfolio/${username}` });
        }

        res.json({ status: "pending" });
      } catch (error) {
        logger.error("[Stripe] Payment status error", { error: String(error) });
        res.status(500).json({ message: "Failed to check payment status" });
      }
    },
  );

  app.post(
    "/api/stripe/webhook",
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        logger.error("[Stripe] STRIPE_WEBHOOK_SECRET is not set");
        return res.status(500).json({ error: "Webhook secret not configured" });
      }

      let event: Stripe.Event;
      try {
        const stripe = getStripe();
        event = stripe.webhooks.constructEvent(
          (req as any).rawBody,
          sig,
          webhookSecret,
        );
      } catch (err: any) {
        logger.error("[Stripe] Webhook signature error", { error: err.message });
        return res.status(400).json({ error: `Webhook error: ${err.message}` });
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid") {
          const profileId = session.metadata?.profileId;
          const tier = session.metadata?.tier || "pro";
          const username = session.metadata?.username || "";
          const customerId = session.metadata?.customerId || "";

          if (profileId) {
            try {
              await storage.updateProfileById(profileId, {
                paymentStatus: "paid",
                paidAt: new Date(),
                isPublic: true,
                tier,
                publicDomain: `myproxy.work/portfolio/${username}`,
              });
              await storage.updateProfileStatus(profileId, "published");
              await storage.updateCustomerStatus(customerId, "paid");
              logger.info(`[Stripe] Webhook: published profile ${profileId} for ${username} (${tier})`);

              // Send "Profile is live" email (fire and forget)
              if (process.env.RESEND_API_KEY && customerId) {
                try {
                  const customer = await storage.getCustomer(customerId);
                  if (customer?.email) {
                    const { Resend } = await import("resend");
                    const { profileLiveTemplate } = await import("./emails");
                    const resend = new Resend(process.env.RESEND_API_KEY);
                    const fromEmail = `Proxy <${process.env.FROM_EMAIL || "noreply@myproxy.work"}>`;
                    const profileUrl = `https://myproxy.work/portfolio/${username}`;
                    await resend.emails.send({
                      from: fromEmail,
                      to: customer.email,
                      subject: "Your Digital Twin is live!",
                      html: profileLiveTemplate(customer.name, profileUrl),
                    });
                    logger.info("[Stripe] Profile live email sent", { to: customer.email });
                  }
                } catch (emailErr) {
                  logger.info("[Stripe] Profile live email failed (non-fatal)", { error: String(emailErr) });
                }
              }
            } catch (dbErr) {
              logger.error("[Stripe] DB update error in webhook", { error: String(dbErr) });
            }
          }
        }
      }

      res.json({ received: true });
    },
  );

  // ==================== BLOG ====================

  // GET /api/blog — published posts only
  app.get("/api/blog", async (req, res) => {
    const posts = await storage.getPublishedBlogPosts();
    res.json(posts);
  });

  // GET /api/blog/:slug — single published post, increment view
  app.get("/api/blog/:slug", async (req, res) => {
    const post = await storage.getBlogPostBySlug(req.params.slug);
    if (!post || post.status !== "published") {
      return res.status(404).json({ message: "Post not found" });
    }
    storage.incrementBlogViewCount(post.id).catch(() => {});
    res.json(post);
  });

  // ==================== ADMIN ====================

  app.delete(
    "/api/admin/customer/:customerId",
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const { customerId } = req.params;
        if (customerId === req.session.customerId) {
          return res.status(400).json({ message: "Cannot delete your own account" });
        }
        await storage.deleteCustomer(customerId);
        logger.info("[Admin] Customer deleted", { customerId, by: req.session.customerId });
        res.json({ success: true });
      } catch (error) {
        logger.error("Admin delete customer error", { error: String(error) });
        res.status(500).json({ message: "Failed to delete customer" });
      }
    },
  );

  app.post(
    "/api/admin/grant-access/:customerId",
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const { customerId } = req.params;
        const customer = await storage.getCustomer(customerId);
        if (!customer) return res.status(404).json({ message: "Customer not found" });

        await storage.updateCustomerStatus(customerId, "paid");

        const profile = await storage.getProfileByCustomerId(customerId);
        if (profile) {
          await storage.updateProfileById(profile.id, {
            paymentStatus: "paid",
            paidAt: new Date(),
            isPublic: true,
            tier: "pro",
            publicDomain: `myproxy.work/portfolio/${customer.username}`,
          });
          // If profile has questionnaire data, process it; otherwise just mark published
          if (profile.questionnaireData) {
            await storage.updateProfileStatus(profile.id, "processing");
            processQuestionnaire(profile.id, profile.questionnaireData as any).catch((err) =>
              logger.error("[Admin] Grant access reprocess error", { error: String(err) })
            );
          } else {
            await storage.updateProfileStatus(profile.id, "published");
          }
        }

        // Send "Profile is live" email (fire and forget)
        if (process.env.RESEND_API_KEY && customer.email) {
          try {
            const { Resend } = await import("resend");
            const { profileLiveTemplate } = await import("./emails");
            const resend = new Resend(process.env.RESEND_API_KEY);
            const fromEmail = `Proxy <${process.env.FROM_EMAIL || "noreply@myproxy.work"}>`;
            const profileUrl = `https://myproxy.work/portfolio/${customer.username}`;
            resend.emails.send({
              from: fromEmail,
              to: customer.email,
              subject: "Your Digital Twin is live!",
              html: profileLiveTemplate(customer.name, profileUrl),
            }).catch(() => {});
            logger.info("[Admin] Profile live email queued", { to: customer.email });
          } catch {}
        }

        logger.info("[Admin] Free access granted", { customerId, by: req.session.customerId });
        res.json({ success: true });
      } catch (error) {
        logger.error("Admin grant access error", { error: String(error) });
        res.status(500).json({ message: "Failed to grant access" });
      }
    },
  );

  app.post(
    "/api/admin/reprocess/:customerId",
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const profile = await storage.getProfileByCustomerId(req.params.customerId);
        if (!profile) {
          return res.status(404).json({ message: "Profile not found" });
        }
        if (!profile.questionnaireData) {
          return res.status(400).json({ message: "No questionnaire data to reprocess" });
        }

        await storage.updateProfileStatus(profile.id, "processing");
        res.json({ message: "Reprocessing started" });

        processQuestionnaire(profile.id, profile.questionnaireData as any).catch((err) => {
          logger.error("[Admin Reprocess] AI error", { error: String(err) });
          storage.updateProfileStatus(profile.id, "ready");
        });
      } catch (error) {
        logger.error("[Admin Reprocess] Error", { error: String(error) });
        res.status(500).json({ message: "Failed to reprocess" });
      }
    },
  );

  app.get(
    "/api/admin/overview",
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const stats = await storage.getAdminStats();
        const customersData = await storage.getCustomersWithProfiles();

        // Remove password hashes
        const safeCustomers = customersData.map(
          ({ passwordHash, ...rest }) => rest,
        );

        res.json({ customers: safeCustomers, stats });
      } catch (error) {
        logger.error("Admin error", { error: String(error) });
        res.status(500).json({ message: "Failed to load admin data" });
      }
    },
  );

  // ==================== ADMIN BLOG ====================

  // GET /api/admin/blog — all posts
  app.get("/api/admin/blog", requireAdmin, async (req, res) => {
    const posts = await storage.getAllBlogPosts();
    res.json(posts);
  });

  // POST /api/admin/blog — create post
  app.post("/api/admin/blog", requireAdmin, async (req, res) => {
    try {
      const { title, slug, excerpt, content, heroImageUrl, category, metaDescription, status } = req.body;
      if (!title || !content) return res.status(400).json({ message: "Title and content are required" });
      const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const post = await storage.createBlogPost({
        title, slug: finalSlug, excerpt, content, heroImageUrl, category, metaDescription,
        status: status || "draft",
        publishedAt: status === "published" ? new Date() : null,
      });
      res.json(post);
    } catch (error: any) {
      if (error.message?.includes("unique")) {
        return res.status(400).json({ message: "A post with this slug already exists" });
      }
      logger.error("Blog create error", { error: String(error) });
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // PATCH /api/admin/blog/:id — update post
  app.patch("/api/admin/blog/:id", requireAdmin, async (req, res) => {
    try {
      const existing = await storage.getBlogPostById(req.params.id);
      if (!existing) return res.status(404).json({ message: "Post not found" });
      await storage.updateBlogPost(req.params.id, req.body);
      const updated = await storage.getBlogPostById(req.params.id);
      res.json(updated);
    } catch (error) {
      logger.error("Blog update error", { error: String(error) });
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  // DELETE /api/admin/blog/:id — delete post
  app.delete("/api/admin/blog/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteBlogPost(req.params.id);
      res.json({ success: true });
    } catch (error) {
      logger.error("Blog delete error", { error: String(error) });
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // POST /api/admin/blog/:id/publish — publish a post
  app.post("/api/admin/blog/:id/publish", requireAdmin, async (req, res) => {
    try {
      await storage.updateBlogPost(req.params.id, { status: "published", publishedAt: new Date() });
      res.json({ success: true });
    } catch (error) {
      logger.error("Blog publish error", { error: String(error) });
      res.status(500).json({ message: "Failed to publish post" });
    }
  });

  // POST /api/admin/blog/:id/unpublish — unpublish a post
  app.post("/api/admin/blog/:id/unpublish", requireAdmin, async (req, res) => {
    try {
      await storage.updateBlogPost(req.params.id, { status: "draft" });
      res.json({ success: true });
    } catch (error) {
      logger.error("Blog unpublish error", { error: String(error) });
      res.status(500).json({ message: "Failed to unpublish post" });
    }
  });

  // POST /api/admin/nudge-test/:customerId — send both nudge emails immediately for testing
  app.post("/api/admin/nudge-test/:customerId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const customer = await storage.getCustomer(req.params.customerId);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      const profile = await storage.getProfileByCustomerId(customer.id);
      if (!profile) return res.status(404).json({ message: "Profile not found" });

      const { Resend } = await import("resend");
      const { nudgeEditWindowTemplate, nudgeEngagementTemplate } = await import("./emails");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = `Proxy <${process.env.FROM_EMAIL || "noreply@myproxy.work"}>`;
      const upgradeUrl = "https://myproxy.work/dashboard";
      const viewCount = profile.viewCount ?? 0;

      await resend.emails.send({
        from,
        to: customer.email,
        subject: "[TEST] Your Proxy edit window has closed",
        html: nudgeEditWindowTemplate(customer.name, upgradeUrl),
      });
      await resend.emails.send({
        from,
        to: customer.email,
        subject: `[TEST] Your Twin has had ${viewCount} visitors`,
        html: nudgeEngagementTemplate(customer.name, viewCount, upgradeUrl),
      });

      logger.info("[Nudge] Test emails sent", { to: customer.email });
      res.json({ success: true, sentTo: customer.email });
    } catch (error) {
      logger.error("[Nudge] Test email error", { error: String(error) });
      res.status(500).json({ message: "Failed to send test emails" });
    }
  });

  // ─── Sitemap & Robots.txt ──────────────────────────────────────────────────

  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const baseUrl = "https://myproxy.work";
      const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // Static pages
      const staticPages = [
        { url: "/", priority: "1.0", changefreq: "weekly" },
        { url: "/about", priority: "0.8", changefreq: "monthly" },
        { url: "/blog", priority: "0.9", changefreq: "daily" },
        { url: "/faq", priority: "0.8", changefreq: "monthly" },
        { url: "/privacy", priority: "0.3", changefreq: "yearly" },
        { url: "/terms", priority: "0.3", changefreq: "yearly" },
        { url: "/register", priority: "0.7", changefreq: "monthly" },
        { url: "/login", priority: "0.5", changefreq: "monthly" },
      ];

      // Published blog posts
      const blogPosts = await storage.getPublishedBlogPosts();

      // Published portfolio profiles
      const usernames = await storage.getPublishedProfileUsernames();

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

      // Static pages
      for (const page of staticPages) {
        xml += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
      }

      // Blog posts
      for (const post of blogPosts) {
        const lastmod = post.updatedAt
          ? new Date(post.updatedAt).toISOString().split("T")[0]
          : now;
        xml += `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }

      // Published portfolios
      for (const username of usernames) {
        xml += `  <url>
    <loc>${baseUrl}/portfolio/${username}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }

      xml += `</urlset>`;

      res.set("Content-Type", "application/xml");
      res.send(xml);
    } catch (error) {
      logger.error("Sitemap generation error", { error: String(error) });
      res.status(500).send("Error generating sitemap");
    }
  });

  app.get("/robots.txt", (_req, res) => {
    const robots = `User-agent: *
Allow: /
Allow: /about
Allow: /blog
Allow: /blog/*
Allow: /faq
Allow: /portfolio/*
Allow: /privacy
Allow: /terms

Disallow: /api/
Disallow: /dashboard
Disallow: /admin
Disallow: /questionnaire
Disallow: /preview
Disallow: /payment/
Disallow: /verify-email
Disallow: /reset-password
Disallow: /forgot-password

Sitemap: https://myproxy.work/sitemap.xml
`;
    res.set("Content-Type", "text/plain");
    res.send(robots);
  });

  return httpServer;
}
