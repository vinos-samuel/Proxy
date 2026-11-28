import assert from "node:assert/strict";
import { applyProposal, buildProfileDocument, conciseHeadline, getImprovementCandidates, getPublicationAccess, undoLastChange } from "../server/profile-builder";
import { cardsForHowIWork, closedCardLines, markProjectAccurate, profileDocumentSchema, selectPublicProfileDocument, toPublicProfileDocument, workTitleFromText, type ProfileDocument } from "../shared/profile-document";
import { mergeProfileDocuments, setDocumentPath } from "../client/src/lib/profile-document-merge";
import { hasConfirmedPro, hasJobSearchAccess, recentQuestionsForPlan, JOB_SEARCH_TRIAL_MS } from "../shared/plan-access";
import { cardIdFromAnswer, rewriteWithoutNewNumbers, ungroundedNumbers } from "../shared/answer-grounding";
import { sanitizeChatAnswer } from "../server/chat-sanitize";
import { PRIYA_PAGE_FACTS, PRIYA_REVIEWED_QUESTIONS, reviewedPriyaAnswer } from "../shared/priya-reviewed-answers";
import { guestDraftTtlMs, GUEST_DRAFT_TTL_MS, GUEST_DRAFT_EMAIL_TTL_MS } from "../shared/guest-draft";

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
  ["complete project asks what did not go as expected", () => {
    const complete = page({ projects: [{ id: "project-1", title: "Work", challenge: "A constraint", contribution: "Changed the process", outcome: "Delivery became reliable", sourceIds: ["resume-role-1"] }] });
    const question = getImprovementCandidates(complete).find((item) => item.section === "project");
    assert.equal(question?.id, "project:project-1:learned");
    assert.equal(question?.question, "What did not go as you expected, or what would you do differently next time? A sentence is enough.");
  }],
  ["accepted learned answer leads to the decision follow-up", () => {
    const complete = page({
      projects: [{ id: "project-1", title: "Work", challenge: "A constraint", contribution: "Changed the process", outcome: "Delivery became reliable", sourceIds: ["resume-role-1"] }],
      answeredQuestionIds: ["project:project-1:learned"],
    });
    assert.equal(getImprovementCandidates(complete).find((item) => item.section === "project")?.id, "project:project-1:decision");
  }],
  ["accepted decision leads to a relevant influence follow-up", () => {
    const complete = page({
      projects: [{ id: "project-1", title: "Work", challenge: "A constraint", contribution: "Changed the process", outcome: "Delivery became reliable", sourceIds: ["resume-role-1"] }],
      answeredQuestionIds: ["project:project-1:learned", "project:project-1:decision"],
    });
    assert.equal(getImprovementCandidates(complete).find((item) => item.section === "project")?.id, "project:project-1:influence");
  }],
  ["accepted influence leads to a third relevant reflection question", () => {
    const complete = page({
      projects: [{ id: "project-1", title: "Work", challenge: "A constraint", contribution: "Changed the process", outcome: "Delivery became reliable", sourceIds: ["resume-role-1"] }],
      answeredQuestionIds: ["project:project-1:learned", "project:project-1:decision", "project:project-1:influence"],
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
  ["a saved page with no case-card fields still parses", () => {
    const saved = page();
    assert.equal(saved.projects[0].status, undefined);
    assert.equal(saved.projects[0].learned, undefined);
    assert.equal(saved.projects[0].skills, undefined);
  }],
  ["an explicit draft card is left off the public page", () => {
    const value = page();
    value.projects[0].status = "draft";
    value.projects[0].outcome = "Delivery became reliable for the region.";
    assert.equal(toPublicProfileDocument(value).projects.some((project) => project.id === "project-1"), false);
  }],
  ["a card with no status stays on the public page", () => {
    const value = page();
    value.projects[0].outcome = "Delivery became reliable for the region.";
    const published = toPublicProfileDocument(value).projects.find((project) => project.id === "project-1");
    assert.ok(published);
    assert.equal(published.status, undefined);
    assert.equal(published.approvedAt, undefined);
  }],
  ["the private evidence note stays off the public page", () => {
    const value = page();
    value.projects[0].outcome = "Delivery became reliable for the region.";
    value.projects[0].evidenceNote = "Raw words from the candidate.";
    value.projects[0].approvedAt = "2026-11-28T00:00:00.000Z";
    const published = toPublicProfileDocument(value).projects.find((project) => project.id === "project-1");
    assert.equal(published?.evidenceNote, undefined);
    assert.equal(published?.approvedAt, undefined);
  }],
  ["what I learned is public only after that card is approved", () => {
    const value = page();
    value.projects[0].outcome = "Delivery became reliable for the region.";
    value.projects[0].learned = "I would brief the missing team first.";
    assert.equal(toPublicProfileDocument(value).projects[0].learned, undefined);
    value.projects[0].status = "approved";
    assert.equal(toPublicProfileDocument(value).projects[0].learned, "I would brief the missing team first.");
  }],
  ["a learned answer does not change what I did", () => {
    const value = page();
    const next = applyProposal(value, { id: "p-learned", questionId: "project:project-1:learned", section: "project", targetId: "project-1", field: "learned", question: "What did not go as you expected?", answer: "The first briefing missed a team.", before: "", proposed: "I would brief that team before kickoff.", baseRevision: 1 });
    assert.equal(next.projects[0].learned, "I would brief that team before kickoff.");
    assert.equal(next.projects[0].contribution, "Led the redesign.");
  }],
  ["how you work does not replace the about text", () => {
    const value = page();
    const about = value.identity.summary;
    const question = getImprovementCandidates(value).find((item) => item.id === "identity:working-style");
    assert.equal(question?.field, "workingStyle");
    const next = applyProposal(value, { id: "p-style", questionId: "identity:working-style", section: "summary", targetId: null, field: "workingStyle", question: "When work is complex or unclear, what do colleagues rely on you to do?", answer: "They ask me to make the decision clear.", before: "", proposed: "They ask me to make the decision clear.", baseRevision: 1 });
    assert.equal(next.identity.summary, about);
    assert.equal(next.privateContext.workingStyle, "They ask me to make the decision clear.");
    const undone = undoLastChange(next);
    assert.equal(undone?.identity.summary, about);
    assert.equal(undone?.privateContext.workingStyle, undefined);
  }],
  ["what you want next does not replace the about text", () => {
    const value = page();
    const about = value.identity.summary;
    const question = getImprovementCandidates(value).find((item) => item.id === "identity:career-direction");
    assert.equal(question?.field, "careerDirection");
    const next = applyProposal(value, { id: "p-direction", questionId: "identity:career-direction", section: "summary", targetId: null, field: "careerDirection", question: "What kind of opportunity would you most like to take on next?", answer: "A regional operations role with a messy handover.", before: "", proposed: "A regional operations role with a messy handover.", baseRevision: 1 });
    assert.equal(next.identity.summary, about);
    assert.equal(next.privateContext.careerDirection, "A regional operations role with a messy handover.");
    const undone = undoLastChange(next);
    assert.equal(undone?.identity.summary, about);
    assert.equal(undone?.privateContext.careerDirection, undefined);
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
  ["cancelled checkout still allows a first free publish", () => { const access = getPublicationAccess({ paymentStatus: "unpaid", tier: "pro", freePublishedAt: null, isPublic: false }); assert.equal(access.canPublish, true); assert.equal(access.canChangeLivePage, false); }],
  ["free page can publish changes during its edit window", () => assert.equal(getPublicationAccess({ paymentStatus: "unpaid", tier: "free", freePublishedAt: new Date(), isPublic: true }).canChangeLivePage, true)],
  ["older free publish that stored paymentStatus paid still edits inside the window", () => assert.equal(getPublicationAccess({ paymentStatus: "paid", tier: "free", freePublishedAt: new Date(), isPublic: true }).canChangeLivePage, true)],
  ["expired free page cannot publish or roll back its live page", () => { const access = getPublicationAccess({ paymentStatus: "paid", tier: "free", freePublishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), isPublic: true }); assert.equal(access.canPublish, false); assert.equal(access.canChangeLivePage, false); }],
  ["paid page can publish and roll back", () => { const access = getPublicationAccess({ paymentStatus: "paid", tier: "pro", freePublishedAt: null, isPublic: true }); assert.equal(access.canPublish, true); assert.equal(access.canChangeLivePage, true); }],
  ["free account is blocked from job search after the trial", () => {
    const now = Date.parse("2026-11-15T00:00:00Z");
    const created = new Date(now - JOB_SEARCH_TRIAL_MS - 60_000).toISOString();
    const freePaid = { tier: "free", paymentStatus: "paid" };
    assert.equal(hasConfirmedPro(freePaid), false);
    assert.equal(hasJobSearchAccess(freePaid, created, now), false);
    assert.equal(hasJobSearchAccess({ tier: "free", paymentStatus: "unpaid" }, created, now), false);
  }],
  ["confirmed pro can use job search", () => {
    const now = Date.parse("2026-11-15T00:00:00Z");
    const created = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(hasJobSearchAccess({ tier: "pro", paymentStatus: "paid" }, created, now), true);
  }],
  ["pro without a confirmed payment is blocked after the trial", () => {
    const now = Date.parse("2026-11-15T00:00:00Z");
    const created = new Date(now - JOB_SEARCH_TRIAL_MS).toISOString();
    assert.equal(hasJobSearchAccess({ tier: "pro", paymentStatus: "unpaid" }, created, now), false);
  }],
  ["new account can use job search for 48 hours", () => {
    const now = Date.parse("2026-11-15T00:00:00Z");
    const created = new Date(now - (JOB_SEARCH_TRIAL_MS - 60_000)).toISOString();
    assert.equal(hasJobSearchAccess({ tier: "free", paymentStatus: "unpaid" }, created, now), true);
  }],
  ["a number inside another number is not grounded", () => assert.deepEqual(ungroundedNumbers("9 markets", "94% across 6 markets"), ["9"])],
  ["a chat reply points at one card", () => {
    const projects = [{ id: "a", title: "Regional operating model" }, { id: "b", title: "Vendor reset" }];
    assert.equal(cardIdFromAnswer("On Regional operating model I changed the handover.", projects), "a");
    assert.equal(cardIdFromAnswer("Regional operating model and Vendor reset both mattered.", projects), null);
    assert.equal(cardIdFromAnswer("Nothing on the page covers that.", projects), null);
  }],
  ["an invented figure is not grounded in a card outcome", () => {
    assert.deepEqual(ungroundedNumbers("Cycle time fell 30%.", "The handover got calmer."), ["30"]);
  }],
  ["a rewrite cannot add a number the person did not say", () => {
    assert.equal(rewriteWithoutNewNumbers("it got faster", "cut cycle time by 30%"), "it got faster");
    assert.equal(rewriteWithoutNewNumbers("it fell 18%", "Cycle time fell 18%."), "Cycle time fell 18%.");
  }],
  ["keeping an outcome marks that card as a draft", () => {
    const value = page();
    value.projects[0].status = "approved";
    value.projects[0].approvedAt = "2026-11-28T00:00:00.000Z";
    const next = applyProposal(value, { id: "p-draft", questionId: "project:project-1:outcome", section: "project", targetId: "project-1", field: "outcome", question: "What changed?", answer: "Fewer delays", before: "", proposed: "Delivery became more reliable.", baseRevision: 1 });
    assert.equal(next.projects[0].status, "draft");
    assert.equal(next.projects[0].approvedAt, undefined);
    assert.equal(next.projects[0].outcome, "Delivery became more reliable.");
  }],
  ["a publish keeps approved and unmarked cards and drops the draft", () => {
    const value = page({ projects: [
      { id: "approved", title: "Approved work", outcome: "The handover got calmer.", status: "approved", sourceIds: ["resume-role-1"] },
      { id: "draft", title: "Draft work", outcome: "This one is not ready to show.", status: "draft", sourceIds: ["resume-role-1"] },
      { id: "legacy", title: "Older work", outcome: "This card has no new mark.", sourceIds: ["resume-role-1"] },
    ] });
    assert.deepEqual(toPublicProfileDocument(value).projects.map((project) => project.id), ["approved", "legacy"]);
  }],
  ["the live snapshot hides a draft from visitors and chat", () => {
    const value = page();
    value.projects[0].status = "draft";
    value.projects[0].outcome = "Delivery became reliable for the region.";
    value.projects.push({ id: "kept", title: "Shown work", contribution: "Led the redesign.", sourceIds: ["resume-role-1"] });
    const live = selectPublicProfileDocument({ activeDocument: value, publishedDocument: value });
    assert.equal(live?.projects.some((project) => project.id === "project-1"), false);
    assert.equal(live?.projects.some((project) => project.id === "kept"), true);
  }],
  ["draft cards do not count toward my approach", () => {
    const value = page({ projects: [
      { id: "a", title: "Still drafting", outcome: "A clear result from the work.", status: "draft", sourceIds: [] },
      { id: "b", title: "Also drafting", outcome: "Another clear result here.", status: "draft", sourceIds: [] },
      { id: "c", title: "Older card", outcome: "An older card with no mark.", sourceIds: [] },
    ] });
    assert.deepEqual(cardsForHowIWork(value).map((project) => project.id), ["c"]);
  }],
  ["a great-question opener does not leave a broken sentence", () => {
    assert.equal(sanitizeChatAnswer("That's a great question, but it's not covered here. Reach out directly."), "But it's not covered here. Reach out directly.");
    assert.equal(sanitizeChatAnswer("Great question. I led the migration for 40,000 accounts."), "I led the migration for 40,000 accounts.");
    assert.equal(sanitizeChatAnswer("I led the migration. Great question to ask next time."), "I led the migration. Great question to ask next time.");
  }],
  ["a decimal does not cut a work title short", () => {
    assert.equal(workTitleFromText("Cut average settlement turnaround from 3.2 days to 1.1 days by redesigning the exceptions queue"), "Cut average settlement turnaround from 3.2 days to 1.1 days by redesigning");
  }],
  ["numbered role lines become draft case cards when achievements are empty", () => {
    const document = buildProfileDocument({
      name: "Priya Nair",
      currentTitle: "Head of Operations",
      roles: [
        {
          title: "Head of Operations, APAC",
          company: "Meridian Trust Bank",
          years: "2019 - Present",
          achievements: "Run a 140-person operations team across 3 countries\nCut average settlement turnaround from 3.2 days to 1.1 days\nReduced operating cost per transaction by 22% over 3 years\nLed the core banking migration for 40,000 accounts with zero downtime",
        },
        {
          title: "Operations Manager",
          company: "Straits Fund Services",
          years: "2010 - 2015",
          achievements: "Managed fund administration for a $2.1B AUM book",
        },
      ],
      achievements: [],
    }, { positioning: "I run regional operations.", heroSubtitle: "Head of Operations", stats: [], careerTimeline: [] });
    assert.equal(document.projects.length, 3);
    assert.deepEqual(document.projects.map((project) => project.status), ["draft", "draft", "draft"]);
    assert.equal(document.projects[0].title, "Cut average settlement turnaround from 3.2 days to 1.1 days");
    assert.match(document.projects[2].outcome || "", /40,000 accounts/);
    assert.equal(document.projects.some((project) => /140-person/.test(project.outcome || "")), false);
    assert.equal(document.projects.some((project) => project.outcome?.includes("2.1B")), false);
    assert.equal(document.sources.filter((source) => source.label === "CV achievement").length, 3);
    assert.equal(document.experience.length, 2);
  }],
  ["an achievements list still builds cards without marking them draft", () => {
    const document = buildProfileDocument({
      name: "Priya Nair",
      currentTitle: "Head of Operations",
      roles: [{ title: "Head of Operations", company: "Meridian", years: "2019 - Present", achievements: "Run the team" }],
      achievements: ["Led the core banking migration for 40,000 accounts with zero downtime"],
    }, { positioning: "I run regional operations.", heroSubtitle: "Head of Operations", stats: [], careerTimeline: [] });
    assert.equal(document.projects.length, 1);
    assert.equal(document.projects[0].status, undefined);
  }],
  ["a closed card leads with the outcome, role, and its own skills", () => {
    const lines = closedCardLines({ outcome: "The handover got calmer.", summary: "A long CV bullet that should not lead.", role: "Program lead", company: "Example Co", skills: ["One", "Two", "Three", "Four", "Five"] });
    assert.equal(lines.preview, "The handover got calmer.");
    assert.equal(lines.byline, "Program lead · Example Co");
    assert.deepEqual(lines.skills, ["One", "Two", "Three", "Four"]);
    assert.equal(closedCardLines({ summary: "Only a summary." }).preview, "Only a summary.");
    assert.deepEqual(closedCardLines({ company: "Example Co" }).skills, []);
  }],
  ["two approved cards are enough for my approach", () => {
    const value = page({ projects: [
      { id: "a", title: "First", challenge: "Something was stuck.", status: "approved", sourceIds: [] },
      { id: "b", title: "Second", contribution: "I changed the handover.", status: "approved", sourceIds: [] },
      { id: "c", title: "Draft", outcome: "A draft result that is long enough.", status: "draft", sourceIds: [] },
    ] });
    assert.deepEqual(cardsForHowIWork(value).map((project) => project.id), ["a", "b"]);
  }],
  ["my approach refuses to generate from one eligible card", () => {
    const value = page({ projects: [
      { id: "a", title: "Still drafting", outcome: "A clear result from the work.", status: "draft", sourceIds: [] },
      { id: "b", title: "Also drafting", outcome: "Another clear result here.", status: "draft", sourceIds: [] },
      { id: "c", title: "Older card", outcome: "An older card with no mark.", sourceIds: [] },
    ] });
    assert.equal(cardsForHowIWork(value).length < 2, true);
  }],
  ["marking a card accurate does not publish it by itself", () => {
    const value = page();
    value.projects[0].status = "draft";
    value.projects[0].outcome = "Delivery became reliable for the region.";
    const next = markProjectAccurate(value, "project-1", "2026-11-28T12:00:00.000Z");
    assert.equal(next.projects[0].status, "approved");
    assert.equal(next.projects[0].approvedAt, "2026-11-28T12:00:00.000Z");
    assert.equal(selectPublicProfileDocument({ activeDocument: null, publishedDocument: next }), null);
    assert.equal(toPublicProfileDocument(next).projects[0].id, "project-1");
  }],
  ["keeping an outcome stores the candidate's words once", () => {
    const value = page();
    const next = applyProposal(value, { id: "p-outcome", questionId: "project:project-1:outcome", section: "project", targetId: "project-1", field: "outcome", question: "What changed?", answer: "Fewer delays", before: "", proposed: "Delivery became more reliable.", baseRevision: 1 });
    assert.equal(next.projects[0].evidenceNote, "Fewer delays");
    const again = applyProposal(next, { id: "p-outcome-2", questionId: "project:project-1:outcome", section: "project", targetId: "project-1", field: "outcome", question: "What changed?", answer: "A later answer", before: "", proposed: "Another rewrite.", baseRevision: 2 });
    assert.equal(again.projects[0].evidenceNote, "Fewer delays");
    assert.equal(again.projects[0].outcome, "Another rewrite.");
  }],
  ["Priya chip answers use only figures from her page", () => {
    for (const question of PRIYA_REVIEWED_QUESTIONS) {
      const answer = reviewedPriyaAnswer(question);
      assert.ok(answer);
      assert.deepEqual(ungroundedNumbers(answer, PRIYA_PAGE_FACTS), []);
    }
    assert.equal(reviewedPriyaAnswer("something typed by a visitor"), undefined);
    assert.ok(ungroundedNumbers("Singapore 35 days, India 18, Japan 65", PRIYA_PAGE_FACTS).length > 0);
    assert.deepEqual(ungroundedNumbers("4 countries, 6 markets, from 52 to 29 days", PRIYA_PAGE_FACTS), []);
  }],
  ["guest draft lasts 7 days only after an email is saved", () => {
    assert.equal(guestDraftTtlMs(false), GUEST_DRAFT_TTL_MS);
    assert.equal(guestDraftTtlMs(true), GUEST_DRAFT_EMAIL_TTL_MS);
  }],
  ["visitor question text is hidden for free and shown for pro", () => {
    const questions = [{ question: "How did the migration go?", askedAt: new Date() }];
    assert.deepEqual(recentQuestionsForPlan({ tier: "free", paymentStatus: "paid" }, questions), []);
    assert.deepEqual(recentQuestionsForPlan({ tier: "free", paymentStatus: "unpaid" }, questions), []);
    assert.deepEqual(recentQuestionsForPlan({ tier: "pro", paymentStatus: "unpaid" }, questions), []);
    assert.deepEqual(recentQuestionsForPlan({ tier: "pro", paymentStatus: "paid" }, questions), questions);
  }],
  ["concurrent changes to different fields merge without loss", () => { const base = page(); const local = page({ identity: { ...base.identity, headline: "Local headline" } }); const remote = page({ contact: { ...base.contact, showEmail: true } }); const merged = mergeProfileDocuments(base, local, remote); assert.equal(merged.conflicts.length, 0); assert.equal(merged.document.identity.headline, "Local headline"); assert.equal(merged.document.contact.showEmail, true); }],
  ["concurrent changes to the same field require an owner choice", () => { const base = page(); const local = page({ identity: { ...base.identity, headline: "Local headline" } }); const remote = page({ identity: { ...base.identity, headline: "Remote headline" } }); const merged = mergeProfileDocuments(base, local, remote); assert.equal(merged.conflicts[0].path, "identity.headline"); assert.equal(setDocumentPath(merged.document, merged.conflicts[0].path, merged.conflicts[0].local).identity.headline, "Local headline"); }],
];

for (const [name, check] of checks) {
  await check();
  console.log(`✓ ${name}`);
}
console.log(`\n${checks.length} profile-builder checks passed.`);
