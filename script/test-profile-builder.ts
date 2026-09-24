import assert from "node:assert/strict";
import { applyProposal, getImprovementCandidates, undoLastChange } from "../server/profile-builder";
import { profileDocumentSchema, toPublicProfileDocument, type ProfileDocument } from "../shared/profile-document";

function page(overrides: Partial<ProfileDocument> = {}): ProfileDocument {
  return profileDocumentSchema.parse({
    schemaVersion: 1,
    style: "editorial",
    identity: { name: "Avery Tan", title: "Operations Director", headline: "I build reliable regional operations.", summary: "I lead complex regional operations and improve how teams deliver.", photoUrl: null },
    projects: [{ id: "project-1", title: "Regional operating model", contribution: "Led the redesign.", sourceIds: ["resume-role-1"] }],
    experience: [{ id: "experience-1", company: "Example Co", title: "Operations Director", highlights: ["Led a regional redesign"], sourceIds: ["resume-role-1"] }],
    skills: ["Operations", "Change management"],
    contact: { email: "avery@example.com", linkedin: "https://linkedin.com/in/avery", website: null, showEmail: false, showLinkedin: false, showWebsite: false },
    publicBotEnabled: false,
    sources: [{ id: "resume-role-1", kind: "resume", label: "Role", excerpt: "Operations Director at Example Co" }],
    skippedQuestionIds: [], answeredQuestionIds: [], pendingProposal: null, undoStack: [],
    ...overrides,
  });
}

const checks: Array<[string, () => void]> = [
  ["valid base document", () => assert.equal(page().schemaVersion, 1)],
  ["missing project challenge creates a question", () => assert.equal(getImprovementCandidates(page())[0].field, "challenge")],
  ["missing project outcome creates a question", () => assert(getImprovementCandidates(page()).some((item) => item.field === "outcome"))],
  ["existing contribution does not create contribution question", () => assert(!getImprovementCandidates(page()).some((item) => item.field === "contribution"))],
  ["skipped question stays skipped", () => assert(!getImprovementCandidates(page({ skippedQuestionIds: ["project:project-1:challenge"] })).some((item) => item.id.endsWith(":challenge")))],
  ["answered question stays answered", () => assert(!getImprovementCandidates(page({ answeredQuestionIds: ["project:project-1:outcome"] })).some((item) => item.id.endsWith(":outcome")))],
  ["complete project can produce no project question", () => {
    const complete = page({ projects: [{ id: "project-1", title: "Work", challenge: "A constraint", contribution: "Changed the process", outcome: "Delivery became reliable", sourceIds: ["resume-role-1"] }] });
    assert.equal(getImprovementCandidates(complete).filter((item) => item.section === "project").length, 0);
  }],
  ["no projects asks for a useful role example", () => assert.equal(getImprovementCandidates(page({ projects: [] }))[0].section, "experience")],
  ["short summary creates summary question", () => assert(getImprovementCandidates(page({ identity: { ...page().identity, summary: "Operations leader." } })).some((item) => item.section === "summary"))],
  ["public projection removes raw sources", () => assert.equal(toPublicProfileDocument(page()).sources.length, 0)],
  ["public projection removes hidden email", () => assert.equal(toPublicProfileDocument(page()).contact.email, null)],
  ["public projection retains selected email", () => { const value = page(); value.contact.showEmail = true; assert.equal(toPublicProfileDocument(value).contact.email, "avery@example.com"); }],
  ["public projection removes review state", () => { const value = page(); value.skippedQuestionIds = ["x"]; assert.equal(toPublicProfileDocument(value).skippedQuestionIds.length, 0); }],
  ["unknown source references are rejected", () => assert.throws(() => profileDocumentSchema.parse({ ...page(), projects: [{ id: "x", title: "X", sourceIds: ["missing"] }] }))],
  ["oversized skills list is rejected", () => assert.throws(() => profileDocumentSchema.parse({ ...page(), skills: Array.from({ length: 41 }, (_, index) => `Skill ${index}`) }))],
  ["proposal changes only its field", () => { const value = page(); const next = applyProposal(value, { id: "p1", questionId: "project:project-1:outcome", section: "project", targetId: "project-1", field: "outcome", question: "What changed?", answer: "Fewer delays", before: "", proposed: "Delivery became more reliable.", baseRevision: 1 }); assert.equal(next.projects[0].outcome, "Delivery became more reliable."); assert.equal(next.identity.headline, value.identity.headline); }],
  ["accepted answer becomes a private source", () => { const next = applyProposal(page(), { id: "p2", questionId: "project:project-1:outcome", section: "project", targetId: "project-1", field: "outcome", question: "What changed?", answer: "Fewer delays", before: "", proposed: "Fewer delays.", baseRevision: 1 }); assert(next.sources.some((source) => source.id === "answer-p2")); }],
  ["accepted question is remembered", () => { const next = applyProposal(page(), { id: "p3", questionId: "project:project-1:outcome", section: "project", targetId: "project-1", field: "outcome", question: "What changed?", answer: "Fewer delays", before: "", proposed: "Fewer delays.", baseRevision: 1 }); assert(next.answeredQuestionIds.includes("project:project-1:outcome")); }],
  ["undo restores accepted text", () => { const next = applyProposal(page(), { id: "p4", questionId: "project:project-1:outcome", section: "project", targetId: "project-1", field: "outcome", question: "What changed?", answer: "Fewer delays", before: "", proposed: "Fewer delays.", baseRevision: 1 }); assert.equal(undoLastChange(next)?.projects[0].outcome, undefined); }],
  ["style undo restores previous style", () => { const value = page({ style: "modern", undoStack: [{ section: "style", targetId: null, field: "style", before: "editorial", after: "modern" }] }); assert.equal(undoLastChange(value)?.style, "editorial"); }],
];

for (const [name, check] of checks) {
  check();
  console.log(`✓ ${name}`);
}
console.log(`\n${checks.length} profile-builder checks passed.`);
