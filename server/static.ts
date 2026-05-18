import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { storage } from "./storage";

/** Strip characters that could break HTML attributes or the <title> tag */
function sanitize(str: string): string {
  return str.replace(/[<>"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] ?? c));
}

function injectMeta(html: string, meta: {
  title: string;
  description: string;
  ogUrl?: string;
  jsonLd?: object;
}): string {
  const t   = sanitize(meta.title);
  const d   = sanitize(meta.description);
  const url = sanitize(meta.ogUrl || "");

  let result = html
    .replace(/<title>.*?<\/title>/,                                     `<title>${t}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/,            `$1${d}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/,           `$1${t}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/,     `$1${d}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/,             `$1${url}$2`)
    .replace(/(<meta property="twitter:title" content=")[^"]*(")/,      `$1${t}$2`)
    .replace(/(<meta property="twitter:description" content=")[^"]*(")/,`$1${d}$2`)
    .replace(/(<meta property="twitter:url" content=")[^"]*(")/,        `$1${url}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/,                  `$1${url}$2`);

  // Inject JSON-LD before </head> — this is what AI agents and Google parse
  if (meta.jsonLd) {
    const ldScript = `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`;
    result = result.replace("</head>", `${ldScript}\n</head>`);
  }

  return result;
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  const indexHtmlPath = path.resolve(distPath, "index.html");
  let indexHtml = "";
  try {
    indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");
  } catch { /* fall back to sendFile */ }

  app.use(express.static(distPath));

  // Blog post — per-post title/description for crawlers and social sharing
  app.get("/blog/:slug", async (req, res) => {
    if (indexHtml) {
      try {
        const post = await storage.getBlogPostBySlug(req.params.slug);
        if (post && post.status === "published") {
          const url = `https://myproxy.work/blog/${post.slug}`;
          const html = injectMeta(indexHtml, {
            title: `${post.title} — Proxy Blog`,
            description: post.excerpt || post.title,
            ogUrl: url,
          });
          return res.send(html);
        }
      } catch { /* fall through */ }
    }
    res.sendFile(indexHtmlPath);
  });

  // Portfolio page — full AEO/SEO: real profile data + JSON-LD Person schema
  app.get("/portfolio/:username", async (req, res) => {
    if (indexHtml) {
      try {
        const [customer, profile] = await Promise.all([
          storage.getCustomerByUsername(req.params.username),
          storage.getProfileByUsername(req.params.username),
        ]);

        if (customer && profile?.status === "published") {
          const name = profile.displayName || customer.name || req.params.username;
          const url  = `https://myproxy.work/portfolio/${req.params.username}`;
          const qd   = (profile.questionnaireData as any) || {};

          // Use real positioning as description, fall back to generic
          const rawDescription = profile.positioning
            ? profile.positioning.slice(0, 155)
            : `Explore ${name}'s AI career portfolio. Ask questions, understand their experience, and decide if they're the right fit — before you get on a call.`;

          // Build schema.org Person — the core of AEO
          const jsonLd: Record<string, any> = {
            "@context": "https://schema.org",
            "@type": "Person",
            name,
            url,
            mainEntityOfPage: {
              "@type": "ProfilePage",
              "@id": url,
              name: `${name} — AI Career Portfolio`,
            },
          };

          if (profile.roleTitle)        jsonLd.jobTitle     = profile.roleTitle;
          if (profile.positioning)      jsonLd.description  = profile.positioning;
          if (qd.step1?.location)       jsonLd.address      = { "@type": "PostalAddress", addressLocality: qd.step1.location };
          if (qd.step1?.linkedinUrl)    jsonLd.sameAs       = [qd.step1.linkedinUrl];
          if (qd.step10?.headshot) {
            const headshot = qd.step10.headshot as string;
            jsonLd.image = headshot.startsWith("http") ? headshot : `https://myproxy.work${headshot}`;
          }

          // Skills as knowsAbout array (split on commas/newlines, cap at 15)
          if (qd.step6?.technicalSkills) {
            const skills = qd.step6.technicalSkills
              .split(/[,\n]+/)
              .map((s: string) => s.trim())
              .filter((s: string) => s.length > 0)
              .slice(0, 15);
            if (skills.length > 0) jsonLd.knowsAbout = skills;
          }

          const html = injectMeta(indexHtml, {
            title: `${name} — ${profile.roleTitle || "AI Career Portfolio"} | Proxy`,
            description: rawDescription,
            ogUrl: url,
            jsonLd,
          });
          return res.send(html);
        }
      } catch { /* fall through to SPA */ }
    }
    res.sendFile(indexHtmlPath);
  });

  // SPA catch-all
  app.use("/{*path}", (_req, res) => {
    res.sendFile(indexHtmlPath);
  });
}
