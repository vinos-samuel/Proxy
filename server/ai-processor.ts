import { GoogleGenAI } from "@google/genai";
import { storage } from "./storage";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

interface QuestionnaireData {
  step1: {
    fullName: string;
    roleTitle: string;
    positioning: string;
    persona: string;
    tone: string;
  };
  step2: {
    careers: Array<{
      companyName: string;
      roleTitle: string;
      duration: string;
      facts: string[];
    }>;
  };
  step3: {
    stories: Array<{
      type: string;
      title: string;
      challenge: string;
      approach: string;
      result: string;
      scale: string;
    }>;
  };
  step4: {
    influences: string;
    limitations: string;
    contactEmail: string;
    contactPhone: string;
    contactLinkedin: string;
  };
  step5: {
    photoUrl: string;
    resumeUrl: string;
  };
}

export async function processQuestionnaire(profileId: string, data: QuestionnaireData) {
  // Clean up existing generated content
  await storage.deleteFactBanksByProfileId(profileId);
  await storage.deleteKnowledgeEntriesByProfileId(profileId);

  // 1. Generate identity and update profile
  const toneMap: Record<string, string> = {
    direct: "Direct, confident, and senior. Answers concisely with authority.",
    warm: "Warm, approachable, and friendly. Explains things clearly with empathy.",
    technical: "Technical, precise, and detail-oriented. Uses specific terminology.",
    casual: "Casual, conversational, and relatable. Speaks naturally.",
  };

  await storage.updateProfileById(profileId, {
    displayName: data.step1.fullName,
    roleTitle: data.step1.roleTitle,
    positioning: data.step1.positioning,
    persona: data.step1.persona,
    tone: data.step1.tone,
    answerStyle: toneMap[data.step1.tone] || toneMap.direct,
    fallbackResponse: `I appreciate the question, but that's outside my area of expertise. I'm ${data.step1.fullName}, and I'm happy to discuss my experience in ${data.step1.roleTitle} roles. Feel free to ask about my career history, key projects, or professional philosophy.`,
    photoUrl: data.step5.photoUrl || null,
    resumeUrl: data.step5.resumeUrl || null,
  });

  // 2. Create fact banks from career history
  for (const career of data.step2.careers) {
    if (career.companyName) {
      await storage.createFactBank({
        twinProfileId: profileId,
        companyName: career.companyName,
        roleName: career.roleTitle,
        duration: career.duration,
        facts: career.facts.filter(Boolean),
      });
    }
  }

  // 3. Generate canonical "About Me" entry using AI
  try {
    const careerSummary = data.step2.careers
      .map(c => `${c.roleTitle} at ${c.companyName} (${c.duration}): ${c.facts.filter(Boolean).join("; ")}`)
      .join("\n");

    const aboutPrompt = `You are writing a professional "Tell Me About Yourself" response for ${data.step1.fullName}, a ${data.step1.roleTitle}.

Their positioning: ${data.step1.positioning}
Their persona: ${data.step1.persona}
Their career history:
${careerSummary}

Write a compelling, first-person narrative (2-3 paragraphs) that introduces this person. Be authentic and specific, weaving in key achievements. Match the tone: ${toneMap[data.step1.tone] || "Professional"}.

Return ONLY the narrative text, no headers or labels.`;

    const aboutResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: aboutPrompt,
    });

    const aboutText = aboutResponse.text || `I'm ${data.step1.fullName}, ${data.step1.positioning}`;

    await storage.createKnowledgeEntry({
      twinProfileId: profileId,
      entryId: "about-me",
      type: "canonical",
      title: "Tell Me About Yourself",
      content: aboutText,
      challenge: null,
      approach: null,
      result: null,
      scale: null,
      intent: ["intro", "framing"],
      keywords: ["about", "yourself", "introduction", "who", "background", "tell me"],
    });
  } catch (error) {
    console.error("Error generating about me:", error);
    await storage.createKnowledgeEntry({
      twinProfileId: profileId,
      entryId: "about-me",
      type: "canonical",
      title: "Tell Me About Yourself",
      content: `I'm ${data.step1.fullName}, ${data.step1.positioning}. ${data.step1.persona}`,
      challenge: null,
      approach: null,
      result: null,
      scale: null,
      intent: ["intro", "framing"],
      keywords: ["about", "yourself", "introduction", "who", "background", "tell me"],
    });
  }

  // 4. Create knowledge entries from stories
  const intentMap: Record<string, string[]> = {
    failure: ["behavioral"],
    conflict: ["behavioral", "scenario"],
    commercial: ["behavioral", "commercial"],
    influence: ["behavioral", "scenario"],
    "data-driven": ["behavioral", "scenario"],
    building: ["behavioral", "commercial"],
    consultative: ["consulting", "behavioral"],
    "buy-in": ["behavioral", "consulting"],
  };

  for (const story of data.step3.stories) {
    if (!story.title) continue;

    const entryId = `${story.type}-${story.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
    let keywords: string[] = [];

    try {
      const keywordPrompt = `Generate 8-12 relevant keywords/phrases for this career story. Return ONLY a JSON array of strings, nothing else.

Title: ${story.title}
Type: ${story.type}
Challenge: ${story.challenge}
Approach: ${story.approach}
Result: ${story.result}`;

      const keywordResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: keywordPrompt,
      });

      const keywordText = keywordResponse.text?.trim() || "[]";
      const match = keywordText.match(/\[[\s\S]*\]/);
      if (match) {
        keywords = JSON.parse(match[0]);
      }
    } catch {
      keywords = [story.type, story.title.toLowerCase()];
    }

    await storage.createKnowledgeEntry({
      twinProfileId: profileId,
      entryId,
      type: "experience",
      title: story.title,
      content: null,
      challenge: story.challenge,
      approach: story.approach,
      result: story.result,
      scale: story.scale,
      intent: intentMap[story.type] || ["behavioral"],
      keywords,
    });
  }

  // 5. Create philosophy entries
  if (data.step4.influences) {
    await storage.createKnowledgeEntry({
      twinProfileId: profileId,
      entryId: "philosophy-influences",
      type: "philosophy",
      title: "Key Influences & Thinking",
      content: data.step4.influences,
      challenge: null,
      approach: null,
      result: null,
      scale: null,
      intent: ["philosophy"],
      keywords: ["influences", "books", "thinking", "philosophy", "approach", "mindset"],
    });
  }

  if (data.step4.limitations) {
    await storage.createKnowledgeEntry({
      twinProfileId: profileId,
      entryId: "integrity-limits",
      type: "integrity",
      title: "Professional Boundaries",
      content: data.step4.limitations,
      challenge: null,
      approach: null,
      result: null,
      scale: null,
      intent: ["integrity"],
      keywords: ["limitations", "boundaries", "expertise", "don't", "not", "outside"],
    });
  }

  // 6. Create contact entry
  if (data.step4.contactEmail || data.step4.contactPhone || data.step4.contactLinkedin) {
    const contactParts = [];
    if (data.step4.contactEmail) contactParts.push(`Email: ${data.step4.contactEmail}`);
    if (data.step4.contactPhone) contactParts.push(`Phone: ${data.step4.contactPhone}`);
    if (data.step4.contactLinkedin) contactParts.push(`LinkedIn: ${data.step4.contactLinkedin}`);

    await storage.createKnowledgeEntry({
      twinProfileId: profileId,
      entryId: "contact-info",
      type: "contact",
      title: "Contact Information",
      content: contactParts.join("\n"),
      challenge: null,
      approach: null,
      result: null,
      scale: null,
      intent: ["contact"],
      keywords: ["contact", "reach", "email", "phone", "linkedin", "connect", "hire"],
    });
  }

  // Update profile status to ready
  await storage.updateProfileStatus(profileId, "ready");
}
