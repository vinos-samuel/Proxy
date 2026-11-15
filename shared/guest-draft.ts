export const GUEST_DRAFT_TTL_MS = 4 * 60 * 60 * 1000;
export const GUEST_DRAFT_EMAIL_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function guestDraftTtlMs(hasEmail: boolean): number {
  return hasEmail ? GUEST_DRAFT_EMAIL_TTL_MS : GUEST_DRAFT_TTL_MS;
}
