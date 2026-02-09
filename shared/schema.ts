import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, uuid, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  subscriptionStatus: text("subscription_status").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  customDomain: text("custom_domain"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const twinProfiles = pgTable("twin_profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  roleTitle: text("role_title"),
  positioning: text("positioning"),
  persona: text("persona"),
  tone: text("tone"),
  answerStyle: text("answer_style"),
  fallbackResponse: text("fallback_response"),
  photoUrl: text("photo_url"),
  videoUrl: text("video_url"),
  resumeUrl: text("resume_url"),
  brandingTheme: text("branding_theme").default("executive"),
  cvResumeUrl: text("cv_resume_url"),
  status: text("status").notNull().default("draft"),
  questionnaireData: jsonb("questionnaire_data"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const factBanks = pgTable("fact_banks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  twinProfileId: uuid("twin_profile_id").notNull().references(() => twinProfiles.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  roleName: text("role_name").notNull(),
  duration: text("duration"),
  facts: text("facts").array().notNull(),
});

export const knowledgeEntries = pgTable("knowledge_entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  twinProfileId: uuid("twin_profile_id").notNull().references(() => twinProfiles.id, { onDelete: "cascade" }),
  entryId: text("entry_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  challenge: text("challenge"),
  approach: text("approach"),
  result: text("result"),
  scale: text("scale"),
  intent: text("intent").array().notNull().default(sql`'{}'::text[]`),
  keywords: text("keywords").array().notNull().default(sql`'{}'::text[]`),
});

export const chatUsage = pgTable("chat_usage", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  messageCount: integer("message_count").notNull().default(0),
  tokenCount: integer("token_count").notNull().default(0),
  month: timestamp("month").notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  stripePaymentId: text("stripe_payment_id"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Insert schemas
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  isAdmin: true,
  subscriptionStatus: true,
  stripeCustomerId: true,
  customDomain: true,
});

export const insertTwinProfileSchema = createInsertSchema(twinProfiles).omit({
  id: true,
  createdAt: true,
});

export const insertFactBankSchema = createInsertSchema(factBanks).omit({
  id: true,
});

export const insertKnowledgeEntrySchema = createInsertSchema(knowledgeEntries).omit({
  id: true,
});

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Username must be lowercase letters, numbers, and hyphens only"),
});

export const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password is required"),
});

// Questionnaire schemas
export const questionnaireStep1Schema = z.object({
  fullName: z.string().min(2),
  roleTitle: z.string().min(2),
  positioning: z.string().min(10),
  persona: z.string().min(10),
  tone: z.enum(["direct", "warm", "technical", "casual"]),
});

export const careerEntrySchema = z.object({
  companyName: z.string().min(1),
  roleTitle: z.string().min(1),
  duration: z.string().min(1),
  facts: z.array(z.string()).min(1).max(10),
});

export const questionnaireStep2Schema = z.object({
  careers: z.array(careerEntrySchema).min(1).max(5),
});

export const storySchema = z.object({
  type: z.enum(["failure", "conflict", "commercial", "influence", "data-driven", "building", "consultative", "buy-in"]),
  title: z.string().min(2),
  challenge: z.string().min(10),
  approach: z.string().min(10),
  result: z.string().min(10),
  scale: z.string().min(5),
});

export const questionnaireStep3Schema = z.object({
  stories: z.array(storySchema).min(1).max(8),
});

export const questionnaireStep4Schema = z.object({
  influences: z.string().optional(),
  limitations: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  contactLinkedin: z.string().optional(),
});

// Types
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type TwinProfile = typeof twinProfiles.$inferSelect;
export type InsertTwinProfile = z.infer<typeof insertTwinProfileSchema>;
export type FactBank = typeof factBanks.$inferSelect;
export type InsertFactBank = z.infer<typeof insertFactBankSchema>;
export type KnowledgeEntry = typeof knowledgeEntries.$inferSelect;
export type InsertKnowledgeEntry = z.infer<typeof insertKnowledgeEntrySchema>;
export type ChatUsage = typeof chatUsage.$inferSelect;
export type Payment = typeof payments.$inferSelect;

// Keep old exports for compatibility with integration files
export const users = customers;
export const insertUserSchema = insertCustomerSchema;
export type InsertUser = InsertCustomer;
export type User = Customer;
