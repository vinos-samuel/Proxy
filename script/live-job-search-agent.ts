/**
 * Live Job Search Agent check. Calls the real Gemini key.
 * Not part of npm test. Never prints a key.
 *
 *   AI_INTEGRATIONS_GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta \
 *   npx tsx script/live-job-search-agent.ts
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

process.env.AI_INTEGRATIONS_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

const OUT = "/opt/cursor/artifacts/job-search-agent";

function presence(name: string): "missing" | "empty" | "present" {
  const value = process.env[name];
  if (value == null) return "missing";
  if (!value.trim()) return "empty";
  return "present";
}

function redact(text: string): string {
  let out = text;
  for (const name of ["AI_INTEGRATIONS_GEMINI_API_KEY", "ANTHROPIC_API_KEY"]) {
    const secret = process.env[name];
    if (secret) out = out.split(secret).join("[redacted]");
  }
  return out.replace(/key=[^&\s]+/gi, "key=[redacted]");
}

const geminiKey = presence("AI_INTEGRATIONS_GEMINI_API_KEY");
const anthropicKey = presence("ANTHROPIC_API_KEY");
console.log(`AI_INTEGRATIONS_GEMINI_API_KEY: ${geminiKey}`);
console.log(`ANTHROPIC_API_KEY: ${anthropicKey}`);
console.log(`AI_INTEGRATIONS_GEMINI_BASE_URL host path: generativelanguage.googleapis.com/v1beta`);

if (geminiKey !== "present") {
  console.log("STOP live: AI_INTEGRATIONS_GEMINI_API_KEY is not usable. No stand-in was called.");
  process.exit(2);
}
if (anthropicKey !== "present") {
  console.log("STOP live: ANTHROPIC_API_KEY is not usable. No stand-in was called.");
  process.exit(2);
}

const pdfPath = path.resolve("test-fixtures/cv-senior-ops.pdf");
const pdf = fs.readFileSync(pdfPath);

const { parseResumeWithGemini } = await import("../server/ai-processor.ts");
const { buildProfileDocument } = await import("../server/profile-builder.ts");
const { agentProfileContext, systemPromptFor, openingInstruction } = await import("../server/job-search-prompts.ts");
const { completeAgentTurn, JOB_AGENT_MODEL } = await import("../server/job-search-agent.ts");
const { showJobSearchAgentBadge } = await import("../shared/job-search-agent.ts");

fs.mkdirSync(OUT, { recursive: true });

let parsed: any;
try {
  parsed = await parseResumeWithGemini(pdf);
} catch (error) {
  const message = redact(error instanceof Error ? error.message : String(error));
  console.log(`STOP live: resume parse failed. Key or model rejected the call.\n${message}`);
  fs.writeFileSync(path.join(OUT, "parse-error.txt"), message);
  process.exit(2);
}

const document = buildProfileDocument(parsed, {
  positioning: parsed.summary || parsed.currentTitle || "",
  heroSubtitle: parsed.currentTitle || "",
  stats: [],
  careerTimeline: [],
});
const profile = agentProfileContext({
  workingDocument: document,
  questionnaireData: {
    step1: { fullName: parsed.name, currentTitle: parsed.currentTitle },
    step2: { professionalSummary: parsed.summary },
  },
});
fs.writeFileSync(path.join(OUT, "parsed-resume.json"), JSON.stringify(parsed, null, 2));
fs.writeFileSync(path.join(OUT, "profile-context.txt"), profile.text);
console.log(`profile source: ${profile.source}`);
console.log(`requested model: ${JOB_AGENT_MODEL}`);

const jd = [
  "Head of Securities Operations, Harbourline Bank, Singapore.",
  "You will run settlement, client servicing, and reconciliation across Singapore, Hong Kong, and India.",
  "You own the control calendar with the regulator, the exceptions queue, and the handoff between custody and fund accounting.",
  "The brief asks for someone who has led a regional operations team through a core system change and a custody acquisition.",
  "Report to the regional COO. The team covers three markets.",
].join(" ");

const tasks: Array<{ id: string; title: string; action: any; entity: Record<string, any> }> = [
  {
    id: "company-fit",
    title: "Company fit",
    action: "research",
    entity: {
      name: "Harbourline Bank",
      industry: "Financial services",
      notes: "Regional operations lead for securities services. They care about settlement speed and regulator controls.",
    },
  },
  {
    id: "outreach",
    title: "Outreach",
    action: "outreach",
    entity: { name: "Helena Ong", title: "Talent Partner", companyName: "Harbourline Bank", notes: "Posted the securities operations role." },
  },
  {
    id: "follow-up",
    title: "Follow-up",
    action: "follow-up",
    entity: { name: "Helena Ong", title: "Talent Partner", companyName: "Harbourline Bank", lastOutreachDate: null, notes: "No reply saved." },
  },
  {
    id: "cover-letter",
    title: "Cover letter",
    action: "cover-letter",
    entity: { jobTitle: "Head of Securities Operations", companyName: "Harbourline Bank", notes: jd },
  },
  {
    id: "interview",
    title: "Interview practice",
    action: "interview-prep",
    entity: { jobTitle: "Head of Securities Operations", companyName: "Harbourline Bank", notes: jd },
  },
  {
    id: "thank-you",
    title: "Thank-you",
    action: "thank-you",
    entity: { jobTitle: "Head of Securities Operations", companyName: "Harbourline Bank" },
  },
  {
    id: "offer-notes",
    title: "Offer notes",
    action: "negotiate",
    entity: { jobTitle: "Head of Securities Operations", companyName: "Harbourline Bank", salaryMin: 180000, salaryMax: 220000, salaryCurrency: "SGD" },
  },
];

const runs: any[] = [];
for (const task of tasks) {
  const systemPrompt = systemPromptFor(task.action, profile.text, task.entity);
  const opening = openingInstruction(task.action, task.entity);
  process.stdout.write(`running ${task.id}... `);
  try {
    const result = await completeAgentTurn(systemPrompt, [{ role: "user", parts: [{ text: opening }] }]);
    if (!result.text.trim()) throw new Error("Empty model text");
    console.log(`modelVersion=${result.modelVersion || "none"} chars=${result.text.length}`);
    fs.writeFileSync(path.join(OUT, `${task.id}.txt`), result.text);
    runs.push({ ...task, ok: true, modelVersion: result.modelVersion, requestedModel: result.requestedModel, text: result.text });
  } catch (error) {
    const message = redact(error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error));
    console.log(`FAILED\n${message}`);
    fs.writeFileSync(path.join(OUT, `${task.id}-error.txt`), message);
    console.log(`STOP live: ${task.id} failed. Later features were not called with a stand-in.`);
    process.exit(2);
  }
}

const now = Date.parse("2026-11-28T00:00:00.000Z");
const withinTrial = new Date(now - 47 * 60 * 60 * 1000).toISOString();
const pastTrial = new Date(now - 49 * 60 * 60 * 1000).toISOString();
const gate = [
  ["trial 47h, free unpaid", showJobSearchAgentBadge({ tier: "free", paymentStatus: "unpaid" }, withinTrial, now)],
  ["trial 49h, free unpaid", showJobSearchAgentBadge({ tier: "free", paymentStatus: "unpaid" }, pastTrial, now)],
  ["49h, free but paymentStatus paid", showJobSearchAgentBadge({ tier: "free", paymentStatus: "paid" }, pastTrial, now)],
  ["49h, pro unpaid", showJobSearchAgentBadge({ tier: "pro", paymentStatus: "unpaid" }, pastTrial, now)],
  ["49h, pro paid", showJobSearchAgentBadge({ tier: "pro", paymentStatus: "paid" }, pastTrial, now)],
  ["no created date, pro paid", showJobSearchAgentBadge({ tier: "pro", paymentStatus: "paid" }, null, now)],
];
fs.writeFileSync(path.join(OUT, "access-gate.json"), JSON.stringify(gate, null, 2));

function escapeHtml(value: string): string {
  return value.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char] || char));
}

function pageHtml(title: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin: 0; background: #E8E8E3; color: #111; font: 16px/1.45 Georgia, serif; }
    main { max-width: 720px; margin: 24px auto; padding: 0 20px 40px; }
    h1 { font: 700 13px/1 ui-monospace, monospace; letter-spacing: .08em; background: #111; color: #22C55E; display: inline-block; padding: 6px 10px; }
    h2 { font: 700 22px/1.2 Georgia, serif; margin: 12px 0; }
    pre { white-space: pre-wrap; background: #fff; border: 3px solid #111; padding: 16px; box-shadow: 4px 4px 0 #111; font: 15px/1.45 Georgia, serif; }
    table { border-collapse: collapse; width: 100%; background: #fff; }
    td, th { border: 2px solid #111; padding: 8px 10px; text-align: left; font: 14px/1.3 ui-monospace, monospace; }
    .on { background: #111; color: #22C55E; font-weight: 700; }
    .off { background: #fff; color: #111; }
  </style></head><body><main><h1>JOB SEARCH AGENT</h1><h2>${escapeHtml(title)}</h2>${body}</main></body></html>`;
}

for (const run of runs) {
  const html = pageHtml(run.title, `<pre>${escapeHtml(run.text)}</pre>`);
  fs.writeFileSync(path.join(OUT, `${run.id}.html`), html);
}
const gateRows = gate.map(([label, on]) => `<tr><td>${escapeHtml(String(label))}</td><td class="${on ? "on" : "off"}">${on ? "AGENT ACTIVE" : "badge hidden"}</td></tr>`).join("");
fs.writeFileSync(path.join(OUT, "access-gate.html"), pageHtml("Access gate, simulated", `<table><tr><th>Account</th><th>Header</th></tr>${gateRows}</table>`));

const versions = [...new Set(runs.map((run) => run.modelVersion || "none"))];
fs.writeFileSync(path.join(OUT, "model.json"), JSON.stringify({
  requestedModel: JOB_AGENT_MODEL,
  modelVersions: versions,
  baseUrl: "https://generativelanguage.googleapis.com/v1beta",
  profileSource: profile.source,
  anthropicOnThisPath: false,
}, null, 2));
for (const name of [...runs.map((run) => run.id), "access-gate"]) {
  try {
    execFileSync("timeout", [
      "20s",
      "google-chrome",
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--hide-scrollbars",
      `--screenshot=${path.join(OUT, `${name}.png`)}`,
      "--window-size=840,2400",
      `file://${path.join(OUT, `${name}.html`)}`,
    ], { stdio: "pipe" });
  } catch {
    // Chrome in this environment writes the png and then does not exit.
  }
  const png = path.join(OUT, `${name}.png`);
  console.log(`screenshot ${name}.png ${fs.existsSync(png) ? fs.statSync(png).size : "MISSING"}`);
}

console.log(`done. model versions: ${versions.join(", ") || "none"}`);
console.log(`wrote ${OUT}`);
