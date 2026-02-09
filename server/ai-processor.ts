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
    currentTitle: string;
    email: string;
    phone: string;
    linkedinUrl: string;
    location: string;
  };
  step2: {
    professionalSummary: string;
  };
  step3: {
    resumeUrl: string;
  };
  step4: {
    stories: Array<{
      title: string;
      challenge: string;
      approach: string;
      result: string;
    }>;
  };
  step5: {
    achievements: string;
  };
  step6: {
    technicalSkills: string;
  };
  step7: {
    communicationStyle: string;
    wordsUsedOften: string;
    wordsAvoided: string;
    writingSample: string;
  };
  step8: {
    questions: Array<{
      question: string;
      answer: string;
    }>;
  };
  step9: {
    objections: Array<{
      objection: string;
      response: string;
    }>;
  };
  step10: {
    brandingTheme: string;
    headshot: string;
    introVideo: string;
    cvResume: string;
  };
  step11: {
    suggestedQuestions: string;
    specialInstructions: string;
    easterEgg: string;
  };
}

export async function processQuestionnaire(profileId: string, data: QuestionnaireData) {
  await storage.deleteFactBanksByProfileId(profileId);
  await storage.deleteKnowledgeEntriesByProfileId(profileId);

  const toneMap: Record<string, string> = {
    direct: "Direct, confident, and no-nonsense. Answers concisely with authority.",
    warm: "Warm, conversational, and friendly. Explains things clearly with empathy.",
    technical: "Technical, precise, and detail-oriented. Uses specific terminology.",
    strategic: "Strategic, consultative, and big-picture. Thinks in frameworks and trade-offs.",
  };

  const tone = data.step7?.communicationStyle || "direct";

  await storage.updateProfileById(profileId, {
    displayName: data.step1.fullName,
    roleTitle: data.step1.currentTitle,
    positioning: data.step2.professionalSummary,
    persona: data.step2.professionalSummary,
    tone: tone,
    answerStyle: toneMap[tone] || toneMap.direct,
    fallbackResponse: `I appreciate the question, but that's outside my area of expertise. I'm ${data.step1.fullName}, and I'm happy to discuss my experience as a ${data.step1.currentTitle}. Feel free to ask about my career history, key projects, or professional philosophy.`,
    photoUrl: data.step10?.headshot || null,
    resumeUrl: data.step3?.resumeUrl || null,
    brandingTheme: data.step10?.brandingTheme || "executive",
    videoUrl: data.step10?.introVideo || null,
    cvResumeUrl: data.step10?.cvResume || null,
  });

  // 1. Generate "About Me" using AI with all the rich context
  try {
    const aboutPrompt = `You are writing a professional "Tell Me About Yourself" response for ${data.step1.fullName}, a ${data.step1.currentTitle} based in ${data.step1.location || "N/A"}.

Their professional summary / positioning:
${data.step2.professionalSummary}

Key achievements:
${data.step5?.achievements || "Not provided"}

Technical skills:
${data.step6?.technicalSkills || "Not provided"}

Communication style preference: ${toneMap[tone] || "Professional"}
Words they use often: ${data.step7?.wordsUsedOften || "N/A"}
Words they avoid: ${data.step7?.wordsAvoided || "N/A"}

${data.step7?.writingSample ? `Sample of their writing style:\n${data.step7.writingSample}` : ""}

${data.step11?.specialInstructions ? `Special instructions: ${data.step11.specialInstructions}` : ""}

Write a compelling, first-person narrative (2-3 paragraphs) that introduces this person authentically. Mirror their communication style and word choices. Be specific and weave in key achievements.

Return ONLY the narrative text, no headers or labels.`;

    const aboutResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: aboutPrompt,
    });

    const aboutText = aboutResponse.text || `I'm ${data.step1.fullName}, ${data.step2.professionalSummary}`;

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
      keywords: ["about", "yourself", "introduction", "who", "background", "tell me", "what do you do"],
    });
  } catch (error) {
    console.error("Error generating about me:", error);
    await storage.createKnowledgeEntry({
      twinProfileId: profileId,
      entryId: "about-me",
      type: "canonical",
      title: "Tell Me About Yourself",
      content: `I'm ${data.step1.fullName}. ${data.step2.professionalSummary}`,
      challenge: null,
      approach: null,
      result: null,
      scale: null,
      intent: ["intro", "framing"],
      keywords: ["about", "yourself", "introduction", "who", "background", "tell me"],
    });
  }

  // 2. Create knowledge entries from war stories (AI-enhanced)
  for (let i = 0; i < data.step4.stories.length; i++) {
    const story = data.step4.stories[i];
    if (!story.title) continue;

    const entryId = `war-story-${i}-${story.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
    let keywords: string[] = [];
    let enhancedChallenge = story.challenge;
    let enhancedApproach = story.approach;
    let enhancedResult = story.result;

    try {
      const rewritePrompt = `You are a professional career storytelling expert. Rewrite this war story in the voice of ${data.step1.fullName}, a ${data.step1.currentTitle}.

Communication style: ${toneMap[tone] || "Professional"}
Words they use often: ${data.step7?.wordsUsedOften || "N/A"}
Words they avoid: ${data.step7?.wordsAvoided || "N/A"}

ORIGINAL STORY:
Title: ${story.title}
Challenge (raw input): ${story.challenge}
Approach (raw input): ${story.approach}
Result (raw input): ${story.result}

INSTRUCTIONS:
- Rewrite each section to be polished, impactful, and interview-ready
- Add specificity and quantify results wherever possible
- Mirror the person's communication style
- Make the challenge feel high-stakes
- Make the approach show strategic thinking
- Make the result feel like a clear win with measurable impact
- Keep first-person voice
- Also generate 8-12 search keywords/phrases

Return ONLY valid JSON (no markdown, no code fences):
{"challenge": "...", "approach": "...", "result": "...", "keywords": ["...", "..."]}`;

      const rewriteResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: rewritePrompt,
      });

      const rewriteText = rewriteResponse.text?.trim() || "";
      const jsonMatch = rewriteText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        enhancedChallenge = parsed.challenge || story.challenge;
        enhancedApproach = parsed.approach || story.approach;
        enhancedResult = parsed.result || story.result;
        keywords = parsed.keywords || [story.title.toLowerCase()];
      }
    } catch {
      keywords = [story.title.toLowerCase()];
    }

    await storage.createKnowledgeEntry({
      twinProfileId: profileId,
      entryId,
      type: "experience",
      title: story.title,
      content: null,
      challenge: enhancedChallenge,
      approach: enhancedApproach,
      result: enhancedResult,
      scale: null,
      intent: ["behavioral", "scenario"],
      keywords,
    });
  }

  // 3. Create achievements knowledge entry (AI-enhanced)
  if (data.step5?.achievements) {
    const achievementLines = data.step5.achievements.split("\n").filter(Boolean);
    let enhancedAchievements = achievementLines.map(a => `- ${a.trim()}`).join("\n");

    try {
      const achPrompt = `You are a career impact specialist. Rewrite these achievements for ${data.step1.fullName}, a ${data.step1.currentTitle}, to be maximally impressive and interview-ready.

Communication style: ${toneMap[tone] || "Professional"}

RAW ACHIEVEMENTS:
${achievementLines.join("\n")}

INSTRUCTIONS:
- Quantify everything possible (percentages, dollar amounts, team sizes, timeframes)
- Use strong action verbs (spearheaded, orchestrated, drove, transformed)
- Make each achievement a standalone impressive bullet point
- If raw input is vague, infer reasonable specifics that make it concrete
- Keep first-person voice
- Return as bullet points, one per line, starting with "- "

Return ONLY the rewritten bullet points, nothing else.`;

      const achResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: achPrompt,
      });

      enhancedAchievements = achResponse.text?.trim() || enhancedAchievements;
    } catch {
      // Keep original
    }

    await storage.createKnowledgeEntry({
      twinProfileId: profileId,
      entryId: "key-achievements",
      type: "canonical",
      title: "Key Metrics & Achievements",
      content: enhancedAchievements,
      challenge: null,
      approach: null,
      result: null,
      scale: null,
      intent: ["achievements", "metrics"],
      keywords: ["achievements", "metrics", "results", "impact", "numbers", "quantifiable", "accomplished", "delivered"],
    });

    // Also create a fact bank entry from achievements
    await storage.createFactBank({
      twinProfileId: profileId,
      companyName: "Key Achievements",
      roleName: data.step1.currentTitle,
      duration: "Career Highlights",
      facts: achievementLines.map(a => a.trim()).filter(Boolean),
    });
  }

  // 4. Create technical skills knowledge entry
  if (data.step6?.technicalSkills) {
    await storage.createKnowledgeEntry({
      twinProfileId: profileId,
      entryId: "technical-skills",
      type: "canonical",
      title: "Technical Skills & Tools",
      content: data.step6.technicalSkills,
      challenge: null,
      approach: null,
      result: null,
      scale: null,
      intent: ["skills", "technical"],
      keywords: ["skills", "tools", "technologies", "platforms", "proficient", "experience with", "expertise", "technical"],
    });
  }

  // 5. Create Q&A knowledge entries from common questions
  for (let i = 0; i < data.step8.questions.length; i++) {
    const qa = data.step8.questions[i];
    if (!qa.question) continue;

    let aiAnswer = qa.answer;

    try {
      const qaPrompt = `You are ${data.step1.fullName}, a ${data.step1.currentTitle}.
Communication style: ${toneMap[tone] || "Professional"}
Words you use often: ${data.step7?.wordsUsedOften || "N/A"}
Words you avoid: ${data.step7?.wordsAvoided || "N/A"}

A visitor asks: "${qa.question}"

The key points to cover are: ${qa.answer}

Write a natural first-person response (2-3 paragraphs) that covers these key points while matching the communication style. Be authentic and specific.

Return ONLY the response text.`;

      const qaResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: qaPrompt,
      });

      aiAnswer = qaResponse.text || qa.answer;
    } catch {
      aiAnswer = qa.answer;
    }

    let qKeywords: string[] = [];
    try {
      const kw = qa.question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      qKeywords = kw;
    } catch {
      qKeywords = [];
    }

    await storage.createKnowledgeEntry({
      twinProfileId: profileId,
      entryId: `common-question-${i}`,
      type: "qa",
      title: qa.question,
      content: aiAnswer,
      challenge: null,
      approach: null,
      result: null,
      scale: null,
      intent: ["qa", "common-question"],
      keywords: [...qKeywords, "question", "interview"],
    });
  }

  // 6. Create objection handling knowledge entries
  for (let i = 0; i < data.step9.objections.length; i++) {
    const obj = data.step9.objections[i];
    if (!obj.objection) continue;

    let aiResponse = obj.response;

    try {
      const objPrompt = `You are ${data.step1.fullName}, a ${data.step1.currentTitle}.
Communication style: ${toneMap[tone] || "Professional"}
Words you use often: ${data.step7?.wordsUsedOften || "N/A"}
Words you avoid: ${data.step7?.wordsAvoided || "N/A"}

Someone raises this objection/concern: "${obj.objection}"

Your key response points: ${obj.response}

Write a natural first-person response (1-2 paragraphs) that addresses this concern confidently while matching the communication style. Turn the objection into a positive.

Return ONLY the response text.`;

      const objResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: objPrompt,
      });

      aiResponse = objResponse.text || obj.response;
    } catch {
      aiResponse = obj.response;
    }

    await storage.createKnowledgeEntry({
      twinProfileId: profileId,
      entryId: `objection-${i}`,
      type: "objection",
      title: `Objection: ${obj.objection}`,
      content: aiResponse,
      challenge: obj.objection,
      approach: null,
      result: null,
      scale: null,
      intent: ["objection", "concern"],
      keywords: [
        "objection", "concern", "worry", "issue", "problem",
        ...obj.objection.toLowerCase().split(/\s+/).filter(w => w.length > 3),
      ],
    });
  }

  // 7. Create contact entry
  const contactParts = [];
  if (data.step1.email) contactParts.push(`Email: ${data.step1.email}`);
  if (data.step1.phone) contactParts.push(`Phone: ${data.step1.phone}`);
  if (data.step1.linkedinUrl) contactParts.push(`LinkedIn: ${data.step1.linkedinUrl}`);
  if (data.step1.location) contactParts.push(`Location: ${data.step1.location}`);

  if (contactParts.length > 0) {
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
      keywords: ["contact", "reach", "email", "phone", "linkedin", "connect", "hire", "location"],
    });
  }

  // 8. Create Easter Egg entry if provided
  if (data.step11?.easterEgg) {
    await storage.createKnowledgeEntry({
      twinProfileId: profileId,
      entryId: "easter-egg",
      type: "personal",
      title: "Personal Interest / Easter Egg",
      content: data.step11.easterEgg,
      challenge: null,
      approach: null,
      result: null,
      scale: null,
      intent: ["personal", "hobby"],
      keywords: ["hobby", "hobbies", "personal", "fun", "outside work", "interests", "free time", "passion"],
    });
  }

  // 9. Create professional summary as a dedicated knowledge entry
  if (data.step2?.professionalSummary) {
    await storage.createKnowledgeEntry({
      twinProfileId: profileId,
      entryId: "professional-summary",
      type: "canonical",
      title: "Professional Summary & Superpower",
      content: data.step2.professionalSummary,
      challenge: null,
      approach: null,
      result: null,
      scale: null,
      intent: ["positioning", "differentiator"],
      keywords: ["positioning", "superpower", "unique", "different", "differentiator", "value", "strength", "why you"],
    });
  }

  await storage.updateProfileStatus(profileId, "ready");
}
