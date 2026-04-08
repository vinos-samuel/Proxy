import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

// ==================== SESSION STORE ====================

interface OnboardingSession {
  customerId: string;
  draft: any; // questionnaire draft from CV parse
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  coveredAreas: Set<string>;
  transcript: string;
}

const onboardingSessions = new Map<string, OnboardingSession>();

// ==================== COVERAGE AREAS ====================

const COVERAGE_AREAS = [
  "career_stories",      // specific high-stakes situations they handled
  "working_style",       // how they actually operate day-to-day
  "unique_value",        // what makes them genuinely different
  "personality_voice",   // how they want to come across
  "skills_depth",        // beyond the list — what they're really expert at
  "career_direction",    // where they're headed / what they want next
];

// ==================== PROMPT BUILDERS ====================

function buildSystemPrompt(draft: any): string {
  // Summarise what we already know from the CV so the bot doesn't repeat it
  const name = draft?.step1?.fullName || "them";
  const title = draft?.step1?.currentTitle || "";
  const summary = draft?.step2?.professionalSummary || "";
  const careerHistory = draft?.step2?.careerHistory || [];
  const existingStories = draft?.step4?.stories || [];
  const skills = draft?.step6?.technicalSkills || "";

  const careerSummary = careerHistory.length > 0
    ? careerHistory.map((r: any) => `${r.title} at ${r.company} (${r.years})`).join(", ")
    : "not yet captured";

  const storiesNote = existingStories.length > 0
    ? `The CV gave us ${existingStories.length} career stories but they need more depth — specific context, what was at stake, what they actually did, real outcomes with numbers.`
    : "We don't have any detailed career stories yet — this is a key gap to explore.";

  return `You are helping ${name} build their Digital Twin on Proxy — an AI-powered career profile that represents them to hiring managers, recruiters and professional contacts.

You've already read their CV. Here's what you know:
- Current role: ${title}
- Career path: ${careerSummary}
- Summary: ${summary || "not yet captured"}
- Skills: ${skills || "not yet captured"}
- ${storiesNote}

YOUR ROLE:
You're like a smart, curious friend who genuinely wants to help them tell their career story well. Not a recruiter. Not a formal interviewer. Someone who finds their work interesting and wants to understand it properly.

HOW TO HAVE THIS CONVERSATION:
1. Start with something specific from their CV that's interesting or unclear — not a generic opener.
2. Ask ONE question at a time. Let them talk. Don't rush.
3. When they say something interesting, go deeper: "What was actually going on there?", "How did that play out?", "What would have happened if you hadn't done that?"
4. When something is vague, gently probe: "Can you give me a sense of the scale of that?" or "What did that look like day to day?"
5. Don't ask about things that are already clear from the CV — only explore where the picture is thin or missing.
6. Cover these areas naturally through conversation (don't make it feel like a checklist):
   - The career stories behind their biggest moments (with real context, stakes, actions, outcomes)
   - How they actually work — their approach, what they're known for, how they handle hard situations
   - What makes them genuinely different from other people in similar roles
   - How they want to come across — tone, style, what matters to them professionally
   - Where they're headed and what kind of work they want to do next
7. Keep the tone warm and conversational. This is not a job interview. They don't need to "position" anything — just talk.
8. When you feel you have a good picture of who they are (usually after 10-20 exchanges), wrap up naturally: acknowledge what you've learned, ask if there's anything important they haven't mentioned, then end with EXACTLY this phrase: "I think I've got a really good picture of you now. Let me update your profile."

IMPORTANT:
- Never use corporate HR language ("leverage", "synergies", "key deliverables")
- Never ask them to "describe their achievements" or "outline their key competencies"
- If they seem unsure or self-deprecating, reassure them: the point is just to talk naturally, not to sell themselves
- You are building context for an AI — the more specific and real the better, even if it's messy`;
}

function buildExtractionPrompt(transcript: string, draft: any): string {
  const existingData = JSON.stringify(draft, null, 2);

  return `You are updating a career profile questionnaire based on a conversation transcript. The person has been talking naturally about their career — extract everything useful and map it to the questionnaire fields below.

EXISTING QUESTIONNAIRE DATA (already populated from CV):
${existingData}

CONVERSATION TRANSCRIPT:
${transcript}

Your job: enhance and enrich the existing data with everything discussed in the conversation. Don't replace good existing data — add to it, deepen it, make it more specific.

Return ONLY valid JSON matching this exact structure. Keep all existing fields. Only update fields where the conversation added meaningful new information:

{
  "step1": {
    "fullName": "string",
    "currentTitle": "string",
    "email": "string",
    "phone": "string",
    "linkedinUrl": "string",
    "location": "string"
  },
  "step2": {
    "professionalSummary": "string — updated if conversation revealed stronger positioning or clearer unique value",
    "careerHistory": [{ "company": "string", "title": "string", "years": "string", "achievements": "string — enriched with specifics from conversation" }]
  },
  "step3": { "resumeUrl": "string" },
  "step4": {
    "stories": [
      {
        "title": "string — short descriptive title",
        "challenge": "string — the situation and what was at stake",
        "approach": "string — what they specifically did",
        "result": "string — the outcome, ideally with numbers or concrete impact"
      }
    ]
  },
  "step5": { "achievements": "string — specific quantified wins from the conversation" },
  "step6": { "technicalSkills": "string — skills mentioned in conversation, merged with existing" },
  "step7": {
    "communicationStyle": "string — one of: direct, warm, technical, strategic",
    "brandingTheme": "string — one of: corporate, tech, creative",
    "wordsUsedOften": "string — phrases or words they used naturally in conversation",
    "wordsAvoided": "string — anything they pushed back on or seemed uncomfortable with"
  },
  "step8": {
    "questions": [{ "question": "string", "answer": "string" }]
  },
  "step9": {
    "objections": [{ "objection": "string", "response": "string" }]
  },
  "step10": {
    "resumeUrl": "string",
    "headshotUrl": "string",
    "videoUrl": "string",
    "cvUrl": "string"
  },
  "step11": {
    "chatbotName": "string",
    "chatbotWelcome": "string — a welcome message in their voice, based on how they talked",
    "fallbackResponse": "string"
  },
  "_aiDraft": true,
  "_conversationalOnboarding": true,
  "_aiDraftGeneratedAt": "${new Date().toISOString()}"
}

Rules:
- Preserve all existing data — only update where conversation added something new or better
- For step4 stories: include the existing CV stories AND any new ones from the conversation. Enrich existing stories if the conversation added detail.
- For step7 communicationStyle and brandingTheme: infer from HOW they spoke in the conversation, not just what they said
- For step11 chatbotWelcome: write something that sounds like THEM based on how they conversed
- Return only valid JSON — no explanation, no markdown fences`;
}

// ==================== PUBLIC API ====================

export function getOnboardingSession(customerId: string): OnboardingSession | undefined {
  return onboardingSessions.get(customerId);
}

export function clearOnboardingSession(customerId: string): void {
  onboardingSessions.delete(customerId);
}

export async function startOnboarding(
  customerId: string,
  draft: any
): Promise<string> {
  const systemPrompt = buildSystemPrompt(draft);

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: { systemInstruction: systemPrompt },
    contents: [{ role: "user", parts: [{ text: "I'm ready to get started." }] }],
  });

  const botMessage = result.text || "Hey! I've had a look at your CV. Let's talk through your career — I want to get a real sense of who you are and what you've done. Where do you want to start?";

  onboardingSessions.set(customerId, {
    customerId,
    draft,
    messages: [
      { role: "user", content: "I'm ready to get started." },
      { role: "assistant", content: botMessage },
    ],
    coveredAreas: new Set(),
    transcript: "",
  });

  return botMessage;
}

export async function sendOnboardingMessage(
  customerId: string,
  userMessage: string
): Promise<{ botResponse: string; readyToComplete: boolean }> {
  const session = onboardingSessions.get(customerId);
  if (!session) throw new Error("No active onboarding session");

  session.messages.push({ role: "user", content: userMessage });

  const systemPrompt = buildSystemPrompt(session.draft);
  const geminiMessages = session.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: { systemInstruction: systemPrompt },
    contents: geminiMessages,
  });

  const botResponse = result.text || "Tell me more about that.";
  session.messages.push({ role: "assistant", content: botResponse });

  const readyToComplete = botResponse.includes("I think I've got a really good picture of you now");

  return { botResponse, readyToComplete };
}

export async function extractAndSave(customerId: string): Promise<{
  enrichedDraft: any;
}> {
  const session = onboardingSessions.get(customerId);
  if (!session) throw new Error("No active onboarding session");

  const transcript = session.messages
    .map((m) => `${m.role === "user" ? "PERSON" : "GUIDE"}: ${m.content}`)
    .join("\n\n");

  const extractionPrompt = buildExtractionPrompt(transcript, session.draft);

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: extractionPrompt }] }],
  });

  const rawText = result.text || "{}";

  let enrichedDraft = { ...session.draft };
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      enrichedDraft = JSON.parse(jsonMatch[0]);
    }
  } catch {
    // If parse fails, return original draft — don't lose data
  }

  return { enrichedDraft };
}
