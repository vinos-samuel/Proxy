// Copy for the Pro plan. The first line is the Job Search Agent, which
// the server reserves for tier "pro" with a confirmed payment (new accounts
// also get 48 hours). The other lines are the edit window and visitor questions.
// The amount is not shown on Proxy. Stripe shows the charge before payment.

export const PRO_BUTTON_LABEL = "Get Pro";
export const PRO_FOR = "For the job search after your page is live.";
export const PRO_FEATURES = [
  "Job Search Agent: cover letters, outreach, interview practice, thank-you notes, and offer notes from your account",
  "Edit whenever you want, including after the first week",
  "See the questions visitors ask",
] as const;
