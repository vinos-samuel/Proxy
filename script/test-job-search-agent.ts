import assert from "node:assert/strict";
import { chatContextDocument, profileDocumentSchema, type ProfileDocument } from "../shared/profile-document";
import {
  agentProfileContext,
  hasJobDescription,
  hasOfferNumbers,
  openingInstruction,
  systemPromptFor,
} from "../server/job-search-prompts";
import {
  contactShowsFollowUp,
  JOB_SEARCH_AGENT_FAQ,
  jobSearchAgentFaqPlainText,
  outreachDateWhenDraftSaved,
  showJobSearchAgentBadge,
} from "../shared/job-search-agent";
import { JOB_SEARCH_AGENT_HOME, PRO_BUTTON_LABEL } from "../client/src/lib/pro-plan";

function page(overrides: Partial<ProfileDocument> = {}): ProfileDocument {
  return profileDocumentSchema.parse({
    schemaVersion: 1,
    style: "executive",
    identity: {
      name: "Priya Nair",
      title: "Head of Operations",
      location: "Singapore",
      headline: "I run regional operations.",
      summary: "Operations leader with 18 years in financial services.",
      photoUrl: null,
    },
    projects: [],
    experience: [{
      id: "experience-1",
      company: "Meridian Trust Bank",
      title: "Head of Operations, APAC",
      period: "2019 - Present",
      highlights: ["Led the core banking migration for 40,000 accounts with zero client-impacting downtime"],
      sourceIds: ["resume-role-1"],
    }],
    skills: ["Core Banking Migration", "Regulatory Reporting (MAS)"],
    contact: { email: null, linkedin: null, website: null, showEmail: false, showLinkedin: false, showWebsite: false },
    publicBotEnabled: false,
    sources: [{ id: "resume-role-1", kind: "resume", label: "Role", excerpt: "Head of Operations at Meridian Trust Bank" }],
    ...overrides,
  });
}

const questionnaireOnly = {
  step1: { fullName: "Priya Nair", currentTitle: "Head of Operations", location: "Singapore" },
  step2: { professionalSummary: "Operations leader with 18 years in financial services." },
};

const longJd = "Head of Securities Operations. You will run settlement and reconciliation across three markets, own the MAS control calendar, and cut exception aging. The team is about 80 people. You will report to the regional COO and work with custody, fund accounting, and client servicing.";

export const jobSearchAgentChecks: Array<[string, () => void]> = [
  ["a CV page is read from the working document, not the empty questionnaire", () => {
    const built = agentProfileContext({
      workingDocument: page(),
      questionnaireData: questionnaireOnly,
      displayName: "Priya Nair",
      roleTitle: "Head of Operations",
      positioning: "Operations leader with 18 years in financial services.",
    });
    assert.equal(built.source, "working");
    assert.match(built.text, /Page source: working document/);
    assert.match(built.text, /Meridian Trust Bank/);
    assert.match(built.text, /2019 - Present/);
    assert.match(built.text, /40,000 accounts/);
    assert.match(built.text, /Core Banking Migration/);
    assert.match(built.text, /18 years/);
    assert.match(built.text, /NO-INVENTION RULE/);
  }],
  ["the working document wins over the active document", () => {
    const built = agentProfileContext({
      workingDocument: page({ experience: [{ id: "experience-1", company: "Only Working Co", title: "Head of Operations", period: "2020 - Present", highlights: ["Cut cost by 22%"], sourceIds: ["resume-role-1"] }] }),
      activeDocument: page({ experience: [{ id: "experience-1", company: "Only Active Co", title: "Director", period: "2015 - 2019", highlights: ["Built onboarding"], sourceIds: ["resume-role-1"] }] }),
    });
    assert.equal(built.source, "working");
    assert.match(built.text, /Only Working Co/);
    assert.doesNotMatch(built.text, /Only Active Co/);
  }],
  ["the active document is used when there is no working document", () => {
    const built = agentProfileContext({
      workingDocument: null,
      activeDocument: page({ experience: [{ id: "experience-1", company: "Harbourline Custody", title: "Director", period: "2015 - 2019", highlights: ["60-person team"], sourceIds: ["resume-role-1"] }] }),
      questionnaireData: questionnaireOnly,
    });
    assert.equal(built.source, "active");
    assert.match(built.text, /Page source: active document/);
    assert.match(built.text, /Harbourline Custody/);
    assert.match(built.text, /60-person/);
  }],
  ["a broken working document falls through to the active document", () => {
    const built = agentProfileContext({
      workingDocument: { nope: true },
      activeDocument: page(),
    });
    assert.equal(built.source, "active");
    assert.match(built.text, /Meridian Trust Bank/);
  }],
  ["legacy questionnaire roles include employers, dates, and achievements", () => {
    const built = agentProfileContext({
      workingDocument: null,
      activeDocument: null,
      questionnaireData: {
        step1: { fullName: "Priya Nair", currentTitle: "Head of Operations" },
        step2: {
          professionalSummary: "Operations leader.",
          careerHistory: [{
            company: "Straits Fund Services",
            title: "Operations Manager",
            years: "2010 - 2015",
            achievements: "Managed fund administration for a $2.1B AUM book across 30 fund structures",
          }],
        },
        step5: { achievements: "Reduced operating cost per transaction by 22% over 3 years" },
        step6: { technicalSkills: "Fund Administration, Client Onboarding" },
      },
    });
    assert.equal(built.source, "legacy");
    assert.match(built.text, /Straits Fund Services/);
    assert.match(built.text, /2010 - 2015/);
    assert.match(built.text, /\$2\.1B/);
    assert.match(built.text, /22%/);
    assert.match(built.text, /Fund Administration/);
  }],
  ["a private-draft card is labelled for the agent and kept off the public chat", () => {
    const value = page({
      projects: [
        { id: "shown", title: "Core banking migration", outcome: "Led the migration for 40,000 accounts.", status: "approved", sourceIds: ["resume-role-1"] },
        { id: "zephyr", title: "Zephyr ledger reconciliation", outcome: "Recovered 424242 unmatched zephyr ledger entries.", status: "draft", sourceIds: ["resume-role-1"] },
      ],
    });
    const built = agentProfileContext({ workingDocument: value });
    assert.match(built.text, /APPROVED: Core banking migration/);
    assert.match(built.text, /PRIVATE-DRAFT: Zephyr ledger reconciliation/);
    assert.match(built.text, /424242 unmatched zephyr/);
    assert.match(built.text, /unverified/);
    const chat = chatContextDocument(value);
    const publicText = JSON.stringify(chat);
    assert.equal(chat.projects.some((project) => project.id === "zephyr"), false);
    assert.equal(chat.projects.some((project) => project.id === "shown"), true);
    assert.doesNotMatch(publicText, /424242/);
    assert.doesNotMatch(publicText, /zephyr/i);
  }],
  ["follow-up is available for every contact, with or without an outreach date", () => {
    assert.equal(contactShowsFollowUp(undefined), true);
    assert.equal(contactShowsFollowUp({}), true);
    assert.equal(contactShowsFollowUp({ lastOutreachDate: null, responseReceived: false }), true);
    assert.equal(contactShowsFollowUp({ lastOutreachDate: "2026-01-02", responseReceived: true }), true);
  }],
  ["saving an outreach draft sets a missing date and keeps one already saved", () => {
    const savedAt = new Date("2026-11-28T15:04:00.000Z");
    assert.equal(outreachDateWhenDraftSaved(null, savedAt), "2026-11-28");
    assert.equal(outreachDateWhenDraftSaved("", savedAt), "2026-11-28");
    assert.equal(outreachDateWhenDraftSaved(undefined, savedAt), "2026-11-28");
    assert.equal(outreachDateWhenDraftSaved("not-a-date", savedAt), "2026-11-28");
    assert.equal(outreachDateWhenDraftSaved("2026-01-02", savedAt), null);
    assert.equal(outreachDateWhenDraftSaved(new Date("2026-03-01T00:00:00.000Z"), savedAt), null);
  }],
  ["the first click drafts outreach, the first interview question, a thank-you, and offer notes", () => {
    const outreach = openingInstruction("outreach", { name: "Helena Ong" });
    assert.match(outreach, /Write the outreach draft now/);
    assert.match(outreach, /Do not ask those questions before the draft/);
    assert.doesNotMatch(systemPromptFor("outreach", "PROFILE", { name: "Helena Ong" }), /ONLY CONTAIN THE TWO QUESTIONS/);

    const interview = openingInstruction("interview-prep", { jobTitle: "Head of Operations", companyName: "Harbourline" });
    assert.match(interview, /Ask the first practice question now/);
    assert.match(interview, /Do not ask those before the first practice question/);
    assert.match(systemPromptFor("interview-prep", "PROFILE", { jobTitle: "Head of Operations" }), /Ask one practice question now/);

    const thanks = openingInstruction("thank-you", { jobTitle: "Head of Operations", companyName: "Harbourline" });
    assert.match(thanks, /Write the thank-you note now/);
    assert.match(thanks, /Do not invent what was said/);
    assert.match(thanks, /No interview notes are saved/);
    assert.match(thanks, /Do not write that the result aligns, fits, or is required/);
    assert.doesNotMatch(thanks, /Do not write any note/);

    const offer = openingInstruction("negotiate", { jobTitle: "Head of Operations", salaryMin: 180000, salaryMax: 220000, salaryCurrency: "SGD" });
    assert.match(offer, /Write the offer notes now/);
    assert.match(systemPromptFor("negotiate", "PROFILE", { salaryMin: 180000, salaryMax: 220000, salaryCurrency: "SGD" }), /SGD 180,000 – 220,000/);
  }],
  ["a missing job description or missing offer numbers asks for that one thing", () => {
    assert.equal(hasJobDescription(""), false);
    assert.equal(hasJobDescription("x".repeat(100)), false);
    assert.equal(hasJobDescription(longJd), true);
    assert.equal(hasOfferNumbers({}), false);
    assert.equal(hasOfferNumbers({ salaryMin: 0, salaryMax: "" }), false);
    assert.equal(hasOfferNumbers({ salaryMin: "180000" }), true);

    const letter = openingInstruction("cover-letter", { jobTitle: "Head of Operations", notes: "Ops role" });
    assert.match(letter, /Ask only for the job description/);
    assert.match(letter, /Do not write a letter/);
    assert.match(openingInstruction("cover-letter", { notes: longJd }), /Write the cover letter now/);

    const offer = openingInstruction("negotiate", { jobTitle: "Head of Operations" });
    assert.match(offer, /Ask only for the base salary/);
    assert.match(offer, /Do not ask about bonus/);
    assert.match(systemPromptFor("negotiate", "PROFILE", {}), /Ask only for the base salary/);
  }],
  ["a follow-up is written even when no outreach date is saved", () => {
    const opening = openingInstruction("follow-up", { name: "Helena Ong", lastOutreachDate: null });
    assert.match(opening, /Write the follow-up now/);
    assert.match(opening, /Do not invent a date/);
    assert.match(opening, /Do not mention a previous message/);
    assert.match(opening, /first person/);
    assert.match(systemPromptFor("follow-up", "PROFILE", { name: "Helena Ong" }), /first person/);
    assert.match(systemPromptFor("follow-up", "PROFILE", { name: "Helena Ong" }), /missing outreach date is allowed/);
  }],
  ["the agent badge shows for a 48-hour trial or paid Pro, and not otherwise", () => {
    const now = Date.parse("2026-11-28T00:00:00.000Z");
    const withinTrial = new Date(now - 47 * 60 * 60 * 1000).toISOString();
    const pastTrial = new Date(now - 49 * 60 * 60 * 1000).toISOString();
    assert.equal(showJobSearchAgentBadge({ tier: "free", paymentStatus: "unpaid" }, withinTrial, now), true);
    assert.equal(showJobSearchAgentBadge({ tier: "free", paymentStatus: "unpaid" }, pastTrial, now), false);
    assert.equal(showJobSearchAgentBadge({ tier: "free", paymentStatus: "paid" }, pastTrial, now), false);
    assert.equal(showJobSearchAgentBadge({ tier: "pro", paymentStatus: "unpaid" }, pastTrial, now), false);
    assert.equal(showJobSearchAgentBadge({ tier: "pro", paymentStatus: "unpaid" }, withinTrial, now), true);
    assert.equal(showJobSearchAgentBadge({ tier: "pro", paymentStatus: "paid" }, pastTrial, now), true);
    assert.equal(showJobSearchAgentBadge({ tier: "pro", paymentStatus: "paid" }, null, now), true);
    assert.equal(showJobSearchAgentBadge({ tier: null, paymentStatus: null }, null, now), false);
  }],
  ["a thank-you with no interview notes may not add an unsupported fit line", () => {
    const prompt = systemPromptFor("thank-you", "PROFILE", { jobTitle: "Head of Securities Operations", companyName: "Harbourline Bank" });
    assert.match(prompt, /No interview notes are saved/);
    assert.match(prompt, /Do not write that the result aligns, fits, matches, or is required/);
    assert.match(prompt, /Do not write "aligns well", "operational efficiency", or "the needs of the role"/);
    assert.match(prompt, /Do not write that the candidate is interested or excited/);
    assert.match(prompt, /One result copied from the profile/);
    assert.match(prompt, /first person \("I", not "you"\)/);
    assert.match(prompt, /Do not describe the candidate as "you"/);
    const withNotes = systemPromptFor("thank-you", "PROFILE", { jobTitle: "Head of Operations", companyName: "Harbourline Bank", notes: "We talked about the exceptions queue." });
    assert.match(withNotes, /Interview notes are saved/);
    assert.match(withNotes, /Do not add a claim that is in neither/);
  }],
  ["company fit drops unsourced next steps and showcase filler", () => {
    const entity = { name: "Harbourline Bank", industry: "Financial services", notes: "They care about settlement speed." };
    const prompt = systemPromptFor("research", "PROFILE", entity);
    assert.match(prompt, /Do not write a next step/);
    assert.match(prompt, /showcase/i);
    assert.match(prompt, /Do not add a FIRST MOVE section/);
    assert.match(prompt, /Do not tell the candidate to prepare, apply, review, elaborate, ensure, or speak to anything/);
    assert.match(prompt, /Do not calculate years from a date range/);
    assert.match(prompt, /Do not write a number that is not already written/);
    assert.doesNotMatch(prompt, /headers: PROFILE FIT, ROLES TO TARGET, WHAT TO LEAD WITH, WATCH OUT FOR, FIRST MOVE/);
    assert.match(openingInstruction("research", entity), /Do not write a next step/);
    assert.match(openingInstruction("research", entity), /Do not use the word showcase/);
  }],
  ["the homepage Job Search Agent section uses the approved words", () => {
    assert.equal(JOB_SEARCH_AGENT_HOME.eyebrow, "Job Search Agent");
    assert.equal(JOB_SEARCH_AGENT_HOME.headline, "Draft the search from the page you already have.");
    assert.equal(JOB_SEARCH_AGENT_HOME.subhead, "It uses the roles, employers, and numbers saved on your page.");
    assert.deepEqual([...JOB_SEARCH_AGENT_HOME.bullets], [
      "A message to a contact",
      "A shorter follow-up",
      "A cover letter, when the job description is saved",
      "Interview practice, one question at a time",
      "A thank-you note",
      "Notes on an offer, when the salary numbers are saved",
    ]);
    assert.equal(JOB_SEARCH_AGENT_HOME.price, "Pro, $49 once");
    assert.equal(PRO_BUTTON_LABEL, "Get Pro · $49 once");
  }],
  ["the Job Search Agent FAQ matches the first-click behaviour", () => {
    const faq = jobSearchAgentFaqPlainText();
    assert.equal(faq, [...JOB_SEARCH_AGENT_FAQ.intro, ...JOB_SEARCH_AGENT_FAQ.drafts].join(" "));
    assert.match(faq, /\$49, paid once/);
    assert.match(faq, /48 hours after you create an account/);
    assert.match(faq, /does not invent employers, dates, or numbers/);
    assert.match(faq, /private draft card can be used/);
    assert.match(faq, /public page chat does not use draft cards/);
    assert.match(faq, /message to a contact, on the first click/);
    assert.match(faq, /follow-up for any contact/);
    assert.match(faq, /Saving an outreach draft sets the outreach date/);
    assert.match(faq, /asks only for the job description/);
    assert.match(faq, /starts with the first question/);
    assert.match(faq, /thank-you note on the first click/);
    assert.match(faq, /asks only for those numbers/);
    assert.doesNotMatch(faq, /thank-you note after you say who you met/);
  }],
];
