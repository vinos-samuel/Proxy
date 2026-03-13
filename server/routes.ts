import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { logger } from "./logger";
import { registerSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import session from "express-session";
import { processQuestionnaire, parseResumeWithGemini } from "./ai-processor";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import pgSession from "connect-pg-simple";
import { pool } from "./db";
import Fuse from "fuse.js";
import { buildSystemPrompt } from "./system-prompt-builder";
import type { KnowledgeEntry } from "@shared/schema";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import Stripe from "stripe";

// Tier → Stripe Price ID mapping
const STRIPE_PRICE_IDS: Record<string, string> = {
  launch: "price_1TAQ4QPzBwfwKXghIiFEE6eG",
  evolve: "price_1TAQ4oPzBwfwKXghRBwMw9F0",
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
      }),
      secret: process.env.SESSION_SECRET || "digital-twin-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: false,
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
      });

      req.session.customerId = customer.id;
      const { passwordHash: _, ...safeCustomer } = customer;
      res.status(201).json(safeCustomer);
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

      req.session.customerId = customer.id;
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

      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.setResetToken(customer.id, hashedToken, expiry);

      if (!process.env.RESEND_API_KEY) {
        logger.error("RESEND_API_KEY not set — cannot send reset email");
        return res.json(successMsg);
      }

      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = process.env.FROM_EMAIL || "noreply@myproxy.work";
      const resetUrl = `https://myproxy.work/reset-password?token=${rawToken}`;

      await resend.emails.send({
        from: fromEmail,
        to: customer.email,
        subject: "Reset your Proxy password",
        html: `
          <div style="font-family: monospace; max-width: 600px; margin: 0 auto; padding: 40px;">
            <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">Password Reset</h2>
            <p style="margin-bottom: 24px; color: #555;">You requested a password reset for your Proxy account. Click the link below to set a new password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display: inline-block; background: #22C55E; color: black; font-weight: bold; padding: 14px 28px; text-decoration: none; border: 3px solid black; box-shadow: 4px 4px 0 black;">
              Reset Password
            </a>
            <p style="margin-top: 24px; font-size: 12px; color: #888;">If you did not request this, you can safely ignore this email.</p>
            <p style="font-size: 12px; color: #aaa; margin-top: 8px;">Or copy this link: ${resetUrl}</p>
          </div>
        `,
      });

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
      if (!token || typeof token !== "string") return res.json({ valid: false });

      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
      const customer = await storage.getCustomerByResetToken(hashedToken);

      if (!customer || !customer.resetTokenExpiry || customer.resetTokenExpiry < new Date()) {
        return res.json({ valid: false });
      }
      return res.json({ valid: true });
    } catch {
      return res.json({ valid: false });
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
        const publicDomain = customer ? `${customer.username}.myproxy.work` : undefined;

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

        res.json(extractedData);
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

        const profile = await storage.upsertProfile({
          customerId: req.session.customerId!,
          questionnaireData: req.body,
          status: "processing",
        });

        // Process in background
        res.json({ message: "Processing started" });

        processQuestionnaire(profile.id, req.body).catch((err) => {
          logger.error("AI Processing error", { error: String(err) });
          storage.updateProfileStatus(profile.id, "draft");
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

      if (profile.status !== "published" && profile.status !== "ready") {
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
      });

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: message }] }],
        config: {
          systemInstruction: systemPrompt,
        },
      });

      for await (const chunk of stream) {
        const content = chunk.text || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      logger.error("Chat error", { error: String(error) });
      if (res.headersSent) {
        res.write(
          `data: ${JSON.stringify({ error: "Failed to respond" })}\n\n`,
        );
        res.end();
      } else {
        res.status(500).json({ message: "Chat failed" });
      }
    }
  });

  // ==================== PAYMENTS ====================

  app.post(
    "/api/create-checkout-session",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { tier } = req.body;
        if (!tier || !Object.keys(STRIPE_PRICE_IDS).includes(tier)) {
          return res.status(400).json({ message: "Invalid tier. Must be launch, evolve, or concierge." });
        }

        const profile = await storage.getProfileByCustomerId(req.session.customerId!);
        if (!profile) {
          return res.status(404).json({ message: "No profile found" });
        }
        if (profile.paymentStatus === "paid") {
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
          const tier = session.metadata?.tier || "launch";
          const username = session.metadata?.username || "";
          const customerId = session.metadata?.customerId || "";

          if (profileId) {
            await storage.updateProfileById(profileId, {
              paymentStatus: "paid",
              paidAt: new Date(),
              isPublic: true,
              tier,
              publicDomain: `${username}.myproxy.work`,
            });
            await storage.updateProfileStatus(profileId, "published");
            await storage.updateCustomerStatus(customerId, "paid");
          }

          return res.json({ status: "paid", tier, domain: `${username}.myproxy.work` });
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
          const tier = session.metadata?.tier || "launch";
          const username = session.metadata?.username || "";
          const customerId = session.metadata?.customerId || "";

          if (profileId) {
            try {
              await storage.updateProfileById(profileId, {
                paymentStatus: "paid",
                paidAt: new Date(),
                isPublic: true,
                tier,
                publicDomain: `${username}.myproxy.work`,
              });
              await storage.updateProfileStatus(profileId, "published");
              await storage.updateCustomerStatus(customerId, "paid");
              logger.info(`[Stripe] Webhook: published profile ${profileId} for ${username} (${tier})`);
            } catch (dbErr) {
              logger.error("[Stripe] DB update error in webhook", { error: String(dbErr) });
            }
          }
        }
      }

      res.json({ received: true });
    },
  );

  // ==================== ADMIN ====================

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

  return httpServer;
}
