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
    careerHistory?: Array<{
      company: string;
      title: string;
      years: string;
      achievements: string | string[];
    }>;
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

export async function processQuestionnaire(
  profileId: string,
  data: QuestionnaireData,
) {
  await storage.deleteFactBanksByProfileId(profileId);
  await storage.deleteKnowledgeEntriesByProfileId(profileId);

  const toneMap: Record<string, string> = {
    direct:
      "Direct, confident, and no-nonsense. Answers concisely with authority.",
    warm: "Warm, conversational, and friendly. Explains things clearly with empathy.",
    technical:
      "Technical, precise, and detail-oriented. Uses specific terminology.",
    strategic:
      "Strategic, consultative, and big-picture. Thinks in frameworks and trade-offs.",
  };

  const tone = data.step7?.communicationStyle || "direct";

  // ====================
  // STEP 1: Generate Portfolio Display Data (RESUME_DATA structure)
  // ====================

  let portfolioData: any = {};

  try {
    const portfolioPrompt = `You are an expert career storyteller and portfolio designer. Transform this executive's raw questionnaire data into a polished, high-impact portfolio structure.

**EXECUTIVE PROFILE:**
Name: ${data.step1.fullName}
Title: ${data.step1.currentTitle}
Location: ${data.step1.location || "N/A"}

**PROFESSIONAL SUMMARY:**
${data.step2.professionalSummary}

**KEY ACHIEVEMENTS:**
${data.step5?.achievements || "Not provided"}

**TECHNICAL SKILLS:**
${data.step6?.technicalSkills || "Not provided"}

**WAR STORIES:**
${data.step4.stories
  .map(
    (s, i) => `
Story ${i + 1}: ${s.title}
Challenge: ${s.challenge}
Approach: ${s.approach}
Result: ${s.result}
`,
  )
  .join("\n")}

**COMMUNICATION STYLE:**
Tone: ${toneMap[tone]}
Words they use: ${data.step7?.wordsUsedOften || "N/A"}
Words they avoid: ${data.step7?.wordsAvoided || "N/A"}

---

**INSTRUCTIONS:**

Generate a JSON object with the following structure. Follow these rules exactly:

1. **heroDescription**: Write EXACTLY 2 paragraphs:
   - Paragraph 1: One-line positioning statement ("I [verb] [what] for [who]")
   - Paragraph 2: A specific proof story from their most impressive achievement with concrete outcomes

2. **heroSubtitle**: Take their role title and split into 3 facets separated by " • ". Don't just copy the title - reframe it into positioning language.

3. **stats**: Extract ALL numbers from achievements and stories. Each stat must have:
   - label: What was measured (string)
   - value: The number with units (e.g., "$100M+", "25%", "15 People")
   - Minimum 6 stats, maximum 9 stats

4. **problemFit**: Rewrite their skills as 5-6 BUYER PROBLEMS. Each starts with "You're..." or "Your..." and frames the buyer's pain, not the candidate's skills.
   Example: NOT "I can scale operations" but "You're scaling fast and your ops can't keep up"

5. **howIWork**: Create a 4-step methodology that describes their approach. Give it a name (e.g., "Strategy → Build → Scale → Optimize")

6. **whyAiCv**: Write 4-5 short paragraphs explaining:
   - Why static CVs fail for senior roles
   - How this cuts through noise
   - What the AI is trained on
   - What to ask it
   - Future vision

7. **suggestedQuestions**: Write 8 questions a HIRING MANAGER would ask. Should map to their war stories. Mix types:
   - Specific project questions
   - Scenario questions
   - Leadership philosophy
   - Technical depth

**CRITICAL:** Return ONLY valid JSON. No markdown, no code fences, no preamble.

{
  "heroDescription": "Paragraph 1\\n\\nParagraph 2",
  "heroSubtitle": "Facet 1 • Facet 2 • Facet 3",
  "stats": [
    {"label": "Description", "value": "$100M+"},
    {"label": "Description", "value": "25%"}
  ],
  "problemFit": [
    "You're scaling fast and your ops infrastructure can't keep up",
    "Your systems are manual and error-prone"
  ],
  "howIWork": {
    "name": "Step 1 → Step 2 → Step 3 → Step 4",
    "steps": [
      {"label": "Step Name", "description": "What happens"},
      {"label": "Step Name", "description": "What happens"}
    ]
  },
  "whyAiCv": [
    "Paragraph 1 about why static CVs fail",
    "Paragraph 2 about cutting through noise",
    "Paragraph 3 about what AI knows",
    "Paragraph 4 about what to ask",
    "Paragraph 5 about future vision"
  ],
  "suggestedQuestions": [
    "Tell me about the project where you scaled X",
    "How do you handle conflict with stakeholders?"
  ]
}`;

    const portfolioResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: portfolioPrompt,
    });

    const portfolioText = portfolioResponse.text?.trim() || "";
    const jsonMatch = portfolioText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      portfolioData = JSON.parse(jsonMatch[0]);
    }

    // Extract career timeline from questionnaire
    const careerTimeline = data.step2?.careerHistory?.map((role: any) => ({
      company: role.company,
      title: role.title,
      years: role.years,
      achievements: typeof role.achievements === 'string' 
        ? role.achievements.split('\n').filter(Boolean) 
        : role.achievements
    })) || [];
    portfolioData.careerTimeline = careerTimeline;
  } catch (error) {
    console.error("Error generating portfolio data:", error);
    // Fallback to basic structure
    portfolioData = {
      heroDescription: `I'm ${data.step1.fullName}. ${data.step2.professionalSummary}`,
      heroSubtitle: data.step1.currentTitle,
      stats: [],
      problemFit: [],
      howIWork: { name: "", steps: [] },
      whyAiCv: [],
      suggestedQuestions: [],
    };
  }

  // Update profile with portfolio data
  await storage.updateProfileById(profileId, {
    displayName: data.step1.fullName,
    roleTitle: data.step1.currentTitle,
    positioning:
      portfolioData.heroDescription || data.step2.professionalSummary,
    persona: portfolioData.heroDescription || data.step2.professionalSummary,
    tone: tone,
    answerStyle: toneMap[tone] || toneMap.direct,
    fallbackResponse: `I appreciate the question, but that's outside my area of expertise. I'm ${data.step1.fullName}, and I'm happy to discuss my experience as a ${data.step1.currentTitle}. Feel free to ask about my career history, key projects, or professional philosophy.`,
    photoUrl: data.step10?.headshot || null,
    resumeUrl: data.step3?.resumeUrl || null,
    brandingTheme: data.step10?.brandingTheme || "corporate",
    videoUrl: data.step10?.introVideo || null,
    cvResumeUrl: data.step10?.cvResume || null,
    // NEW PORTFOLIO FIELDS
    heroSubtitle: portfolioData.heroSubtitle || null,
    stats: portfolioData.stats || null,
    problemFit: portfolioData.problemFit || null,
    howIWork: portfolioData.howIWork || null,
    whyAiCv: portfolioData.whyAiCv || null,
    portfolioSuggestedQuestions: portfolioData.suggestedQuestions || null,
    careerTimeline: portfolioData.careerTimeline || null,
    // Store full questionnaire data
    questionnaireData: {
      ...data,
      portfolioData: portfolioData,
    },
  });

  // ====================
  // STEP 2: Generate "About Me" knowledge entry
  // ====================

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

    const aboutText =
      aboutResponse.text ||
      `I'm ${data.step1.fullName}, ${data.step2.professionalSummary}`;

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
      keywords: [
        "about",
        "yourself",
        "introduction",
        "who",
        "background",
        "tell me",
        "what do you do",
      ],
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
      keywords: [
        "about",
        "yourself",
        "introduction",
        "who",
        "background",
        "tell me",
      ],
    });
  }

  // ====================
  // STEP 3: Create enhanced war stories
  // ====================

  for (let i = 0; i < data.step4.stories.length; i++) {
    const story = data.step4.stories[i];
    if (!story.title) continue;

    const entryId = `war-story-${i}-${story.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40)}`;
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

  // ====================
  // STEP 4: Create achievements knowledge entry
  // ====================

  if (data.step5?.achievements) {
    const achievementLines = data.step5.achievements
      .split("\n")
      .filter(Boolean);
    let enhancedAchievements = achievementLines
      .map((a) => `- ${a.trim()}`)
      .join("\n");

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
      keywords: [
        "achievements",
        "metrics",
        "results",
        "impact",
        "numbers",
        "quantifiable",
        "accomplished",
        "delivered",
      ],
    });

    // Create fact bank from achievements
    await storage.createFactBank({
      twinProfileId: profileId,
      companyName: "Key Achievements",
      roleName: data.step1.currentTitle,
      duration: "Career Highlights",
      facts: achievementLines.map((a) => a.trim()).filter(Boolean),
    });
  }

  // ====================
  // STEP 5: Create technical skills knowledge entry
  // ====================

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
      keywords: [
        "skills",
        "tools",
        "technologies",
        "platforms",
        "proficient",
        "experience with",
        "expertise",
        "technical",
      ],
    });
  }

  // ====================
  // STEP 6: Create Q&A knowledge entries
  // ====================

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
      const kw = qa.question
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);
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

  // ====================
  // STEP 7: Create objection handling knowledge entries
  // ====================

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
        "objection",
        "concern",
        "worry",
        "issue",
        "problem",
        ...obj.objection
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 3),
      ],
    });
  }

  // ====================
  // STEP 8: Create contact entry
  // ====================

  const contactParts = [];
  if (data.step1.email) contactParts.push(`Email: ${data.step1.email}`);
  if (data.step1.phone) contactParts.push(`Phone: ${data.step1.phone}`);
  if (data.step1.linkedinUrl)
    contactParts.push(`LinkedIn: ${data.step1.linkedinUrl}`);
  if (data.step1.location)
    contactParts.push(`Location: ${data.step1.location}`);

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
      keywords: [
        "contact",
        "reach",
        "email",
        "phone",
        "linkedin",
        "connect",
        "hire",
        "location",
      ],
    });
  }

  // ====================
  // STEP 9: Create Easter Egg entry
  // ====================

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
      keywords: [
        "hobby",
        "hobbies",
        "personal",
        "fun",
        "outside work",
        "interests",
        "free time",
        "passion",
      ],
    });
  }

  // ====================
  // STEP 10: Create professional summary entry
  // ====================

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
      keywords: [
        "positioning",
        "superpower",
        "unique",
        "different",
        "differentiator",
        "value",
        "strength",
        "why you",
      ],
    });
  }

  await storage.updateProfileStatus(profileId, "ready");
}
