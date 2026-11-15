// Copy for the $49 Pro plan. Only list what the product actually gates to a
// paid tier: unlimited edits (server) and the text of visitor questions
// (dashboard). The Job Search Agent is not in this list. Its page hides it
// for some accounts, but the API does not check the plan, and a free publish
// sets paymentStatus to "paid", which the page treats as Pro.

export const PRO_PRICE = "$49";
export const PRO_BUTTON_LABEL = "Get Pro · $49 once";
export const PRO_FOR = "For the job search after your page is live.";
export const PRO_FEATURES = [
  "Edit whenever you want, including after the first week",
  "See the questions visitors ask",
] as const;
