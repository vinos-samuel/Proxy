import type { Express, Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { storage } from "./storage";
import { logger } from "./logger";
import {
  improvementAnswerSchema,
  profileDocumentPatchSchema,
  profileDocumentSchema,
  revisionSchema,
  type ProfileDocument,
} from "@shared/profile-document";
import { parseResumeWithGemini, generatePortfolioPreview, generateProfileImprovement } from "./ai-processor";
import {
  applyProposal,
  buildProfileDocument,
  buildProfileDocumentFromLegacy,
  getImprovementCandidates,
  undoLastChange,
} from "./profile-builder";
import { selectImprovementQuestion } from "./typesafe-judgments";

declare module "express-session" {
  interface SessionData {
    pageDraft?: {
      createdAt: number;
      revision: number;
      extractedData: unknown;
      document: ProfileDocument;
    };
  }
}

const GUEST_DRAFT_TTL_MS = 4 * 60 * 60 * 1000;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const improveSchema = improvementAnswerSchema.extend({});
const skipSchema = revisionSchema.extend({ questionId: z.string().min(1).max(100) });
const proposalEditSchema = revisionSchema.extend({ proposed: z.string().trim().min(2).max(2500) });
const adoptGuestSchema = z.object({ confirmReplace: z.boolean().default(false) });

type LoadedBuilder = {
  profileId: string | null;
  document: ProfileDocument;
  revision: number;
  publishedRevision: number | null;
  hasPublished: boolean;
  source: "account" | "guest";
};

function getGuestDraft(req: Request) {
  const draft = req.session.pageDraft;
  if (!draft) return undefined;
  if (Date.now() - draft.createdAt > GUEST_DRAFT_TTL_MS) {
    delete req.session.pageDraft;
    return undefined;
  }
  return draft;
}

async function saveSession(req: Request): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    req.session.save((error) => error ? reject(error) : resolve());
  });
}

async function loadBuilder(req: Request): Promise<LoadedBuilder | null> {
  if (req.session.customerId) {
    const profile = await storage.getProfileByCustomerId(req.session.customerId);
    if (profile) {
      const row = await storage.getProfileDocumentByProfileId(profile.id);
      if (row) {
        return {
          profileId: profile.id,
          document: profileDocumentSchema.parse(row.workingDocument),
          revision: row.revision,
          publishedRevision: row.publishedRevision,
          hasPublished: Boolean(row.publishedDocument),
          source: "account",
        };
      }
    }
  }

  const guest = getGuestDraft(req);
  if (!guest) return null;
  return {
    profileId: null,
    document: profileDocumentSchema.parse(guest.document),
    revision: guest.revision,
    publishedRevision: null,
    hasPublished: false,
    source: "guest",
  };
}

async function saveWorking(req: Request, state: LoadedBuilder, document: ProfileDocument) {
  const parsed = profileDocumentSchema.parse(document);
  if (state.profileId) {
    const row = await storage.updateWorkingProfileDocument(state.profileId, state.revision, parsed);
    if (!row) return null;
    return { document: profileDocumentSchema.parse(row.workingDocument), revision: row.revision };
  }

  const guest = getGuestDraft(req);
  if (!guest || guest.revision !== state.revision) return null;
  guest.document = parsed;
  guest.revision += 1;
  guest.createdAt = Date.now();
  req.session.pageDraft = guest;
  await saveSession(req);
  return { document: parsed, revision: guest.revision };
}

function stateResponse(state: LoadedBuilder, extra: Record<string, unknown> = {}) {
  return {
    document: state.document,
    revision: state.revision,
    publishedRevision: state.publishedRevision,
    hasPublished: state.hasPublished,
    source: state.source,
    ...extra,
  };
}

export function registerProfileBuilderRoutes(app: Express) {
  app.get("/api/builder", async (req: Request, res: Response) => {
    try {
      const state = await loadBuilder(req);
      if (state) {
        const guestAvailable = Boolean(req.session.customerId && getGuestDraft(req));
        return res.json(stateResponse(state, { guestAvailable }));
      }
      if (req.session.customerId) {
        const profile = await storage.getProfileByCustomerId(req.session.customerId);
        return res.json({ needsUpload: !profile, legacyAvailable: Boolean(profile) });
      }
      return res.json({ needsUpload: true, guestExpiresInHours: 4 });
    } catch (error) {
      logger.error("[Profile Builder] Load failed", { error: String(error) });
      return res.status(500).json({ message: "Could not load your page" });
    }
  });

  app.post("/api/builder/upload", upload.single("resume"), async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ message: "Choose a CV to upload" });
      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({ message: "Only PDF CVs are supported" });
      }

      const startedAt = Date.now();
      const extractedData = await parseResumeWithGemini(req.file.buffer);
      const parsedAt = Date.now();
      const preview = await generatePortfolioPreview(extractedData);
      const generatedAt = Date.now();
      const document = profileDocumentSchema.parse(buildProfileDocument(extractedData, preview));

      if (req.session.customerId) {
        const profile = await storage.upsertProfile({
          customerId: req.session.customerId,
          displayName: document.identity.name,
          roleTitle: document.identity.title,
          positioning: document.identity.summary,
          heroSubtitle: document.identity.headline,
          careerTimeline: preview.careerTimeline,
          stats: preview.stats,
          status: "ready",
        });
        const row = await storage.upsertProfileDocument(profile.id, document);
        logger.info("[Profile Builder] Account page generated", {
          profileId: profile.id,
          parseMs: parsedAt - startedAt,
          generationMs: generatedAt - parsedAt,
          totalMs: Date.now() - startedAt,
        });
        return res.json({
          document: row.workingDocument,
          revision: row.revision,
          hasPublished: Boolean(row.publishedDocument),
          source: "account",
        });
      }

      req.session.pageDraft = {
        createdAt: Date.now(),
        revision: 1,
        extractedData,
        document,
      };
      await saveSession(req);
      logger.info("[Profile Builder] Guest page generated", {
        parseMs: parsedAt - startedAt,
        generationMs: generatedAt - parsedAt,
        totalMs: Date.now() - startedAt,
      });
      return res.json({ document, revision: 1, hasPublished: false, source: "guest" });
    } catch (error: any) {
      logger.error("[Profile Builder] Upload failed", { error: String(error) });
      return res.status(500).json({ message: error.message || "Could not build your page" });
    }
  });

  app.post("/api/builder/adopt-existing", async (req: Request, res: Response) => {
    if (!req.session.customerId) return res.status(401).json({ message: "Sign in first" });
    try {
      const profile = await storage.getProfileByCustomerId(req.session.customerId);
      if (!profile) return res.status(404).json({ message: "No existing profile found" });
      const existing = await storage.getProfileDocumentByProfileId(profile.id);
      if (existing) return res.status(409).json({ message: "A new-design draft already exists" });
      const document = profileDocumentSchema.parse(buildProfileDocumentFromLegacy(profile));
      const row = await storage.upsertProfileDocument(profile.id, document);
      return res.json({ document: row.workingDocument, revision: row.revision, source: "account" });
    } catch (error) {
      logger.error("[Profile Builder] Legacy import failed", { error: String(error) });
      return res.status(500).json({ message: "Could not prepare the new design" });
    }
  });

  app.post("/api/builder/adopt-guest", async (req: Request, res: Response) => {
    if (!req.session.customerId) return res.status(401).json({ message: "Sign in first" });
    const guest = getGuestDraft(req);
    if (!guest) return res.status(404).json({ message: "Your guest draft has expired" });
    try {
      const request = adoptGuestSchema.safeParse(req.body || {});
      if (!request.success) return res.status(400).json({ message: "Invalid request" });
      const existingProfile = await storage.getProfileByCustomerId(req.session.customerId);
      const existingDocument = existingProfile
        ? await storage.getProfileDocumentByProfileId(existingProfile.id)
        : undefined;
      if (existingDocument && !request.data.confirmReplace) {
        return res.status(409).json({ message: "This account already has a working page. Confirm before replacing that private draft." });
      }
      const profile = await storage.upsertProfile({
        customerId: req.session.customerId,
        displayName: guest.document.identity.name,
        roleTitle: guest.document.identity.title,
        positioning: guest.document.identity.summary,
        heroSubtitle: guest.document.identity.headline,
        status: "ready",
      });
      const row = await storage.upsertProfileDocument(profile.id, guest.document);
      delete req.session.pageDraft;
      await saveSession(req);
      return res.json({ document: row.workingDocument, revision: row.revision, source: "account" });
    } catch (error) {
      logger.error("[Profile Builder] Guest adoption failed", { error: String(error) });
      return res.status(500).json({ message: "Could not save this draft to your account" });
    }
  });

  app.patch("/api/builder", async (req: Request, res: Response) => {
    const parsed = profileDocumentPatchSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid page data", details: parsed.error.flatten() });
    const state = await loadBuilder(req);
    if (!state) return res.status(404).json({ message: "No page draft found" });
    if (state.revision !== parsed.data.revision) return res.status(409).json({ message: "This page changed in another tab. Reload before saving." });
    const saved = await saveWorking(req, state, parsed.data.document);
    if (!saved) return res.status(409).json({ message: "This page changed in another tab. Reload before saving." });
    return res.json(saved);
  });

  app.get("/api/builder/question", async (req: Request, res: Response) => {
    const state = await loadBuilder(req);
    if (!state) return res.status(404).json({ message: "No page draft found" });
    if (state.document.pendingProposal) {
      return res.json({ question: null, pendingProposal: state.document.pendingProposal });
    }
    const selection = await selectImprovementQuestion(state.document, getImprovementCandidates(state.document));
    return res.json(selection);
  });

  app.post("/api/builder/improve", async (req: Request, res: Response) => {
    const parsed = improveSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Add a short answer first" });
    const state = await loadBuilder(req);
    if (!state) return res.status(404).json({ message: "No page draft found" });
    if (state.revision !== parsed.data.revision) return res.status(409).json({ message: "Your page changed. Reload and try again." });
    if (state.document.pendingProposal) return res.status(409).json({ message: "Review the current suggestion first" });
    const question = getImprovementCandidates(state.document).find((candidate) => candidate.id === parsed.data.questionId);
    if (!question) return res.status(400).json({ message: "That question is no longer relevant" });
    const proposal = await generateProfileImprovement(state.document, question, parsed.data.answer, state.revision);
    proposal.baseRevision = state.revision + 1;
    const next = { ...state.document, pendingProposal: proposal };
    const saved = await saveWorking(req, state, next);
    if (!saved) return res.status(409).json({ message: "Your page changed while the suggestion was prepared. Try again." });
    return res.json({ ...saved, proposal });
  });

  app.post("/api/builder/keep", async (req: Request, res: Response) => {
    const parsed = revisionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid revision" });
    const state = await loadBuilder(req);
    if (!state?.document.pendingProposal) return res.status(404).json({ message: "No suggestion to keep" });
    if (state.revision !== parsed.data.revision || state.document.pendingProposal.baseRevision !== state.revision) {
      return res.status(409).json({ message: "This suggestion is out of date. Reload your page." });
    }
    const saved = await saveWorking(req, state, applyProposal(state.document, state.document.pendingProposal));
    if (!saved) return res.status(409).json({ message: "Your page changed in another tab" });
    return res.json(saved);
  });

  app.post("/api/builder/proposal", async (req: Request, res: Response) => {
    const parsed = proposalEditSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "The edited suggestion is invalid" });
    const state = await loadBuilder(req);
    if (!state?.document.pendingProposal) return res.status(404).json({ message: "No suggestion to edit" });
    if (state.revision !== parsed.data.revision) return res.status(409).json({ message: "Your page changed. Reload and try again." });
    const next = structuredClone(state.document);
    next.pendingProposal!.proposed = parsed.data.proposed;
    next.pendingProposal!.baseRevision = state.revision + 1;
    const saved = await saveWorking(req, state, next);
    if (!saved) return res.status(409).json({ message: "Your page changed in another tab" });
    return res.json(saved);
  });

  app.post("/api/builder/skip", async (req: Request, res: Response) => {
    const parsed = skipSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid request" });
    const state = await loadBuilder(req);
    if (!state) return res.status(404).json({ message: "No page draft found" });
    if (state.revision !== parsed.data.revision) return res.status(409).json({ message: "Your page changed. Reload and try again." });
    const next = structuredClone(state.document);
    next.skippedQuestionIds = Array.from(new Set([...next.skippedQuestionIds, parsed.data.questionId]));
    next.pendingProposal = null;
    const saved = await saveWorking(req, state, next);
    if (!saved) return res.status(409).json({ message: "Your page changed in another tab" });
    return res.json(saved);
  });

  app.post("/api/builder/undo", async (req: Request, res: Response) => {
    const parsed = revisionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid revision" });
    const state = await loadBuilder(req);
    if (!state) return res.status(404).json({ message: "No page draft found" });
    if (state.revision !== parsed.data.revision) return res.status(409).json({ message: "Your page changed. Reload and try again." });
    const next = undoLastChange(state.document);
    if (!next) return res.status(400).json({ message: "There is nothing to undo" });
    const saved = await saveWorking(req, state, next);
    if (!saved) return res.status(409).json({ message: "Your page changed in another tab" });
    return res.json(saved);
  });

  app.post("/api/builder/approve", async (req: Request, res: Response) => {
    if (!req.session.customerId) return res.status(401).json({ message: "Create an account to publish" });
    const parsed = revisionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid revision" });
    const profile = await storage.getProfileByCustomerId(req.session.customerId);
    if (!profile) return res.status(404).json({ message: "No profile found" });
    const row = await storage.getProfileDocumentByProfileId(profile.id);
    if (!row || row.revision !== parsed.data.revision) return res.status(409).json({ message: "Your page changed. Reload before publishing." });
    if (row.publishedDocument && row.publishedRevision === row.revision) {
      return res.json({ approved: true, revision: row.revision, profileId: profile.id });
    }
    const document = profileDocumentSchema.parse(row.workingDocument);
    if (document.pendingProposal) return res.status(409).json({ message: "Keep or skip the current suggestion before publishing" });
    const published = await storage.publishProfileDocument(profile.id, row.revision);
    if (!published) return res.status(409).json({ message: "Your page changed. Reload before publishing." });
    return res.json({ approved: true, revision: published.revision, profileId: profile.id });
  });

  app.post("/api/builder/publish", async (req: Request, res: Response) => {
    if (!req.session.customerId) return res.status(401).json({ message: "Create an account to publish" });
    const parsed = revisionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid revision" });
    const profile = await storage.getProfileByCustomerId(req.session.customerId);
    if (!profile) return res.status(404).json({ message: "No profile found" });
    const row = await storage.getProfileDocumentByProfileId(profile.id);
    if (!row || row.revision !== parsed.data.revision) return res.status(409).json({ message: "Your page changed. Reload before publishing." });
    if (!row.publishedDocument || row.publishedRevision !== row.revision) {
      return res.status(409).json({ message: "Approve this version before publishing" });
    }

    const isPaid = profile.paymentStatus === "paid" && profile.tier !== "free";
    const isEditableFree = profile.tier === "free" && profile.freePublishedAt &&
      Date.now() - new Date(profile.freePublishedAt).getTime() <= 7 * 24 * 60 * 60 * 1000;
    if (!isPaid && !isEditableFree) {
      return res.status(402).json({ message: "Choose a publishing plan", code: "PLAN_REQUIRED", profileId: profile.id });
    }

    const customer = await storage.getCustomer(req.session.customerId);
    await storage.updateProfileById(profile.id, {
      isPublic: true,
      publicDomain: `myproxy.work/portfolio/${customer?.username}`,
    });
    await storage.updateProfileStatus(profile.id, "published");
    return res.json({ success: true, username: customer?.username });
  });

  app.post("/api/builder/rollback", async (req: Request, res: Response) => {
    if (!req.session.customerId) return res.status(401).json({ message: "Sign in first" });
    const parsed = revisionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid revision" });
    const profile = await storage.getProfileByCustomerId(req.session.customerId);
    if (!profile) return res.status(404).json({ message: "No profile found" });
    const restored = await storage.restorePreviousProfileDocument(profile.id, parsed.data.revision);
    if (!restored) return res.status(400).json({ message: "No previous published version is available" });
    return res.json({ document: restored.workingDocument, revision: restored.revision });
  });
}
