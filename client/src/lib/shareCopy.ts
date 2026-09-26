// The one place this text lives. Every "share on LinkedIn" surface (payment
// gate, dashboard, payment-success page) should import this instead of
// keeping its own copy of the post — three drifted, independently-edited
// versions of this exact text is what caused the last correction to only
// land in one of them.
export function buildLinkedInPost(profileUrl: string): string {
  return `A CV tells a recruiter what I did. It doesn't explain why any of it mattered.

So I built a page that shows the work behind the titles: the situation, what I contributed, and what changed.

${profileUrl}`;
}

/** Short note to paste to someone already inside a company. Soft inbound — not a pitch. */
export function buildInsiderNote(profileUrl: string): string {
  return `If you're open to passing this along inside, here's a page that answers questions about my work better than a CV:

${profileUrl}`;
}
