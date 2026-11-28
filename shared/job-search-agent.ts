// Rules the Job Search page and the FAQ share with the server.
// The private prompt itself lives in server/job-search-prompts.ts so it is
// not shipped in the public page bundle.

import { hasJobSearchAccess, type PlanSnapshot } from "./plan-access";

export function hasSavedOutreachDate(value: unknown): boolean {
  if (value == null || value === "") return false;
  const time = new Date(value as string | number | Date).getTime();
  return Number.isFinite(time);
}

// Returns the date to store when an outreach draft is saved, or null when a
// date is already saved and must be left as it is. Follow-up does not require it.
export function outreachDateWhenDraftSaved(existing: unknown, savedAt: Date): string | null {
  if (hasSavedOutreachDate(existing)) return null;
  if (!Number.isFinite(savedAt.getTime())) return null;
  return savedAt.toISOString().slice(0, 10);
}

export function contactShowsFollowUp(_contact?: unknown): boolean {
  return true;
}

export function showJobSearchAgentBadge(
  plan: PlanSnapshot,
  accountCreatedAt: Date | string | null | undefined,
  now = Date.now(),
): boolean {
  return hasJobSearchAccess(plan, accountCreatedAt, now);
}

export const JOB_SEARCH_AGENT_FAQ = {
  intro: [
    "The Job Search Agent is included with Pro ($49, paid once). For 48 hours after you create an account, you can use it before you pay.",
    "You add companies, contacts, and applications. The first click writes from what is already saved on your account: the roles, employers, dates, achievements, skills, summary, and work cards on your page, plus the company, contact, or application you opened. It does not invent employers, dates, or numbers. A private draft card can be used in these drafts and is marked unverified. The public page chat does not use draft cards.",
  ],
  drafts: [
    "A message to a contact, on the first click. You can then say the goal or the channel if you want a revision.",
    "A shorter follow-up for any contact, including when no outreach date is saved. Saving an outreach draft sets the outreach date if you had not set one.",
    "A cover letter when the job description is saved on the application. If it is missing, it asks only for the job description.",
    "Interview practice starts with the first question. You can then say the stage or the focus if you want a different question.",
    "A thank-you note on the first click, from the role and company you saved. You can then add who you met and what you discussed.",
    "Notes on an offer when salary numbers are saved on the application: a counter, what to say, and what to leave out. If the numbers are missing, it asks only for those numbers.",
    "For a company you add: where you fit, roles to aim at, and a first step, from the name and notes you entered.",
  ],
} as const;

export function jobSearchAgentFaqPlainText(): string {
  return [...JOB_SEARCH_AGENT_FAQ.intro, ...JOB_SEARCH_AGENT_FAQ.drafts].join(" ");
}
