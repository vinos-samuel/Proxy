import { z } from "zod";

export const profileStyleSchema = z.enum(["editorial", "modern", "expressive"]);
export type ProfileStyle = z.infer<typeof profileStyleSchema>;

const boundedText = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) => boundedText(max).optional();
const mediaUrl = boundedText(1000).refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value), "Invalid media URL");

export const profileSourceSchema = z.object({
  id: boundedText(80),
  kind: z.enum(["resume", "user"]),
  label: boundedText(160),
  excerpt: boundedText(1200),
});

export const profileExperienceSchema = z.object({
  id: boundedText(80),
  company: boundedText(160),
  title: boundedText(160),
  period: optionalText(100),
  summary: optionalText(800),
  highlights: z.array(boundedText(500)).max(8).default([]),
  sourceIds: z.array(boundedText(80)).max(12).default([]),
});

export const profileProjectSchema = z.object({
  id: boundedText(80),
  title: boundedText(180),
  company: optionalText(160),
  challenge: optionalText(900),
  contribution: optionalText(900),
  outcome: optionalText(900),
  sourceIds: z.array(boundedText(80)).max(12).default([]),
});

export const profileContactSchema = z.object({
  email: z.string().email().max(254).nullable().default(null),
  linkedin: z.string().url().max(500).nullable().default(null),
  website: z.string().url().max(500).nullable().default(null),
  showEmail: z.boolean().default(false),
  showLinkedin: z.boolean().default(false),
  showWebsite: z.boolean().default(false),
});

export const improvementProposalSchema = z.object({
  id: boundedText(80),
  questionId: boundedText(100),
  section: z.enum(["headline", "summary", "project", "experience"]),
  targetId: boundedText(80).nullable().default(null),
  field: z.enum(["headline", "summary", "challenge", "contribution", "outcome"]),
  question: boundedText(400),
  answer: boundedText(2500),
  before: boundedText(2500),
  proposed: boundedText(2500),
  baseRevision: z.number().int().positive(),
});

export const profileUndoSchema = z.object({
  section: z.enum(["headline", "summary", "project", "experience", "style", "settings"]),
  targetId: boundedText(80).nullable().default(null),
  field: boundedText(80),
  before: z.unknown(),
  after: z.unknown(),
});

export const profileDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  style: profileStyleSchema,
  identity: z.object({
    name: boundedText(160),
    title: boundedText(180),
    location: optionalText(160),
    headline: boundedText(240),
    summary: boundedText(1800),
    photoUrl: mediaUrl.nullable().default(null),
  }),
  projects: z.array(profileProjectSchema).max(8).default([]),
  experience: z.array(profileExperienceSchema).max(20).default([]),
  skills: z.array(boundedText(80)).max(40).default([]),
  contact: profileContactSchema,
  publicBotEnabled: z.boolean().default(false),
  sources: z.array(profileSourceSchema).max(80).default([]),
  skippedQuestionIds: z.array(boundedText(100)).max(60).default([]),
  answeredQuestionIds: z.array(boundedText(100)).max(60).default([]),
  pendingProposal: improvementProposalSchema.nullable().default(null),
  undoStack: z.array(profileUndoSchema).max(5).default([]),
}).superRefine((document, context) => {
  const sourceIds = new Set(document.sources.map((source) => source.id));
  for (const section of [...document.projects, ...document.experience]) {
    for (const sourceId of section.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `Unknown source reference: ${sourceId}` });
      }
    }
  }
  const proposal = document.pendingProposal;
  if (proposal?.section === "project" && !document.projects.some((project) => project.id === proposal.targetId)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Suggestion target does not exist" });
  }
  if (proposal?.section === "experience" && !document.experience.some((role) => role.id === proposal.targetId)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Suggestion target does not exist" });
  }
});

export type ProfileDocument = z.infer<typeof profileDocumentSchema>;
export type ImprovementProposal = z.infer<typeof improvementProposalSchema>;

export const improvementQuestionSchema = z.object({
  id: boundedText(100),
  section: z.enum(["headline", "summary", "project", "experience"]),
  targetId: boundedText(80).nullable().default(null),
  field: z.enum(["headline", "summary", "challenge", "contribution", "outcome"]),
  label: boundedText(160),
  question: boundedText(400),
  priority: z.number().int().min(1).max(100),
});
export type ImprovementQuestion = z.infer<typeof improvementQuestionSchema>;

export const profileDocumentPatchSchema = z.object({
  revision: z.number().int().positive(),
  document: profileDocumentSchema,
});

export const improvementAnswerSchema = z.object({
  revision: z.number().int().positive(),
  questionId: boundedText(100),
  answer: boundedText(2500).min(2),
});

export const revisionSchema = z.object({
  revision: z.number().int().positive(),
});

export function toPublicProfileDocument(document: ProfileDocument): ProfileDocument {
  const contact = {
    ...document.contact,
    email: document.contact.showEmail ? document.contact.email : null,
    linkedin: document.contact.showLinkedin ? document.contact.linkedin : null,
    website: document.contact.showWebsite ? document.contact.website : null,
  };

  return {
    ...document,
    contact,
    sources: [],
    skippedQuestionIds: [],
    answeredQuestionIds: [],
    pendingProposal: null,
    undoStack: [],
    projects: document.projects.map(({ sourceIds: _sourceIds, ...project }) => ({
      ...project,
      sourceIds: [],
    })),
    experience: document.experience.map(({ sourceIds: _sourceIds, ...role }) => ({
      ...role,
      sourceIds: [],
    })),
  };
}
