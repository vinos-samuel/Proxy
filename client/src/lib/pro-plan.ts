// Copy for the $49 Pro plan. The first line is the Job Search Agent, which
// the server reserves for tier "pro" with a confirmed payment (new accounts
// also get 48 hours). The other lines are the edit window and visitor questions.

export const PRO_PRICE = "$49";
export const PRO_BUTTON_LABEL = "Get Pro · $49 once";
export const PRO_FOR = "For the job search after your page is live.";
export const PRO_FEATURES = [
  "Job Search Agent: cover letters, outreach, interview practice, thank-you notes, and offer notes from your account",
  "Edit whenever you want, including after the first week",
  "See the questions visitors ask",
] as const;

// Homepage section after Work cards. The button label and destination stay
// on the existing Pro CTA (PRO_BUTTON_LABEL and the landing proHref).
export const JOB_SEARCH_AGENT_HOME = {
  eyebrow: "Job Search Agent",
  headline: "Draft the search from the page you already have.",
  subhead: "It uses the roles, employers, and numbers saved on your page.",
  bullets: [
    "A message to a contact",
    "A shorter follow-up",
    "A cover letter, when the job description is saved",
    "Interview practice, one question at a time",
    "A thank-you note",
    "Notes on an offer, when the salary numbers are saved",
  ],
  price: "Pro, $49 once",
} as const;
