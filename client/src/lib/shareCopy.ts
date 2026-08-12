// The one place this text lives. Every "share on LinkedIn" surface (payment
// gate, dashboard, payment-success page) should import this instead of
// keeping its own copy of the post — three drifted, independently-edited
// versions of this exact text is what caused the last correction to only
// land in one of them.
export function buildLinkedInPost(profileUrl: string): string {
  return `A CV tells a recruiter what I did. It doesn't explain why any of it mattered.

So I built a page that answers that instead. Ask it about a specific project, a hard call, a number - it answers from the real record, in my voice.

${profileUrl} — go on, try the Conversational Resume`;
}
