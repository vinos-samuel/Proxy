/**
 * Email templates for Proxy / myproxy.work
 * All templates use inline CSS for email client compatibility (no flexbox, no CSS vars)
 */

function baseTemplate(body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E8E3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#E8E8E3;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border:3px solid #000000;box-shadow:6px 6px 0 #000000;">

          <!-- Header -->
          <tr>
            <td style="background:#22C55E;padding:24px 32px;border-bottom:3px solid #000000;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#000000;width:38px;height:38px;text-align:center;vertical-align:middle;border:2px solid #000000;">
                    <span style="font-weight:900;font-size:20px;color:#22C55E;font-family:monospace;line-height:38px;display:block;">P</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-weight:900;font-size:22px;color:#000000;letter-spacing:-0.5px;">PROXY</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:2px solid #e5e5e5;background:#fafaf8;">
              <p style="font-size:12px;color:#999999;margin:0;line-height:1.6;">
                You're receiving this because you signed up at <a href="https://myproxy.work" style="color:#22C55E;text-decoration:none;">myproxy.work</a>.<br>
                Questions? Email us at <a href="mailto:vinos@myproxy.work" style="color:#22C55E;text-decoration:none;">vinos@myproxy.work</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(url: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
    <tr>
      <td style="background:#22C55E;border:3px solid #000000;box-shadow:4px 4px 0 #000000;">
        <a href="${url}" style="display:block;padding:14px 32px;color:#000000;font-weight:900;font-size:15px;text-decoration:none;letter-spacing:0.5px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${label}</a>
      </td>
    </tr>
  </table>`;
}

function fallbackLink(url: string): string {
  return `<p style="font-size:12px;color:#aaaaaa;margin:16px 0 0 0;word-break:break-all;">
    Or copy this link: <a href="${url}" style="color:#22C55E;text-decoration:none;">${url}</a>
  </p>`;
}

// ─── Verify Email ────────────────────────────────────────────────────────────

export function verifyEmailTemplate(name: string, verifyUrl: string): string {
  const body = `
    <h1 style="font-size:26px;font-weight:900;color:#000000;margin:0 0 8px 0;letter-spacing:-0.5px;">Confirm your email</h1>
    <p style="font-size:15px;color:#555555;margin:0 0 24px 0;line-height:1.6;">
      Hi ${name} — you're almost there. Click below to verify your email address and activate your Proxy account.
    </p>
    ${ctaButton(verifyUrl, "Verify My Email →")}
    <p style="font-size:13px;color:#888888;margin:0;line-height:1.6;">
      This link expires in <strong>24 hours</strong>. If you didn't sign up for Proxy, you can safely ignore this email.
    </p>
    ${fallbackLink(verifyUrl)}
  `;
  return baseTemplate(body);
}

// ─── Welcome Email (sent after email is verified) ───────────────────────────

export function welcomeEmailTemplate(name: string, dashboardUrl: string): string {
  const body = `
    <h1 style="font-size:26px;font-weight:900;color:#000000;margin:0 0 8px 0;letter-spacing:-0.5px;">You're in. Let's build your Digital Twin.</h1>
    <p style="font-size:15px;color:#555555;margin:0 0 28px 0;line-height:1.6;">
      Welcome, ${name}. Your account is verified and ready. Your Digital Twin is a public AI profile that represents you — answering questions, sharing your story, and working for you 24/7.
    </p>

    <!-- Steps -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="padding:14px 16px;background:#f5f5f0;border:2px solid #000000;border-bottom:0;vertical-align:top;width:32px;">
          <span style="font-weight:900;font-size:18px;color:#22C55E;font-family:monospace;">1</span>
        </td>
        <td style="padding:14px 16px;background:#f5f5f0;border:2px solid #000000;border-left:0;border-bottom:0;">
          <strong style="font-size:14px;color:#000000;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Upload your CV</strong>
          <span style="font-size:13px;color:#666666;">AI reads your resume and pre-fills your entire profile in seconds.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 16px;background:#ffffff;border:2px solid #000000;border-bottom:0;vertical-align:top;">
          <span style="font-weight:900;font-size:18px;color:#22C55E;font-family:monospace;">2</span>
        </td>
        <td style="padding:14px 16px;background:#ffffff;border:2px solid #000000;border-left:0;border-bottom:0;">
          <strong style="font-size:14px;color:#000000;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Review &amp; personalise</strong>
          <span style="font-size:13px;color:#666666;">Go through 11 short sections. Add your stories, skills, and voice.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 16px;background:#f5f5f0;border:2px solid #000000;vertical-align:top;">
          <span style="font-weight:900;font-size:18px;color:#22C55E;font-family:monospace;">3</span>
        </td>
        <td style="padding:14px 16px;background:#f5f5f0;border:2px solid #000000;border-left:0;">
          <strong style="font-size:14px;color:#000000;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Go live</strong>
          <span style="font-size:13px;color:#666666;">Publish your Twin at myproxy.work/username and share the link.</span>
        </td>
      </tr>
    </table>

    ${ctaButton(dashboardUrl, "Start Building →")}
    <p style="font-size:13px;color:#888888;margin:0;line-height:1.6;">
      Takes about 15–20 minutes. Your AI does most of the heavy lifting.
    </p>
  `;
  return baseTemplate(body);
}

// ─── Profile Live ─────────────────────────────────────────────────────────────

export function profileLiveTemplate(name: string, profileUrl: string): string {
  const body = `
    <h1 style="font-size:26px;font-weight:900;color:#000000;margin:0 0 8px 0;letter-spacing:-0.5px;">Your Digital Twin is live 🚀</h1>
    <p style="font-size:15px;color:#555555;margin:0 0 24px 0;line-height:1.6;">
      Congratulations, ${name}! Your AI-powered career profile is now published and ready to share with the world.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
      <tr>
        <td style="background:#f5f5f0;border:2px solid #000000;padding:18px 20px;">
          <strong style="font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:8px;">Your Profile URL</strong>
          <a href="${profileUrl}" style="font-size:16px;font-weight:900;color:#000000;text-decoration:none;word-break:break-all;">${profileUrl}</a>
        </td>
      </tr>
    </table>

    <p style="font-size:15px;color:#555555;margin:0 0 8px 0;line-height:1.6;font-weight:700;">What to do now:</p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;font-size:14px;color:#555555;line-height:1.6;">
          <strong style="color:#22C55E;">→</strong> Share your link on LinkedIn, email signatures, and job applications<br>
          <strong style="color:#22C55E;">→</strong> Ask colleagues to chat with your Twin and give feedback<br>
          <strong style="color:#22C55E;">→</strong> Check your dashboard for visitor analytics and questions asked
        </td>
      </tr>
    </table>

    ${ctaButton(profileUrl, "View My Profile →")}
    <p style="font-size:13px;color:#888888;margin:0;line-height:1.6;">
      Your Twin is now working for you 24/7. Every visitor interaction shows up in your dashboard analytics.
    </p>
  `;
  return baseTemplate(body);
}

// ─── Nudge: Edit Window Closed ───────────────────────────────────────────────

export function nudgeEditWindowTemplate(name: string, upgradeUrl: string): string {
  const body = `
    <h1 style="font-size:26px;font-weight:900;color:#000000;margin:0 0 8px 0;letter-spacing:-0.5px;">Your edit window has closed</h1>
    <p style="font-size:15px;color:#555555;margin:0 0 24px 0;line-height:1.6;">
      Hi ${name}, your free Proxy profile is live — but your 48-hour edit window has now closed. You can no longer make changes on the free plan.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
      <tr>
        <td style="background:#f5f5f0;border:2px solid #000000;padding:18px 20px;">
          <strong style="font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:8px;">Upgrade to Pro for</strong>
          <p style="font-size:14px;color:#555555;margin:0;line-height:1.8;">
            <strong style="color:#22C55E;">→</strong> Unlimited edits, any time<br>
            <strong style="color:#22C55E;">→</strong> Full visitor questions feed<br>
            <strong style="color:#22C55E;">→</strong> Priority AI processing
          </p>
        </td>
      </tr>
    </table>

    ${ctaButton(upgradeUrl, "Upgrade to Pro — $49 →")}
    <p style="font-size:13px;color:#888888;margin:0;line-height:1.6;">
      Your profile stays live — it's working for you right now. Upgrade when you're ready to make changes.
    </p>
  `;
  return baseTemplate(body);
}

// ─── Nudge: Engagement (Day 3) ───────────────────────────────────────────────

export function nudgeEngagementTemplate(name: string, viewCount: number, upgradeUrl: string): string {
  const visitorText = viewCount > 0
    ? `Your Twin has already had <strong>${viewCount} visitor${viewCount === 1 ? "" : "s"}</strong>.`
    : "Your Twin is live and ready to be discovered.";

  const body = `
    <h1 style="font-size:26px;font-weight:900;color:#000000;margin:0 0 8px 0;letter-spacing:-0.5px;">Your Twin is working for you</h1>
    <p style="font-size:15px;color:#555555;margin:0 0 24px 0;line-height:1.6;">
      Hi ${name}, it's been 3 days since you published your Proxy profile. ${visitorText}
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
      <tr>
        <td style="background:#f5f5f0;border:2px solid #000000;padding:18px 20px;">
          <strong style="font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:8px;">Pro unlocks</strong>
          <p style="font-size:14px;color:#555555;margin:0;line-height:1.8;">
            <strong style="color:#22C55E;">→</strong> See every question visitors asked your Twin<br>
            <strong style="color:#22C55E;">→</strong> Unlimited profile edits<br>
            <strong style="color:#22C55E;">→</strong> Full analytics dashboard
          </p>
        </td>
      </tr>
    </table>

    ${ctaButton(upgradeUrl, "See what they asked → Upgrade")}
    <p style="font-size:13px;color:#888888;margin:0;line-height:1.6;">
      Know what recruiters and hiring managers are curious about. That context alone is worth the upgrade.
    </p>
  `;
  return baseTemplate(body);
}

// ─── Weekly Activity Digest ──────────────────────────────────────────────────

export function weeklyDigestTemplate(
  name: string,
  newViews: number,
  questions: string[],
  isPro: boolean,
  profileUrl: string,
  dashboardUrl: string
): string {
  const firstName = name.split(" ")[0];
  const viewLine = newViews > 0
    ? `<strong>${newViews} ${newViews === 1 ? "person" : "people"}</strong> viewed your profile this week.`
    : "";
  const questionLine = questions.length > 0
    ? `Visitors asked your Twin <strong>${questions.length} question${questions.length === 1 ? "" : "s"}</strong>.`
    : "";

  const questionBlock = questions.length > 0
    ? isPro
      ? `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
          <tr>
            <td style="background:#f5f5f0;border:2px solid #000000;padding:18px 20px;">
              <strong style="font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:8px;">What they asked</strong>
              <p style="font-size:14px;color:#555555;margin:0;line-height:1.8;">
                ${questions.slice(0, 5).map(q => `<strong style="color:#22C55E;">→</strong> ${q}`).join("<br>")}
              </p>
            </td>
          </tr>
        </table>`
      : `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
          <tr>
            <td style="background:#f5f5f0;border:2px solid #000000;padding:18px 20px;">
              <p style="font-size:14px;color:#555555;margin:0;line-height:1.6;">
                Upgrade to Pro to see exactly what visitors asked your Twin.
              </p>
            </td>
          </tr>
        </table>`
    : "";

  const body = `
    <h1 style="font-size:26px;font-weight:900;color:#000000;margin:0 0 8px 0;letter-spacing:-0.5px;">Your Twin was busy this week</h1>
    <p style="font-size:15px;color:#555555;margin:0 0 24px 0;line-height:1.6;">
      Hi ${firstName} — a quick update on your Proxy profile. ${viewLine} ${questionLine}
    </p>
    ${questionBlock}
    ${ctaButton(dashboardUrl, "See Your Dashboard →")}
    <p style="font-size:13px;color:#888888;margin:0;line-height:1.6;">
      More shares mean more visitors. Your profile: <a href="${profileUrl}" style="color:#22C55E;text-decoration:none;">${profileUrl}</a>
    </p>
  `;
  return baseTemplate(body);
}

// ─── Password Reset ──────────────────────────────────────────────────────────

// ─── Admin Broadcast ─────────────────────────────────────────────────────────

export function broadcastTemplate(name: string, bodyText: string): string {
  // Replace [name] placeholder with actual first name
  const firstName = name.split(" ")[0];
  const resolvedText = bodyText.replace(/\[name\]/gi, firstName);

  // Convert plain text to HTML paragraphs (double newline = new paragraph)
  const paragraphs = resolvedText
    .split(/\n\n+/)
    .map((para) => {
      const inner = para.trim().replace(/\n/g, "<br>");
      return `<p style="font-size:15px;color:#333333;margin:0 0 18px 0;line-height:1.7;">${inner}</p>`;
    })
    .join("");

  const body = `
    ${paragraphs}
    <p style="font-size:12px;color:#aaaaaa;margin:28px 0 0 0;border-top:1px solid #e5e5e5;padding-top:16px;">
      — Vinos, Proxy
    </p>
  `;
  return baseTemplate(body);
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export function feedbackEmailTemplate(name: string): string {
  const firstName = name.split(" ")[0];
  const body = `
    <h1 style="font-size:26px;font-weight:900;color:#000000;margin:0 0 8px 0;letter-spacing:-0.5px;">Quick question, ${firstName}</h1>
    <p style="font-size:15px;color:#333333;margin:0 0 16px 0;line-height:1.6;">
      I'm Vinos — I built Proxy. Your profile was generated yesterday and I wanted to check in personally.
    </p>
    <p style="font-size:15px;color:#333333;margin:0 0 16px 0;line-height:1.6;">
      One question: <strong>what was the hardest part of getting your profile set up?</strong>
    </p>
    <p style="font-size:15px;color:#333333;margin:0 0 16px 0;line-height:1.6;">
      Just reply to this email. A few words is enough. I read every reply and it directly shapes what I fix next.
    </p>
    <p style="font-size:15px;color:#333333;margin:0 0 24px 0;line-height:1.6;">
      Also — if your profile is still sitting at "Ready" and you haven't gone live yet, I'm happy to help you push it live. Takes 5 minutes.
    </p>
    <p style="font-size:15px;color:#333333;margin:0 0 4px 0;line-height:1.6;">Vinos</p>
    <p style="font-size:13px;color:#888888;margin:0;line-height:1.6;">Founder, Proxy — myproxy.work</p>
  `;
  return baseTemplate(body);
}

export function tipsEmailTemplate(name: string, dashboardUrl: string): string {
  const firstName = name.split(" ")[0];
  const body = `
    <h1 style="font-size:24px;font-weight:900;color:#000000;margin:0 0 8px 0;letter-spacing:-0.5px;">3 ways to get more from your Proxy, ${firstName}</h1>
    <p style="font-size:15px;color:#333333;margin:0 0 20px 0;line-height:1.6;">Your profile is live. Here's how to make it work harder for you.</p>

    <div style="border-left:4px solid #22C55E;padding:12px 16px;margin:0 0 20px 0;background:#f9fafb;">
      <p style="font-size:14px;font-weight:700;color:#000;margin:0 0 4px 0;">1. Make your Twin sound like you</p>
      <p style="font-size:14px;color:#555;margin:0;line-height:1.6;">Go to your profile → Edit → Voice & Style. Paste a few sentences you've written — a LinkedIn post, a message to a colleague, anything in your own words. Your Twin will mirror your tone instead of sounding generic.</p>
    </div>

    <div style="border-left:4px solid #22C55E;padding:12px 16px;margin:0 0 20px 0;background:#f9fafb;">
      <p style="font-size:14px;font-weight:700;color:#000;margin:0 0 4px 0;">2. Your profile is private until you publish it</p>
      <p style="font-size:14px;color:#555;margin:0;line-height:1.6;">Nothing is visible to anyone until you choose to publish. You control when it goes live. We don't share or sell your data — ever.</p>
    </div>

    <div style="border-left:4px solid #22C55E;padding:12px 16px;margin:0 0 24px 0;background:#f9fafb;">
      <p style="font-size:14px;font-weight:700;color:#000;margin:0 0 4px 0;">3. How to use your Proxy link</p>
      <p style="font-size:14px;color:#555;margin:0;line-height:1.6;">Add it to your LinkedIn About section. Put it in your email signature. When someone asks for your CV, send your Proxy link instead. Every time someone clicks it, your AI answers their questions — even while you sleep.</p>
    </div>

    <a href="${dashboardUrl}" style="display:inline-block;background:#22C55E;color:#000;font-weight:700;padding:12px 24px;text-decoration:none;border:3px solid #000;font-family:monospace;text-transform:uppercase;letter-spacing:0.5px;">Go to your profile →</a>

    <p style="font-size:12px;color:#aaaaaa;margin:28px 0 0 0;border-top:1px solid #e5e5e5;padding-top:16px;">
      — Vinos, Proxy
    </p>
  `;
  return baseTemplate(body);
}

export function passwordResetTemplate(resetUrl: string): string {
  const body = `
    <h1 style="font-size:26px;font-weight:900;color:#000000;margin:0 0 8px 0;letter-spacing:-0.5px;">Reset your password</h1>
    <p style="font-size:15px;color:#555555;margin:0 0 24px 0;line-height:1.6;">
      We received a request to reset the password on your Proxy account. Click below to choose a new one.
    </p>
    ${ctaButton(resetUrl, "Reset My Password →")}
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:8px;">
      <tr>
        <td style="background:#fff8e1;border:2px solid #f0c000;padding:14px 16px;">
          <p style="font-size:13px;color:#7a6000;margin:0;line-height:1.6;">
            ⚠️ This link expires in <strong>1 hour</strong>. If you didn't request a password reset, your account is safe — just ignore this email.
          </p>
        </td>
      </tr>
    </table>
    ${fallbackLink(resetUrl)}
  `;
  return baseTemplate(body);
}
