import { db } from "./db";
import { eq, desc, sql, count, and } from "drizzle-orm";
import {
  customers, twinProfiles, factBanks, knowledgeEntries, chatUsage, payments, chatMessages, blogPosts,
  jobCompanies, jobContacts, jobApplications,
  type Customer, type InsertCustomer, type TwinProfile, type InsertTwinProfile,
  type FactBank, type InsertFactBank, type KnowledgeEntry, type InsertKnowledgeEntry,
  type Payment, type BlogPost,
  type JobCompany, type InsertJobCompany,
  type JobContact, type InsertJobContact,
  type JobApplication, type InsertJobApplication,
} from "@shared/schema";

export interface IStorage {
  // Customers
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomerByUsername(username: string): Promise<Customer | undefined>;
  createCustomer(data: InsertCustomer): Promise<Customer>;
  getAllCustomers(): Promise<Customer[]>;
  updateCustomerStatus(id: string, status: string): Promise<void>;
  getReferralCount(username: string): Promise<number>;

  // Twin Profiles
  getProfileByCustomerId(customerId: string): Promise<TwinProfile | undefined>;
  getProfileByUsername(username: string): Promise<TwinProfile | undefined>;
  upsertProfile(data: Partial<InsertTwinProfile> & { customerId: string }): Promise<TwinProfile>;
  updateProfileStatus(id: string, status: string): Promise<void>;

  updateProfileById(id: string, data: Partial<InsertTwinProfile>): Promise<void>;

  // Fact Banks
  getFactBanksByProfileId(profileId: string): Promise<FactBank[]>;
  createFactBank(data: InsertFactBank): Promise<FactBank>;
  deleteFactBanksByProfileId(profileId: string): Promise<void>;

  // Chat Messages
  deleteChatMessagesByProfileId(profileId: string): Promise<void>;

  // Knowledge Entries
  getKnowledgeEntriesByProfileId(profileId: string): Promise<KnowledgeEntry[]>;
  createKnowledgeEntry(data: InsertKnowledgeEntry): Promise<KnowledgeEntry>;
  deleteKnowledgeEntriesByProfileId(profileId: string): Promise<void>;

  // Payment
  getProfileById(id: string): Promise<TwinProfile | undefined>;
  getProfileByStripeSessionId(sessionId: string): Promise<TwinProfile | undefined>;
  deleteProfileById(id: string): Promise<void>;

  // Password Reset
  setResetToken(customerId: string, hashedToken: string, expiry: Date): Promise<void>;
  getCustomerByResetToken(hashedToken: string): Promise<Customer | undefined>;
  clearResetToken(customerId: string): Promise<void>;
  updatePasswordHash(customerId: string, passwordHash: string): Promise<void>;

  // Email Verification
  setEmailVerificationToken(customerId: string, hashedToken: string, expiry: Date): Promise<void>;
  getCustomerByVerificationToken(hashedToken: string): Promise<Customer | undefined>;
  markEmailVerified(customerId: string): Promise<void>;

  // Analytics
  incrementViewCount(profileId: string): Promise<void>;
  saveChatMessage(profileId: string, question: string): Promise<void>;
  getAnalytics(profileId: string): Promise<{ viewCount: number; recentQuestions: { question: string; askedAt: Date }[] }>;

  // Nudge emails
  getFreeProfilesDueForNudge(): Promise<Array<{ profileId: string; email: string; name: string; username: string; freePublishedAt: Date; viewCount: number; nudge1SentAt: Date | null; nudge2SentAt: Date | null; }>>;
  markNudgeSent(profileId: string, nudgeNumber: 1 | 2): Promise<void>;

  // Blog
  getPublishedBlogPosts(): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getBlogPostById(id: string): Promise<BlogPost | undefined>;
  getAllBlogPosts(): Promise<BlogPost[]>;
  createBlogPost(data: any): Promise<BlogPost>;
  updateBlogPost(id: string, data: any): Promise<void>;
  deleteBlogPost(id: string): Promise<void>;
  incrementBlogViewCount(id: string): Promise<void>;

  // Sitemap
  getPublishedProfileUsernames(): Promise<string[]>;

  // Twin Interview
  mergeInterviewData(profileId: string, extracted: {
    warStories: Array<{ title: string; challenge: string; approach: string; result: string; scale: string }>;
    achievements: Array<{ title: string; content: string }>;
    additionalFacts: Array<{ companyName: string; fact: string }>;
  }): Promise<{ warStoriesAdded: number; achievementsAdded: number; factsAdded: number }>;
  updateLastDeepenedAt(profileId: string): Promise<void>;

  // Admin
  getAdminStats(): Promise<{ totalCustomers: number; publishedProfiles: number; totalRevenue: number }>;
  getCustomersWithProfiles(): Promise<(Customer & { profile?: TwinProfile | null })[]>;
  deleteCustomer(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer;
  }

  async getCustomerByUsername(username: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.username, username));
    return customer;
  }

  async createCustomer(data: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(data).returning();
    return customer;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getReferralCount(username: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.referredBy, username));
    return result?.count ?? 0;
  }

  async updateCustomerStatus(id: string, status: string): Promise<void> {
    await db.update(customers).set({ subscriptionStatus: status }).where(eq(customers.id, id));
  }

  async getOnboardingSession(customerId: string): Promise<any | null> {
    const [row] = await db.select({ onboardingSession: customers.onboardingSession }).from(customers).where(eq(customers.id, customerId));
    return row?.onboardingSession ?? null;
  }

  async saveOnboardingSession(customerId: string, session: any): Promise<void> {
    await db.update(customers).set({ onboardingSession: session }).where(eq(customers.id, customerId));
  }

  async clearOnboardingSession(customerId: string): Promise<void> {
    await db.update(customers).set({ onboardingSession: null }).where(eq(customers.id, customerId));
  }

  async getProfileByCustomerId(customerId: string): Promise<TwinProfile | undefined> {
    const [profile] = await db.select().from(twinProfiles).where(eq(twinProfiles.customerId, customerId));
    return profile;
  }

  async getProfileByUsername(username: string): Promise<TwinProfile | undefined> {
    const customer = await this.getCustomerByUsername(username);
    if (!customer) return undefined;
    return this.getProfileByCustomerId(customer.id);
  }

  async upsertProfile(data: Partial<InsertTwinProfile> & { customerId: string }): Promise<TwinProfile> {
    const existing = await this.getProfileByCustomerId(data.customerId);
    if (existing) {
      const [updated] = await db
        .update(twinProfiles)
        .set(data)
        .where(eq(twinProfiles.id, existing.id))
        .returning();
      return updated;
    }
    const [profile] = await db.insert(twinProfiles).values(data as InsertTwinProfile).returning();
    return profile;
  }

  async updateProfileStatus(id: string, status: string): Promise<void> {
    await db.update(twinProfiles).set({ status }).where(eq(twinProfiles.id, id));
  }

  async updateProfileById(id: string, data: Partial<InsertTwinProfile>): Promise<void> {
    await db.update(twinProfiles).set(data).where(eq(twinProfiles.id, id));
  }

  async getFactBanksByProfileId(profileId: string): Promise<FactBank[]> {
    return db.select().from(factBanks).where(eq(factBanks.twinProfileId, profileId));
  }

  async createFactBank(data: InsertFactBank): Promise<FactBank> {
    const [fb] = await db.insert(factBanks).values(data).returning();
    return fb;
  }

  async deleteFactBanksByProfileId(profileId: string): Promise<void> {
    await db.delete(factBanks).where(eq(factBanks.twinProfileId, profileId));
  }

  async deleteChatMessagesByProfileId(profileId: string): Promise<void> {
    await db.delete(chatMessages).where(eq(chatMessages.profileId, profileId));
  }

  async getKnowledgeEntriesByProfileId(profileId: string): Promise<KnowledgeEntry[]> {
    return db.select().from(knowledgeEntries).where(eq(knowledgeEntries.twinProfileId, profileId));
  }

  async createKnowledgeEntry(data: InsertKnowledgeEntry): Promise<KnowledgeEntry> {
    const [entry] = await db.insert(knowledgeEntries).values(data).returning();
    return entry;
  }

  async deleteKnowledgeEntriesByProfileId(profileId: string): Promise<void> {
    await db.delete(knowledgeEntries).where(eq(knowledgeEntries.twinProfileId, profileId));
  }

  async getProfileById(id: string): Promise<TwinProfile | undefined> {
    const [profile] = await db.select().from(twinProfiles).where(eq(twinProfiles.id, id));
    return profile;
  }

  async getProfileByStripeSessionId(sessionId: string): Promise<TwinProfile | undefined> {
    const [profile] = await db.select().from(twinProfiles).where(eq(twinProfiles.stripeSessionId, sessionId));
    return profile;
  }

  async deleteProfileById(id: string): Promise<void> {
    await db.delete(twinProfiles).where(eq(twinProfiles.id, id));
  }

  async setResetToken(customerId: string, hashedToken: string, expiry: Date): Promise<void> {
    await db.update(customers)
      .set({ resetToken: hashedToken, resetTokenExpiry: expiry })
      .where(eq(customers.id, customerId));
  }

  async getCustomerByResetToken(hashedToken: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.resetToken, hashedToken));
    return customer;
  }

  async clearResetToken(customerId: string): Promise<void> {
    await db.update(customers)
      .set({ resetToken: null, resetTokenExpiry: null })
      .where(eq(customers.id, customerId));
  }

  async updatePasswordHash(customerId: string, passwordHash: string): Promise<void> {
    await db.update(customers).set({ passwordHash }).where(eq(customers.id, customerId));
  }

  async setEmailVerificationToken(customerId: string, hashedToken: string, expiry: Date): Promise<void> {
    await db.update(customers)
      .set({ emailVerificationToken: hashedToken, emailVerificationTokenExpiry: expiry })
      .where(eq(customers.id, customerId));
  }

  async getCustomerByVerificationToken(hashedToken: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.emailVerificationToken, hashedToken));
    return customer;
  }

  async markEmailVerified(customerId: string): Promise<void> {
    await db.update(customers)
      .set({ emailVerified: true, emailVerificationToken: null, emailVerificationTokenExpiry: null })
      .where(eq(customers.id, customerId));
  }

  async getAdminStats() {
    const [customerCount] = await db.select({ count: count() }).from(customers);
    const [publishedCount] = await db
      .select({ count: count() })
      .from(twinProfiles)
      .where(eq(twinProfiles.status, "published"));
    const [revenueResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(eq(payments.status, "completed"));

    return {
      totalCustomers: customerCount?.count || 0,
      publishedProfiles: publishedCount?.count || 0,
      totalRevenue: Number(revenueResult?.total || 0) / 100,
    };
  }

  async getCustomersWithProfiles(): Promise<(Customer & { profile?: TwinProfile | null })[]> {
    const allCustomers = await this.getAllCustomers();
    const result = [];
    for (const customer of allCustomers) {
      const profile = await this.getProfileByCustomerId(customer.id);
      result.push({ ...customer, profile: profile || null });
    }
    return result;
  }

  async incrementViewCount(profileId: string): Promise<void> {
    await db.update(twinProfiles)
      .set({ viewCount: sql`view_count + 1` })
      .where(eq(twinProfiles.id, profileId));
  }

  async saveChatMessage(profileId: string, question: string): Promise<void> {
    await db.insert(chatMessages).values({ profileId, question });
  }

  async getAnalytics(profileId: string): Promise<{ viewCount: number; recentQuestions: { question: string; askedAt: Date }[] }> {
    const [profile] = await db.select({ viewCount: twinProfiles.viewCount }).from(twinProfiles).where(eq(twinProfiles.id, profileId));
    const questions = await db.select({ question: chatMessages.question, askedAt: chatMessages.askedAt })
      .from(chatMessages)
      .where(eq(chatMessages.profileId, profileId))
      .orderBy(desc(chatMessages.askedAt))
      .limit(10);
    return {
      viewCount: profile?.viewCount || 0,
      recentQuestions: questions,
    };
  }

  async getFreeProfilesDueForNudge(): Promise<Array<{ profileId: string; email: string; name: string; username: string; freePublishedAt: Date; viewCount: number; nudge1SentAt: Date | null; nudge2SentAt: Date | null; }>> {
    const rows = await db
      .select({
        profileId: twinProfiles.id,
        email: customers.email,
        name: customers.name,
        username: customers.username,
        freePublishedAt: twinProfiles.freePublishedAt,
        viewCount: twinProfiles.viewCount,
        nudge1SentAt: twinProfiles.nudge1SentAt,
        nudge2SentAt: twinProfiles.nudge2SentAt,
      })
      .from(twinProfiles)
      .innerJoin(customers, eq(twinProfiles.customerId, customers.id))
      .where(
        sql`${twinProfiles.tier} = 'free' AND ${twinProfiles.freePublishedAt} IS NOT NULL AND ${twinProfiles.isPublic} = true`
      );
    return rows.map(r => ({
      ...r,
      freePublishedAt: r.freePublishedAt!,
      viewCount: r.viewCount ?? 0,
    }));
  }

  async markNudgeSent(profileId: string, nudgeNumber: 1 | 2): Promise<void> {
    const update = nudgeNumber === 1
      ? { nudge1SentAt: new Date() }
      : { nudge2SentAt: new Date() };
    await db.update(twinProfiles).set(update).where(eq(twinProfiles.id, profileId));
  }

  // Blog
  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    return db.select().from(blogPosts).where(eq(blogPosts.status, "published")).orderBy(desc(blogPosts.publishedAt));
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post;
  }

  async getBlogPostById(id: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post;
  }

  async getAllBlogPosts(): Promise<BlogPost[]> {
    return db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }

  async createBlogPost(data: any): Promise<BlogPost> {
    const [post] = await db.insert(blogPosts).values(data).returning();
    return post;
  }

  async updateBlogPost(id: string, data: any): Promise<void> {
    await db.update(blogPosts).set({ ...data, updatedAt: new Date() }).where(eq(blogPosts.id, id));
  }

  async deleteBlogPost(id: string): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  async incrementBlogViewCount(id: string): Promise<void> {
    await db.update(blogPosts).set({ viewCount: sql`view_count + 1` }).where(eq(blogPosts.id, id));
  }

  async getPublishedProfileUsernames(): Promise<string[]> {
    const results = await db
      .select({ username: customers.username })
      .from(twinProfiles)
      .innerJoin(customers, eq(twinProfiles.customerId, customers.id))
      .where(eq(twinProfiles.status, "published"));
    return results.map((r) => r.username);
  }

  async mergeInterviewData(profileId: string, extracted: {
    warStories: Array<{ title: string; challenge: string; approach: string; result: string; scale: string }>;
    achievements: Array<{ title: string; content: string }>;
    additionalFacts: Array<{ companyName: string; fact: string }>;
  }): Promise<{ warStoriesAdded: number; achievementsAdded: number; factsAdded: number }> {
    let warStoriesAdded = 0;
    let achievementsAdded = 0;
    let factsAdded = 0;

    // Add new war stories — use createKnowledgeEntry to stay within typed InsertKnowledgeEntry
    for (const story of (extracted.warStories || [])) {
      if (!story.title || !story.challenge) continue;
      const entryId = `interview-story-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      await this.createKnowledgeEntry({
        twinProfileId: profileId,
        entryId,
        type: "experience",
        title: story.title,
        challenge: story.challenge || undefined,
        approach: story.approach || undefined,
        result: story.result || undefined,
        scale: story.scale || undefined,
        intent: [],
        keywords: [],
      });
      warStoriesAdded++;
    }

    // Append achievements to existing entry or create new one
    if (extracted.achievements && extracted.achievements.length > 0) {
      const existingEntries = await this.getKnowledgeEntriesByProfileId(profileId);
      const existingAchievements = existingEntries.find(
        (e) => e.entryId === "key-achievements"
      );
      const newText = extracted.achievements
        .map((a) => `• ${a.title}: ${a.content}`)
        .join("\n");

      if (existingAchievements) {
        const updatedContent =
          (existingAchievements.content || "") +
          "\n\n[Added from interview]\n" +
          newText;
        await db
          .update(knowledgeEntries)
          .set({ content: updatedContent })
          .where(eq(knowledgeEntries.id, existingAchievements.id));
      } else {
        await this.createKnowledgeEntry({
          twinProfileId: profileId,
          entryId: "key-achievements",
          type: "achievement",
          title: "Key Achievements",
          content: newText,
          intent: [],
          keywords: [],
        });
      }
      achievementsAdded = extracted.achievements.length;
    }

    // Append facts to matching existing fact banks
    const allFactBanks = await this.getFactBanksByProfileId(profileId);
    for (const factItem of (extracted.additionalFacts || [])) {
      if (!factItem.companyName || !factItem.fact) continue;
      const match = allFactBanks.find(
        (fb) =>
          fb.companyName.toLowerCase() === factItem.companyName.toLowerCase()
      );
      if (match) {
        const updatedFacts = [...match.facts, factItem.fact];
        await db
          .update(factBanks)
          .set({ facts: updatedFacts })
          .where(eq(factBanks.id, match.id));
        factsAdded++;
      }
    }

    return { warStoriesAdded, achievementsAdded, factsAdded };
  }

  async updateLastDeepenedAt(profileId: string): Promise<void> {
    await db
      .update(twinProfiles)
      .set({ lastDeepenedAt: new Date() })
      .where(eq(twinProfiles.id, profileId));
  }

  async deleteCustomer(id: string): Promise<void> {
    // Full cascade delete — remove all user data before deleting the account
    const profile = await this.getProfileByCustomerId(id);
    if (profile) {
      await this.deleteChatMessagesByProfileId(profile.id);
      await this.deleteKnowledgeEntriesByProfileId(profile.id);
      await this.deleteFactBanksByProfileId(profile.id);
      await this.deleteProfileById(profile.id);
    }
    // Delete the customer last (payments rows kept for financial record-keeping)
    await db.delete(customers).where(eq(customers.id, id));
  }

  // ─── Job Search CRM ────────────────────────────────────────────────────────

  // Companies
  async getJobCompanies(customerId: string): Promise<JobCompany[]> {
    return db.select().from(jobCompanies).where(eq(jobCompanies.customerId, customerId)).orderBy(desc(jobCompanies.createdAt));
  }

  async createJobCompany(data: InsertJobCompany): Promise<JobCompany> {
    const [company] = await db.insert(jobCompanies).values(data).returning();
    return company;
  }

  async updateJobCompany(id: string, customerId: string, data: Partial<InsertJobCompany>): Promise<void> {
    await db.update(jobCompanies)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(jobCompanies.id, id), eq(jobCompanies.customerId, customerId)));
  }

  async deleteJobCompany(id: string, customerId: string): Promise<void> {
    await db.delete(jobCompanies)
      .where(and(eq(jobCompanies.id, id), eq(jobCompanies.customerId, customerId)));
  }

  // Contacts
  async getJobContacts(customerId: string): Promise<(JobContact & { companyName: string | null })[]> {
    const rows = await db
      .select({
        id: jobContacts.id,
        customerId: jobContacts.customerId,
        companyId: jobContacts.companyId,
        name: jobContacts.name,
        title: jobContacts.title,
        email: jobContacts.email,
        linkedinUrl: jobContacts.linkedinUrl,
        lastOutreachDate: jobContacts.lastOutreachDate,
        responseReceived: jobContacts.responseReceived,
        responseDate: jobContacts.responseDate,
        responseNotes: jobContacts.responseNotes,
        followUpDate: jobContacts.followUpDate,
        notes: jobContacts.notes,
        createdAt: jobContacts.createdAt,
        companyName: jobCompanies.name,
      })
      .from(jobContacts)
      .leftJoin(jobCompanies, eq(jobContacts.companyId, jobCompanies.id))
      .where(eq(jobContacts.customerId, customerId))
      .orderBy(desc(jobContacts.createdAt));
    return rows;
  }

  async createJobContact(data: InsertJobContact): Promise<JobContact> {
    const [contact] = await db.insert(jobContacts).values(data).returning();
    return contact;
  }

  async updateJobContact(id: string, customerId: string, data: Partial<InsertJobContact>): Promise<void> {
    await db.update(jobContacts)
      .set(data)
      .where(and(eq(jobContacts.id, id), eq(jobContacts.customerId, customerId)));
  }

  async deleteJobContact(id: string, customerId: string): Promise<void> {
    await db.delete(jobContacts)
      .where(and(eq(jobContacts.id, id), eq(jobContacts.customerId, customerId)));
  }

  // Applications
  async getJobApplications(customerId: string): Promise<(JobApplication & { companyName: string | null })[]> {
    const rows = await db
      .select({
        id: jobApplications.id,
        customerId: jobApplications.customerId,
        companyId: jobApplications.companyId,
        jobTitle: jobApplications.jobTitle,
        jobUrl: jobApplications.jobUrl,
        status: jobApplications.status,
        salaryMin: jobApplications.salaryMin,
        salaryMax: jobApplications.salaryMax,
        salaryCurrency: jobApplications.salaryCurrency,
        notes: jobApplications.notes,
        appliedAt: jobApplications.appliedAt,
        followUpDate: jobApplications.followUpDate,
        createdAt: jobApplications.createdAt,
        updatedAt: jobApplications.updatedAt,
        companyName: jobCompanies.name,
      })
      .from(jobApplications)
      .leftJoin(jobCompanies, eq(jobApplications.companyId, jobCompanies.id))
      .where(eq(jobApplications.customerId, customerId))
      .orderBy(desc(jobApplications.createdAt));
    return rows;
  }

  async createJobApplication(data: InsertJobApplication): Promise<JobApplication> {
    const [application] = await db.insert(jobApplications).values(data).returning();
    return application;
  }

  async updateJobApplication(id: string, customerId: string, data: Partial<InsertJobApplication>): Promise<void> {
    await db.update(jobApplications)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(jobApplications.id, id), eq(jobApplications.customerId, customerId)));
  }

  async deleteJobApplication(id: string, customerId: string): Promise<void> {
    await db.delete(jobApplications)
      .where(and(eq(jobApplications.id, id), eq(jobApplications.customerId, customerId)));
  }
}

export const storage = new DatabaseStorage();
