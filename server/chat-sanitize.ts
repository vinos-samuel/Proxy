/**
 * Post-filter for Ask/proxy answers. The model sometimes echoes classifier
 * instructions ("This is a Type 2: SPECIFIC PROJECT question") and other
 * assistant-voice tics. Strip those so the visitor hears a person on a call.
 */

const LEAKED_INSTRUCTION_LINE = [
  /\bthis is a type\s*[1-5]\b/i,
  /\btype\s*[1-5]\s*[:(]\s*(specific project|general\/?exploratory|general|exploratory|transferable skills|outside scope|data insufficient)\b/i,
  // Catch-all: any bare "Type 1"–"Type 5" mention is a classifier leak in this
  // domain, even without the label attached (e.g. "since this is Type 3...").
  /\btype\s*[1-5]\b/i,
  /i'?ll tell the story as a narrative/i,
  /without section headers/i,
  /i have direct experience here from my netflix work/i,
  /\bas an? ai\b/i,
  /\bi am an ai\b/i,
  /\bi'?m an ai\b/i,
  /as a language model/i,
  /as an artificial intelligence/i,
  // Other self-reference leaks the model sometimes uses instead of "AI".
  /\bi'?m (just |only )?(a |an )?(chatbot|bot|language model|large language model|digital twin|virtual assistant)\b/i,
  /\bas a digital twin\b/i,
  /\bi was trained (on|by)\b/i,
  /\bmy training data\b/i,
];

function dropLeakedSentences(text: string): string {
  // Split on sentence boundaries but keep newlines as paragraph structure.
  const blocks = text.split(/\n/);
  return blocks
    .map((block) => {
      if (!block.trim()) return block;
      const sentences = block.split(/(?<=[.!?])\s+/);
      const kept = sentences.filter((s) => {
        const t = s.trim();
        if (!t) return true;
        return !LEAKED_INSTRUCTION_LINE.some((re) => re.test(t));
      });
      return kept.join(" ");
    })
    .join("\n");
}

function stripAsARoleOpener(text: string): string {
  // "As a talent leader, I built..." → "I built..."
  return text.replace(/(^|[.\n]\s*)As an? [^.\n]{2,60}?,?\s+I\b/g, "$1I");
}

function stripEmDashAsides(text: string): string {
  // Contrast-dash: "a monthly governance forum — not a status meeting, a working session"
  let out = text.replace(/\s+[—–]\s+not\s+[^.\n]+/gi, "");
  // Remaining rhetorical em/en-dashes → spoken period.
  out = out.replace(/\s+[—–]\s+([a-z])/g, (_m, c: string) => `. ${c.toUpperCase()}`);
  out = out.replace(/\s+[—–]\s+/g, ". ");
  return out;
}

export function stripModelSlop(text: string): string {
  let out = text.replace(/\r\n/g, "\n");

  // Markdown section headers ("## Challenge")
  out = out.replace(/^#{1,6}\s+.+$/gm, "");

  // Bolded pseudo-headers ("**Challenge:**", "**The Situation**" as a whole
  // line, or "**Result:** we cut spend 38%" as a line prefix).
  const SECTION_LABELS =
    "(the )?(challenge|situation|context|background|approach|solution|action|result|results|outcome|outcomes|impact)";
  // Colon may land inside or outside the closing "**" ("**Challenge:**" or
  // "**Challenge**:") — match both.
  out = out.replace(new RegExp(`^\\*\\*${SECTION_LABELS}\\s*:?\\s*\\*\\*:?\\s*$`, "gim"), "");
  out = out.replace(new RegExp(`^\\*\\*${SECTION_LABELS}\\s*:?\\s*\\*\\*:?\\s*`, "gim"), "");

  // Whole-line leaks
  out = dropLeakedSentences(out);

  // Openers / tics, including mid-paragraph
  out = out.replace(/\bGreat question[.!]?\s*/gi, "");
  out = out.replace(/\bThat'?s a great question[.!]?\s*/gi, "");
  out = out.replace(/\bLet me walk you through[^.\n]*[.!]?\s*/gi, "");
  out = out.replace(/\bThe key insight is[,:]?\s*/gi, "");
  out = out.replace(/\bI have direct experience here from my Netflix work[.!]?\s*/gi, "");

  out = stripAsARoleOpener(out);
  out = stripEmDashAsides(out);

  out = out.replace(/[ \t]+\n/g, "\n");
  out = out.replace(/\n{3,}/g, "\n\n");
  // Recapitalize after stripped openers ("The key insight is you fill..." -> "You fill...")
  out = out.replace(/(^|[.!?]\s+|\n+)([a-z])/g, (_m, pre: string, c: string) => pre + c.toUpperCase());
  return out.trim();
}

/**
 * Safety net: if the model ends with a question directed at the recruiter
 * (not an offer from the twin), strip it and replace with a safe closing.
 */
export function stripRecruiterQuestion(text: string): string {
  const trimmed = text.trim();
  const parts = trimmed.split(/(?<=[.!?])\s+(?=[A-Z"'])/);
  if (parts.length <= 1) return trimmed;

  const last = parts[parts.length - 1].trim();
  if (!last.endsWith("?")) return trimmed;

  const twinOffers = [
    /^want me\b/i,
    /^shall i\b/i,
    /^would you like me\b/i,
    /^i can (go|walk|take|give|share|break|run)\b/i,
    /^happy to\b/i,
    /^want to (hear|know|see)\b/i,
  ];
  if (twinOffers.some((p) => p.test(last))) return trimmed;

  const withoutQuestion = parts.slice(0, -1).join(" ").trim();
  return withoutQuestion
    ? withoutQuestion + "\n\nHappy to go deeper on any of this."
    : trimmed;
}

// If every sentence in the model's answer turned out to be a leaked
// instruction / assistant tic, the filters above can legitimately empty the
// string. Never ship a blank chat bubble — fall back to a safe, honest line.
const EMPTY_ANSWER_FALLBACK =
  "I don't have a clean answer for that one — happy to go deeper if you rephrase, or reach out directly.";

export function sanitizeChatAnswer(text: string): string {
  const cleaned = stripRecruiterQuestion(stripModelSlop(text));
  return cleaned.trim() ? cleaned : EMPTY_ANSWER_FALLBACK;
}
