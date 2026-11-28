// After a CV becomes a page, the builder shows that page. The interview
// stays beside it, and an open suggestion still has to be kept or skipped
// before publish.

export const OPTIONAL_INTERVIEW_LABEL = "Make it stronger (optional)";

export type BuilderLanding = {
  focus: "preview";
  interviewLabel: typeof OPTIONAL_INTERVIEW_LABEL;
  interviewVisible: true;
};

export function landingAfterUpload(): BuilderLanding {
  return {
    focus: "preview",
    interviewLabel: OPTIONAL_INTERVIEW_LABEL,
    interviewVisible: true,
  };
}

export function canPublishNow(input: { dirty: boolean; busy: boolean; openSuggestion: boolean }): boolean {
  return !input.dirty && !input.busy && !input.openSuggestion;
}

export function publishGuardTitle(openSuggestion: boolean): string | undefined {
  return openSuggestion ? "Keep or skip the suggested change first" : undefined;
}

export const DRAFT_CARD_BADGE = "Draft — check and approve";

export function draftCardHighlight(status: string | undefined): { highlighted: boolean; badge: string | null } {
  if (status !== "draft") return { highlighted: false, badge: null };
  return { highlighted: true, badge: DRAFT_CARD_BADGE };
}

export function draftCheckLabel(count: number): string | null {
  if (count < 1) return null;
  return count === 1 ? "1 draft to check" : `${count} drafts to check`;
}
