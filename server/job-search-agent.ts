import { GoogleGenAI } from "@google/genai";
import { storage } from "./storage";
import { logger } from "./logger";
import {
  agentProfileContext,
  cleanPromptText,
  openingInstruction,
  systemPromptFor,
  type AgentActionType,
  type AgentEntityType,
} from "./job-search-prompts";

export type { AgentActionType, AgentEntityType };

export const JOB_AGENT_MODEL = "gemini-2.5-flash";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

interface AgentSession {
  customerId: string;
  actionType: AgentActionType;
  entityType: AgentEntityType;
  entityData: Record<string, any>;
  systemPrompt: string;
  messages: Array<{ role: "user" | "model"; parts: [{ text: string }] }>;
}

const agentSessions = new Map<string, AgentSession>();

async function profileContextFor(customerId: string): Promise<string> {
  const profile = await storage.getProfileByCustomerId(customerId);
  if (!profile) {
    return agentProfileContext({}).text;
  }
  const row = await storage.getProfileDocumentByProfileId(profile.id);
  return agentProfileContext({
    workingDocument: row?.workingDocument ?? null,
    activeDocument: row?.activeDocument ?? null,
    questionnaireData: profile.questionnaireData,
    displayName: profile.displayName,
    roleTitle: profile.roleTitle,
    positioning: profile.positioning,
    tone: profile.tone,
  }).text;
}

export async function completeAgentTurn(
  systemPrompt: string,
  contents: Array<{ role: "user" | "model"; parts: [{ text: string }] }>,
): Promise<{ text: string; requestedModel: string; modelVersion: string | null }> {
  const response = await ai.models.generateContent({
    model: JOB_AGENT_MODEL,
    config: { systemInstruction: systemPrompt, temperature: 0.4 },
    contents,
  });
  return {
    text: response.text || "",
    requestedModel: JOB_AGENT_MODEL,
    modelVersion: response.modelVersion || null,
  };
}

export async function startAgentSession(
  customerId: string,
  actionType: AgentActionType,
  entityType: AgentEntityType,
  entityData: Record<string, any>,
): Promise<{ sessionId: string; message: string; modelVersion: string | null }> {
  const profileContext = await profileContextFor(customerId);
  const systemPrompt = systemPromptFor(actionType, profileContext, entityData);
  const opening = openingInstruction(actionType, entityData);

  logger.info("[JobAgent] Starting session", { customerId, actionType, entityType });

  const result = await completeAgentTurn(systemPrompt, [
    { role: "user", parts: [{ text: opening }] },
  ]);
  const message = result.text || "Ready to help. Add a bit more of what is already saved and I will draft from that.";

  const sessionId = `job-agent-${customerId}-${Date.now()}`;
  agentSessions.set(sessionId, {
    customerId,
    actionType,
    entityType,
    entityData,
    systemPrompt,
    messages: [
      { role: "user", parts: [{ text: opening }] },
      { role: "model", parts: [{ text: message }] },
    ],
  });

  return { sessionId, message, modelVersion: result.modelVersion };
}

export async function sendAgentMessage(
  sessionId: string,
  customerId: string,
  userMessage: string,
): Promise<string> {
  const session = agentSessions.get(sessionId);
  if (!session) throw new Error("No active agent session");
  if (session.customerId !== customerId) throw new Error("Session ownership mismatch");

  const sanitized = cleanPromptText(userMessage, 2000);
  const updated: AgentSession["messages"] = [
    ...session.messages,
    { role: "user", parts: [{ text: sanitized }] },
  ];

  const result = await completeAgentTurn(session.systemPrompt, updated);
  const reply = result.text || "Could you say that another way?";
  session.messages = [...updated, { role: "model", parts: [{ text: reply }] }];
  return reply;
}
