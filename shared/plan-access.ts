// Who has Pro, and who can use the Job Search Agent.
// Pro is tier "pro" plus a confirmed payment (Stripe checkout or an admin grant).
// A free publish must not set paymentStatus to "paid". Older rows that did
// stay tier "free", so a paymentStatus of "paid" alone is not Pro.

export const JOB_SEARCH_TRIAL_MS = 48 * 60 * 60 * 1000;

export type PlanSnapshot = {
  tier: string | null;
  paymentStatus: string | null;
};

export function hasConfirmedPro(plan: PlanSnapshot): boolean {
  return plan.tier === "pro" && plan.paymentStatus === "paid";
}

// A paid non-free tier (Pro or a leftover Concierge grant). Free rows are
// excluded even when an older publish left paymentStatus as "paid".
export function hasConfirmedPaidTier(plan: PlanSnapshot): boolean {
  return plan.paymentStatus === "paid" && !!plan.tier && plan.tier !== "free";
}

export function jobSearchTrialActive(
  accountCreatedAt: Date | string | null | undefined,
  now = Date.now(),
): boolean {
  if (!accountCreatedAt) return false;
  const created = new Date(accountCreatedAt).getTime();
  if (!Number.isFinite(created)) return false;
  const age = now - created;
  return age >= 0 && age < JOB_SEARCH_TRIAL_MS;
}

export function hasJobSearchAccess(
  plan: PlanSnapshot,
  accountCreatedAt: Date | string | null | undefined,
  now = Date.now(),
): boolean {
  return hasConfirmedPro(plan) || jobSearchTrialActive(accountCreatedAt, now);
}

export function recentQuestionsForPlan<T>(plan: PlanSnapshot, questions: T[]): T[] {
  return hasConfirmedPro(plan) ? questions : [];
}
