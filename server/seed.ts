import { storage } from "./storage";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  try {
    // Check if admin already exists
    const existingAdmin = await storage.getCustomerByEmail("admin@digitaltwin.studio");
    if (existingAdmin) return;

    console.log("Seeding database...");

    // Create admin user
    const adminHash = await bcrypt.hash("admin123", 10);
    await storage.createCustomer({
      email: "admin@digitaltwin.studio",
      passwordHash: adminHash,
      name: "Admin",
      username: "admin",
    });

    // Update admin flag directly
    const admin = await storage.getCustomerByEmail("admin@digitaltwin.studio");
    if (admin) {
      const { db } = await import("./db");
      const { customers } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      await db.update(customers).set({ isAdmin: true }).where(eq(customers.id, admin.id));
    }

    // Create demo user with published profile
    const demoHash = await bcrypt.hash("demo1234", 10);
    const demoUser = await storage.createCustomer({
      email: "sarah@example.com",
      passwordHash: demoHash,
      name: "Sarah Chen",
      username: "demo",
    });

    // Create demo profile
    const demoProfile = await storage.upsertProfile({
      customerId: demoUser.id,
      displayName: "Sarah Chen",
      roleTitle: "VP of Engineering",
      positioning: "I build world-class engineering teams that deliver products users love",
      persona: "A hands-on engineering leader with 15 years of experience scaling teams from 5 to 200+ engineers. Known for balancing technical excellence with business outcomes.",
      tone: "direct",
      answerStyle: "Direct, confident, and concise with specific examples and metrics.",
      fallbackResponse: "That's a great question, but it falls outside my primary expertise. I'm best at discussing engineering leadership, team building, and scaling technology organizations. What would you like to know about those areas?",
      photoUrl: null,
      resumeUrl: null,
      status: "published",
      questionnaireData: {
        step4: {
          contactEmail: "sarah@example.com",
          contactLinkedin: "linkedin.com/in/sarahchen",
          contactPhone: "",
          influences: "Inspired by 'An Elegant Puzzle' by Will Larson, 'Radical Candor' by Kim Scott, and 'The Manager's Path' by Camille Fournier.",
          limitations: "I don't claim deep expertise in AI/ML algorithms, hardware engineering, or cybersecurity. I defer to specialists in these areas.",
        },
      },
    });

    // Create fact banks
    await storage.createFactBank({
      twinProfileId: demoProfile.id,
      companyName: "TechScale Inc",
      roleName: "VP of Engineering",
      duration: "2021 - Present",
      facts: [
        "Scaled engineering team from 30 to 180 engineers in 2 years",
        "Reduced deployment failures by 85% through CI/CD improvements",
        "Launched 3 major product lines generating $45M ARR",
        "Introduced engineering career ladder adopted company-wide",
        "Led architecture migration from monolith to microservices"
      ],
    });

    await storage.createFactBank({
      twinProfileId: demoProfile.id,
      companyName: "DataFlow Systems",
      roleName: "Engineering Director",
      duration: "2017 - 2021",
      facts: [
        "Built and led a team of 45 engineers across 6 squads",
        "Delivered real-time data pipeline processing 2B events/day",
        "Reduced infrastructure costs by 40% through optimization",
        "Mentored 8 engineers into senior+ roles",
        "Achieved 99.99% uptime SLA for mission-critical services"
      ],
    });

    await storage.createFactBank({
      twinProfileId: demoProfile.id,
      companyName: "StartupXYZ",
      roleName: "Senior Software Engineer",
      duration: "2013 - 2017",
      facts: [
        "Employee #5, helped grow to 100+ employees",
        "Designed core API serving 10M+ requests/day",
        "Led mobile app development from scratch to 500K users",
        "Implemented A/B testing framework used by product team"
      ],
    });

    // Create knowledge entries
    await storage.createKnowledgeEntry({
      twinProfileId: demoProfile.id,
      entryId: "about-me",
      type: "canonical",
      title: "Tell Me About Yourself",
      content: "I'm Sarah Chen, VP of Engineering at TechScale Inc. Over the past 15 years, I've built my career around a simple belief: great engineering organizations are built on trust, clarity, and relentless focus on outcomes.\n\nI started as employee #5 at a startup where I learned to ship fast and iterate. That experience shaped my approach to engineering leadership - I believe in empowering teams with clear goals and the autonomy to figure out the best path forward. At DataFlow Systems, I grew from managing a single team to leading 45 engineers across 6 squads, delivering a real-time data pipeline processing 2 billion events daily.\n\nNow at TechScale, I've scaled our engineering organization from 30 to 180 engineers while launching 3 major product lines generating $45M in ARR. I'm passionate about building engineering cultures where people do the best work of their careers.",
      challenge: null,
      approach: null,
      result: null,
      scale: null,
      intent: ["intro", "framing"],
      keywords: ["about", "yourself", "introduction", "who", "background", "tell me", "career", "experience"],
    });

    await storage.createKnowledgeEntry({
      twinProfileId: demoProfile.id,
      entryId: "failure-platform-migration",
      type: "experience",
      title: "The Platform Migration That Almost Failed",
      content: null,
      challenge: "We were migrating our core platform from a monolithic architecture to microservices while simultaneously serving 10M+ daily active users. Three months in, our migration was 2 months behind schedule, team morale was dropping, and customers were experiencing increased latency.",
      approach: "I paused the migration, gathered the team for a frank retrospective, and we identified that we were trying to migrate too many services at once. I restructured the approach into smaller, independent migration waves with clear rollback plans. I also created a 'migration war room' with daily standups and real-time monitoring dashboards.",
      result: "We completed the migration in 4 months (vs. the original 6-month timeline), reduced API latency by 60%, and had zero customer-facing incidents during the final migration waves. The approach became our standard playbook for all future large-scale changes.",
      scale: "TechScale Inc, 180 engineers, 10M+ DAU, $200M+ revenue platform",
      intent: ["behavioral"],
      keywords: ["failure", "migration", "monolith", "microservices", "scaling", "challenge", "setback", "lesson", "architecture"],
    });

    await storage.createKnowledgeEntry({
      twinProfileId: demoProfile.id,
      entryId: "commercial-growth-product",
      type: "experience",
      title: "Building the Enterprise Product Line",
      content: null,
      challenge: "TechScale was purely a self-serve product with $15M ARR. The board wanted us to enter the enterprise market, but we had no enterprise features, no sales engineering team, and our architecture wasn't ready for enterprise-grade SLAs.",
      approach: "I worked closely with the Head of Sales to identify the top 10 enterprise requirements. I formed a dedicated enterprise squad of 8 engineers, implemented SOC 2 compliance, built SSO/SAML integration, and created a multi-tenant architecture with dedicated infrastructure options. I also embedded an engineer with the sales team to provide technical expertise during deals.",
      result: "Within 18 months, we launched the enterprise tier, closed 25 enterprise contracts, and the enterprise segment grew to $30M ARR - becoming our fastest growing revenue stream. The embedded engineer model was so successful we made it permanent.",
      scale: "TechScale Inc, cross-functional initiative spanning engineering, sales, and product",
      intent: ["behavioral", "commercial"],
      keywords: ["enterprise", "growth", "revenue", "commercial", "product", "scaling", "business", "ARR", "sales"],
    });

    await storage.createKnowledgeEntry({
      twinProfileId: demoProfile.id,
      entryId: "conflict-cross-team",
      type: "experience",
      title: "Resolving the Platform vs. Product Conflict",
      content: null,
      challenge: "Our platform and product engineering teams were in constant conflict. Platform wanted to freeze features for 6 months to address tech debt, while product needed to ship 3 critical features for a major customer. Both VPs escalated to me, and the teams had stopped collaborating effectively.",
      approach: "I facilitated a joint planning session where both teams mapped their priorities on a shared impact/effort matrix. We identified that 60% of the tech debt work actually aligned with the product roadmap. I created joint 'feature+foundation' squads that paired platform and product engineers, and we adopted an 80/20 time split - 80% on product features that also addressed underlying tech debt, 20% on pure platform improvements.",
      result: "All 3 critical features shipped on time, and we addressed 70% of the tech debt backlog within 4 months. More importantly, the collaborative model stuck - both teams reported higher satisfaction and the 'us vs them' mentality disappeared.",
      scale: "TechScale Inc, resolving conflict between 40 platform engineers and 60 product engineers",
      intent: ["behavioral", "scenario"],
      keywords: ["conflict", "stakeholder", "teams", "resolution", "collaboration", "tech debt", "prioritization", "leadership"],
    });

    await storage.createKnowledgeEntry({
      twinProfileId: demoProfile.id,
      entryId: "philosophy-influences",
      type: "philosophy",
      title: "Key Influences & Thinking",
      content: "Inspired by 'An Elegant Puzzle' by Will Larson, 'Radical Candor' by Kim Scott, and 'The Manager's Path' by Camille Fournier. I believe in servant leadership - my job is to remove obstacles and create the conditions for engineers to do their best work. I also believe deeply in data-driven decision making while maintaining empathy for the human side of engineering.",
      challenge: null,
      approach: null,
      result: null,
      scale: null,
      intent: ["philosophy"],
      keywords: ["influences", "books", "thinking", "philosophy", "leadership", "approach", "mindset", "values"],
    });

    await storage.createKnowledgeEntry({
      twinProfileId: demoProfile.id,
      entryId: "integrity-limits",
      type: "integrity",
      title: "Professional Boundaries",
      content: "I don't claim deep expertise in AI/ML algorithms, hardware engineering, or cybersecurity. I defer to specialists in these areas. My strengths are in engineering leadership, team building, system architecture, and scaling organizations.",
      challenge: null,
      approach: null,
      result: null,
      scale: null,
      intent: ["integrity"],
      keywords: ["limitations", "boundaries", "expertise", "don't", "not", "outside"],
    });

    await storage.createKnowledgeEntry({
      twinProfileId: demoProfile.id,
      entryId: "contact-info",
      type: "contact",
      title: "Contact Information",
      content: "Email: sarah@example.com\nLinkedIn: linkedin.com/in/sarahchen",
      challenge: null,
      approach: null,
      result: null,
      scale: null,
      intent: ["contact"],
      keywords: ["contact", "reach", "email", "linkedin", "connect", "hire"],
    });

    // Update demo user to paid
    const { db } = await import("./db");
    const { customers } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    await db.update(customers).set({ subscriptionStatus: "paid" }).where(eq(customers.id, demoUser.id));

    console.log("Database seeded successfully!");
    console.log("Demo portfolio: /portfolio/demo");
    console.log("Admin login: admin@digitaltwin.studio / admin123");
    console.log("Demo login: sarah@example.com / demo1234");
  } catch (error) {
    console.error("Seed error:", error);
  }
}
