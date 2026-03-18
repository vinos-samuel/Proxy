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
                Questions? Email us at <a href="mailto:myproxy_work@proton.me" style="color:#22C55E;text-decoration:none;">myproxy_work@proton.me</a>
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

// ─── Password Reset ──────────────────────────────────────────────────────────

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
