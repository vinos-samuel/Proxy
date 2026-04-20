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

// ==================== SESSION STORE ====================

export type AgentActionType = "outreach" | "interview-prep" | "cover-letter";
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

// ==================== PROFILE CONTEXT BUILDER ====================

async function buildProfileContext(customerId: string): Promise<string> {
  const profile = await storage.getProfileByCustomerId(customerId);
  if (!profile) return "No Twin profile found for this user.";

  const qd = profile.questionnaireData as any;
  const name      = sanitizeForPrompt(qd?.step1?.fullName || profile.displayName, 100);
  const title     = sanitizeForPrompt(qd?.step1?.currentTitle || profile.roleTitle, 100);
  const summary   = sanitizeForPrompt(qd?.step2?.professionalSummary || profile.positioning, 600);
  const skills    = sanitizeForPrompt(qd?.step6?.technicalSkills, 300);
  const achievements = sanitizeForPrompt(qd?.step5?.achievements, 500);
  const tone      = sanitizeForPrompt(profile.tone, 30) || "direct";
  const wordsUsed = sanitizeForPrompt(qd?.step7?.wordsUsedOften, 100);
  const wordsAvoided = sanitizeForPrompt(qd?.step7?.wordsAvoided, 100);

  const careerHistory = (qd?.step2?.careerHistory || [])
    .map((r: any) => `${sanitizeForPrompt(r.title, 80)} at ${sanitizeForPrompt(r.company, 80)} (${sanitizeForPrompt(r.years, 20)})`)
    .join(", ");

  const stories = (qd?.step4?.stories || [])
    .slice(0, 4)
    .map((s: any, i: number) =>
      `Story ${i + 1}: ${sanitizeForPrompt(s.title, 80)}\n  Challenge: ${sanitizeForPrompt(s.challenge, 200)}\n  Result: ${sanitizeForPrompt(s.result, 200)}`
    )
    .join("\n");

  const objections = (qd?.step9?.objections || [])
    .slice(0, 2)
    .map((o: any) => `Objection: ${sanitizeForPrompt(o.objection, 100)} → ${sanitizeForPrompt(o.response, 200)}`)
    .join("\n");

  return `
PROFESSIONAL PROFILE:
Name: ${name}
Current Title: ${title}
Communication Tone: ${tone}
${wordsUsed ? `Words used often: ${wordsUsed}` : ""}
${wordsAvoided ? `Words avoided: ${wordsAvoided}` : ""}

CAREER PATH: ${careerHistory || "Not provided"}

PROFESSIONAL SUMMARY:
${summary || "Not provided"}

KEY ACHIEVEMENTS:
${achievements || "Not provided"}

SKILLS: ${skills || "Not provided"}

CAREER STORIES (use these for interview answers and outreach credibility):
${stories || "Not provided"}

${objections ? `HOW THEY HANDLE OBJECTIONS:\n${objections}` : ""}
`.trim();
}

// ==================== SYSTEM PROMPT BUILDERS ====================

function buildOutreachSystemPrompt(
  profileContext: string,
  entityData: Record<string, any>,
  entityType: AgentEntityType
): string {
  const targetName    = sanitizeForPrompt(entityData.name, 100);
  const targetTitle   = sanitizeForPrompt(entityData.title, 100);
  const companyName   = sanitizeForPrompt(entityData.companyName || entityData.name, 100);
  const notes         = sanitizeForPrompt(entityData.notes, 300);
  const industry      = sanitizeForPrompt(entityData.industry, 100);

  const targetSection = entityType === "contact"
    ? `Target Person: ${targetName}${targetTitle ? `, ${targetTitle}` : ""}${companyName ? ` at ${companyName}` : ""}`
    : `Target Company: ${companyName}${industry ? ` (${industry})` : ""}`;

  return `You are a personal career assistant helping the user craft an outreach message. You know their professional background in detail.

${profileContext}

OUTREACH TARGET:
${targetSection}
${notes ? `What the user knows: ${notes}` : ""}

YOUR JOB:
- Write a short, genuine first-touch message (LinkedIn DM or email — they can tell you which)
- Make it feel like a real person wrote it — not a template, not salesy
- Reference something specific and relevant if possible (their industry, company focus, or a shared context from the notes)
- Connect to one relevant part of the user's background without overselling
- LinkedIn: under 100 words. Email: under 200 words
- After the draft, ask ONE question to refine: angle, goal, or format preference

Output the draft first. Then ask. No preamble, no "here is a draft" — just write it.`;
}

function buildInterviewPrepSystemPrompt(
  profileContext: string,
  entityData: Record<string, any>
): string {
  const jobTitle    = sanitizeForPrompt(entityData.jobTitle || entityData.name, 100);
  const companyName = sanitizeForPrompt(entityData.companyName || entityData.name, 100);
  const notes       = sanitizeForPrompt(entityData.notes, 300);
  const status      = sanitizeForPrompt(entityData.status, 50);

  return `You are a personal interview coach. You know the user's full professional background and are prepping them for a specific role.

${profileContext}

INTERVIEW CONTEXT:
Role: ${jobTitle}
Company: ${companyName}
${status ? `Application stage: ${status}` : ""}
${notes ? `Role notes: ${notes}` : ""}

YOUR JOB:
1. Generate 5 likely interview questions for this role — mix of behavioural (tell me about a time...), situational, and role-specific
2. For each, provide a 2-3 sentence answer angle that uses the user's ACTUAL stories and achievements from their profile above
3. After presenting all 5, ask: "Which one do you want to practice answering?"
4. When they respond with an answer, give sharp, specific feedback. Suggest how to strengthen it using their real examples.
5. Keep the tone conversational and encouraging — this is a prep session, not an evaluation

Start by listing the 5 questions with answer angles. Then ask which to practice first.`;
}

function buildCoverLetterSystemPrompt(
  profileContext: string,
  entityData: Record<string, any>
): string {
  const jobTitle    = sanitizeForPrompt(entityData.jobTitle || entityData.name, 100);
  const companyName = sanitizeForPrompt(entityData.companyName || entityData.name, 100);
  const notes       = sanitizeForPrompt(entityData.notes, 300);
  const jobUrl      = sanitizeForPrompt(entityData.jobUrl, 200);

  return `You are a professional cover letter writer. You know the user's full background and are writing for a specific role.

${profileContext}

ROLE:
Job Title: ${jobTitle}
Company: ${companyName}
${notes ? `What the user knows about this role: ${notes}` : ""}
${jobUrl ? `Job posting: ${jobUrl}` : ""}

YOUR JOB:
Write a tailored, compelling cover letter. Non-negotiable rules:
- Open with a specific hook — NEVER "I am writing to apply for..." or "I am excited to..." Start mid-action or with a bold positioning statement
- Use the user's ACTUAL achievements with numbers from their profile
- Match their communication style (tone: ${profileContext.includes("warm") ? "warm, conversational" : "direct, confident"})
- Under 350 words. Three short paragraphs max.
- No generic phrases: no "passionate about", "team player", "results-driven", "dynamic"
- End with a confident, specific close — not "I look forward to hearing from you"

Output the full cover letter first. Then ask: "What do you want to change — the opening, the achievements, the tone, or the length?"`;
}

// ==================== PUBLIC API ====================

export async function startAgentSession(
  customerId: string,
  actionType: AgentActionType,
  entityType: AgentEntityType,
  entityData: Record<string, any>
): Promise<{ sessionId: string; message: string }> {

  const profileContext = await buildProfileContext(customerId);

  let systemPrompt: string;
  let openingInstruction: string;

  if (actionType === "outreach") {
    systemPrompt = buildOutreachSystemPrompt(profileContext, entityData, entityType);
    openingInstruction = "Write the outreach message draft now. Then ask one question to refine it.";
  } else if (actionType === "interview-prep") {
    systemPrompt = buildInterviewPrepSystemPrompt(profileContext, entityData);
    openingInstruction = "Generate the 5 interview questions with answer angles now.";
  } else {
    systemPrompt = buildCoverLetterSystemPrompt(profileContext, entityData);
    openingInstruction = "Write the cover letter now.";
  }

  logger.info("[JobAgent] Starting session", { customerId, actionType, entityType });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: openingInstruction }] }],
    config: { systemInstruction: systemPrompt },
  });

  const message = response.text || "Ready to help. Could you share a bit more context?";

  const sessionId = `job-agent-${customerId}-${Date.now()}`;
  agentSessions.set(sessionId, {
    customerId,
    actionType,
    entityType,
    entityData,
    systemPrompt,
    messages: [
      { role: "user",  parts: [{ text: openingInstruction }] },
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

  const sanitized = sanitizeForPrompt(userMessage, 1000);

  const updatedMessages = [
    ...session.messages,
    { role: "user" as const, parts: [{ text: sanitized }] },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: updatedMessages,
    config: { systemInstruction: session.systemPrompt },
  });

  const reply = response.text || "Could you rephrase that?";

  session.messages = [
    ...updatedMessages,
    { role: "model", parts: [{ text: reply }] },
  ];

  logger.info("[JobAgent] Message processed", { sessionId, customerId });

  return reply;
}
