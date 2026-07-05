import cron from "node-cron";
import { storage } from "./storage";
import { Resend } from "resend";
import { nudgeEditWindowTemplate, nudgeEngagementTemplate, feedbackEmailTemplate, tipsEmailTemplate, weeklyDigestTemplate } from "./emails";
import { logger } from "./logger";

export function startNudgeCron() {
  // Run every hour at :00
  cron.schedule("0 * * * *", async () => {
    logger.info("[Nudge] Cron tick");
    try {
      const profiles = await storage.getFreeProfilesDueForNudge();
      if (profiles.length === 0) return;

      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = `Vinos at Proxy <vinos@myproxy.work>`;
      const now = new Date();

      for (const p of profiles) {
        const hoursSincePublish = (now.getTime() - p.freePublishedAt.getTime()) / (1000 * 60 * 60);
        const upgradeUrl = "https://myproxy.work/dashboard";

        // Nudge 1: edit window closed (50hrs after free publish)
        if (hoursSincePublish >= 50 && !p.nudge1SentAt) {
          await resend.emails.send({
            from,
            to: p.email,
            reply_to: "vinos@myproxy.work",
            subject: "Your Proxy edit window has closed",
            html: nudgeEditWindowTemplate(p.name, upgradeUrl),
          }).catch(() => {});
          await storage.markNudgeSent(p.profileId, 1);
          logger.info("[Nudge] Nudge 1 sent", { profileId: p.profileId, email: p.email });
        }

        // Nudge 2: engagement (72hrs after free publish)
        if (hoursSincePublish >= 72 && !p.nudge2SentAt) {
          await resend.emails.send({
            from,
            to: p.email,
            reply_to: "vinos@myproxy.work",
            subject: p.viewCount > 0
              ? `Your Twin has had ${p.viewCount} visitor${p.viewCount === 1 ? "" : "s"}`
              : "Your Digital Twin is live — upgrade to see engagement",
            html: nudgeEngagementTemplate(p.name, p.viewCount, upgradeUrl),
          }).catch(() => {});
          await storage.markNudgeSent(p.profileId, 2);
          logger.info("[Nudge] Nudge 2 sent", { profileId: p.profileId, email: p.email });
        }
      }
      // Feedback email: 24hrs after profile becomes ready (all users, free + paid)
      const feedbackProfiles = await storage.getProfilesDueForFeedback();
      for (const p of feedbackProfiles) {
        await resend.emails.send({
          from,
          replyTo: "vinos@myproxy.work",
          to: p.email,
          subject: "Quick question about your Proxy profile",
          html: feedbackEmailTemplate(p.name),
        }).catch(() => {});
        await storage.markFeedbackEmailSent(p.profileId);
        logger.info("[Nudge] Feedback email sent", { profileId: p.profileId, email: p.email });
      }

      // Tips email: 3 days after profile becomes ready (all users)
      const tipsProfiles = await storage.getProfilesDueForTipsEmail();
      const dashboardUrl = "https://myproxy.work/dashboard";
      for (const p of tipsProfiles) {
        await resend.emails.send({
          from,
          reply_to: "vinos@myproxy.work",
          to: p.email,
          subject: `3 ways to get more from your Proxy, ${p.name.split(" ")[0]}`,
          html: tipsEmailTemplate(p.name, dashboardUrl),
        }).catch(() => {});
        await storage.markTipsEmailSent(p.profileId);
        logger.info("[Nudge] Tips email sent", { profileId: p.profileId, email: p.email });
      }
      // Weekly activity digest: published profiles, at most once every 7 days, only when there was activity
      const digestProfiles = await storage.getProfilesDueForWeeklyDigest();
      for (const p of digestProfiles) {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const questions = await storage.getQuestionsSince(p.profileId, p.digestSentAt ?? sevenDaysAgo);
        const newViews = Math.max(0, p.viewCount - p.digestViewCount);
        if (newViews === 0 && questions.length === 0) {
          // No activity — reset the window silently so we don't recheck hourly
          await storage.markDigestSent(p.profileId, p.viewCount);
          continue;
        }
        const isPro = p.tier !== "free" && p.tier !== null;
        const profileUrl = `https://myproxy.work/portfolio/${p.username}`;
        await resend.emails.send({
          from,
          reply_to: "vinos@myproxy.work",
          to: p.email,
          subject: newViews > 0
            ? `${newViews} ${newViews === 1 ? "person" : "people"} viewed your Proxy profile this week`
            : `Visitors asked your Twin ${questions.length} question${questions.length === 1 ? "" : "s"} this week`,
          html: weeklyDigestTemplate(p.name, newViews, questions, isPro, profileUrl, dashboardUrl),
        }).catch(() => {});
        await storage.markDigestSent(p.profileId, p.viewCount);
        logger.info("[Nudge] Weekly digest sent", { profileId: p.profileId, email: p.email, newViews, questions: questions.length });
      }
    } catch (err) {
      logger.error("[Nudge] Cron error", { error: String(err) });
    }
  });
  logger.info("[Nudge] Cron scheduled (hourly)");
}
