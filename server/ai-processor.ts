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

function cleanAchievements(achievements: string[]): string[] {
  return achievements
    .filter(a => a && a.trim().length > 0)
    .filter(a => !['na', 'n/a', 'none', 'nil', 'null', '-', '—'].includes(a.toLowerCase().trim()))
    .map(a => a.replace(/^[\s•\-\*]+/, '').trim())
    .filter(a => a.length > 0);
}

function formatAchievement(text: string): string {
  let cleaned = text.replace(/^[\s•\-\*]+/, '').trim();
  if (/^\d+\./.test(cleaned)) return cleaned;
  return cleaned;
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
  // STEP 1: Generate Portfolio Display Data
  // ====================

  const fullInputData = `
EXECUTIVE PROFILE:
Name: ${data.step1.fullName}
Title: ${data.step1.currentTitle}
Location: ${data.step1.location || "N/A"}

PROFESSIONAL SUMMARY:
${data.step2.professionalSummary}

CAREER HISTORY:
${(data.step2?.careerHistory || []).map((r: any) => `${r.title} at ${r.company} (${r.years})\nAchievements: ${typeof r.achievements === 'string' ? r.achievements : (r.achievements || []).join('; ')}`).join('\n\n')}

KEY ACHIEVEMENTS:
${data.step5?.achievements || "Not provided"}

TECHNICAL SKILLS:
${data.step6?.technicalSkills || "Not provided"}

WAR STORIES:
${data.step4.stories.map((s, i) => `Story ${i + 1}: ${s.title}\nChallenge: ${s.challenge}\nApproach: ${s.approach}\nResult: ${s.result}`).join('\n\n')}

COMMUNICATION STYLE:
Tone: ${toneMap[tone]}
Words they use: ${data.step7?.wordsUsedOften || "N/A"}
Words they avoid: ${data.step7?.wordsAvoided || "N/A"}`;

  let portfolioData: any = {};
  let skillsMatrixData: any = null;
  let whereImMostUsefulData: any = null;

  try {
    const portfolioPrompt = `You are an expert career strategist and executive positioning specialist. Transform this professional's raw data into a strategically positioned portfolio. Think like a branding consultant, not a resume writer.

${fullInputData}

---

MINDSET: You are POSITIONING this person, not listing their history. Every section should answer "why should I hire THIS person?"

Generate a JSON object with the following structure:

1. "heroDescription": Write EXACTLY 2 paragraphs:
   - Paragraph 1: Bold positioning statement. Not "I am a..." but a value proposition. Example: "I architect talent solutions that transform how organizations compete for leadership across Asia Pacific."
   - Paragraph 2: A specific proof story with concrete metrics that demonstrates the positioning.

2. "heroSubtitle": Reframe their title into 3 positioning facets separated by " • ". Not "Director of Sales" but "Revenue Architecture • Market Expansion • Client Partnership".

3. "impactMetrics": Extract EXACTLY 6 most impressive quantifiable achievements. Return exactly 6 items, no more, no fewer. Each must have:
   - "value": The number with context (e.g., "98%", "GBP 1.2M+", "3x", "18+")
   - "label": What it represents IN ALL CAPS with comparison context where possible (e.g., "RETAINED MANDATE COMPLETION RATE", "NPS SCORE (VS 18% INDUSTRY AVG)")
   - "icon": One of "target", "chart", "users", "ribbon", "lightning", "globe"
   Prioritize business IMPACT metrics over activity metrics. Bad: "Managed 5 accounts". Good: "3x GROWTH ACROSS 5 KEY ACCOUNTS"

4. "howIWork": Based on the user's questionnaire data, extract or infer their professional methodology/framework.
   RULES:
   - Only create this if the user has described a clear, repeatable approach or process
   - Extract 3-5 steps in their process, using their own terminology
   - Give it a strategic name using arrows (e.g., "Diagnose → Design → Deploy → Optimize")
   - If no clear framework exists in their data, return null for howIWork
   - Each step: {"label": "Step Name", "description": "What specifically happens in this phase (15-20 words)"}

5. "whyAiCv": Write 4-5 short paragraphs explaining why this AI portfolio exists and what to ask it.

6. "suggestedQuestions": Write 8 questions a HIRING MANAGER would ask, mapped to their war stories.

7. "chatbotPersona": Write a 2-3 sentence description of how the AI chatbot should BEHAVE and COMMUNICATE. This is NOT a career summary — it describes the chatbot's personality, tone, and conversational style. Example: "Speaks with quiet confidence about talent strategy, drawing on 15+ years across APAC markets. Uses real client examples rather than theory. Balances strategic insight with practical directness — no corporate jargon."

QUALITY RULES:
- NO generic corporate jargon ("passionate", "results-driven", "team player")
- Every statement must be specific and evidence-backed
- Use active voice and strong verbs
- If data contains "NA"/"N/A"/"None", skip that item entirely

CRITICAL: Return ONLY valid JSON. No markdown, no code fences.

{
  "heroDescription": "string",
  "heroSubtitle": "string",
  "impactMetrics": [{"value": "string", "label": "string", "icon": "string"}],
  "howIWork": {"name": "string", "steps": [{"label": "string", "description": "string"}]},
  "whyAiCv": ["string"],
  "suggestedQuestions": ["string"],
  "chatbotPersona": "string"
}`;

    const skillsPrompt = `You are an expert career strategist. Analyze this professional's data and create a comprehensive Skills Matrix.

${fullInputData}

---

REQUIREMENTS:
- Generate 10-14 skill categories (MUST be even number for clean 2-column grid layout)
- Group related skills into meaningful CATEGORIES (not individual skills)
- Include ALL relevant skills from their CV, career history, and questionnaire data
- Write context-rich descriptions that include specific achievements, methodologies, or certifications
- Assign proficiency: "EXPERT" (10+ years or flagship skill) or "ADVANCED" (5+ years or secondary skill)
- Each description must answer "What can you DO with this skill?" with evidence
- Include specific frameworks, certifications, metrics, team sizes where applicable
- Additionally, extract 10-20 individual skill TAGS: specific tools, methodologies, certifications, frameworks, and niche competencies mentioned in their data (e.g., "Miller Heiman LAMP", "NPS / Client Satisfaction", "GTM Strategy", "Cross-Sell Revenue Strategies")

EXAMPLES:
Bad: "Leadership" (too generic, no evidence)
Good: {"title": "Team Leadership & Development", "proficiency": "EXPERT", "description": "Built and managed high-performing teams of 11 billing consultants and 3 researchers consistently exceeding targets.", "icon": "lightning"}

Bad: "Stakeholder Management" (vague)
Good: {"title": "Stakeholder Engagement", "proficiency": "EXPERT", "description": "Trusted advisor to C-Level leadership, aligning talent strategies with broader business objectives.", "icon": "ribbon"}

Bad: "Sales" (single word)
Good: {"title": "Key Account Management", "proficiency": "ADVANCED", "description": "Certified Miller Heiman LAMP practitioner. Built KAM framework resulting in 3x growth across 5 key accounts.", "icon": "briefcase"}

Return ONLY valid JSON, no markdown:
{"skillsMatrix": [{"title": "string", "proficiency": "EXPERT"|"ADVANCED", "description": "string (15-25 words with evidence)", "icon": "target"|"users"|"ribbon"|"briefcase"|"chart"|"lightning"|"globe"}], "skillTags": ["string"]}`;

    const positioningPrompt = `You are an expert at positioning professionals for their ideal roles. Create a "Where I'm Most Useful" section.

${fullInputData}

---

REQUIREMENTS:
- Write an intro sentence: "I'm most effective when [specific positioning]"
- Create EXACTLY 6 scenarios starting with "You...". Return exactly 6 items, no more, no fewer.
- Be concrete and specific, not generic
- Include context about their unique value (regions, methodologies, completion rates, team sizes)
- Frame around CLIENT PAIN POINTS, not just capabilities

EXAMPLES:
Bad: "You need a leader" (too generic)
Good: {"title": "You need access to senior and executive talent", "description": "You need access to senior and executive talent through retained or exclusive search mandates with proven completion rates.", "icon": "users"}

Bad: "You're hiring in Asia" (vague)
Good: {"title": "You're scaling across APAC", "description": "You're scaling across APAC and need a trusted recruitment partner who understands regional talent markets and cultural nuances.", "icon": "globe"}

Return ONLY valid JSON, no markdown:
{"intro": "string", "scenarios": [{"title": "string (short)", "description": "string (full scenario, 15-25 words)", "icon": "globe"|"users"|"target"|"chart"|"briefcase"|"lightning"}]}`;

    const [portfolioResponse, skillsResponse, positioningResponse] = await Promise.all([
      ai.models.generateContent({ model: "gemini-2.5-flash", contents: portfolioPrompt }),
      ai.models.generateContent({ model: "gemini-2.5-flash", contents: skillsPrompt }),
      ai.models.generateContent({ model: "gemini-2.5-flash", contents: positioningPrompt }),
    ]);

    const parseJson = (text: string | undefined) => {
      const cleaned = (text || "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : null;
    };

    portfolioData = parseJson(portfolioResponse.text) || {};
    skillsMatrixData = parseJson(skillsResponse.text);
    whereImMostUsefulData = parseJson(positioningResponse.text);

    const careerTimeline = (data.step2?.careerHistory || [])
      .map((role: any) => {
        const rawAchievements = typeof role.achievements === 'string' 
          ? role.achievements.split('\n').filter(Boolean) 
          : (role.achievements || []);
        const cleaned = cleanAchievements(rawAchievements).map(formatAchievement);
        return {
          company: role.company,
          title: role.title,
          years: role.years,
          achievements: cleaned
        };
      });

    const groupedCareer: any[] = [];
    const companyMap = new Map<string, any>();
    for (const role of careerTimeline) {
      const key = (role.company || "").trim();
      if (!companyMap.has(key)) {
        companyMap.set(key, { company: key, roles: [] });
        groupedCareer.push(companyMap.get(key));
      }
      companyMap.get(key).roles.push({
        title: role.title,
        years: role.years,
        achievements: role.achievements
      });
    }
    portfolioData.careerTimeline = groupedCareer.length > 0 ? groupedCareer : careerTimeline;

    const userSuggestedQuestions = data.step11?.suggestedQuestions
      ? data.step11.suggestedQuestions.split('\n').map((q: string) => q.trim()).filter(Boolean)
      : null;
    if (userSuggestedQuestions && userSuggestedQuestions.length > 0) {
      portfolioData.suggestedQuestions = userSuggestedQuestions;
    }
  } catch (error) {
    console.error("Error generating portfolio data:", error);
    portfolioData = {
      heroDescription: `I'm ${data.step1.fullName}. ${data.step2.professionalSummary}`,
      heroSubtitle: data.step1.currentTitle,
      impactMetrics: [],
      stats: [],
      problemFit: [],
      howIWork: { name: "", steps: [] },
      whyAiCv: [],
      suggestedQuestions: [],
    };
  }

  await storage.updateProfileById(profileId, {
    displayName: data.step1.fullName,
    roleTitle: data.step1.currentTitle,
    positioning:
      portfolioData.heroDescription || data.step2.professionalSummary,
    persona: portfolioData.chatbotPersona || portfolioData.heroDescription || data.step2.professionalSummary,
    tone: tone,
    answerStyle: toneMap[tone] || toneMap.direct,
    fallbackResponse: `I appreciate the question, but that's outside my area of expertise. I'm ${data.step1.fullName}, and I'm happy to discuss my experience as a ${data.step1.currentTitle}. Feel free to ask about my career history, key projects, or professional philosophy.`,
    photoUrl: data.step10?.headshot || null,
    resumeUrl: data.step3?.resumeUrl || null,
    brandingTheme: data.step10?.brandingTheme || "corporate",
    videoUrl: data.step10?.introVideo || null,
    cvResumeUrl: data.step10?.cvResume || null,
    heroSubtitle: portfolioData.heroSubtitle || null,
    stats: portfolioData.impactMetrics || portfolioData.stats || null,
    problemFit: portfolioData.problemFit || null,
    howIWork: portfolioData.howIWork || null,
    whyAiCv: portfolioData.whyAiCv || null,
    portfolioSuggestedQuestions: portfolioData.suggestedQuestions || null,
    careerTimeline: portfolioData.careerTimeline || null,
    skillsMatrix: skillsMatrixData?.skillsMatrix || null,
    skillTags: skillsMatrixData?.skillTags || null,
    whereImMostUseful: whereImMostUsefulData || null,
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
    const rawAchievementLines = data.step5.achievements
      .split("\n")
      .filter(Boolean);
    const achievementLines = cleanAchievements(rawAchievementLines).map(formatAchievement);
    if (achievementLines.length === 0) {
      // Skip achievements if all entries were NA/empty
    } else {
    let enhancedAchievements = achievementLines
      .map((a) => `- ${a}`)
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

    await storage.createFactBank({
      twinProfileId: profileId,
      companyName: "Key Achievements",
      roleName: data.step1.currentTitle,
      duration: "Career Highlights",
      facts: achievementLines,
    });
    } // end else (valid achievements)
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

export async function parseResumeWithGemini(pdfBuffer: Buffer) {
  const base64Pdf = pdfBuffer.toString("base64");

  const prompt = `You are a resume data extraction expert. Extract structured career information from this resume PDF.

CRITICAL INSTRUCTIONS:
- Extract ALL information exactly as written
- Preserve original wording for achievements (don't paraphrase)
- Use "Present" for current roles (not "Current" or "Now")
- If dates show just years like "2019-2021", output startDate as "2019" and endDate as "2021"
- If a field is missing, use empty string ("") or empty array ([])
- Extract skills as individual items, not grouped phrases

REQUIRED OUTPUT FORMAT (JSON ONLY, NO MARKDOWN):
{
  "name": "string (full name from resume)",
  "currentTitle": "string (most recent job title)",
  "email": "string (email if present, else empty)",
  "phone": "string (phone if present, else empty)",
  "location": "string (city, country format)",
  "linkedin": "string (LinkedIn URL if present, else empty)",
  "summary": "string (professional summary if present, 2-3 sentences max)",
  "roles": [
    {
      "title": "string (exact job title)",
      "company": "string (company name)",
      "years": "string (date range, e.g. '2020 - Present' or '2018 - 2020')",
      "achievements": "string (bullet points joined with newlines)"
    }
  ],
  "skills": ["string (individual skill, tool, or methodology)"],
  "achievements": ["string (quantified achievement statements)"]
}

Return ONLY valid JSON. No markdown code fences, no explanations, no preamble.`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { data: base64Pdf, mimeType: "application/pdf" } },
          ],
        },
      ],
    });

    const responseText = result.text || "";
    const cleanJson = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleanJson);

    if (!parsed.name) {
      throw new Error("Could not extract name from resume");
    }

    parsed.roles = parsed.roles || [];
    parsed.skills = parsed.skills || [];
    parsed.achievements = parsed.achievements || [];

    return parsed;
  } catch (error) {
    console.error("[Gemini Resume Parse] Error:", error);
    throw new Error("Failed to extract data from resume. The file may be corrupted or unreadable.");
  }
}

// ==================== QUESTIONNAIRE DRAFT GENERATOR ====================

interface ParsedResume {
  name?: string;
  currentTitle?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  summary?: string;
  roles?: Array<{ title: string; company: string; years: string; achievements: string }>;
  skills?: string[];
  achievements?: string[];
}

export async function generateQuestionnaireDraft(parsedResume: ParsedResume) {
  const rolesText = (parsedResume.roles || [])
    .map((r) => `- ${r.title} at ${r.company} (${r.years}): ${r.achievements}`)
    .join("\n");

  const prompt = `You are an expert career profile writer. Based on the resume data below, generate a complete pre-filled questionnaire draft for a Digital Twin AI career profile.

RESUME DATA:
Name: ${parsedResume.name || ""}
Title: ${parsedResume.currentTitle || ""}
Summary: ${parsedResume.summary || ""}
Roles:
${rolesText}
Skills: ${(parsedResume.skills || []).join(", ")}
Key Achievements: ${(parsedResume.achievements || []).join(" | ")}

TASK: Generate a complete questionnaire draft. Be specific using details from the resume. For war stories, Q&A, and objections, create realistic drafts — add [EDIT] wherever the person should personalise further with their own words/numbers.

REQUIRED OUTPUT FORMAT (JSON ONLY, NO MARKDOWN):
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
    "professionalSummary": "string (2-3 compelling sentences positioning this person as an expert — first person, confident)",
    "careerHistory": [
      { "company": "string", "title": "string", "years": "string", "achievements": "string (newline-separated bullet points)" }
    ]
  },
  "step3": {
    "resumeUrl": ""
  },
  "step4": {
    "stories": [
      {
        "title": "string (short name for the story, e.g. 'Rebuilt the sales pipeline at [Company]')",
        "challenge": "string (what was the high-stakes problem or pressure?)",
        "approach": "string (what did you uniquely do — your specific actions and decisions?)",
        "result": "string (quantified outcome — numbers where possible, add [EDIT] if unknown)"
      }
    ]
  },
  "step5": {
    "achievements": "string (5-8 quantified achievement statements, one per line starting with bullet •)"
  },
  "step6": {
    "technicalSkills": "string (comma-separated list of all tools, platforms, languages, methodologies)"
  },
  "step7": {
    "communicationStyle": "string (one of: direct, warm, technical, strategic)",
    "wordsUsedOften": "string (6-10 words or phrases this person likely uses — based on their industry and seniority)",
    "wordsAvoided": "synergy, leverage, move the needle, circle back",
    "writingSample": "string (2-3 sentences written exactly as this person would write them — casual but professional)"
  },
  "step8": {
    "questions": [
      { "question": "string", "answer": "string (specific draft answer using resume data, with [EDIT] where needed)" }
    ]
  },
  "step9": {
    "objections": [
      { "objection": "string (realistic tough question or concern)", "response": "string (confident, specific response using resume evidence)" }
    ]
  },
  "step10": {
    "brandingTheme": "string (one of: corporate, tech, creative — based on their industry)",
    "headshot": "",
    "introVideo": "",
    "cvResume": ""
  },
  "step11": {
    "suggestedQuestions": "string (5 suggested questions a recruiter or client might ask, one per line)",
    "specialInstructions": "Keep answers concise and confident. If asked about compensation, say you prefer to discuss details directly. Always end with an invitation to connect.",
    "easterEgg": ""
  }
}

RULES:
- step4.stories: generate exactly 3 stories from the most impactful roles/achievements
- step8.questions: generate exactly 5 likely questions with specific draft answers
- step9.objections: generate exactly 3 common objections with confident responses
- step10.brandingTheme: choose "corporate", "tech", or "creative" based on their industry
- step7.communicationStyle: choose one of direct/warm/technical/strategic based on their role type
- Use first person ("I") throughout
- Be specific — use company names, years, technologies from the resume
- Add [EDIT] markers where the user should add personal details, numbers, or context
- Return ONLY valid JSON. No markdown code fences, no explanations.`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const responseText = result.text || "";
    const cleanJson = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const draft = JSON.parse(cleanJson);

    // Enforce minimum array lengths as safety net
    if (!Array.isArray(draft.step4?.stories) || draft.step4.stories.length < 3) {
      draft.step4 = {
        stories: [
          { title: "[EDIT] Key project or initiative", challenge: "[EDIT] What was the challenge?", approach: "[EDIT] What did you do?", result: "[EDIT] What was the outcome?" },
          { title: "[EDIT] Key project or initiative", challenge: "[EDIT] What was the challenge?", approach: "[EDIT] What did you do?", result: "[EDIT] What was the outcome?" },
          { title: "[EDIT] Key project or initiative", challenge: "[EDIT] What was the challenge?", approach: "[EDIT] What did you do?", result: "[EDIT] What was the outcome?" },
        ],
      };
    }
    if (!Array.isArray(draft.step8?.questions) || draft.step8.questions.length < 3) {
      draft.step8 = {
        questions: [
          { question: "What are your core areas of expertise?", answer: "[EDIT] Add your answer" },
          { question: "What types of roles or projects excite you most?", answer: "[EDIT] Add your answer" },
          { question: "How do you prefer to work with teams?", answer: "[EDIT] Add your answer" },
        ],
      };
    }
    if (!Array.isArray(draft.step9?.objections) || draft.step9.objections.length < 2) {
      draft.step9 = {
        objections: [
          { objection: "[EDIT] Add a common concern people have", response: "[EDIT] Your confident response" },
          { objection: "[EDIT] Add a common concern people have", response: "[EDIT] Your confident response" },
        ],
      };
    }

    logger.debug("[Questionnaire Draft] Generated successfully", {
      name: parsedResume.name,
      storiesCount: draft.step4?.stories?.length,
      questionsCount: draft.step8?.questions?.length,
    });

    return draft;
  } catch (error) {
    logger.error("[Questionnaire Draft] Error generating draft", { error: String(error) });
    throw new Error("Failed to generate questionnaire draft from resume.");
  }
}
