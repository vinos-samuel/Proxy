import { GoogleGenAI } from "@google/genai";
import { storage } from "./storage";
import { logger } from "./logger";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

function sanitizeForPrompt(s: string | undefined | null, maxLen = 500): string {
  if (!s) return "";
  return s.replace(/[\r\n]+/g, " ").replace(/[`{}\\]/g, "").trim().slice(0, maxLen);
}

// ==================== TYPES ====================

export type AgentActionType =
  | "research"       // Company: profile fit + intel
  | "outreach"       // Contact: question-first message draft
  | "follow-up"      // Contact: no-response follow-up
  | "cover-letter"   // Application: tailored cover letter
  | "role-fit"       // Application: JD gap analysis
  | "interview-prep" // Application (interviewing): 5 Q + practice
  | "thank-you"      // Application (interviewing): post-interview note
  | "negotiate";     // Application (offer): counter-offer strategy

export type AgentEntityType = "company" | "contact" | "application";

interface AgentSession {
  customerId: string;
  actionType: AgentActionType;
  entityType: AgentEntityType;
  entityData: Record<string, any>;
  systemPrompt: string;
  messages: Array<{ role: "user" | "model"; parts: [{ text: string }] }>;
}

const agentSessions = new Map<string, AgentSession>();

// ==================== PROFILE CONTEXT ====================

async function buildProfileContext(customerId: string): Promise<string> {
  const profile = await storage.getProfileByCustomerId(customerId);
  if (!profile) return "No Twin profile found. Proceed with general advice.";

  const qd = profile.questionnaireData as any;
  const name         = sanitizeForPrompt(qd?.step1?.fullName || profile.displayName, 100);
  const title        = sanitizeForPrompt(qd?.step1?.currentTitle || profile.roleTitle, 100);
  const location     = sanitizeForPrompt(qd?.step1?.location, 80);
  const summary      = sanitizeForPrompt(qd?.step2?.professionalSummary || profile.positioning, 600);
  const skills       = sanitizeForPrompt(qd?.step6?.technicalSkills, 300);
  const achievements = sanitizeForPrompt(qd?.step5?.achievements, 500);
  const tone         = sanitizeForPrompt(profile.tone, 30) || "direct";
  const wordsUsed    = sanitizeForPrompt(qd?.step7?.wordsUsedOften, 100);
  const wordsAvoided = sanitizeForPrompt(qd?.step7?.wordsAvoided, 100);

  const careerHistory = (qd?.step2?.careerHistory || [])
    .map((r: any) => `${sanitizeForPrompt(r.title, 80)} at ${sanitizeForPrompt(r.company, 80)} (${sanitizeForPrompt(r.years, 20)})`)
    .join(", ");

  const stories = (qd?.step4?.stories || [])
    .slice(0, 4)
    .map((s: any, i: number) =>
      `Story ${i + 1}: ${sanitizeForPrompt(s.title, 80)}\n  Challenge: ${sanitizeForPrompt(s.challenge, 200)}\n  Result: ${sanitizeForPrompt(s.result, 200)}`
    ).join("\n");

  const objections = (qd?.step9?.objections || [])
    .slice(0, 2)
    .map((o: any) => `Q: ${sanitizeForPrompt(o.objection, 100)} → A: ${sanitizeForPrompt(o.response, 200)}`)
    .join("\n");

  return `
CANDIDATE PROFILE:
Name: ${name}
Title: ${title}
Location: ${location || "Not specified"}
Communication tone: ${tone}
${wordsUsed ? `Words used often: ${wordsUsed}` : ""}
${wordsAvoided ? `Words avoided: ${wordsAvoided}` : ""}

CAREER PATH: ${careerHistory || "Not provided"}

PROFESSIONAL SUMMARY:
${summary || "Not provided"}

KEY ACHIEVEMENTS:
${achievements || "Not provided"}

SKILLS: ${skills || "Not provided"}

CAREER STORIES (use these as interview evidence and credibility anchors):
${stories || "Not provided"}

${objections ? `OBJECTION HANDLING:\n${objections}` : ""}
`.trim();
}

// ==================== SYSTEM PROMPTS ====================

function promptResearch(ctx: string, entityData: Record<string, any>): string {
  const company  = sanitizeForPrompt(entityData.name, 100);
  const industry = sanitizeForPrompt(entityData.industry, 80);
  const notes    = sanitizeForPrompt(entityData.notes, 300);

  return `You are a career strategist helping a senior professional assess whether to pursue ${company} and how to position themselves.

${ctx}

COMPANY:
Name: ${company}
Industry: ${industry || "Not specified"}
${notes ? `User's notes: ${notes}` : ""}

YOUR JOB — generate a structured analysis with these sections:
1. PROFILE FIT: How well does their background match what ${company} typically hires? Be honest — strong fit, partial fit, or stretch?
2. ROLES TO TARGET: What 2-3 specific roles would make sense to apply for or pitch?
3. WHAT TO LEAD WITH: Which part of their background is most relevant? What story or achievement to emphasise?
4. WATCH OUT FOR: Any gaps, potential objections, or things they should address proactively?
5. FIRST MOVE: What's the recommended next action — apply directly, network in, or research more first?

Be specific and direct. Use their actual background. No generic advice.`;
}

function promptOutreach(ctx: string, entityData: Record<string, any>): string {
  const name            = sanitizeForPrompt(entityData.name, 100);
  const contactTitle    = sanitizeForPrompt(entityData.title, 100);
  const company         = sanitizeForPrompt(entityData.companyName, 100);
  const email           = sanitizeForPrompt(entityData.email, 150);
  const linkedinUrl     = sanitizeForPrompt(entityData.linkedinUrl, 200);
  const notes           = sanitizeForPrompt(entityData.notes, 500);
  const responseNotes   = sanitizeForPrompt(entityData.responseNotes, 300);
  const lastOutreach    = sanitizeForPrompt(entityData.lastOutreachDate, 30);

  return `You are a messaging coach helping someone craft a personalized outreach message. You know the sender's full career background from their profile.

${ctx}

CONTACT BEING REACHED OUT TO:
- Name: ${name}
- Title/Role: ${contactTitle || "not specified"}
- Company: ${company || "not specified"}
${email ? `- Email: ${email}` : ""}
${linkedinUrl ? `- LinkedIn: ${linkedinUrl}` : ""}
${lastOutreach ? `- Previous outreach: ${lastOutreach}` : ""}
${responseNotes ? `- Previous response notes: ${responseNotes}` : ""}
${notes ? `- User's notes on this contact: ${notes}` : ""}

STRICT RULE: YOUR FIRST RESPONSE MUST ONLY CONTAIN THE TWO QUESTIONS BELOW. No preamble. No "sure!". No draft. No other text.

Ask exactly:
"Before I write this, two quick things:
1. What's the goal here — explore openings at ${company || "their company"}, ask for a referral, reconnect after a gap, or something else?
2. Channel preference — LinkedIn DM or email? And warmer/casual or more formal?"

Only after they reply do you write the draft. The draft rules:
- Read like a real human wrote it, not a template
- Open with a specific hook relevant to ${name} or ${company || "their company"} — not a compliment
- Use ONE concrete achievement from the sender's profile as the credibility hook (real numbers, real companies)
- LinkedIn DM: under 80 words. Email: under 180 words
- Close with a low-friction ask — not "let's schedule a call"
- Sign off with the sender's ACTUAL name from the profile above

After the draft: "Want me to adjust the tone, shorten it, or try a different angle?"`;
}

function promptFollowUp(ctx: string, entityData: Record<string, any>): string {
  const name          = sanitizeForPrompt(entityData.name, 100);
  const contactTitle  = sanitizeForPrompt(entityData.title, 100);
  const company       = sanitizeForPrompt(entityData.companyName, 100);
  const email         = sanitizeForPrompt(entityData.email, 150);
  const linkedinUrl   = sanitizeForPrompt(entityData.linkedinUrl, 200);
  const notes         = sanitizeForPrompt(entityData.notes, 400);
  const outreachDate  = sanitizeForPrompt(entityData.lastOutreachDate, 30);

  return `You are helping write a follow-up to an unanswered outreach message. You know the sender's full career background.

${ctx}

CONTACT:
- Name: ${name}
- Title: ${contactTitle || "unknown"}
- Company: ${company || "unknown"}
${email ? `- Email: ${email}` : ""}
${linkedinUrl ? `- LinkedIn: ${linkedinUrl}` : ""}
${outreachDate ? `- Original outreach sent: ${outreachDate}` : ""}
${notes ? `- Notes: ${notes}` : ""}

Write the follow-up now. Rules:
- Never mention that they didn't reply — it's implied, never stated
- Add a NEW hook — a different angle, a specific observation, or a brief value-add not in the first message
- Much shorter than the original: under 60 words for LinkedIn DM, under 120 for email
- End with an easy out — giving them a graceful way to say not now actually increases response rates
- Sign with the sender's ACTUAL name from the profile above

Then ask: "LinkedIn DM or email? Want me to try a different angle or tone?"`;
}

function promptCoverLetter(ctx: string, entityData: Record<string, any>): string {
  const jobTitle = sanitizeForPrompt(entityData.jobTitle, 100);
  const company  = sanitizeForPrompt(entityData.companyName, 100);
  const notes    = sanitizeForPrompt(entityData.notes, 2000);
  const jobUrl   = sanitizeForPrompt(entityData.jobUrl, 200);
  const hasJD    = notes && notes.length > 100;

  return `You are a professional cover letter writer. You know the candidate's full background from their profile.

${ctx}

ROLE BEING APPLIED TO:
Job Title: ${jobTitle}
Company: ${company || "Not specified"}
${jobUrl ? `Job posting URL: ${jobUrl}` : ""}
${hasJD ? `\nJOB DESCRIPTION / ROLE NOTES (from the candidate's application notes):\n${notes}` : notes ? `Role notes (brief): ${notes}` : ""}

${hasJD
  ? `The job description is already available above. Write the cover letter now using it to tailor the content.`
  : `There is no detailed job description available. Ask the candidate to paste it, or if they don't have it, they can say "no JD" and you'll write a strong general version.`
}

When you write the letter (either now or after they provide the JD), use this EXACT FORMAT:

[Candidate's Full Name]
[Current Title from their profile]
[Today's date]

Hiring Team, ${company || "[Company Name]"}

[Opening paragraph — bold positioning statement. NEVER "I am writing to apply" or "I am excited to". Start with who they are and why it's directly relevant.]

[Second paragraph — 2-3 SPECIFIC achievements from their profile with real numbers. Directly connect each to what this role needs. No generic phrases: "passionate", "team player", "results-driven", "dynamic".]

[Third paragraph — why this company specifically, and a confident close. Not "I look forward to hearing from you". End with conviction.]

Sincerely,
[Candidate's Full Name]

After writing: "What would you like to change — the opening angle, which achievements I used, the tone, or the length?"`;
}

function promptRoleFit(ctx: string, entityData: Record<string, any>): string {
  const jobTitle = sanitizeForPrompt(entityData.jobTitle, 100);
  const company  = sanitizeForPrompt(entityData.companyName, 100);
  const notes    = sanitizeForPrompt(entityData.notes, 2000);
  const hasJD    = notes && notes.length > 100;

  return `You are a career coach giving an honest, specific assessment of a candidate's fit for a role — and how to position them for the best chance.

${ctx}

ROLE: ${jobTitle} at ${company || "the target company"}
${hasJD ? `\nJOB DESCRIPTION (from the candidate's application notes):\n${notes}` : notes ? `Brief role notes: ${notes}` : ""}

${hasJD
  ? `The job description is already available above. Run the full fit analysis now using it.`
  : `IMPORTANT: You cannot do a meaningful fit analysis without seeing the actual job requirements. Do NOT guess what the role needs.`
}

${hasJD ? "PRODUCE THE FULL FIT ANALYSIS NOW:" : "YOUR FIRST RESPONSE: Ask them to paste the JD. Be direct: 'I need the job description to give you an accurate fit analysis — paste it here. Without it I'd just be guessing.'"}

When you have the JD (either now or after they paste it), produce this analysis:

1. STRONG MATCHES — Requirements from the JD their background clearly covers. Name the specific achievement or company that proves each one.
2. REAL GAPS — What's missing or thin. Be honest. No false reassurance.
3. HOW TO POSITION — The specific angle to lead with in the application and interview. Which of their stories maps best to this JD.
4. ATS KEYWORDS — Key terms from the JD that appear (or can be reflected) in their background. Include these in CV and cover letter.
5. HANDLE PROACTIVELY — The 1-2 things that could raise a concern, and the honest best way to address them.

End with: "Want me to help reframe your CV summary or draft a cover letter using this positioning?"

Be specific. Use their actual background. Don't generalise.`;
}

function promptInterviewPrep(ctx: string, entityData: Record<string, any>): string {
  const jobTitle = sanitizeForPrompt(entityData.jobTitle, 100);
  const company  = sanitizeForPrompt(entityData.companyName, 100);
  const notes    = sanitizeForPrompt(entityData.notes, 200);

  return `You are a tough but encouraging interview coach running a live practice session. You know the candidate's full background from their profile. You ask ONE question at a time, wait for their answer, then coach them on it before moving on.

${ctx}

ROLE BEING INTERVIEWED FOR:
Title: ${jobTitle}
Company: ${company || "the target company"}
${notes ? `Context: ${notes}` : ""}

HOW TO RUN THE SESSION:
1. First, ask: "What stage is this — first call, hiring manager round, panel, or final? That'll shape the questions." Then ask which type they want to focus on: behavioural, strategic/leadership, or technical/functional.

2. Once they answer: ask ONE interview question. Make it realistic for the seniority and company. Label it clearly (e.g. "QUESTION 1 — Behavioural").

3. After they give their answer, coach them specifically:
   - WHAT WORKED: What was strong — be specific, name the exact thing
   - SHARPEN: What to cut, restructure, or be more concrete about
   - MISSING: Any specific achievement, number, or story from their profile that would have made this answer stronger — name it explicitly
   - EXAMPLE UPGRADE: Show them the ONE sentence that would transform their answer (don't rewrite the whole thing, just the key upgrade)

4. Then ask: "Ready for the next one, or want to try that one again?"

5. Keep going until they say stop or you've done 5 questions. At the end, give a 3-line summary: what's landing well, one pattern to fix, their strongest story to lead with.

TONE: Direct coach, not an evaluator. Like a trusted colleague who's been through these interviews themselves. Short sentences. Call out what's weak — don't sugarcoat. But always end with what's strong.

NEVER dump multiple questions at once. ONE question, then wait.`;
}

function promptThankYou(ctx: string, entityData: Record<string, any>): string {
  const jobTitle = sanitizeForPrompt(entityData.jobTitle, 100);
  const company  = sanitizeForPrompt(entityData.companyName, 100);

  return `You are helping write a post-interview thank you note. You know the candidate's full background.

${ctx}

ROLE: ${jobTitle} at ${company || "target company"}

YOUR FLOW:
Step 1 — Ask two quick questions (nothing else):
  "Two quick things:
  1. Who did you interview with — name and their role?
  2. What's one thing that stood out from the conversation — a topic, a moment, or something they said?"

Step 2 — Generate a thank you note that:
  - Opens by referencing the specific moment they mentioned — not a generic "thank you for your time"
  - Reaffirms their fit for the role using one specific piece of their background
  - Keeps it under 120 words — this is not a second cover letter
  - Ends with genuine interest, not desperation

Step 3 — Ask: "Email or LinkedIn message? Want me to adjust anything?"

Do NOT generate the note until they answer the two questions.`;
}

function promptNegotiate(ctx: string, entityData: Record<string, any>): string {
  const jobTitle    = sanitizeForPrompt(entityData.jobTitle, 100);
  const company     = sanitizeForPrompt(entityData.companyName, 100);
  const salaryMin   = entityData.salaryMin;
  const salaryMax   = entityData.salaryMax;
  const currency    = sanitizeForPrompt(entityData.salaryCurrency, 10) || "USD";
  const hasSalary   = salaryMin || salaryMax;

  return `You are a salary negotiation coach helping a senior professional respond to a job offer. You know their full background.

${ctx}

ROLE: ${jobTitle} at ${company || "target company"}
${hasSalary ? `Target salary range logged in CRM: ${currency} ${salaryMin ? salaryMin.toLocaleString() : "?"} – ${salaryMax ? salaryMax.toLocaleString() : "?"}` : ""}

YOUR FLOW:
Step 1 — Ask for the actual offer details${hasSalary ? " (you already have their target range from the CRM)" : ""}:
  "To build your negotiation strategy, share:
  1. Base salary offered (the actual number)
  2. Bonus / equity / any other comp?
  3. Your target number${hasSalary ? ` (I can see your range is ${currency} ${salaryMin ? salaryMin.toLocaleString() : "?"}–${salaryMax ? salaryMax.toLocaleString() : "?"} — confirm or update)` : ""}
  4. Walk-away number (private — just so I know your real floor)
  5. Non-salary things that matter — title, remote days, start date, review timeline?"

Step 2 — Once they share, generate:
  STRATEGY: Counter, accept, or ask for time — and why
  COUNTER SCRIPT: Exact wording to use — confident, non-apologetic, relationship intact
  LEVERAGE POINTS: Specific things in their background that justify the ask (use real achievements)
  TRADEOFFS: If salary is fixed, what else to push for — bonus structure, equity cliff, remote days, 90-day review
  WHAT NOT TO SAY: The 2-3 phrases that weaken their position

Step 3 — Offer to roleplay: "Want to practice the conversation? I'll play the recruiter."

Be direct. Negotiation at this level is normal and expected. Treat it that way.`;
}

// ==================== OPENING INSTRUCTIONS ====================

function getOpeningInstruction(actionType: AgentActionType, entityData: Record<string, any>): string {
  const hasJD     = entityData.notes && String(entityData.notes).length > 100;
  const hasSalary = entityData.salaryMin || entityData.salaryMax;
  switch (actionType) {
    case "research":
      return "Generate the company fit analysis now. Structure it clearly with the five labelled sections.";
    case "outreach":
      return "Ask your two questions now. Do not write any draft — just the two questions, nothing else.";
    case "follow-up":
      return "Write the follow-up message now.";
    case "cover-letter":
      return hasJD
        ? "The job description is available in the system context. Write the cover letter now using the format specified."
        : "Ask the candidate to paste the job description. Do not write any letter yet.";
    case "role-fit":
      return hasJD
        ? "The job description is available in the system context. Run the full fit analysis now."
        : "Ask the candidate to paste the job description. Explain you can't do an accurate analysis without it.";
    case "interview-prep":
      return "Ask the two setup questions (interview stage and type) now. Do not ask any practice questions yet.";
    case "thank-you":
      return "Ask your two setup questions now. Do not write any note yet — just the two questions.";
    case "negotiate":
      return hasSalary
        ? "Ask for the offer details now. Reference their target salary range from the CRM context. Do not suggest any counter yet."
        : "Ask for the five offer details now. Do not suggest any counter yet.";
    default:
      return "Start the session now.";
  }
}

// ==================== PUBLIC API ====================

function buildSystemPrompt(
  actionType: AgentActionType,
  profileContext: string,
  entityData: Record<string, any>,
  entityType: AgentEntityType
): string {
  switch (actionType) {
    case "research":       return promptResearch(profileContext, entityData);
    case "outreach":       return promptOutreach(profileContext, entityData);
    case "follow-up":      return promptFollowUp(profileContext, entityData);
    case "cover-letter":   return promptCoverLetter(profileContext, entityData);
    case "role-fit":       return promptRoleFit(profileContext, entityData);
    case "interview-prep": return promptInterviewPrep(profileContext, entityData);
    case "thank-you":      return promptThankYou(profileContext, entityData);
    case "negotiate":      return promptNegotiate(profileContext, entityData);
    default:               return promptResearch(profileContext, entityData);
  }
}

export async function startAgentSession(
  customerId: string,
  actionType: AgentActionType,
  entityType: AgentEntityType,
  entityData: Record<string, any>
): Promise<{ sessionId: string; message: string }> {

  const profileContext = await buildProfileContext(customerId);
  const systemPrompt   = buildSystemPrompt(actionType, profileContext, entityData, entityType);
  const opening        = getOpeningInstruction(actionType, entityData);

  logger.info("[JobAgent] Starting session", { customerId, actionType, entityType });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: { systemInstruction: systemPrompt },
    contents: [{ role: "user", parts: [{ text: opening }] }],
  });

  const message = response.text || "Ready to help — could you share a bit more context?";

  const sessionId = `job-agent-${customerId}-${Date.now()}`;
  agentSessions.set(sessionId, {
    customerId,
    actionType,
    entityType,
    entityData,
    systemPrompt,
    messages: [
      { role: "user",  parts: [{ text: opening }] },
      { role: "model", parts: [{ text: message }] },
    ],
  });

  return { sessionId, message };
}

export async function sendAgentMessage(
  sessionId: string,
  customerId: string,
  userMessage: string
): Promise<string> {
  const session = agentSessions.get(sessionId);
  if (!session) throw new Error("No active agent session");
  if (session.customerId !== customerId) throw new Error("Session ownership mismatch");

  const sanitized = sanitizeForPrompt(userMessage, 2000);
  const updated = [
    ...session.messages,
    { role: "user" as const, parts: [{ text: sanitized }] },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: { systemInstruction: session.systemPrompt },
    contents: updated,
  });

  const reply = response.text || "Could you rephrase that?";
  session.messages = [...updated, { role: "model", parts: [{ text: reply }] }];

  return reply;
}
