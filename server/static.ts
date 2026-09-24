import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { storage } from "./storage";
import { getCustomerForPublicPortfolio, getProfileForPublicPortfolio, canonicalPublicUsername } from "./portfolio-alias";
import { profileDocumentSchema, toPublicProfileDocument } from "@shared/profile-document";

/** Strip characters that could break HTML attributes or the <title> tag */
function sanitize(str: string): string {
  return str.replace(/[<>"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] ?? c));
}

function sanitizeXml(str: string): string {
  return str.replace(/[<>&"']/g, (character) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;",
  }[character] || character));
}

function wrapCardText(text: string, maxLineLength = 34): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/)) {
    if (current && `${current} ${word}`.length > maxLineLength) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function injectMeta(html: string, meta: {
  title: string;
  description: string;
  ogUrl?: string;
  ogType?: string;
  ogImage?: string;
  jsonLd?: object;
}): string {
  const t    = sanitize(meta.title);
  const d    = sanitize(meta.description);
  const url  = sanitize(meta.ogUrl || "");
  const type = sanitize(meta.ogType || "website");

  let result = html
    .replace(/<title>.*?<\/title>/,                                     `<title>${t}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/,            `$1${d}$2`)
    .replace(/(<meta property="og:type" content=")[^"]*(")/,            `$1${type}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/,           `$1${t}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/,     `$1${d}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/,             `$1${url}$2`)
    .replace(/(<meta property="twitter:title" content=")[^"]*(")/,      `$1${t}$2`)
    .replace(/(<meta property="twitter:description" content=")[^"]*(")/,`$1${d}$2`)
    .replace(/(<meta property="twitter:url" content=")[^"]*(")/,        `$1${url}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/,                  `$1${url}$2`);

  // Override og:image if provided
  if (meta.ogImage) {
    const img = sanitize(meta.ogImage);
    result = result
      .replace(/(<meta property="og:image" content=")[^"]*(")/,         `$1${img}$2`)
      .replace(/(<meta property="twitter:image" content=")[^"]*(")/,    `$1${img}$2`);
  }

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

  // Deterministic social card from the approved public snapshot only.
  app.get("/social-card/:username.png", async (req, res) => {
    try {
      const [customer, profile] = await Promise.all([
        getCustomerForPublicPortfolio(req.params.username),
        getProfileForPublicPortfolio(req.params.username),
      ]);
      if (!customer || !profile || profile.status !== "published") return res.status(404).end();
      const row = await storage.getProfileDocumentByProfileId(profile.id);
      if (!row?.publishedDocument) return res.status(404).end();
      const page = toPublicProfileDocument(profileDocumentSchema.parse(row.publishedDocument));
      const palette = page.style === "modern"
        ? { background: "#f2f6fa", ink: "#102c59", accent: "#8da5c2" }
        : page.style === "expressive"
          ? { background: "#2d172d", ink: "#fbf2f8", accent: "#c687b7" }
          : { background: "#f4f1e9", ink: "#17201b", accent: "#778066" };
      const name = sanitizeXml(page.identity.name.slice(0, 70));
      const title = sanitizeXml(page.identity.title.slice(0, 90));
      const headline = sanitizeXml(page.identity.headline.slice(0, 125));
      const slug = sanitizeXml(canonicalPublicUsername(req.params.username));
      const headlineLines = wrapCardText(headline).map((line, index) => `<tspan x="110" dy="${index === 0 ? 0 : 52}">${line}</tspan>`).join("");
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="${palette.background}"/><rect x="64" y="64" width="8" height="502" fill="${palette.accent}"/><text x="110" y="125" fill="${palette.accent}" font-family="Arial,sans-serif" font-size="24" letter-spacing="4">PROXY / PROFESSIONAL EVIDENCE</text><text x="110" y="220" fill="${palette.ink}" font-family="Georgia,serif" font-size="62">${name}</text><text x="110" y="270" fill="${palette.accent}" font-family="Arial,sans-serif" font-size="25">${title}</text><text x="110" y="350" fill="${palette.ink}" font-family="Georgia,serif" font-size="42">${headlineLines}</text><text x="110" y="550" fill="${palette.accent}" font-family="Arial,sans-serif" font-size="22">myproxy.work/portfolio/${slug}</text></svg>`;
      const png = await sharp(Buffer.from(svg)).png().toBuffer();
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.send(png);
    } catch {
      return res.status(404).end();
    }
  });

  // Blog listing page — custom meta for the index
  app.get("/blog", (_req, res) => {
    if (indexHtml) {
      const html = injectMeta(indexHtml, {
        title: "Career Advice for Senior Professionals — Proxy Blog",
        description: "Practical articles on job search, AI sourcing, career positioning, and what it actually takes to land senior roles in 2026.",
        ogUrl: "https://myproxy.work/blog",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Proxy Blog",
          url: "https://myproxy.work/blog",
          description: "Career advice for mid to senior professionals — job search strategy, AI sourcing, and how to stand out in 2026.",
          publisher: {
            "@type": "Organization",
            name: "Proxy",
            url: "https://myproxy.work",
          },
        },
      });
      return res.send(html);
    }
    res.sendFile(indexHtmlPath);
  });

  // Blog post — per-post title/description + BlogPosting JSON-LD for crawlers
  app.get("/blog/:slug", async (req, res) => {
    if (indexHtml) {
      try {
        const post = await storage.getBlogPostBySlug(req.params.slug);
        if (post && post.status === "published") {
          const url         = `https://myproxy.work/blog/${post.slug}`;
          const description = post.metaDescription || post.excerpt || post.title;
          const datePublished = (post.publishedAt || post.createdAt).toISOString();
          const dateModified  = post.updatedAt.toISOString();

          const jsonLd: Record<string, any> = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description,
            url,
            datePublished,
            dateModified,
            author: {
              "@type": "Organization",
              name: "Proxy",
              url: "https://myproxy.work",
            },
            publisher: {
              "@type": "Organization",
              name: "Proxy",
              url: "https://myproxy.work",
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": url,
            },
          };

          if (post.heroImageUrl) jsonLd.image = post.heroImageUrl;

          // Use hero image as OG image if available, otherwise use blog-specific fallback
          const ogImage = (post.heroImageUrl && post.heroImageUrl.startsWith("http"))
            ? post.heroImageUrl
            : "https://myproxy.work/og-blog.png";

          // Preload post data so React renders immediately — no API wait, no loading state
          // This prevents Google from capturing a "Loading..." soft 404
          const preloadData = {
            id: post.id,
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            category: post.category,
            heroImageUrl: post.heroImageUrl,
            publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
            metaDescription: post.metaDescription,
          };

          // Increment view count server-side — fires on every real page visit
          storage.incrementBlogViewCount(post.id).catch(() => {});

          let html = injectMeta(indexHtml, {
            title: `${post.title} — Proxy Blog`,
            description,
            ogUrl: url,
            ogType: "article",
            ogImage,
            jsonLd,
          });

          // Inject preload script before </head>
          const preloadScript = `<script>window.__BLOG_POST__ = ${JSON.stringify(preloadData)};</script>`;
          html = html.replace("</head>", `${preloadScript}\n</head>`);

          return res.send(html);
        }
      } catch { /* fall through */ }
    }
    res.status(404).sendFile(indexHtmlPath);
  });

  // Portfolio page — full AEO/SEO: real profile data + JSON-LD Person schema
  app.get("/portfolio/:username", async (req, res) => {
    if (req.params.username.toLowerCase() === "admin") {
      return res.redirect(301, "/portfolio/vinos");
    }
    if (indexHtml) {
      try {
        const [customer, profile] = await Promise.all([
          getCustomerForPublicPortfolio(req.params.username),
          getProfileForPublicPortfolio(req.params.username),
        ]);

        if (customer && profile?.status === "published") {
          const documentRow = await storage.getProfileDocumentByProfileId(profile.id);
          const page = documentRow?.publishedDocument
            ? toPublicProfileDocument(profileDocumentSchema.parse(documentRow.publishedDocument))
            : null;
          const name = page?.identity.name || profile.displayName || customer.name || req.params.username;
          const url  = `https://myproxy.work/portfolio/${canonicalPublicUsername(req.params.username)}`;
          const qd   = (profile.questionnaireData as any) || {};

          // Use real positioning as description, fall back to generic
          const rawDescription = page?.identity.summary
            ? page.identity.summary.slice(0, 155)
            : profile.positioning
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

          if (page?.identity.title || profile.roleTitle) jsonLd.jobTitle = page?.identity.title || profile.roleTitle;
          if (page?.identity.summary || profile.positioning) jsonLd.description = page?.identity.summary || profile.positioning;
          const publicLocation = page?.identity.location || (!page ? qd.step1?.location : null);
          const publicLinkedin = page?.contact.linkedin || (!page ? qd.step1?.linkedinUrl : null);
          if (publicLocation) jsonLd.address = { "@type": "PostalAddress", addressLocality: publicLocation };
          if (publicLinkedin) jsonLd.sameAs = [publicLinkedin];

          // Real headshot for both the JSON-LD image and the social share
          // card (og:image / twitter:image) — without this, LinkedIn/Slack
          // previews show the generic Proxy logo even for a profile with a
          // real photo. profile.photoUrl is the canonical column; step10's
          // questionnaire field is only a fallback for older data that
          // predates it — same order the /api/portfolio endpoint already
          // uses (see routes.ts), which this was missing. Falls through to
          // the base template's default image when there's no photo at all.
          const rawHeadshot: string | null = page?.identity.photoUrl || profile.photoUrl || qd.step10?.headshot || qd.step10?.photoUrl || null;
          let headshotUrl: string | undefined;
          if (rawHeadshot) {
            headshotUrl = rawHeadshot.startsWith("http") ? rawHeadshot : `https://myproxy.work${rawHeadshot}`;
            jsonLd.image = headshotUrl;
          }

          // Skills as knowsAbout array (split on commas/newlines, cap at 15)
          const skillText = page?.skills.join(",") || (!page ? qd.step6?.technicalSkills : "");
          if (skillText) {
            const skills = skillText
              .split(/[,\n]+/)
              .map((s: string) => s.trim())
              .filter((s: string) => s.length > 0)
              .slice(0, 15);
            if (skills.length > 0) jsonLd.knowsAbout = skills;
          }

          const html = injectMeta(indexHtml, {
            title: `${name} — ${page?.identity.title || profile.roleTitle || "Professional Profile"} | Proxy`,
            description: rawDescription,
            ogUrl: url,
            ogImage: page ? `https://myproxy.work/social-card/${canonicalPublicUsername(req.params.username)}.png` : headshotUrl,
            jsonLd,
          });
          return res.send(html);
        }
      } catch { /* fall through to SPA */ }
    }
    res.status(404).sendFile(indexHtmlPath);
  });

  // Known static client routes — these render via the SPA shell with a real 200
  const knownStaticRoutes = new Set([
    "/", "/about", "/blog", "/faq", "/login", "/register", "/dashboard",
    "/questionnaire", "/preview", "/admin", "/interview", "/onboarding-chat",
    "/job-search", "/preview-draft", "/payment/success", "/payment/cancelled",
    "/forgot-password", "/reset-password", "/verify-email", "/privacy",
    "/terms", "/pricing", "/try", "/builder",
  ]);

  // SPA catch-all — real 404 status for anything that isn't a known static
  // route. /blog/:slug and /portfolio/:username are handled by the routes
  // above (which now also send a real 404 when the slug/username doesn't
  // resolve to a published record), so they never reach here.
  app.all("/{*path}", (req, res) => {
    if (knownStaticRoutes.has(req.path)) {
      return res.sendFile(indexHtmlPath);
    }
    res.status(404).sendFile(indexHtmlPath);
  });
}
