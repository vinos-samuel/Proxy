/**
 * Seeds 4 test accounts, each frozen at a different funnel stage, so testing
 * never requires typing profile content by hand. Idempotent — rerun anytime.
 *
 * Usage: npm run seed:test
 * Refuses to run against a database that looks like production unless --force
 * is passed (existing customer count > SAFETY_THRESHOLD is treated as prod-like).
 * Deletion/creation only ever touches the 4 known @proxy.test emails below,
 * so even a --force run against the wrong database cannot affect real users.
 */
import bcrypt from "bcryptjs";
import { db } from "../server/db";
import { customers, chatMessages } from "@shared/schema";
import { storage } from "../server/storage";

const SAFETY_THRESHOLD = 20;
const FORCE = process.argv.includes("--force");

const TEST_EMAILS = [
  "test-fresh@proxy.test",
  "test-draft@proxy.test",
  "test-ready@proxy.test",
  "test-live@proxy.test",
] as const;

const PASSWORD = "test1234";

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

// Shared draft content for Priya Nair — reused across the draft/ready/live
// personas so they represent the same person at different funnel stages.
function priyaQuestionnaireData() {
  return {
    step1: {
      fullName: "Priya Nair",
      currentTitle: "Head of Operations, APAC",
      email: "priya.nair.test@example.com",
      phone: "+65 9123 4567",
      linkedinUrl: "linkedin.com/in/priyanairtest",
      location: "Singapore",
    },
    step2: {
      professionalSummary:
        "I run regional operations for a financial services bank — 18 years, 3 countries, 140-person team. I led a core banking migration for 40,000 accounts with zero client-impacting downtime.",
      careerHistory: [
        {
          company: "Meridian Trust Bank",
          title: "Head of Operations, APAC",
          years: "2019 - Present",
          achievements:
            "Run a 140-person operations team across 3 countries. Led the core banking migration for 40,000 accounts with zero downtime. Cut settlement turnaround from 3.2 days to 1.1 days. Reduced cost per transaction by 22% over 3 years.",
        },
        {
          company: "Meridian Trust Bank",
          title: "Director, Client Operations",
          years: "2015 - 2019",
          achievements:
            "Built the client onboarding function from scratch, cutting onboarding time from 14 days to 3. Managed integration of a 60-person team after an acquisition. Owned the MAS regulatory reporting relationship through 2 audit cycles, zero findings.",
        },
        {
          company: "Straits Fund Services",
          title: "Operations Manager",
          years: "2010 - 2015",
          achievements:
            "Managed fund administration for a $2.1B AUM book across 30 fund structures. Introduced a daily NAV exception dashboard that cut late NAVs from 8% to under 1%.",
        },
      ],
    },
    step3: { resumeUrl: "" },
    step4: {
      stories: [
        {
          title: "The core banking migration",
          challenge:
            "40,000 client accounts had to move to a new core banking platform with regulators watching and zero tolerance for client-facing downtime.",
          approach:
            "Built a parallel-run plan with a 6-week reconciliation window, ran 3 full rehearsal cutovers, and put a dedicated war room in place for the live migration weekend.",
          result:
            "Migrated all 40,000 accounts with zero client-impacting downtime and no regulatory findings.",
        },
        {
          title: "Fixing the onboarding backlog",
          challenge:
            "New client onboarding was taking 14 days on average, and losing deals to competitors who could turn around faster.",
          approach:
            "Mapped the full onboarding workflow, removed 4 redundant approval steps, and built a single intake form replacing 3 separate ones.",
          result: "Cut onboarding time from 14 days to 3 days within 2 quarters.",
        },
        {
          title: "Post-acquisition team integration",
          challenge:
            "A 60-person team joined through an acquisition with a different operating model, different tools, and low morale.",
          approach:
            "Spent the first 30 days in listening sessions before changing anything, then migrated the team onto our platform in 3 phased waves over 4 months.",
          result: "Retained 92% of the acquired team through the transition, above the board's 80% target.",
        },
      ],
    },
    step5: {
      achievements:
        "Migrated 40,000 accounts with zero downtime\nCut settlement turnaround from 3.2 days to 1.1 days\nReduced cost per transaction by 22% over 3 years\nCut client onboarding time from 14 days to 3 days\nZero regulatory findings across 2 MAS audit cycles",
    },
    step6: {
      technicalSkills:
        "Operations Strategy, Regulatory Reporting (MAS), Core Banking Migration, Process Automation, Vendor Management, Fund Administration, Client Onboarding, Risk & Controls",
    },
    step7: {
      communicationStyle: "direct",
      wordsUsedOften: "turnaround, exceptions, zero downtime, regulatory",
      wordsAvoided: "synergy, leverage, seamless",
      writingSample: "",
    },
    step8: {
      questions: [
        {
          question: "How did you manage the core banking migration risk?",
          answer:
            "We ran 3 full rehearsal cutovers before the live weekend, with a 6-week parallel reconciliation window so we could catch discrepancies before they touched a client account.",
        },
        {
          question: "What's your approach to a struggling team?",
          answer:
            "I spend the first 30 days listening before changing anything. Most operational problems are process problems, not people problems, and you can't tell the difference until you understand how the work actually gets done.",
        },
        {
          question: "How do you handle regulator relationships?",
          answer:
            "Treat every audit as a chance to find problems before they find you. I run our own internal audit 2 months ahead of the regulator's cycle.",
        },
      ],
    },
    step9: {
      objections: [
        {
          objection: "No direct P&L ownership",
          response:
            "My budget authority is $18M annually and every initiative I run is measured against a cost or revenue-protection target — the discipline is the same as P&L ownership even without the title.",
        },
        {
          objection: "Mostly regional, not global experience",
          response:
            "3 countries with very different regulatory regimes (MAS, HKMA, RBI) is a harder operating environment than most single-market global roles.",
        },
      ],
    },
    step10: { brandingTheme: "corporate", headshot: "", introVideo: "", cvResume: "" },
    step11: {
      suggestedQuestions:
        "How did you migrate 40,000 accounts with zero downtime?\nWhat's your approach when you inherit a struggling team?",
      specialInstructions: "",
      easterEgg: "",
    },
    _aiDraft: true,
    _aiDraftGeneratedAt: new Date().toISOString(),
  };
}

async function ensureCustomer(email: string, username: string, name: string) {
  const existing = await storage.getCustomerByEmail(email);
  if (existing) {
    // cascade deletes twin_profiles, knowledge_entries, chat_messages via FK onDelete: "cascade"
    await storage.deleteCustomer(existing.id);
  }
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  return storage.createCustomer({
    email,
    passwordHash,
    name,
    username,
    emailVerified: true,
  } as any);
}

async function seedFresh() {
  await ensureCustomer("test-fresh@proxy.test", "test-fresh", "Fresh Signup");
  // No profile row — represents a brand new, unverified-free-of-profile user
}

async function seedDraft() {
  const customer = await ensureCustomer("test-draft@proxy.test", "test-draft", "Priya Nair (Draft)");
  await storage.upsertProfile({
    customerId: customer.id,
    displayName: "Priya Nair",
    roleTitle: "Head of Operations, APAC",
    status: "draft",
    questionnaireData: priyaQuestionnaireData(),
  });
}

async function seedReady() {
  const customer = await ensureCustomer("test-ready@proxy.test", "test-ready", "Priya Nair (Ready)");
  await storage.upsertProfile({
    customerId: customer.id,
    displayName: "Priya Nair",
    roleTitle: "Head of Operations, APAC",
    positioning:
      "I run regional operations for a financial services bank — 18 years, 3 countries, 140-person team.",
    persona:
      "Direct, numbers-first operations leader. Talks in outcomes: turnaround times, cost per transaction, zero-downtime migrations.",
    tone: "direct",
    answerStyle: "Direct and specific, always anchored to a number or a named project.",
    fallbackResponse:
      "That's outside what I can speak to directly — happy to connect you with Priya on that one.",
    heroSubtitle: "Head of Operations, APAC",
    stats: [
      { value: "18", label: "Years in Ops", icon: "clock" },
      { value: "40K", label: "Accounts Migrated", icon: "database" },
      { value: "22%", label: "Cost Reduction", icon: "trending-down" },
    ],
    careerTimeline: [
      {
        company: "Meridian Trust Bank",
        roles: [
          {
            title: "Head of Operations, APAC",
            years: "2019 - Present",
            achievements: ["Migrated 40,000 accounts with zero downtime", "Cut cost per transaction by 22%"],
          },
          {
            title: "Director, Client Operations",
            years: "2015 - 2019",
            achievements: ["Cut onboarding time from 14 days to 3 days"],
          },
        ],
      },
      {
        company: "Straits Fund Services",
        roles: [
          {
            title: "Operations Manager",
            years: "2010 - 2015",
            achievements: ["Managed $2.1B AUM fund administration book"],
          },
        ],
      },
    ],
    portfolioSuggestedQuestions: [
      "How did you migrate 40,000 accounts with zero downtime?",
      "What's your approach when you inherit a struggling team?",
    ],
    status: "ready",
    questionnaireData: priyaQuestionnaireData(),
    profileReadyAt: new Date(),
  });
}

async function seedLive() {
  const customer = await ensureCustomer("test-live@proxy.test", "test-live", "Priya Nair (Live)");
  const profile = await storage.upsertProfile({
    customerId: customer.id,
    displayName: "Priya Nair",
    roleTitle: "Head of Operations, APAC",
    positioning:
      "I run regional operations for a financial services bank — 18 years, 3 countries, 140-person team.",
    persona:
      "Direct, numbers-first operations leader. Talks in outcomes: turnaround times, cost per transaction, zero-downtime migrations.",
    tone: "direct",
    answerStyle: "Direct and specific, always anchored to a number or a named project.",
    fallbackResponse:
      "That's outside what I can speak to directly — happy to connect you with Priya on that one.",
    heroSubtitle: "Head of Operations, APAC",
    stats: [
      { value: "18", label: "Years in Ops", icon: "clock" },
      { value: "40K", label: "Accounts Migrated", icon: "database" },
      { value: "22%", label: "Cost Reduction", icon: "trending-down" },
    ],
    careerTimeline: [
      {
        company: "Meridian Trust Bank",
        roles: [
          {
            title: "Head of Operations, APAC",
            years: "2019 - Present",
            achievements: ["Migrated 40,000 accounts with zero downtime", "Cut cost per transaction by 22%"],
          },
          {
            title: "Director, Client Operations",
            years: "2015 - 2019",
            achievements: ["Cut onboarding time from 14 days to 3 days"],
          },
        ],
      },
      {
        company: "Straits Fund Services",
        roles: [
          {
            title: "Operations Manager",
            years: "2010 - 2015",
            achievements: ["Managed $2.1B AUM fund administration book"],
          },
        ],
      },
    ],
    portfolioSuggestedQuestions: [
      "How did you migrate 40,000 accounts with zero downtime?",
      "What's your approach when you inherit a struggling team?",
    ],
    status: "published",
    questionnaireData: priyaQuestionnaireData(),
    paymentStatus: "paid",
    tier: "free",
    isPublic: true,
    freePublishedAt: daysAgo(10),
    publicDomain: "myproxy.work/portfolio/test-live",
    viewCount: 23,
    profileReadyAt: daysAgo(10),
  });

  // Minimal knowledge base so the live chat has something real to answer from
  await storage.createKnowledgeEntry({
    twinProfileId: profile.id,
    entryId: "core-banking-migration",
    type: "experience",
    title: "The Core Banking Migration",
    content: null,
    challenge: "40,000 client accounts had to move to a new core banking platform with zero tolerance for client-facing downtime.",
    approach: "Built a parallel-run plan with a 6-week reconciliation window and ran 3 full rehearsal cutovers before the live weekend.",
    result: "Migrated all 40,000 accounts with zero client-impacting downtime and no regulatory findings.",
    scale: "Meridian Trust Bank, 3 countries, 140-person ops team",
    intent: ["behavioral"],
    keywords: ["migration", "core banking", "downtime", "risk"],
  });
  await storage.createKnowledgeEntry({
    twinProfileId: profile.id,
    entryId: "about-me",
    type: "canonical",
    title: "Tell Me About Yourself",
    content:
      "I'm Priya Nair, Head of Operations APAC at Meridian Trust Bank. 18 years in financial services operations across Singapore, Hong Kong and India. I run a 140-person team and I'm most known for migrating 40,000 client accounts to a new core banking platform with zero downtime.",
    challenge: null,
    approach: null,
    result: null,
    scale: null,
    intent: ["intro"],
    keywords: ["about", "background", "who", "introduction"],
  });

  // 6 fake visitor questions spread over the last 10 days
  const fakeQuestions = [
    { q: "How did you manage the core banking migration risk?", daysBack: 9 },
    { q: "What's your leadership style with a struggling team?", daysBack: 7 },
    { q: "Do you have experience with regulatory audits?", daysBack: 5 },
    { q: "What's your experience with fund administration?", daysBack: 4 },
    { q: "How large a team have you managed directly?", daysBack: 2 },
    { q: "What would you want to do next in your career?", daysBack: 1 },
  ];
  for (const { q, daysBack } of fakeQuestions) {
    await db.insert(chatMessages).values({
      profileId: profile.id,
      question: q,
      askedAt: daysAgo(daysBack),
    });
  }
}

async function main() {
  const dbUrl = process.env.DATABASE_URL || "";
  const hostMatch = dbUrl.match(/@([^/:]+)/);
  const host = hostMatch ? hostMatch[1] : "(unknown host)";

  console.log(`\nTarget database host: ${host}`);

  const allCustomers = await db.select({ id: customers.id }).from(customers);
  const customerCount = allCustomers.length;

  if (customerCount > SAFETY_THRESHOLD && !FORCE) {
    console.error(
      `\nRefusing to run: this database has ${customerCount} customers, which looks like production (safety threshold: ${SAFETY_THRESHOLD}).`
    );
    console.error(`If you are certain this is safe, rerun with: npm run seed:test -- --force\n`);
    console.error(`Note: even with --force, this script only ever creates/deletes the 4 @proxy.test accounts below — it cannot touch real user data.\n`);
    process.exit(1);
  }

  console.log(`Seeding 4 test accounts (customer count on this DB: ${customerCount})...\n`);

  await seedFresh();
  await seedDraft();
  await seedReady();
  await seedLive();

  const loginUrl = process.env.NODE_ENV === "production" ? "https://myproxy.work/login" : "https://worf.replit.dev/login";

  console.log("============================================");
  console.log(" TEST ACCOUNTS READY — myproxy.work workspace");
  console.log("============================================");
  console.log(` test-fresh@proxy.test   / ${PASSWORD}   -> no profile yet`);
  console.log(` test-draft@proxy.test   / ${PASSWORD}   -> AI draft, not submitted`);
  console.log(` test-ready@proxy.test   / ${PASSWORD}   -> processed, ready to publish`);
  console.log(` test-live@proxy.test    / ${PASSWORD}   -> published, 23 views, 6 questions`);
  console.log("============================================");
  console.log(` Login at: ${loginUrl}`);
  console.log("============================================\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed test error:", err);
  process.exit(1);
});
