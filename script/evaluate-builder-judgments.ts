import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getImprovementCandidates } from "../server/profile-builder";
import { selectImprovementQuestion } from "../server/typesafe-judgments";
import { profileDocumentSchema, type ProfileDocument } from "../shared/profile-document";

if (!process.env.TYPESAFE_API_KEY && process.argv.includes("--local-credentials")) {
  const credentialsPath = path.join(os.homedir(), ".config", "typesafe", "credentials.json");
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
  if (typeof credentials.TYPESAFE_API_KEY === "string") process.env.TYPESAFE_API_KEY = credentials.TYPESAFE_API_KEY;
}

type Scenario = { label: string; expectedField: "challenge" | "contribution" | "outcome" | "summary" | null; make: () => ProfileDocument };

function base(): ProfileDocument {
  return profileDocumentSchema.parse({ schemaVersion: 1, style: "editorial", identity: { name: "Test Person", title: "Consultant", headline: "I improve complex services.", summary: "I help teams improve complex services through practical operating changes, clear decisions, and durable ways of working across functions and regions.", photoUrl: null }, projects: [], experience: [{ id: "role-1", company: "Example", title: "Consultant", highlights: [], sourceIds: [] }], skills: [], contact: { email: null, linkedin: null, website: null, showEmail: false, showLinkedin: false, showWebsite: false }, publicBotEnabled: false, sources: [], skippedQuestionIds: [], answeredQuestionIds: [], pendingProposal: null, undoStack: [] });
}

function project(fields: Partial<ProfileDocument["projects"][number]>): ProfileDocument {
  return profileDocumentSchema.parse({ ...base(), projects: [{ id: "work-1", title: "Service redesign", sourceIds: [], ...fields }] });
}

const scenarios: Scenario[] = [
  { label: "empty project", expectedField: "challenge", make: () => project({}) },
  { label: "problem only", expectedField: "contribution", make: () => project({ challenge: "Customers waited too long." }) },
  { label: "problem and contribution", expectedField: "outcome", make: () => project({ challenge: "Customers waited too long.", contribution: "I redesigned triage." }) },
  { label: "complete qualitative story", expectedField: null, make: () => project({ challenge: "Customers waited too long.", contribution: "I redesigned triage.", outcome: "Cases reached the right team earlier." }) },
  { label: "complete numeric story", expectedField: null, make: () => project({ challenge: "Delays were rising.", contribution: "I changed routing.", outcome: "Cycle time fell 18%." }) },
  { label: "confidential outcome still missing", expectedField: "outcome", make: () => project({ challenge: "A confidential client needed a new model.", contribution: "I led the redesign without naming the client." }) },
  { label: "unsupported metrics are not requested first", expectedField: "challenge", make: () => project({ contribution: "I led the work." }) },
  { label: "no projects", expectedField: "summary", make: () => { const value = base(); value.experience = []; value.identity.summary = "Consultant."; return profileDocumentSchema.parse(value); } },
  { label: "role but no projects", expectedField: "summary", make: () => { const value = base(); value.identity.summary = "Consultant."; return profileDocumentSchema.parse(value); } },
  { label: "skipped challenge", expectedField: "contribution", make: () => { const value = project({}); value.skippedQuestionIds = ["project:work-1:challenge"]; return profileDocumentSchema.parse(value); } },
  { label: "answered challenge", expectedField: "contribution", make: () => { const value = project({}); value.answeredQuestionIds = ["project:work-1:challenge"]; return profileDocumentSchema.parse(value); } },
  { label: "skipped all project gaps", expectedField: null, make: () => { const value = project({}); value.skippedQuestionIds = ["project:work-1:challenge", "project:work-1:contribution", "project:work-1:outcome"]; return profileDocumentSchema.parse(value); } },
  { label: "rich CV", expectedField: null, make: () => project({ challenge: "Fragmented ownership", contribution: "Created one operating cadence", outcome: "Leaders resolved issues earlier" }) },
  { label: "sparse CV", expectedField: "challenge", make: () => project({ title: "Project" }) },
  { label: "consultant case", expectedField: "outcome", make: () => project({ challenge: "A buyer lacked visibility.", contribution: "Mapped suppliers and controls." }) },
  { label: "candidate transformation", expectedField: "contribution", make: () => project({ challenge: "A regional process varied by market." }) },
  { label: "repeated question excluded", expectedField: "outcome", make: () => { const value = project({ challenge: "A", contribution: "B" }); value.answeredQuestionIds = ["project:work-1:challenge", "project:work-1:contribution"]; return profileDocumentSchema.parse(value); } },
  { label: "qualitative outcome acceptable", expectedField: null, make: () => project({ challenge: "Handoffs failed.", contribution: "Clarified ownership.", outcome: "Teams made decisions without escalation." }) },
  { label: "conflicting answer not part of ranking", expectedField: "outcome", make: () => project({ challenge: "Costs rose.", contribution: "Reviewed spend." }) },
  { label: "two projects prioritise first evidence gap", expectedField: "challenge", make: () => { const value = project({}); value.projects.push({ id: "work-2", title: "Second", sourceIds: [] }); return profileDocumentSchema.parse(value); } },
];

let expectedMatches = 0;
let jevSelections = 0;
const startedAt = Date.now();
for (const scenario of scenarios) {
  const document = scenario.make();
  const candidates = getImprovementCandidates(document);
  const result = await selectImprovementQuestion(document, candidates);
  const actual = result.question?.field || null;
  if (actual === scenario.expectedField) expectedMatches += 1;
  if (result.source === "jev") jevSelections += 1;
  console.log(`${actual === scenario.expectedField ? "✓" : "✗"} ${scenario.label}: ${actual || "no question"} (${result.source})`);
}
assert.equal(scenarios.length, 20);
console.log(`\nExpected selection: ${expectedMatches}/${scenarios.length}`);
console.log(`Jev selections: ${jevSelections}/${scenarios.length}`);
console.log(`Total latency: ${Date.now() - startedAt}ms`);
console.log(process.env.TYPESAFE_API_KEY ? "TypeSafe key detected; live Jev path evaluated where multiple candidates existed." : "No TypeSafe key in process; deterministic fallback evaluated.");
