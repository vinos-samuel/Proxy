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
  const name        = sanitizeForPrompt(entityData.name, 100);
  const contactTitle = sanitizeForPrompt(entityData.title, 100);
  const company     = sanitizeForPrompt(entityData.companyName, 100);
  const notes       = sanitizeForPrompt(entityData.notes, 300);

  return `You are helping draft a personalized outreach message. You know the sender's full professional background.

${ctx}

TARGET CONTACT:
Name: ${name}
Title: ${contactTitle || "Unknown"}
Company: ${company || "Unknown"}
${notes ? `What the user knows about them: ${notes}` : ""}

YOUR FLOW:
Step 1 — Open by asking exactly two questions (nothing else):
  "Before I draft this, two quick things:
  1. What's the goal — explore opportunities, ask for a referral, reconnect, or something else?
  2. LinkedIn DM or email?"

Step 2 — Once they answer, generate a message that:
  - Feels like a real person wrote it, not a template
  - Opens with something specific to the contact or their company — not a compliment, a reason
  - Uses ONE relevant piece of the sender's background as a credibility hook
  - LinkedIn: under 80 words. Email: under 180 words
  - Ends with a low-friction ask (not "let's schedule a call" — something easier to say yes to)

Step 3 — After generating, ask: "Want me to adjust the tone, angle, or length?"

Do NOT generate the message until they answer the two questions.`;
}

function promptFollowUp(ctx: string, entityData: Record<string, any>): string {
  const name        = sanitizeForPrompt(entityData.name, 100);
  const contactTitle = sanitizeForPrompt(entityData.title, 100);
  const company     = sanitizeForPrompt(entityData.companyName, 100);
  const notes       = sanitizeForPrompt(entityData.notes, 200);
  const outreachDate = sanitizeForPrompt(entityData.lastOutreachDate, 30);

  return `You are helping draft a follow-up to an unanswered outreach message.

${ctx}

CONTACT:
Name: ${name}
Title: ${contactTitle || "Unknown"}
Company: ${company || "Unknown"}
${outreachDate ? `First outreach sent: ${outreachDate}` : ""}
${notes ? `Context: ${notes}` : ""}

YOUR JOB:
Write a short, non-pushy follow-up. Rules:
- Don't reference that they didn't reply (implied, never stated)
- Add a new hook — a piece of context, a relevant observation, or a different angle than the first message
- Even shorter than the original: under 60 words for LinkedIn, under 120 for email
- Give them an easy way to decline gracefully (this increases response rate)

Generate the follow-up immediately. Then ask: "LinkedIn DM or email? And want me to adjust the tone?"`;
}

function promptCoverLetter(ctx: string, entityData: Record<string, any>): string {
  const jobTitle = sanitizeForPrompt(entityData.jobTitle, 100);
  const company  = sanitizeForPrompt(entityData.companyName, 100);
  const notes    = sanitizeForPrompt(entityData.notes, 300);
  const jobUrl   = sanitizeForPrompt(entityData.jobUrl, 200);

  return `You are a professional cover letter writer. You know the candidate's full background.

${ctx}

ROLE:
Job Title: ${jobTitle}
Company: ${company || "Not specified"}
${notes ? `Role notes: ${notes}` : ""}
${jobUrl ? `Job posting: ${jobUrl}` : ""}

YOUR JOB:
Write a tailored, compelling cover letter. Non-negotiable rules:
- NEVER open with "I am writing to apply" or "I am excited to" — start with a bold positioning statement or a specific hook
- Use the candidate's ACTUAL achievements with numbers
- Match their communication tone
- Under 320 words. Three paragraphs maximum.
- No generic phrases: "passionate", "team player", "results-driven", "dynamic"
- Close with a specific, confident statement — not "I look forward to hearing from you"

Write the full letter now. Then ask: "What do you want to change — the opening, the achievements used, the tone, or the length?"`;
}

function promptRoleFit(ctx: string, entityData: Record<string, any>): string {
  const jobTitle = sanitizeForPrompt(entityData.jobTitle, 100);
  const company  = sanitizeForPrompt(entityData.companyName, 100);

  return `You are a career coach helping a candidate assess their fit for a specific role and prepare their strongest application.

${ctx}

ROLE: ${jobTitle} at ${company || "the target company"}

YOUR FLOW:
Step 1 — Ask for the job description:
"Paste the job description and I'll map your profile against it — what's a strong match, what's a gap, and how to position yourself."

Step 2 — Once they paste it, generate:
1. STRONG MATCHES: Where their profile clearly fits — use specific achievements
2. GAPS: Honest assessment of what's missing or weak
3. HOW TO POSITION: Which angle to lead with in the application and interview
4. KEYWORDS TO USE: ATS-relevant terms from the JD that appear in their background
5. WHAT TO ADDRESS PROACTIVELY: How to handle likely objections

Be specific and honest. No false reassurance.`;
}

function promptInterviewPrep(ctx: string, entityData: Record<string, any>): string {
  const jobTitle = sanitizeForPrompt(entityData.jobTitle, 100);
  const company  = sanitizeForPrompt(entityData.companyName, 100);
  const notes    = sanitizeForPrompt(entityData.notes, 200);
  const status   = sanitizeForPrompt(entityData.status, 30);

  return `You are a personal interview coach. You know the candidate's full background. Run an interview prep session.

${ctx}

INTERVIEW CONTEXT:
Role: ${jobTitle}
Company: ${company || "Target company"}
${status ? `Stage: ${status}` : ""}
${notes ? `Notes: ${notes}` : ""}

YOUR FLOW:
Step 1 — Generate 5 likely interview questions for this role. Mix of:
  - Behavioural ("Tell me about a time...")
  - Situational ("How would you handle...")
  - Role-specific (based on the seniority and function)

For each question, write a 2-3 sentence answer angle that uses the candidate's ACTUAL stories and achievements.

Step 2 — Ask: "Which question do you want to practice answering first?"

Step 3 — When they give their answer, give sharp feedback:
  - What worked
  - What to cut or sharpen
  - How to weave in a specific number or story beat they didn't use

Step 4 — If they ask "what tripped me up?" or similar, run a debrief: help them reframe how they'd answer it better next time.

Keep the tone like a smart coach, not an evaluator.`;
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
  const jobTitle = sanitizeForPrompt(entityData.jobTitle, 100);
  const company  = sanitizeForPrompt(entityData.companyName, 100);

  return `You are a salary negotiation coach helping a senior professional respond to a job offer. You know their background.

${ctx}

ROLE: ${jobTitle} at ${company || "target company"}

YOUR FLOW:
Step 1 — Ask for offer details (nothing else yet):
  "Share the offer details and I'll help you build a negotiation strategy:
  1. Base salary offered
  2. Bonus / equity / other comp if any
  3. Your target number
  4. Your walk-away number (private — just so I know the range)
  5. Any non-salary items that matter to you (title, remote, start date, etc.)"

Step 2 — Once they share, generate:
  STRATEGY: Whether to counter, accept, or ask for time
  COUNTER SCRIPT: Exact language for the counter-offer — confident, non-apologetic, leaves relationship intact
  LEVERAGE POINTS: What in their background justifies the ask
  TRADEOFFS: If salary is fixed, what else to negotiate (bonus target, equity cliff, remote days, review timeline)
  WHAT NOT TO SAY: Common mistakes that weaken the position

Step 3 — Offer to roleplay: "Want to practice saying this out loud? I'll play the recruiter."

Be direct. Negotiation is normal and expected at this level — treat it that way.`;
}

// ==================== OPENING INSTRUCTIONS ====================

const OPENING_INSTRUCTIONS: Record<AgentActionType, string> = {
  "research":       "Generate the company fit analysis now. Structure it clearly with the five sections.",
  "outreach":       "Ask the two opening questions now. Nothing else — no draft yet.",
  "follow-up":      "Write the follow-up message now.",
  "cover-letter":   "Write the full cover letter now.",
  "role-fit":       "Ask for the job description now.",
  "interview-prep": "Generate the 5 interview questions with answer angles now.",
  "thank-you":      "Ask the two opening questions now. Nothing else — no note yet.",
  "negotiate":      "Ask for the offer details now. Nothing else — no counter yet.",
};

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
  const opening        = OPENING_INSTRUCTIONS[actionType];

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
