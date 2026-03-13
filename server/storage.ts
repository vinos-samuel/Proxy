import { db } from "./db";
import { eq, desc, sql, count } from "drizzle-orm";
import {
  customers, twinProfiles, factBanks, knowledgeEntries, chatUsage, payments,
  type Customer, type InsertCustomer, type TwinProfile, type InsertTwinProfile,
  type FactBank, type InsertFactBank, type KnowledgeEntry, type InsertKnowledgeEntry,
  type Payment
} from "@shared/schema";

export interface IStorage {
  // Customers
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomerByUsername(username: string): Promise<Customer | undefined>;
  createCustomer(data: InsertCustomer): Promise<Customer>;
  getAllCustomers(): Promise<Customer[]>;
  updateCustomerStatus(id: string, status: string): Promise<void>;

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

  // Admin
  getAdminStats(): Promise<{ totalCustomers: number; publishedProfiles: number; totalRevenue: number }>;
  getCustomersWithProfiles(): Promise<(Customer & { profile?: TwinProfile | null })[]>;
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

  async updateCustomerStatus(id: string, status: string): Promise<void> {
    await db.update(customers).set({ subscriptionStatus: status }).where(eq(customers.id, id));
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
}

export const storage = new DatabaseStorage();
