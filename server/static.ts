import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { storage } from "./storage";

function injectMeta(html: string, meta: {
  title: string;
  description: string;
  ogUrl?: string;
}) {
  const t = meta.title;
  const d = meta.description.replace(/"/g, "&quot;");
  const url = (meta.ogUrl || "").replace(/"/g, "&quot;");
  return html
    .replace(/<title>.*?<\/title>/, `<title>${t}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/,        `$1${d}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/,       `$1${t}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/,  `$1${d}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/,          `$1${url}$2`)
    .replace(/(<meta property="twitter:title" content=")[^"]*(")/,   `$1${t}$2`)
    .replace(/(<meta property="twitter:description" content=")[^"]*(")/,`$1${d}$2`)
    .replace(/(<meta property="twitter:url" content=")[^"]*(")/,     `$1${url}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/,               `$1${url}$2`);
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

  // Portfolio page — per-profile title/description
  app.get("/portfolio/:username", async (req, res) => {
    if (indexHtml) {
      try {
        const [customer, profile] = await Promise.all([
          storage.getCustomerByUsername(req.params.username),
          storage.getProfileByUsername(req.params.username),
        ]);
        if (customer && profile?.status === "published") {
          const name = customer.name || req.params.username;
          const url = `https://myproxy.work/portfolio/${req.params.username}`;
          const html = injectMeta(indexHtml, {
            title: `${name} — AI Career Portfolio | Proxy`,
            description: `Explore ${name}'s AI career portfolio. Ask questions, understand their work, and see if they're the right fit — before you even get on a call.`,
            ogUrl: url,
          });
          return res.send(html);
        }
      } catch { /* fall through */ }
    }
    res.sendFile(indexHtmlPath);
  });

  // SPA catch-all
  app.use("/{*path}", (_req, res) => {
    res.sendFile(indexHtmlPath);
  });
}
