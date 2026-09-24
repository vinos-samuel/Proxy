import { choice, TypeSafeClient } from "@typesafe-ai/sdk";
import type { ImprovementQuestion, ProfileDocument } from "@shared/profile-document";
import { logger } from "./logger";

export type QuestionSelection = {
  question: ImprovementQuestion | null;
  source: "jev" | "rules" | "none";
  confidence: number | null;
};

const MIN_SELECTION_CONFIDENCE = 0.62;

export async function selectImprovementQuestion(
  document: ProfileDocument,
  candidates: ImprovementQuestion[],
): Promise<QuestionSelection> {
  if (!candidates.length) return { question: null, source: "none", confidence: null };
  if (candidates.length === 1 || !process.env.TYPESAFE_API_KEY) {
    return { question: candidates[0], source: "rules", confidence: null };
  }

  const shortlist = candidates.slice(0, 6);
  const criteria = Object.fromEntries(
    shortlist.map((candidate) => [
      candidate.id,
      `${candidate.label}: ${candidate.question}. Prefer this only if the answer would materially improve clarity or evidence.`,
    ]),
  );

  try {
    const client = new TypeSafeClient({
      apiKey: process.env.TYPESAFE_API_KEY,
      timeout: 4_000,
      retry: { maxRetries: 0 },
    });
    const response = await client.systemOne({
      model: "jev-1.13.0",
      state: {
        professional: {
          title: document.identity.title,
          headline: document.identity.headline,
          summary: document.identity.summary,
        },
        projects: document.projects.map((project) => ({
          id: project.id,
          title: project.title,
          challenge: project.challenge || null,
          contribution: project.contribution || null,
          outcome: project.outcome || null,
        })),
        candidates: shortlist.map(({ id, label, question, field }) => ({ id, label, question, field })),
      },
      questions: {
        next: choice(
          "Which single candidate question would add the most useful missing evidence to this professional profile? Select from the supplied candidate ids. Do not reward requests for numbers when a qualitative outcome would be sufficient.",
          criteria,
        ),
      },
    });
    const selected = shortlist.find((candidate) => candidate.id === response.answers.next.choice);
    const priorityFloor = candidates[0].priority - 2;
    if (selected && selected.priority >= priorityFloor && response.answers.next.confidence >= MIN_SELECTION_CONFIDENCE) {
      return {
        question: selected,
        source: "jev",
        confidence: response.answers.next.confidence,
      };
    }
    return { question: candidates[0], source: "rules", confidence: response.answers.next.confidence };
  } catch (error) {
    logger.info("[Profile Builder] Jev question selection unavailable; using rules", {
      error: String(error),
    });
    return { question: candidates[0], source: "rules", confidence: null };
  }
}
