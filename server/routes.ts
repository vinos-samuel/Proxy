import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerSchema, loginSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import session from "express-session";
import { processQuestionnaire } from "./ai-processor";
import { GoogleGenAI } from "@google/genai";
import pgSession from "connect-pg-simple";
import { pool } from "./db";
import Fuse from "fuse.js";
import { buildSystemPrompt } from "./system-prompt-builder";
import type { KnowledgeEntry } from "@shared/schema";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

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
      console.error("Register error:", error);
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
      console.error("Login error:", error);
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

        await storage.updateProfileStatus(profile.id, "published");
        await storage.updateCustomerStatus(req.session.customerId!, "paid");
        res.json({ message: "Published successfully" });
      } catch (error) {
        console.error("Publish error:", error);
        res.status(500).json({ message: "Failed to publish" });
      }
    },
  );

  app.patch(
    "/api/profile",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const profile = await storage.getProfileByCustomerId(
          req.session.customerId!,
        );
        if (!profile) {
          return res.status(404).json({ message: "No profile found" });
        }

        const allowedFields = [
          "displayName",
          "roleTitle",
          "positioning",
          "persona",
          "tone",
        ];
        const updates: Record<string, any> = {};
        for (const field of allowedFields) {
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
        console.error("Profile update error:", error);
        res.status(500).json({ message: "Failed to update profile" });
      }
    },
  );

  // ==================== QUESTIONNAIRE ====================

  app.post(
    "/api/questionnaire/save",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
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
        console.error("Save error:", error);
        res.status(500).json({ message: "Failed to save" });
      }
    },
  );

  app.post(
    "/api/questionnaire/submit",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const profile = await storage.upsertProfile({
          customerId: req.session.customerId!,
          questionnaireData: req.body,
          status: "processing",
        });

        // Process in background
        res.json({ message: "Processing started" });

        processQuestionnaire(profile.id, req.body).catch((err) => {
          console.error("AI Processing error:", err);
          storage.updateProfileStatus(profile.id, "draft");
        });
      } catch (error) {
        console.error("Submit error:", error);
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
      if (
        !profile ||
        (profile.status !== "published" && profile.status !== "ready")
      ) {
        // Allow "ready" for preview, "published" for public
        if (profile?.status === "ready") {
          // Check if requester is the owner
          if (req.session.customerId !== customer.id) {
            return res.status(404).json({ message: "Portfolio not found" });
          }
        } else {
          return res.status(404).json({ message: "Portfolio not found" });
        }
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
            .filter(Boolean)
            .slice(0, 4)
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
          // NEW PORTFOLIO DISPLAY DATA
          heroSubtitle: profile.heroSubtitle || null,
          stats: profile.stats || [],
          problemFit: profile.problemFit || [],
          howIWork: profile.howIWork || null,
          whyAiCv: profile.whyAiCv || [],
          portfolioSuggestedQuestions:
            profile.portfolioSuggestedQuestions || suggestedQuestions,
          careerTimeline: profile.careerTimeline || [],
        },
        factBanks: factBanksList,
        knowledgeEntries: entries,
        contact,
        suggestedQuestions:
          profile.portfolioSuggestedQuestions || suggestedQuestions,
      });
    } catch (error) {
      console.error("Portfolio error:", error);
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
      console.error("Chat error:", error);
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

  // ==================== ADMIN ====================

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
        console.error("Admin error:", error);
        res.status(500).json({ message: "Failed to load admin data" });
      }
    },
  );

  return httpServer;
}
