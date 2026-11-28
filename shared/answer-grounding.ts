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
