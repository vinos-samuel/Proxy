// Reviewed answers for Priya Sharma's public sample. Every figure is copied
// from her live page: the CoE is 4 countries (Singapore, India, Australia,
// Japan) and 42 specialists; the VMS is 6 markets; time-to-offer moved from
// 52 days to 29. These are served instead of a live model reply.

export const PRIYA_PAGE_FACTS = [
  "42 specialists",
  "4 countries",
  "Singapore, India, Australia, and Japan",
  "38%",
  "SGD 85M",
  "94%",
  "18 months",
  "6 markets",
  "3 months",
  "SGD 1.2M",
  "14 business units",
  "52 to 29 days",
  "72 candidate NPS",
  "benchmark of 41",
  "67% to 93%",
  "120+ graduates",
  "91% first-year retention",
  "47 to 12 agencies",
  "SGD 600K",
  "3 fragmented TA teams",
  "7 months",
  "5 RPO accounts",
  "800+ hires",
  "3 new RPO contracts",
  "SGD 4.2M",
].join("\n");

const ANSWERS: Array<{ question: string; answer: string }> = [
  {
    question: "What do you see as the biggest emerging challenge in talent acquisition for the APAC region?",
    answer: "I don't publish a market forecast on this page. The operating problem I worked on at Nexora Group was building hiring in-house across APAC. I built an internal TA Centre of Excellence from scratch to 42 specialists in Singapore, India, Australia, and Japan. External agency spend fell by 38%. Data-led hiring dashboards, adopted by 14 business units, brought average time-to-offer from 52 days to 29.",
  },
  {
    question: "How do you leverage data and analytics to inform your talent strategy decisions?",
    answer: "At Nexora Group I introduced data-led hiring dashboards that 14 business units adopted. Average time-to-offer moved from 52 days to 29. The candidate NPS programme across the TA function reached 72, against an industry benchmark of 41.",
  },
  {
    question: "Can you describe a time you had to pivot your talent strategy due to unexpected market changes?",
    answer: "The change written on my page is the post-acquisition integration at Nexora Group. I consolidated 3 fragmented TA teams into a single delivery model, and the integration took 7 months. I don't have a separate note here about an unexpected market swing.",
  },
  {
    question: "What's your approach to developing and retaining top talent within your own TA teams?",
    answer: "I built the TA Centre of Excellence at Nexora Group from scratch to 42 specialists across Singapore, India, Australia, and Japan. The graduate programme on my page is separate: 120+ graduates a year, with 91% still there after the first year.",
  },
  {
    question: "How do you ensure diversity and inclusion are embedded within your talent acquisition processes?",
    answer: "That practice isn't written on my page. I can talk about the TA Centre of Excellence, the regional MSP for SGD 85M in contractor spend, or the hiring dashboards.",
  },
];

function normalizeQuestion(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/[?]+$/g, "");
}

const BY_QUESTION = new Map(ANSWERS.map((item) => [normalizeQuestion(item.question), item.answer]));

export const PRIYA_REVIEWED_QUESTIONS = ANSWERS.map((item) => item.question);

export function reviewedPriyaAnswer(question: string): string | undefined {
  return BY_QUESTION.get(normalizeQuestion(question));
}
