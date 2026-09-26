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
    .map((line) => line.replace(/^[\s•*\-–—]+/, "").trim().slice(0, 500))
    .filter(Boolean)
    .slice(0, 16);
}

export type PublicationProfile = {
  paymentStatus: string | null;
  tier: string | null;
  freePublishedAt: Date | string | null;
  isPublic: boolean | null;
};

export function getPublicationAccess(profile: PublicationProfile, now = Date.now()) {
  const isPaid = profile.paymentStatus === "paid" && profile.tier !== "free";
  const freePublishedAt = profile.freePublishedAt ? new Date(profile.freePublishedAt).getTime() : Number.NaN;
  const isEditableFree = profile.tier === "free" && Number.isFinite(freePublishedAt) &&
    now - freePublishedAt <= 7 * 24 * 60 * 60 * 1000;
  const isFirstFreePublish = !profile.isPublic && (!profile.tier || profile.tier === "free");
  return {
    isPaid,
    isEditableFree,
    isFirstFreePublish,
    canPublish: isPaid || isEditableFree || isFirstFreePublish,
    canChangeLivePage: isPaid || isEditableFree,
  };
}

function stableId(prefix: string, index: number): string {
  return `${prefix}-${index + 1}`;
}

export function conciseHeadline(value: string | undefined, fallback: string): string {
  const firstSentence = (value || "").split(/(?<=[.!?])\s+|\n/)[0]?.trim() || "";
  if (firstSentence.length <= 90 && firstSentence.split(/\s+/).length <= 14) {
    return firstSentence || fallback.slice(0, 90);
  }
  return fallback.trim().slice(0, 90) || "Professional profile";
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
  const rawHeadline = positioningParts[0] || parsed.currentTitle || "Professional profile";
  const headline = conciseHeadline(rawHeadline, parsed.currentTitle || "Professional profile");
  const summary = positioningParts.slice(1).join("\n\n") || parsed.summary || rawHeadline;

  const sources: ProfileDocument["sources"] = [];
  const experience: ProfileDocument["experience"] = (parsed.roles || []).slice(0, 20).map((role, index) => {
    const sourceId = stableId("resume-role", index);
    const highlights = cleanLines(role.achievements);
    const company = (role.company || "Company").slice(0, 160);
    const title = (role.title || "Role").slice(0, 160);
    sources.push({
      id: sourceId,
      kind: "resume",
      label: `${title} at ${company}`.slice(0, 160),
      excerpt: [title, company, role.years, ...highlights].filter(Boolean).join(" — ").slice(0, 1200),
    });
    return {
      id: stableId("experience", index),
      company,
      title,
      period: role.years || undefined,
      highlights,
      sourceIds: [sourceId],
    };
  });

  (parsed.achievements || []).slice(0, 10).forEach((achievement, index) => {
    sources.push({
      id: stableId("resume-achievement", index),
      kind: "resume",
      label: "CV achievement",
      excerpt: achievement.slice(0, 1200),
    });
  });

  const employerContributions: ProfileDocument["employerContributions"] = (parsed.employerContributions || [])
    .slice(0, 20)
    .map((employer, index) => {
      const sourceId = stableId("resume-employer", index);
      const contributions = employer.contributions.map((item) => item.trim().slice(0, 500)).filter(Boolean).slice(0, 20);
      sources.push({
        id: sourceId,
        kind: "resume",
        label: `${employer.company} selected contributions`.slice(0, 160),
        excerpt: contributions.join(" — ").slice(0, 1200),
      });
      return {
        id: stableId("employer-contributions", index),
        company: employer.company.slice(0, 160),
        contributions,
        sourceIds: [sourceId],
      };
    })
    .filter((employer) => employer.company && employer.contributions.length);

  // A role description is experience, not automatically a project. Start
  // selected work only from explicitly extracted achievement statements and
  // leave company/role attribution unspecified until the owner confirms it.
  const projects: ProfileDocument["projects"] = (parsed.achievements || []).slice(0, 3).map((achievement, index) => {
    const clean = achievement.trim().slice(0, 900);
    const firstClause = clean.split(/[.;:\n]/)[0]?.trim() || clean;
    const title = firstClause.split(/\s+/).slice(0, 12).join(" ").replace(/[.!?]+$/, "");
    return {
      id: stableId("project", index),
      title: title.slice(0, 180) || `Selected work ${index + 1}`,
      summary: clean.slice(0, 500),
      outcome: clean,
      sourceIds: [stableId("resume-achievement", index)],
    };
  });

  return {
    schemaVersion: 1,
    style: "executive",
    identity: {
      name: parsed.name || "Your name",
      title: parsed.currentTitle || "Professional",
      location: parsed.location || undefined,
      headline,
      summary: summary.slice(0, 1800),
      photoUrl: null,
      videoUrl: null,
      showPhoto: true,
      showVideo: true,
    },
    projects,
    experience,
    employerContributions,
    skills: (parsed.skills || []).map((skill) => skill.trim().slice(0, 80)).filter(Boolean).slice(0, 40),
    contact: {
      email: normalizeEmail(parsed.email),
      linkedin: normalizeWebUrl(parsed.linkedin),
      website: null,
      showEmail: false,
      showLinkedin: false,
      showWebsite: false,
    },
    publicBotEnabled: false,
    impactStats: [],
    details: {
      education: (parsed.education || []).map((item) => item.trim().slice(0, 500)).filter(Boolean).slice(0, 12),
      certifications: (parsed.certifications || []).map((item) => item.trim().slice(0, 500)).filter(Boolean).slice(0, 12),
      awards: (parsed.awards || []).map((item) => item.trim().slice(0, 500)).filter(Boolean).slice(0, 12),
      interests: (parsed.interests || []).map((item) => item.trim().slice(0, 500)).filter(Boolean).slice(0, 12),
      showEducation: true,
      showCertifications: true,
      showAwards: true,
      showInterests: false,
    },
    privateContext: { questions: [], concerns: [] },
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
          .slice(0, 16),
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
    style: "executive",
    identity: {
      name: String(profile.displayName || questionnaire?.step1?.fullName || "Your name").slice(0, 160),
      title: String(profile.roleTitle || questionnaire?.step1?.currentTitle || "Professional").slice(0, 180),
      location: questionnaire?.step1?.location ? String(questionnaire.step1.location).slice(0, 160) : undefined,
      headline: conciseHeadline(String(profile.heroSubtitle || profile.positioning || ""), String(profile.roleTitle || "Professional profile")),
      summary: String(profile.positioning || questionnaire?.step2?.professionalSummary || profile.roleTitle || "Professional profile").slice(0, 1800),
      photoUrl: normalizeWebUrl(profile.photoUrl || questionnaire?.step10?.headshot || questionnaire?.step10?.photoUrl || undefined),
      videoUrl: normalizeWebUrl(profile.videoUrl || questionnaire?.step10?.introVideo || undefined),
      showPhoto: true,
      showVideo: true,
    },
    projects,
    experience,
    employerContributions: [],
    skills: skillTags.map((item: unknown) => String(item).trim().slice(0, 80)).filter(Boolean).slice(0, 40),
    contact: {
      email: typeof contactEmail === "string" && contactEmail.includes("@") && !contactEmail.startsWith("[") ? contactEmail : null,
      linkedin: typeof contactLinkedin === "string" && /^https?:\/\//.test(contactLinkedin) ? contactLinkedin : null,
      website: null,
      showEmail: false,
      showLinkedin: false,
      showWebsite: false,
    },
    publicBotEnabled: false,
    impactStats: [],
    details: {
      education: [], certifications: [], awards: [], interests: [],
      showEducation: true, showCertifications: true, showAwards: true, showInterests: false,
    },
    privateContext: {
      workingStyle: questionnaire?.step7?.workingStyle || undefined,
      careerDirection: questionnaire?.step7?.careerDirection || undefined,
      voiceNotes: questionnaire?.step7?.communicationStyle || undefined,
      questions: Array.isArray(questionnaire?.step8?.questions) ? questionnaire.step8.questions.slice(0, 12) : [],
      concerns: Array.isArray(questionnaire?.step9?.objections)
        ? questionnaire.step9.objections.slice(0, 12).map((item: any) => ({ concern: String(item.objection || ""), response: String(item.response || "") })).filter((item: any) => item.concern && item.response)
        : [],
    },
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
    const label = project.company ? `${project.title} · ${project.company}` : project.title;
    const source = project.sourceIds.map((id) => document.sources.find((item) => item.id === id)).find(Boolean);
    const context = source ? `${source.kind === "resume" ? "Your CV says" : "You added"}: “${source.excerpt.slice(0, 180)}${source.excerpt.length > 180 ? "…" : ""}” ` : "";
    const sourceFields = source ? { sourceKind: source.kind, sourceExcerpt: source.excerpt.slice(0, 320) } : {};
    if (!project.challenge?.trim()) {
      candidates.push({
        id: `project:${project.id}:challenge`,
        section: "project",
        targetId: project.id,
        field: "challenge",
        label,
        ...sourceFields,
        question: `${context}Before this work began, what was difficult, unclear, or not working well?`,
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
        ...sourceFields,
        question: `${context}What did you personally change, decide, or deliver?`,
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
        ...sourceFields,
        question: `${context}What became better or different afterwards? A clear observation is enough; you do not need a number.`,
        priority: 88 - index,
      });
    }

    const coreComplete = Boolean(project.challenge?.trim() && project.contribution?.trim() && project.outcome?.trim());
    const decisionId = `project:${project.id}:decision`;
    if (coreComplete && !answered.has(decisionId) && !skipped.has(decisionId)) {
      candidates.push({
        id: decisionId,
        section: "project",
        targetId: project.id,
        field: "contribution",
        label,
        ...sourceFields,
        question: `While doing ${project.title}, what was one important decision or trade-off you personally made?`,
        priority: 84 - index,
      });
    }

    const influenceId = `project:${project.id}:influence`;
    if (answered.has(decisionId) && !answered.has(influenceId) && !skipped.has(influenceId)) {
      candidates.push({
        id: influenceId,
        section: "project",
        targetId: project.id,
        field: "contribution",
        label,
        ...sourceFields,
        question: `Who needed to support ${project.title}, and how did you bring them with you?`,
        priority: 82 - index,
      });
    }

    const reflectionId = `project:${project.id}:reflection`;
    if (answered.has(influenceId) && !answered.has(reflectionId) && !skipped.has(reflectionId)) {
      candidates.push({
        id: reflectionId,
        section: "project",
        targetId: project.id,
        field: "contribution",
        label,
        ...sourceFields,
        question: `Looking back on ${project.title}, what part of your approach would you deliberately use again?`,
        priority: 80 - index,
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

  if (!document.privateContext.workingStyle?.trim()) {
    candidates.push({
      id: "identity:working-style",
      section: "summary",
      targetId: null,
      field: "summary",
      label: "How you work",
      question: "When work is complex or unclear, what do colleagues rely on you to do?",
      priority: 64,
    });
  }

  if (!document.privateContext.careerDirection?.trim()) {
    candidates.push({
      id: "identity:career-direction",
      section: "summary",
      targetId: null,
      field: "summary",
      label: "What you want next",
      question: "What kind of opportunity or client problem would you most like to take on next?",
      priority: 60,
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

  if (!next.sources.some((source) => source.id === answerSourceId)) {
    next.sources.push({
      id: answerSourceId,
      kind: "user",
      label: proposal.question,
      excerpt: proposal.answer,
    });
  }
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
  if (!undo) return null;
  const next = structuredClone(document);
  if (undo.section === "project" && undo.field === "project:add" && undo.targetId) {
    next.projects = next.projects.filter((project) => project.id !== undo.targetId);
    next.pendingProposal = next.pendingProposal?.targetId === undo.targetId ? null : next.pendingProposal;
  } else if (undo.section === "project" && undo.field === "project:remove" && undo.before && typeof undo.before === "object") {
    const removed = undo.before as { project: ProfileDocument["projects"][number]; index: number };
    next.projects.splice(Math.max(0, Math.min(removed.index, next.projects.length)), 0, removed.project);
  } else if (undo.section === "project" && undo.field === "project:order" && Array.isArray(undo.before)) {
    const order = undo.before.filter((id): id is string => typeof id === "string");
    next.projects.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  } else if (typeof undo.before !== "string") {
    return null;
  } else if (undo.section === "headline") next.identity.headline = undo.before;
  else if (undo.section === "summary") next.identity.summary = undo.before;
  else if (undo.section === "project") {
    const project = next.projects.find((item) => item.id === undo.targetId);
    if (project) project[undo.field as "challenge" | "contribution" | "outcome"] = undo.before || undefined;
  } else if (undo.section === "experience") {
    const role = next.experience.find((item) => item.id === undo.targetId);
    if (role) role.summary = undo.before || undefined;
  } else if (undo.section === "style" && ["executive", "editorial", "modern", "expressive"].includes(undo.before)) {
    next.style = undo.before as ProfileDocument["style"];
  }
  next.undoStack = next.undoStack.slice(0, -1);
  return next;
}
