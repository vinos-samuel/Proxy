import { GoogleGenAI } from "@google/genai";
import type { KnowledgeEntry, FactBank, TwinProfile } from "@shared/schema";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

// ==================== SESSION STORE ====================

interface InterviewSession {
  profileId: string;
  displayName: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  gaps: string[];
  readyToComplete: boolean;
}

const interviewSessions = new Map<string, InterviewSession>();

// ==================== GAP DIAGNOSIS ====================

function diagnoseGaps(
  knowledgeEntries: KnowledgeEntry[],
  factBanks: FactBank[],
  profile: TwinProfile
): string[] {
  const gaps: string[] = [];

  // War stories (type "experience" in this codebase)
  const warStories = knowledgeEntries.filter((e) => e.type === "experience");
  if (warStories.length < 3) {
    gaps.push(
      `Only ${warStories.length} career story/stories documented. Need at least 3 strong examples with specific challenges and outcomes.`
    );
  }

  // Stories missing numbers in the result field
  const storiesWithoutNumbers = warStories.filter((e) => {
    const resultText = e.result || e.content || "";
    return !/\d/.test(resultText);
  });
  if (storiesWithoutNumbers.length > 0) {
    const titles = storiesWithoutNumbers
      .slice(0, 2)
      .map((s) => `"${s.title}"`)
      .join(", ");
    gaps.push(
      `${storiesWithoutNumbers.length} story/stories lack measurable outcomes or specific numbers: ${titles}. Need quantified results.`
    );
  }

  // Thin fact banks (companies with fewer than 3 facts)
  const thinFactBanks = factBanks.filter((fb) => fb.facts.length < 3);
  if (thinFactBanks.length > 0) {
    const companies = thinFactBanks.map((fb) => fb.companyName).join(", ");
    gaps.push(
      `Thin coverage for: ${companies}. Need more specific facts about scope, impact, and contributions at these companies.`
    );
  }

  // Short or missing professional positioning
  if (!profile.positioning || profile.positioning.length < 80) {
    gaps.push(
      "Professional positioning is vague. Need a clear, specific statement of unique value and the type of problems this person solves best."
    );
  }

  // Achievements entry
  const achievements = knowledgeEntries.find(
    (e) => e.entryId === "key-achievements"
  );
  if (!achievements || !achievements.content || achievements.content.length < 100) {
    gaps.push(
      "Key achievements are thin or missing. Need 3-5 specific, quantified career wins that would impress a hiring manager."
    );
  }

  // If no significant gaps, still enrich
  if (gaps.length === 0) {
    gaps.push(
      "Profile looks solid. Let's go deeper on the most impressive career stories to make them even more compelling to hiring managers and recruiters."
    );
  }

  return gaps;
}

// ==================== PROMPTS ====================

function buildInterviewSystemPrompt(displayName: string, gaps: string[]): string {
  return `You are an expert career interviewer conducting a profile deepening session for ${displayName}'s Digital Twin on Proxy.

YOUR MISSION: Extract specific, quantified, authentic career stories and achievements. Everything you capture will power ${displayName}'s AI portfolio and be presented to hiring managers and recruiters — so accuracy and specificity are critical.

PROFILE GAPS TO ADDRESS (work through these in priority order):
${gaps.map((g, i) => `${i + 1}. ${g}`).join("\n")}

INTERVIEW RULES:
1. Ask ONE question at a time. Never stack multiple questions in one message.
2. Start with a brief, warm intro (2 sentences max) then immediately ask your first question.
3. Always probe for SPECIFICS when you get a vague answer. Use follow-ups like:
   - "Can you give me a specific number for that outcome?"
   - "What did that look like in practice — what exactly did you do?"
   - "Who else was involved, and what was your specific role vs theirs?"
   - "What was the core challenge you were solving?"
   - "What would have happened if you hadn't done that?"
4. When you receive a strong answer (situation + specific action + measurable outcome), acknowledge briefly: "Got it — noted." Then move to the next gap.
5. After addressing all gaps (or after 8 exchanges max), briefly summarise: "Here's what I've captured: [2-3 bullet summary]" then ask: "Is there anything important I missed that you'd want hiring managers to know?"
6. When fully done, end your final message with EXACTLY: "Great — I'll update your Twin now." (This phrase triggers the profile update.)
7. If the user struggles or seems unsure, encourage them: "Take your time — even a rough answer gives me something to work with."

TONE: Professional, warm, and curious. Like a trusted senior recruiter who genuinely wants to help this person tell their story well.`;
}

function buildExtractionPrompt(transcript: string, displayName: string): string {
  return `You are extracting structured career profile data from an interview transcript for ${displayName}'s Digital Twin.

TRANSCRIPT:
${transcript}

Extract all useful profile data. Return ONLY valid JSON in this exact format — no explanation, no markdown, just the JSON object:
{
  "warStories": [
    {
      "title": "Brief story title (5-8 words)",
      "challenge": "What problem or situation existed",
      "approach": "What this person specifically did",
      "result": "The outcome — include numbers if mentioned",
      "scale": "Size/scope context: company size, team, budget, timeframe if mentioned"
    }
  ],
  "achievements": [
    {
      "title": "Achievement title",
      "content": "Description with specific metric or outcome"
    }
  ],
  "additionalFacts": [
    {
      "companyName": "Exact company name as mentioned",
      "fact": "One specific fact about what they did or achieved there"
    }
  ],
  "positioningInsights": "Any strong statements about unique value, expertise, or how they describe themselves"
}

Rules:
- Only include information actually stated in the transcript — do not invent or infer
- Preserve specific numbers, percentages, and timeframes exactly as stated
- Each war story must have at minimum a title and challenge to be included
- Each additional fact must reference a company name mentioned in the transcript
- If a section has no data, use an empty array
- positioningInsights can be null if nothing relevant was said`;
}

// ==================== PUBLIC API ====================

export function getInterviewSession(customerId: string): InterviewSession | undefined {
  return interviewSessions.get(customerId);
}

export function clearInterviewSession(customerId: string): void {
  interviewSessions.delete(customerId);
}

export async function startInterview(
  customerId: string,
  profileId: string,
  displayName: string,
  knowledgeEntries: KnowledgeEntry[],
  factBanks: FactBank[],
  profile: TwinProfile
): Promise<string> {
  const gaps = diagnoseGaps(knowledgeEntries, factBanks, profile);
  const systemPrompt = buildInterviewSystemPrompt(displayName, gaps);

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: { systemInstruction: systemPrompt },
    contents: [{ role: "user", parts: [{ text: "Please start the interview." }] }],
  });

  const botMessage = result.text || "Hi! Let's get started. Tell me about your most impactful project.";

  interviewSessions.set(customerId, {
    profileId,
    displayName,
    messages: [
      { role: "user", content: "Please start the interview." },
      { role: "assistant", content: botMessage },
    ],
    gaps,
    readyToComplete: false,
  });

  return botMessage;
}

export async function sendInterviewMessage(
  customerId: string,
  userMessage: string
): Promise<{ botResponse: string; readyToComplete: boolean }> {
  const session = interviewSessions.get(customerId);
  if (!session) {
    throw new Error("No active interview session");
  }

  session.messages.push({ role: "user", content: userMessage });

  const systemPrompt = buildInterviewSystemPrompt(session.displayName, session.gaps);

  const geminiMessages = session.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: { systemInstruction: systemPrompt },
    contents: geminiMessages,
  });

  const botResponse = result.text || "Could you tell me more about that?";

  session.messages.push({ role: "assistant", content: botResponse });

  const readyToComplete = botResponse.includes("I'll update your Twin now");
  session.readyToComplete = readyToComplete;

  return { botResponse, readyToComplete };
}

export async function extractAndComplete(customerId: string): Promise<{
  profileId: string;
  extracted: {
    warStories: Array<{ title: string; challenge: string; approach: string; result: string; scale: string }>;
    achievements: Array<{ title: string; content: string }>;
    additionalFacts: Array<{ companyName: string; fact: string }>;
    positioningInsights: string | null;
  };
}> {
  const session = interviewSessions.get(customerId);
  if (!session) {
    throw new Error("No active interview session");
  }

  const transcript = session.messages
    .map((m) => `${m.role === "user" ? "CANDIDATE" : "INTERVIEWER"}: ${m.content}`)
    .join("\n\n");

  const extractionPrompt = buildExtractionPrompt(transcript, session.displayName);

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: extractionPrompt }] }],
  });

  const rawText = result.text || "{}";

  let extracted = {
    warStories: [] as any[],
    achievements: [] as any[],
    additionalFacts: [] as any[],
    positioningInsights: null as string | null,
  };

  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      extracted = {
        warStories: Array.isArray(parsed.warStories) ? parsed.warStories : [],
        achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
        additionalFacts: Array.isArray(parsed.additionalFacts) ? parsed.additionalFacts : [],
        positioningInsights: parsed.positioningInsights || null,
      };
    }
  } catch {
    // If JSON parse fails, return empty extracted — don't crash
  }

  return { profileId: session.profileId, extracted };
}
