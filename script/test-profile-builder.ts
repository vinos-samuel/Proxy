import assert from "node:assert/strict";
import { applyProposal, conciseHeadline, getImprovementCandidates, getPublicationAccess, undoLastChange } from "../server/profile-builder";
import { profileDocumentSchema, selectPublicProfileDocument, toPublicProfileDocument, type ProfileDocument } from "../shared/profile-document";
import { mergeProfileDocuments, setDocumentPath } from "../client/src/lib/profile-document-merge";

function page(overrides: Partial<ProfileDocument> = {}): ProfileDocument {
  return profileDocumentSchema.parse({
    schemaVersion: 1,
    style: "executive",
    identity: { name: "Avery Tan", title: "Operations Director", headline: "I build reliable regional operations.", summary: "I lead complex regional operations and improve how teams deliver.", photoUrl: null },
    projects: [{ id: "project-1", title: "Regional operating model", contribution: "Led the redesign.", sourceIds: ["resume-role-1"] }],
    experience: [{ id: "experience-1", company: "Example Co", title: "Operations Director", highlights: ["Led a regional redesign"], sourceIds: ["resume-role-1"] }],
    employerContributions: [{ id: "employer-1", company: "Example Co", contributions: ["Built the regional operating model"], sourceIds: ["resume-role-1"] }],
    skills: ["Operations", "Change management"],
    contact: { email: "avery@example.com", linkedin: "https://linkedin.com/in/avery", website: null, showEmail: false, showLinkedin: false, showWebsite: false },
    publicBotEnabled: false,
    privateContext: { questions: [], concerns: [] },
    sources: [{ id: "resume-role-1", kind: "resume", label: "Role", excerpt: "Operations Director at Example Co" }],
    skippedQuestionIds: [], answeredQuestionIds: [], pendingProposal: null, undoStack: [],
    ...overrides,
  });
}

const checks: Array<[string, () => void]> = [
  ["valid base document", () => assert.equal(page().schemaVersion, 1)],
  ["executive style is valid", () => assert.equal(page().style, "executive")],
  ["long generated headline falls back to the role", () => assert.equal(conciseHeadline("I am a leader with a very long positioning paragraph that keeps going far beyond a useful page heading and should not become display type on the page.", "Operations Director"), "Operations Director")],
  ["missing project challenge creates a contextual question", () => { const question = getImprovementCandidates(page())[0]; assert.equal(question.field, "challenge"); assert.match(question.question, /Your CV says/); assert.match(question.question, /Before this work began/); }],
  ["missing project outcome creates a question", () => assert(getImprovementCandidates(page()).some((item) => item.field === "outcome"))],
  ["existing contribution does not create contribution question", () => assert(!getImprovementCandidates(page()).some((item) => item.field === "contribution"))],
  ["skipped question stays skipped", () => assert(!getImprovementCandidates(page({ skippedQuestionIds: ["project:project-1:challenge"] })).some((item) => item.id.endsWith(":challenge")))],
  ["answered question stays answered", () => assert(!getImprovementCandidates(page({ answeredQuestionIds: ["project:project-1:outcome"] })).some((item) => item.id.endsWith(":outcome")))],
  ["complete project produces a deeper decision question", () => {
    const complete = page({ projects: [{ id: "project-1", title: "Work", challenge: "A constraint", contribution: "Changed the process", outcome: "Delivery became reliable", sourceIds: ["resume-role-1"] }] });
    assert.equal(getImprovementCandidates(complete).find((item) => item.section === "project")?.id, "project:project-1:decision");
  }],
  ["accepted decision leads to a relevant influence follow-up", () => {
    const complete = page({
      projects: [{ id: "project-1", title: "Work", challenge: "A constraint", contribution: "Changed the process", outcome: "Delivery became reliable", sourceIds: ["resume-role-1"] }],
      answeredQuestionIds: ["project:project-1:decision"],
    });
    assert.equal(getImprovementCandidates(complete).find((item) => item.section === "project")?.id, "project:project-1:influence");
  }],
  ["accepted influence leads to a third relevant reflection question", () => {
    const complete = page({
      projects: [{ id: "project-1", title: "Work", challenge: "A constraint", contribution: "Changed the process", outcome: "Delivery became reliable", sourceIds: ["resume-role-1"] }],
      answeredQuestionIds: ["project:project-1:decision", "project:project-1:influence"],
    });
    assert.equal(getImprovementCandidates(complete).find((item) => item.section === "project")?.id, "project:project-1:reflection");
  }],
  ["no projects asks for a useful role example", () => assert.equal(getImprovementCandidates(page({ projects: [] }))[0].section, "experience")],
  ["short summary creates summary question", () => assert(getImprovementCandidates(page({ identity: { ...page().identity, summary: "Operations leader." } })).some((item) => item.section === "summary"))],
  ["public projection removes raw sources", () => assert.equal(toPublicProfileDocument(page()).sources.length, 0)],
  ["public projection removes hidden email", () => assert.equal(toPublicProfileDocument(page()).contact.email, null)],
  ["public projection retains selected email", () => { const value = page(); value.contact.showEmail = true; assert.equal(toPublicProfileDocument(value).contact.email, "avery@example.com"); }],
  ["public projection removes review state", () => { const value = page(); value.skippedQuestionIds = ["x"]; assert.equal(toPublicProfileDocument(value).skippedQuestionIds.length, 0); }],
  ["public projection removes private authoring context", () => { const value = page(); value.privateContext.workingStyle = "Private"; value.privateContext.questions = [{ question: "Q", answer: "A" }]; const publicPage = toPublicProfileDocument(value); assert.equal(publicPage.privateContext.workingStyle, undefined); assert.equal(publicPage.privateContext.questions.length, 0); }],
  ["public projection removes source links from employer contributions", () => assert.equal(toPublicProfileDocument(page()).employerContributions[0].sourceIds.length, 0)],
  ["public projection removes empty selected-work drafts", () => {
    const value = page();
    value.projects.push({ id: "empty-project", title: "New selected work", summary: "", sourceIds: [] });
    assert.equal(toPublicProfileDocument(value).projects.some((project) => project.id === "empty-project"), false);
  }],
  ["staged publication is not public before activation", () => {
    const staged = page();
    assert.equal(selectPublicProfileDocument({ activeDocument: null, publishedDocument: staged }), null);
  }],
  ["active publication is selected for public output", () => {
    const active = page();
    const staged = page();
    staged.identity.headline = "A later reviewed version";
    assert.equal(selectPublicProfileDocument({ activeDocument: active, publishedDocument: staged })?.identity.headline, active.identity.headline);
  }],
  ["unknown source references are rejected", () => assert.throws(() => profileDocumentSchema.parse({ ...page(), projects: [{ id: "x", title: "X", sourceIds: ["missing"] }] }))],
  ["oversized skills list is rejected", () => assert.throws(() => profileDocumentSchema.parse({ ...page(), skills: Array.from({ length: 41 }, (_, index) => `Skill ${index}`) }))],
  ["proposal changes only its field", () => { const value = page(); const next = applyProposal(value, { id: "p1", questionId: "project:project-1:outcome", section: "project", targetId: "project-1", field: "outcome", question: "What changed?", answer: "Fewer delays", before: "", proposed: "Delivery became more reliable.", baseRevision: 1 }); assert.equal(next.projects[0].outcome, "Delivery became more reliable."); assert.equal(next.identity.headline, value.identity.headline); }],
  ["accepted answer becomes a private source", () => { const next = applyProposal(page(), { id: "p2", questionId: "project:project-1:outcome", section: "project", targetId: "project-1", field: "outcome", question: "What changed?", answer: "Fewer delays", before: "", proposed: "Fewer delays.", baseRevision: 1 }); assert(next.sources.some((source) => source.id === "answer-p2")); }],
  ["accepted question is remembered", () => { const next = applyProposal(page(), { id: "p3", questionId: "project:project-1:outcome", section: "project", targetId: "project-1", field: "outcome", question: "What changed?", answer: "Fewer delays", before: "", proposed: "Fewer delays.", baseRevision: 1 }); assert(next.answeredQuestionIds.includes("project:project-1:outcome")); }],
  ["undo restores accepted text", () => { const next = applyProposal(page(), { id: "p4", questionId: "project:project-1:outcome", section: "project", targetId: "project-1", field: "outcome", question: "What changed?", answer: "Fewer delays", before: "", proposed: "Fewer delays.", baseRevision: 1 }); assert.equal(undoLastChange(next)?.projects[0].outcome, undefined); }],
  ["style undo restores previous style", () => { const value = page({ style: "modern", undoStack: [{ section: "style", targetId: null, field: "style", before: "editorial", after: "modern" }] }); assert.equal(undoLastChange(value)?.style, "editorial"); }],
  ["undo removes a newly added work item", () => { const value = page(); const added = { id: "project-2", title: "New work", sourceIds: [] }; value.projects.push(added); value.undoStack.push({ section: "project", targetId: added.id, field: "project:add", before: null, after: added }); assert.equal(undoLastChange(value)?.projects.length, 1); }],
  ["undo restores a removed work item at its original position", () => { const value = page({ projects: [] }); const removed = page().projects[0]; value.undoStack.push({ section: "project", targetId: removed.id, field: "project:remove", before: { project: removed, index: 0 }, after: null }); assert.equal(undoLastChange(value)?.projects[0].id, removed.id); }],
  ["undo restores selected-work order", () => { const first = page().projects[0]; const second = { id: "project-2", title: "Second", sourceIds: [] }; const value = page({ projects: [second, first], undoStack: [{ section: "project", targetId: first.id, field: "project:order", before: [first.id, second.id], after: [second.id, first.id] }] }); assert.deepEqual(undoLastChange(value)?.projects.map((item) => item.id), [first.id, second.id]); }],
  ["first public page can publish free without a card", () => assert.equal(getPublicationAccess({ paymentStatus: null, tier: null, freePublishedAt: null, isPublic: false }).canPublish, true)],
  ["free page can publish changes during its edit window", () => assert.equal(getPublicationAccess({ paymentStatus: "paid", tier: "free", freePublishedAt: new Date(), isPublic: true }).canChangeLivePage, true)],
  ["expired free page cannot publish or roll back its live page", () => { const access = getPublicationAccess({ paymentStatus: "paid", tier: "free", freePublishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), isPublic: true }); assert.equal(access.canPublish, false); assert.equal(access.canChangeLivePage, false); }],
  ["paid page can publish and roll back", () => { const access = getPublicationAccess({ paymentStatus: "paid", tier: "pro", freePublishedAt: null, isPublic: true }); assert.equal(access.canPublish, true); assert.equal(access.canChangeLivePage, true); }],
  ["concurrent changes to different fields merge without loss", () => { const base = page(); const local = page({ identity: { ...base.identity, headline: "Local headline" } }); const remote = page({ contact: { ...base.contact, showEmail: true } }); const merged = mergeProfileDocuments(base, local, remote); assert.equal(merged.conflicts.length, 0); assert.equal(merged.document.identity.headline, "Local headline"); assert.equal(merged.document.contact.showEmail, true); }],
  ["concurrent changes to the same field require an owner choice", () => { const base = page(); const local = page({ identity: { ...base.identity, headline: "Local headline" } }); const remote = page({ identity: { ...base.identity, headline: "Remote headline" } }); const merged = mergeProfileDocuments(base, local, remote); assert.equal(merged.conflicts[0].path, "identity.headline"); assert.equal(setDocumentPath(merged.document, merged.conflicts[0].path, merged.conflicts[0].local).identity.headline, "Local headline"); }],
];

for (const [name, check] of checks) {
  check();
  console.log(`✓ ${name}`);
}
console.log(`\n${checks.length} profile-builder checks passed.`);
