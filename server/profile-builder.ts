import type { ParsedResume } from "./ai-processor";
import type {
  ImprovementProposal,
  ImprovementQuestion,
  ProfileDocument,
} from "@shared/profile-document";

type Preview = {
  positioning: string;
  heroSubtitle: string;
  stats: Array<{ value: string; label: string; icon?: string }>;
  careerTimeline: Array<{
    company: string;
    roles: Array<{ title: string; years: string; achievements?: string[] }>;
  }>;
};

function cleanLines(value: string | undefined): string[] {
  return (value || "")
    .split("\n")
    .map((line) => line.replace(/^[\s•*\-–—]+/, "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

function stableId(prefix: string, index: number): string {
  return `${prefix}-${index + 1}`;
}

function normalizeWebUrl(value: string | undefined): string | null {
  if (!value || value.startsWith("[")) return null;
  if (value.startsWith("/")) return value;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(candidate).toString();
  } catch {
    return null;
  }
}

function normalizeEmail(value: string | undefined): string | null {
  return value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
}

export function buildProfileDocument(parsed: ParsedResume, preview: Preview): ProfileDocument {
  const positioningParts = (preview.positioning || parsed.summary || "")
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  const headline = positioningParts[0] || parsed.currentTitle || "Professional profile";
  const summary = positioningParts.slice(1).join("\n\n") || parsed.summary || headline;

  const sources: ProfileDocument["sources"] = [];
  const experience: ProfileDocument["experience"] = (parsed.roles || []).slice(0, 20).map((role, index) => {
    const sourceId = stableId("resume-role", index);
    const highlights = cleanLines(role.achievements);
    sources.push({
      id: sourceId,
      kind: "resume",
      label: `${role.title || "Role"} at ${role.company || "Company"}`,
      excerpt: [role.title, role.company, role.years, ...highlights].filter(Boolean).join(" — ").slice(0, 1200),
    });
    return {
      id: stableId("experience", index),
      company: role.company || "Company",
      title: role.title || "Role",
      period: role.years || undefined,
      highlights,
      sourceIds: [sourceId],
    };
  });

  const projects: ProfileDocument["projects"] = [];
  (parsed.roles || []).forEach((role, index) => {
    const highlights = cleanLines(role.achievements);
    if (!highlights.length || projects.length >= 3) return;
    projects.push({
      id: stableId("project", index),
      title: `${role.company || "Selected work"}: ${role.title || "Professional contribution"}`,
      company: role.company || undefined,
      contribution: highlights[0],
      sourceIds: [stableId("resume-role", index)],
    });
  });

  (parsed.achievements || []).slice(0, 10).forEach((achievement, index) => {
    sources.push({
      id: stableId("resume-achievement", index),
      kind: "resume",
      label: "CV achievement",
      excerpt: achievement.slice(0, 1200),
    });
  });

  return {
    schemaVersion: 1,
    style: "editorial",
    identity: {
      name: parsed.name || "Your name",
      title: parsed.currentTitle || "Professional",
      location: parsed.location || undefined,
      headline: headline.slice(0, 240),
      summary: summary.slice(0, 1800),
      photoUrl: null,
    },
    projects,
    experience,
    skills: (parsed.skills || []).map((skill) => skill.trim()).filter(Boolean).slice(0, 40),
    contact: {
      email: normalizeEmail(parsed.email),
      linkedin: normalizeWebUrl(parsed.linkedin),
      website: null,
      showEmail: false,
      showLinkedin: false,
      showWebsite: false,
    },
    publicBotEnabled: false,
    sources,
    skippedQuestionIds: [],
    answeredQuestionIds: [],
    pendingProposal: null,
    undoStack: [],
  };
}

export function buildProfileDocumentFromLegacy(profile: any): ProfileDocument {
  const questionnaire = profile.questionnaireData || {};
  const rawTimeline = Array.isArray(profile.careerTimeline) ? profile.careerTimeline : [];
  const experience: ProfileDocument["experience"] = [];

  rawTimeline.forEach((company: any, companyIndex: number) => {
    const roles = Array.isArray(company.roles) ? company.roles : [];
    roles.forEach((role: any, roleIndex: number) => {
      experience.push({
        id: `legacy-experience-${companyIndex + 1}-${roleIndex + 1}`,
        company: String(company.company || company.companyName || "Company").slice(0, 160),
        title: String(role.title || role.roleTitle || "Role").slice(0, 160),
        period: role.years ? String(role.years).slice(0, 100) : undefined,
        highlights: (Array.isArray(role.achievements) ? role.achievements : [])
          .map((item: unknown) => String(item).slice(0, 500))
          .slice(0, 8),
        sourceIds: [],
      });
    });
  });

  const stories = Array.isArray(questionnaire?.step4?.stories)
    ? questionnaire.step4.stories
    : Array.isArray(questionnaire?.step3?.stories)
      ? questionnaire.step3.stories
      : [];
  const projects: ProfileDocument["projects"] = stories
    .filter((story: any) => story && !String(story.title || "").startsWith("[EDIT"))
    .slice(0, 8)
    .map((story: any, index: number) => ({
      id: `legacy-project-${index + 1}`,
      title: String(story.title || `Selected work ${index + 1}`).slice(0, 180),
      challenge: story.challenge ? String(story.challenge).slice(0, 900) : undefined,
      contribution: story.approach ? String(story.approach).slice(0, 900) : undefined,
      outcome: story.result && !String(story.result).startsWith("[EDIT")
        ? String(story.result).slice(0, 900)
        : undefined,
      sourceIds: [],
    }));

  const skillTags = Array.isArray(profile.skillTags)
    ? profile.skillTags
    : typeof questionnaire?.step6?.technicalSkills === "string"
      ? questionnaire.step6.technicalSkills.split(/[,\n]/)
      : [];

  const contactEmail = questionnaire?.step1?.email || questionnaire?.step4?.contactEmail || null;
  const contactLinkedin = questionnaire?.step1?.linkedinUrl || questionnaire?.step4?.contactLinkedin || null;

  return {
    schemaVersion: 1,
    style: "editorial",
    identity: {
      name: String(profile.displayName || questionnaire?.step1?.fullName || "Your name").slice(0, 160),
      title: String(profile.roleTitle || questionnaire?.step1?.currentTitle || "Professional").slice(0, 180),
      location: questionnaire?.step1?.location ? String(questionnaire.step1.location).slice(0, 160) : undefined,
      headline: String(profile.positioning || profile.heroSubtitle || profile.roleTitle || "Professional profile").split(/\n\s*\n/)[0].slice(0, 240),
      summary: String(profile.positioning || questionnaire?.step2?.professionalSummary || profile.roleTitle || "Professional profile").slice(0, 1800),
      photoUrl: normalizeWebUrl(profile.photoUrl || questionnaire?.step10?.headshot || questionnaire?.step10?.photoUrl || undefined),
    },
    projects,
    experience,
    skills: skillTags.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 40),
    contact: {
      email: typeof contactEmail === "string" && contactEmail.includes("@") && !contactEmail.startsWith("[") ? contactEmail : null,
      linkedin: typeof contactLinkedin === "string" && /^https?:\/\//.test(contactLinkedin) ? contactLinkedin : null,
      website: null,
      showEmail: false,
      showLinkedin: false,
      showWebsite: false,
    },
    publicBotEnabled: false,
    sources: [],
    skippedQuestionIds: [],
    answeredQuestionIds: [],
    pendingProposal: null,
    undoStack: [],
  };
}

export function getImprovementCandidates(document: ProfileDocument): ImprovementQuestion[] {
  const skipped = new Set(document.skippedQuestionIds);
  const answered = new Set(document.answeredQuestionIds);
  const candidates: ImprovementQuestion[] = [];

  document.projects.forEach((project, index) => {
    const label = project.title;
    if (!project.challenge?.trim()) {
      candidates.push({
        id: `project:${project.id}:challenge`,
        section: "project",
        targetId: project.id,
        field: "challenge",
        label,
        question: `What problem or situation made this work necessary?`,
        priority: 95 - index,
      });
    }
    if (!project.contribution?.trim()) {
      candidates.push({
        id: `project:${project.id}:contribution`,
        section: "project",
        targetId: project.id,
        field: "contribution",
        label,
        question: `What did you personally change or deliver in this work?`,
        priority: 92 - index,
      });
    }
    if (!project.outcome?.trim()) {
      candidates.push({
        id: `project:${project.id}:outcome`,
        section: "project",
        targetId: project.id,
        field: "outcome",
        label,
        question: `What changed because of your work? A specific result helps, but a number is not required.`,
        priority: 88 - index,
      });
    }
  });

  if (!document.projects.length && document.experience.length) {
    const role = document.experience[0];
    candidates.push({
      id: `experience:${role.id}:summary`,
      section: "experience",
      targetId: role.id,
      field: "summary",
      label: `${role.title} at ${role.company}`,
      question: "What is one piece of work from this role that best shows how you make a difference?",
      priority: 90,
    });
  }

  if (document.identity.summary.trim().length < 120) {
    candidates.push({
      id: "identity:summary",
      section: "summary",
      targetId: null,
      field: "summary",
      label: "About you",
      question: "What kind of difficult work do people most often trust you to handle?",
      priority: 70,
    });
  }

  return candidates
    .filter((candidate) => !skipped.has(candidate.id) && !answered.has(candidate.id))
    .sort((a, b) => b.priority - a.priority);
}

export function readTargetValue(document: ProfileDocument, question: ImprovementQuestion): string {
  if (question.section === "headline") return document.identity.headline;
  if (question.section === "summary") return document.identity.summary;
  if (question.section === "project") {
    const project = document.projects.find((item) => item.id === question.targetId);
    return project?.[question.field as "challenge" | "contribution" | "outcome"] || "";
  }
  const role = document.experience.find((item) => item.id === question.targetId);
  return role?.summary || "";
}

export function applyProposal(document: ProfileDocument, proposal: ImprovementProposal): ProfileDocument {
  const next = structuredClone(document);
  const answerSourceId = `answer-${proposal.id}`;
  const before = readTargetValue(next, {
    id: proposal.questionId,
    section: proposal.section,
    targetId: proposal.targetId,
    field: proposal.field,
    label: proposal.question,
    question: proposal.question,
    priority: 1,
  });

  if (proposal.section === "headline") next.identity.headline = proposal.proposed;
  if (proposal.section === "summary") next.identity.summary = proposal.proposed;
  if (proposal.section === "project") {
    const project = next.projects.find((item) => item.id === proposal.targetId);
    if (project) {
      project[proposal.field as "challenge" | "contribution" | "outcome"] = proposal.proposed;
      project.sourceIds = Array.from(new Set([...project.sourceIds, answerSourceId]));
    }
  }
  if (proposal.section === "experience") {
    const role = next.experience.find((item) => item.id === proposal.targetId);
    if (role) {
      role.summary = proposal.proposed;
      role.sourceIds = Array.from(new Set([...role.sourceIds, answerSourceId]));
    }
  }

  next.sources.push({
    id: answerSourceId,
    kind: "user",
    label: proposal.question,
    excerpt: proposal.answer,
  });
  next.answeredQuestionIds = Array.from(new Set([...next.answeredQuestionIds, proposal.questionId]));
  next.pendingProposal = null;
  next.undoStack = [
    ...next.undoStack,
    {
      section: proposal.section,
      targetId: proposal.targetId,
      field: proposal.field,
      before,
      after: proposal.proposed,
    },
  ].slice(-5);
  return next;
}

export function undoLastChange(document: ProfileDocument): ProfileDocument | null {
  const undo = document.undoStack.at(-1);
  if (!undo || typeof undo.before !== "string") return null;
  const next = structuredClone(document);
  if (undo.section === "headline") next.identity.headline = undo.before;
  if (undo.section === "summary") next.identity.summary = undo.before;
  if (undo.section === "project") {
    const project = next.projects.find((item) => item.id === undo.targetId);
    if (project) project[undo.field as "challenge" | "contribution" | "outcome"] = undo.before || undefined;
  }
  if (undo.section === "experience") {
    const role = next.experience.find((item) => item.id === undo.targetId);
    if (role) role.summary = undo.before || undefined;
  }
  if (undo.section === "style" && ["editorial", "modern", "expressive"].includes(undo.before)) {
    next.style = undo.before as ProfileDocument["style"];
  }
  next.undoStack = next.undoStack.slice(0, -1);
  return next;
}
