// A typed answer may only repeat numbers that already appear, as whole
// numbers, in the approved page text. "94" does not license "9".

const NUMBER = /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g;

export function numericTokens(text: string): string[] {
  return Array.from(text.matchAll(NUMBER), (match) => match[0].replace(/,/g, ""));
}

// A rewrite may not introduce a number the person did not say. When the
// answer has no digit and the rewrite does, keep the person's words.
export function rewriteWithoutNewNumbers(answer: string, proposed: string): string {
  const safeAnswer = answer.trim().slice(0, 700);
  const safeProposed = proposed.trim().slice(0, 700);
  if (numericTokens(answer).length === 0 && numericTokens(proposed).length > 0) return safeAnswer;
  return safeProposed;
}

export function ungroundedNumbers(answer: string, source: string): string[] {
  const allowed = new Set(numericTokens(source));
  const seen = new Set<string>();
  const extra: string[] = [];
  for (const token of numericTokens(answer)) {
    if (allowed.has(token) || seen.has(token)) continue;
    seen.add(token);
    extra.push(token);
  }
  return extra;
}

export const UNGROUNDED_NUMBER_REPLY = "I don't have that figure on my page. I can only use numbers that are already written there.";

export const APPROVED_CARD_RULES = `If the question is about how this person works, answer from the howIWork text and name at most one piece of work by its title.
If the question is about a piece of work, answer from that work and put its title in the first sentence.
If the question asks about office politics, private numbers, what a manager thought, compensation, or whether to hire them, give the one-line outcome from that work when it is written above, then invite the visitor to use the contact option. Do not expand.`;

export function cardIdFromAnswer(answer: string, projects: Array<{ id: string; title: string }>): string | null {
  const hits = projects.filter((project) => {
    const title = project.title.trim();
    return title.length > 0 && answer.includes(title);
  });
  return hits.length === 1 ? hits[0].id : null;
}
