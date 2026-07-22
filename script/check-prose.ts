/**
 * Re-runs AI generation on the test-draft persona (test-draft@proxy.test, seeded by
 * `npm run seed:test`) and checks the output against the banned hype-language list
 * from server/ai-processor.ts. Manual run only, not wired into CI.
 *
 * Usage: tsx script/check-prose.ts
 */
import { storage } from "../server/storage";
import { processQuestionnaire, BANNED_PHRASES } from "../server/ai-processor";

const bannedPattern = new RegExp(
  `\\b(${BANNED_PHRASES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "gi",
);

function findHits(label: string, text: string | null | undefined, hits: string[]) {
  if (!text) return;
  const matches = text.match(bannedPattern);
  if (matches) {
    hits.push(`[${label}] contains: ${[...new Set(matches.map((m) => m.toLowerCase()))].join(", ")}`);
  }
}

async function main() {
  const customer = await storage.getCustomerByEmail("test-draft@proxy.test");
  if (!customer) {
    console.error("test-draft@proxy.test not found — run `npm run seed:test` first.");
    process.exit(1);
  }

  const profile = await storage.getProfileByCustomerId(customer.id);
  if (!profile?.questionnaireData) {
    console.error("test-draft profile has no questionnaireData — run `npm run seed:test` first.");
    process.exit(1);
  }

  console.log("Running processQuestionnaire() on the test-draft persona...\n");
  await processQuestionnaire(profile.id, profile.questionnaireData as any);

  const generated = await storage.getProfileById(profile.id);
  const knowledgeEntries = await storage.getKnowledgeEntriesByProfileId(profile.id);

  const hits: string[] = [];
  findHits("positioning", generated?.positioning, hits);
  findHits("heroSubtitle", generated?.heroSubtitle, hits);
  findHits("persona", generated?.persona, hits);
  findHits("whyAiCv", (generated?.whyAiCv as string[] | null)?.join(" "), hits);
  for (const entry of knowledgeEntries) {
    findHits(`knowledge:${entry.entryId}:content`, entry.content, hits);
    findHits(`knowledge:${entry.entryId}:challenge`, entry.challenge, hits);
    findHits(`knowledge:${entry.entryId}:approach`, entry.approach, hits);
    findHits(`knowledge:${entry.entryId}:result`, entry.result, hits);
  }

  console.log("=== Banned phrase check ===");
  if (hits.length === 0) {
    console.log("PASS — no banned phrases found.\n");
  } else {
    console.log(`FAIL — ${hits.length} field(s) contain banned phrases:\n`);
    hits.forEach((h) => console.log(`  ${h}`));
    console.log("");
  }

  console.log("=== Positioning length check ===");
  const firstParagraph = (generated?.positioning || "").split("\n\n")[0] || "";
  console.log(`  First paragraph (${firstParagraph.length} chars, limit 140):`);
  console.log(`  "${firstParagraph}"`);
  console.log(firstParagraph.length <= 140 ? "  PASS\n" : "  FAIL — over 140 chars\n");

  process.exit(hits.length === 0 && firstParagraph.length <= 140 ? 0 : 1);
}

main().catch((err) => {
  console.error("check-prose error:", err);
  process.exit(1);
});
