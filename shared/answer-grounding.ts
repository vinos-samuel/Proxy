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

export const GOAL_NOT_ON_PAGE = "What I want next isn't written on this page. Connect with me directly for that.";

const NEXT_QUESTION = /\b(what do you want to do next|what(?:'s| is) next|what are you looking for|where do you want to go|career goals?)\b/i;
const GOAL_ON_PAGE = /\b(looking for|next role|career goal|i want to|i(?:'m| am) seeking|drawn to)\b/i;
const PREFERENCE_SENTENCE = /\b(i(?:'m| am) looking for|i(?:'m| am) seeking|i(?:'d| would) like (?:a|my next)|i want (?:a |my next |to (?:move|find|lead|join))|ideally\b|i(?:'m| am) drawn to|the kind of (?:work|role)|a role where|next challenge)\b/i;

function alreadyDeclinesGoal(text: string): boolean {
  return /\b(not|isn'?t|is not)\b[^.]{0,80}\b(covered|written|on (this|my) page)\b/i.test(text)
    && /\b(contact|connect|reach out|ask directly)\b/i.test(text);
}

// A "what next" answer may repeat a goal only when the profile already states one.
// Otherwise drop the preference and say it is not on the page.
export function retainStatedGoals(question: string, answer: string, source: string): string {
  if (!NEXT_QUESTION.test(question) || GOAL_ON_PAGE.test(source)) return answer;
  const rest = answer
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence && !PREFERENCE_SENTENCE.test(sentence))
    .join(" ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  if (alreadyDeclinesGoal(rest)) return rest;
  if (!rest) return GOAL_NOT_ON_PAGE;
  return `${GOAL_NOT_ON_PAGE} ${rest}`;
}

export const APPROVED_CARD_RULES = `If the question is about how this person works, answer from the howIWork text and name at most one piece of work by its title.
If the question is about a piece of work, answer from that work and include a distinctive phrase from its title, such as several words in a row or the number with the word beside it.
If the question asks about office politics, private numbers, what a manager thought, compensation, or whether to hire them, give the one-line outcome from that work when it is written above, then invite the visitor to use the contact option. Do not expand.`;

// Names that appear only as prompt examples. They are allowed in an answer
// when the person's own profile also uses them.
const EXAMPLE_EMPLOYERS = ["Nexora Group", "Nexora", "Randstad"];
const NOT_AN_EMPLOYER = new Set(["apac", "mas", "nav", "aum", "ceo", "cto", "cfo", "hr", "ta", "cv", "ai", "us", "uk", "eu"]);

type AnswerCard = { id: string; title: string; summary?: string; challenge?: string; contribution?: string; outcome?: string };


function phraseInSource(phrase: string, source: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(source);
}

function employerMentions(sentence: string): string[] {
  const plain = sentence.replace(/\*\*/g, "");
  const found: string[] = [];
  for (const name of EXAMPLE_EMPLOYERS) {
    if (phraseInSource(name, plain)) found.push(name);
  }
  const pattern = /\b(?:at|with|for|from)\s+([A-Z][A-Za-z0-9&'.-]*(?:\s+[A-Z][A-Za-z0-9&'.-]*){0,3})/g;
  for (const match of Array.from(plain.matchAll(pattern))) {
    const name = match[1].replace(/[.,;:]+$/g, "").trim();
    if (!name || NOT_AN_EMPLOYER.has(name.toLowerCase())) continue;
    const words = name.split(/\s+/);
    if (words.length === 1 && name.length <= 5 && name === name.toUpperCase()) continue;
    found.push(name);
  }
  return found;
}

function sentenceSupported(sentence: string, source: string): boolean {
  if (ungroundedNumbers(sentence, source).length > 0) return false;
  return employerMentions(sentence).every((name) => phraseInSource(name, source));
}

// Keep sentences whose numbers and employer names are already on the page.
// Drop only the sentence that introduces an unsupported figure or employer.
// If nothing supported is left, say so.
export function retainSupportedAnswer(answer: string, source: string): string {
  const blocks = answer.replace(/\r\n/g, "\n").split("\n").map((block) => {
    if (!block.trim()) return "";
    return block
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence && sentenceSupported(sentence, source))
      .join(" ");
  });
  const text = blocks.join("\n").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return text || UNGROUNDED_NUMBER_REPLY;
}

function cardSignals(project: AnswerCard): string[] {
  const signals = new Set<string>();
  const blobs = [project.title, project.summary, project.challenge, project.contribution, project.outcome].filter((value): value is string => Boolean(value && value.trim()));
  for (const blob of blobs) {
    const words = blob.trim().split(/\s+/);
    for (let index = 0; index <= words.length - 4; index++) {
      const phrase = words.slice(index, index + 4).join(" ").replace(/[.,;:]+$/g, "");
      if (phrase.length >= 16) signals.add(phrase.toLowerCase());
    }
    for (const match of Array.from(blob.matchAll(/(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+\.\d+)\s+[A-Za-z][A-Za-z-]{2,}/g))) {
      signals.add(match[0].toLowerCase().replace(/[.,;:]+$/g, ""));
    }
  }
  return Array.from(signals);
}

export function cardIdFromAnswer(answer: string, projects: AnswerCard[]): string | null {
  const text = answer.toLowerCase();
  const cards = projects.map((project) => ({
    id: project.id,
    title: project.title.trim().toLowerCase(),
    signals: cardSignals(project),
  }));
  const hits = cards.filter((project) => {
    if (project.title && text.includes(project.title)) return true;
    if (project.id.length >= 8 && text.includes(project.id.toLowerCase())) return true;
    return project.signals.some((signal) => {
      if (!text.includes(signal)) return false;
      return !cards.some((other) => other.id !== project.id && (other.signals.includes(signal) || other.title.includes(signal)));
    });
  });
  return hits.length === 1 ? hits[0].id : null;
}
