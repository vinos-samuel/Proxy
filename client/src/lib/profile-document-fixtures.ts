import type { ProfileDocument, ProfileStyle } from "@shared/profile-document";

// Development-only visual fixture. It is never sent to an API or used by the upload path.
export function visualProfileFixture(style: ProfileStyle = "editorial"): ProfileDocument {
  return {
    schemaVersion: 1,
    style,
    identity: {
      name: "Maya Ramanathan",
      title: "Regional Operations & Transformation Leader",
      location: "Singapore",
      headline: "I turn fragmented regional operations into systems people can trust.",
      summary: "I work where customer experience, operating discipline, and change meet. My strongest work makes complex services easier to run and easier to use.",
      photoUrl: null,
    },
    projects: [
      { id: "project-1", title: "A shared operating model across six markets", company: "Northstar Services", challenge: "Local teams had different handoffs, measures, and escalation paths.", contribution: "I mapped the failure points with market leads, set one operating cadence, and gave local teams clear decision rights.", outcome: "Leaders could see risks earlier and teams resolved more work without regional escalation.", sourceIds: ["source-1"] },
      { id: "project-2", title: "Rebuilding a high-friction customer journey", company: "Atlas Group", challenge: "Customers repeated the same information across four teams.", contribution: "I brought operations, product, and service teams around one journey and simplified the ownership model.", outcome: "The new flow reduced avoidable handoffs and gave customers one clear route to resolution.", sourceIds: ["source-2"] },
    ],
    experience: [
      { id: "role-1", company: "Northstar Services", title: "Regional Operations Director", period: "2022–Present", summary: "Lead service operations and transformation across six Asian markets.", highlights: ["Built a shared operating cadence across country teams", "Led cross-functional service redesign"], sourceIds: ["source-1"] },
      { id: "role-2", company: "Atlas Group", title: "Head of Service Excellence", period: "2018–2022", summary: "Improved customer journeys, controls, and frontline ways of working.", highlights: ["Connected product and operations around one customer journey"], sourceIds: ["source-2"] },
    ],
    skills: ["Regional operations", "Service design", "Operating models", "Change leadership", "Customer experience"],
    contact: { email: "maya@example.com", linkedin: "https://linkedin.com/in/maya-example", website: null, showEmail: true, showLinkedin: true, showWebsite: false },
    publicBotEnabled: false,
    sources: [
      { id: "source-1", kind: "resume", label: "Northstar role", excerpt: "Fictional visual fixture" },
      { id: "source-2", kind: "resume", label: "Atlas role", excerpt: "Fictional visual fixture" },
    ],
    skippedQuestionIds: [], answeredQuestionIds: [], pendingProposal: null, undoStack: [],
  };
}
