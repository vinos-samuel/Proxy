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
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  emailVerified: boolean("email_verified").notNull().default(true),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationTokenExpiry: timestamp("email_verification_token_expiry"),
  onboardingSession: jsonb("onboarding_session"),
  referredBy: text("referred_by"),
  lastActiveAt: timestamp("last_active_at"),
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
  heroSubtitle: text("hero_subtitle"),
  stats: jsonb("stats"), // Array of {label: string, value: string}
  problemFit: jsonb("problem_fit"), // Array of strings
  howIWork: jsonb("how_i_work"), // {name: string, steps: Array<{label: string, description: string}>}
  whyAiCv: jsonb("why_ai_cv"), // Array of strings (paragraphs)
  portfolioSuggestedQuestions: jsonb("portfolio_suggested_questions"), // Array of strings
  status: text("status").notNull().default("draft"),
  careerTimeline: jsonb("career_timeline"),
  skillsMatrix: jsonb("skills_matrix"),
  skillTags: jsonb("skill_tags"),
  whereImMostUseful: jsonb("where_im_most_useful"),
  questionnaireData: jsonb("questionnaire_data"),
  paymentStatus: text("payment_status").default("unpaid"),
  tier: text("tier"),
  stripeSessionId: text("stripe_session_id"),
  paidAt: timestamp("paid_at"),
  publicDomain: text("public_domain"),
  freePublishedAt: timestamp("free_published_at"),
  isPublic: boolean("is_public").default(false),
  viewCount: integer("view_count").default(0),
  nudge1SentAt: timestamp("nudge1_sent_at"),
  nudge2SentAt: timestamp("nudge2_sent_at"),
  lastDeepenedAt: timestamp("last_deepened_at"),
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

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: uuid("profile_id").references(() => twinProfiles.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  askedAt: timestamp("asked_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
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

export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  heroImageUrl: text("hero_image_url"),
  category: text("category").default("general"),
  metaDescription: text("meta_description"),
  status: text("status").notNull().default("draft"),
  publishedAt: timestamp("published_at"),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Job Search CRM tables
export const jobCompanies = pgTable("job_companies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  website: text("website"),
  industry: text("industry"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const jobContacts = pgTable("job_contacts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").references(() => jobCompanies.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  title: text("title"),
  email: text("email"),
  linkedinUrl: text("linkedin_url"),
  lastOutreachDate: timestamp("last_outreach_date"),
  responseReceived: boolean("response_received").default(false),
  responseDate: timestamp("response_date"),
  responseNotes: text("response_notes"),
  followUpDate: timestamp("follow_up_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const jobApplications = pgTable("job_applications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").references(() => jobCompanies.id, { onDelete: "set null" }),
  jobTitle: text("job_title").notNull(),
  jobUrl: text("job_url"),
  status: text("status").notNull().default("saved"), // saved | applied | interviewing | offer | rejected
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: text("salary_currency").default("USD"),
  notes: text("notes"),
  appliedAt: timestamp("applied_at"),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Insert schemas
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  isAdmin: true,
  subscriptionStatus: true,
  stripeCustomerId: true,
  customDomain: true,
  resetToken: true,
  resetTokenExpiry: true,
  emailVerificationToken: true,
  emailVerificationTokenExpiry: true,
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

export const insertJobCompanySchema = createInsertSchema(jobCompanies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobContactSchema = createInsertSchema(jobContacts).omit({
  id: true,
  createdAt: true,
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Username must be lowercase letters, numbers, and hyphens only"),
  referredBy: z.string().optional(),
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
export type ChatMessage = typeof chatMessages.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;
export type JobCompany = typeof jobCompanies.$inferSelect;
export type InsertJobCompany = z.infer<typeof insertJobCompanySchema>;
export type JobContact = typeof jobContacts.$inferSelect;
export type InsertJobContact = z.infer<typeof insertJobContactSchema>;
export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;

// Keep old exports for compatibility with integration files
export const users = customers;
export const insertUserSchema = insertCustomerSchema;
export type InsertUser = InsertCustomer;
export type User = Customer;
