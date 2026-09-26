import { z } from "zod";

export const profileStyleSchema = z.enum(["executive", "editorial", "modern", "expressive"]);
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
  highlights: z.array(boundedText(500)).max(16).default([]),
  sourceIds: z.array(boundedText(80)).max(12).default([]),
});

export const profileEmployerContributionSchema = z.object({
  id: boundedText(80),
  company: boundedText(160),
  contributions: z.array(boundedText(500)).max(20).default([]),
  sourceIds: z.array(boundedText(80)).max(12).default([]),
});

export const profileProjectSchema = z.object({
  id: boundedText(80),
  title: boundedText(180),
  company: optionalText(160),
  summary: optionalText(500),
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
    videoUrl: mediaUrl.nullable().default(null),
    showPhoto: z.boolean().default(true),
    showVideo: z.boolean().default(true),
  }),
  projects: z.array(profileProjectSchema).max(8).default([]),
  experience: z.array(profileExperienceSchema).max(20).default([]),
  employerContributions: z.array(profileEmployerContributionSchema).max(20).default([]),
  skills: z.array(boundedText(80)).max(40).default([]),
  contact: profileContactSchema,
  publicBotEnabled: z.boolean().default(false),
  impactStats: z.array(z.object({
    id: boundedText(80),
    label: boundedText(120),
    value: boundedText(80),
  })).max(6).default([]),
  howIWork: optionalText(900),
  details: z.object({
    education: z.array(boundedText(500)).max(12).default([]),
    certifications: z.array(boundedText(500)).max(12).default([]),
    awards: z.array(boundedText(500)).max(12).default([]),
    interests: z.array(boundedText(500)).max(12).default([]),
    showEducation: z.boolean().default(true),
    showCertifications: z.boolean().default(true),
    showAwards: z.boolean().default(true),
    showInterests: z.boolean().default(false),
  }).default({ education: [], certifications: [], awards: [], interests: [], showEducation: true, showCertifications: true, showAwards: true, showInterests: false }),
  privateContext: z.object({
    workingStyle: optionalText(1800),
    careerDirection: optionalText(1800),
    voiceNotes: optionalText(1200),
    questions: z.array(z.object({ question: boundedText(400), answer: boundedText(1800) })).max(12).default([]),
    concerns: z.array(z.object({ concern: boundedText(400), response: boundedText(1800) })).max(12).default([]),
  }).default({ questions: [], concerns: [] }),
  sources: z.array(profileSourceSchema).max(80).default([]),
  skippedQuestionIds: z.array(boundedText(100)).max(60).default([]),
  answeredQuestionIds: z.array(boundedText(100)).max(60).default([]),
  pendingProposal: improvementProposalSchema.nullable().default(null),
  undoStack: z.array(profileUndoSchema).max(5).default([]),
}).superRefine((document, context) => {
  const sourceIds = new Set(document.sources.map((source) => source.id));
  for (const section of [...document.projects, ...document.experience, ...document.employerContributions]) {
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

// A page saved before a field existed comes back from storage without it.
// Fill every optional section with its empty shape so old pages open
// instead of crashing on the first missing field a renderer touches.
// Deliberately not the zod schema itself: profileDocumentSchema's
// superRefine cross-checks source references, which a genuinely old
// document can legitimately fail even though it's still safe to render.
export function normalizeProfileDocument(document: ProfileDocument): ProfileDocument {
  return {
    ...document,
    projects: document.projects || [],
    experience: document.experience || [],
    employerContributions: document.employerContributions || [],
    skills: document.skills || [],
    sources: document.sources || [],
    skippedQuestionIds: document.skippedQuestionIds || [],
    answeredQuestionIds: document.answeredQuestionIds || [],
    undoStack: document.undoStack || [],
    pendingProposal: document.pendingProposal ?? null,
    publicBotEnabled: document.publicBotEnabled ?? false,
    impactStats: document.impactStats || [],
    howIWork: document.howIWork,
    identity: {
      ...document.identity,
      videoUrl: document.identity?.videoUrl ?? null,
      showPhoto: document.identity?.showPhoto ?? true,
      showVideo: document.identity?.showVideo ?? true,
    },
    contact: {
      email: document.contact?.email ?? null,
      linkedin: document.contact?.linkedin ?? null,
      website: document.contact?.website ?? null,
      showEmail: document.contact?.showEmail ?? false,
      showLinkedin: document.contact?.showLinkedin ?? false,
      showWebsite: document.contact?.showWebsite ?? false,
    },
    details: {
      education: document.details?.education ?? [],
      certifications: document.details?.certifications ?? [],
      awards: document.details?.awards ?? [],
      interests: document.details?.interests ?? [],
      showEducation: document.details?.showEducation ?? false,
      showCertifications: document.details?.showCertifications ?? false,
      showAwards: document.details?.showAwards ?? false,
      showInterests: document.details?.showInterests ?? false,
    },
    privateContext: {
      workingStyle: document.privateContext?.workingStyle,
      careerDirection: document.privateContext?.careerDirection,
      voiceNotes: document.privateContext?.voiceNotes,
      questions: document.privateContext?.questions ?? [],
      concerns: document.privateContext?.concerns ?? [],
    },
  };
}

// Material the owner explicitly wrote for visitor questions (sample Q&A,
// anticipated concerns) plus how they want the bot to sound. Distinct from
// toPublicProfileDocument/normalizeProfileDocument: those control what
// renders on the page or ships to the client; this never goes to the
// client — only into a server-side prompt for answering a question, and
// only the owner's own words, never invented.
export function approvedBotBackground(document: ProfileDocument): { qaText: string; tone?: string } {
  const parts = [
    ...document.privateContext.questions.map((item) => `Q: ${item.question}\nA: ${item.answer}`),
    ...document.privateContext.concerns.map((item) => `Possible concern: ${item.concern}\nHow to address it: ${item.response}`),
  ];
  return {
    qaText: parts.join("\n\n"),
    tone: document.privateContext.voiceNotes?.trim() || undefined,
  };
}

export const improvementQuestionSchema = z.object({
  id: boundedText(100),
  section: z.enum(["headline", "summary", "project", "experience"]),
  targetId: boundedText(80).nullable().default(null),
  field: z.enum(["headline", "summary", "challenge", "contribution", "outcome"]),
  label: boundedText(160),
  sourceKind: z.enum(["resume", "user"]).optional(),
  sourceExcerpt: optionalText(320),
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
    details: {
      ...document.details,
      education: document.details.showEducation ? document.details.education : [],
      certifications: document.details.showCertifications ? document.details.certifications : [],
      awards: document.details.showAwards ? document.details.awards : [],
      interests: document.details.showInterests ? document.details.interests : [],
    },
    privateContext: { questions: [], concerns: [] },
    sources: [],
    skippedQuestionIds: [],
    answeredQuestionIds: [],
    pendingProposal: null,
    undoStack: [],
    projects: document.projects
      .filter((project) => [project.summary, project.challenge, project.contribution, project.outcome]
        .some((value) => Boolean(value && value.trim().length >= 10)))
      .map(({ sourceIds: _sourceIds, ...project }) => ({
        ...project,
        sourceIds: [],
      })),
    experience: document.experience.map(({ sourceIds: _sourceIds, ...role }) => ({
      ...role,
      sourceIds: [],
    })),
    employerContributions: document.employerContributions.map(({ sourceIds: _sourceIds, ...employer }) => ({
      ...employer,
      sourceIds: [],
    })),
  };
}

export function selectPublicProfileDocument(
  row: { activeDocument?: unknown | null; publishedDocument?: unknown | null } | null | undefined,
): ProfileDocument | null {
  if (!row?.activeDocument) return null;
  return toPublicProfileDocument(profileDocumentSchema.parse(row.activeDocument));
}
