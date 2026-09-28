import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SiteFooter, SiteNav } from "@/components/SiteChrome";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Copy, Check, Linkedin, Twitter } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string | null;
  heroImageUrl: string | null;
  publishedAt: string | null;
  metaDescription: string | null;
}

function renderMarkdown(markdown: string): string {
  const blocks = markdown.split("\n\n");
  const html: string[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Headings
    if (trimmed.startsWith("## ")) {
      const text = inlineMarkdown(trimmed.slice(3));
      html.push(`<h2 class="site-display text-3xl mt-10 mb-4">${text}</h2>`);
      continue;
    }

    // CTA convention: a whole paragraph wrapped as *[sentence, may contain a [link](url)]*
    // The outer [ ] aren't standard markdown — strip them along with the * italics
    // so the inner link parses cleanly instead of leaving stray */[/] characters.
    const ctaMatch = trimmed.match(/^\*\[([\s\S]+)\]\*$/);
    if (ctaMatch) {
      html.push(`<p><em>${inlineMarkdown(ctaMatch[1])}</em></p>`);
      continue;
    }

    // Bullet lists
    const lines = trimmed.split("\n");
    if (lines.every((l) => l.trim().startsWith("- "))) {
      const items = lines
        .map((l) => `<li class="ml-6 list-disc">${inlineMarkdown(l.trim().slice(2))}</li>`)
        .join("");
      html.push(`<ul class="space-y-2">${items}</ul>`);
      continue;
    }

    // Images
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      html.push(`<img src="${imgMatch[2]}" alt="${imgMatch[1]}" class="w-full border border-[#DBD9CD] rounded-lg" />`);
      continue;
    }

    // Paragraph
    html.push(`<p>${inlineMarkdown(trimmed)}</p>`);
  }

  return html.join("");
}

function inlineMarkdown(text: string): string {
  // Bold
  let result = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Links — text can't contain [ or ], so a stray nested [ doesn't get swallowed
  result = result.replace(
    /\[([^\[\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-[#2F5D4C] font-bold hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  // Italic (single asterisk, after bold/links so ** and inserted tags are untouched)
  result = result.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return result;
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();

  // Use server-preloaded data if available (prevents loading state for crawlers)
  const preloaded = typeof window !== "undefined" ? (window as any).__BLOG_POST__ : null;
  const initialData = preloaded?.slug === slug ? preloaded as BlogPost : undefined;

  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: [`/api/blog/${slug}`],
    enabled: !!slug,
    initialData,
  });

  // All published posts, for the "Keep reading" section
  const { data: allPosts } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
  });

  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribeState, setSubscribeState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const postUrl = typeof window !== "undefined" && post ? `${window.location.origin}/blog/${post.slug}` : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — nothing to fall back to, fail silently
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribeState("loading");
    try {
      await apiRequest("POST", "/api/blog/subscribe", { email: email.trim(), sourceSlug: slug });
      setSubscribeState("done");
    } catch {
      setSubscribeState("error");
    }
  };

  const relatedPosts = (() => {
    if (!allPosts || !post) return [];
    const others = allPosts.filter((p) => p.slug !== post.slug);
    const sameCategory = post.category
      ? others.filter((p) => p.category === post.category)
      : [];
    const picks = sameCategory.length >= 2 ? sameCategory : others;
    return picks.slice(0, 3);
  })();

  // JSON-LD structured data
  useEffect(() => {
    if (!post) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.metaDescription || post.excerpt || "",
      datePublished: post.publishedAt,
      author: { "@type": "Organization", name: "Proxy", url: "https://myproxy.work" },
      image: post.heroImageUrl || "",
      publisher: { "@type": "Organization", name: "Proxy" },
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [post]);

  return (
    <div className="site">
      <SiteNav />

      {/* Back link */}
      <div className="px-6 py-6 border-b border-[#DBD9CD]">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog">
            <span className="text-sm font-bold text-black/50 hover:text-[#2F5D4C] cursor-pointer uppercase tracking-widest">
              &larr; Back to Blog
            </span>
          </Link>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-24">
          <div className="text-lg text-black/50">Loading...</div>
        </div>
      )}

      {/* Error / Not found */}
      {error && (
        <div className="text-center py-24">
          <div className="text-lg text-black/50">Post not found</div>
        </div>
      )}

      {/* Post Content */}
      {post && (
        <>
          {/* Hero Image */}
          {post.heroImageUrl && (
            <div className="border-b border-[#DBD9CD]">
              <div className="max-w-5xl mx-auto">
                <img
                  src={post.heroImageUrl}
                  alt={post.title}
                  className="w-full aspect-video object-cover"
                />
              </div>
            </div>
          )}

          {/* Post Header */}
          <section className="px-6 py-16 border-b border-[#DBD9CD]">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  {post.category && (
                    <span className="px-3 py-1 bg-[#2F5D4C] text-white text-xs font-bold uppercase tracking-widest border border-[#DBD9CD] rounded">
                      {post.category}
                    </span>
                  )}
                  <span className="text-xs text-black/40">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : ""}
                  </span>
                  <span className="text-xs text-black/40">
                    {Math.ceil(post.content.length / 1500)} min read
                  </span>
                </div>
                <h1 className="site-display content-h1">
                  {post.title}
                </h1>
                <div className="text-xs font-bold uppercase tracking-widest text-black/50 mt-6">
                  Written by Vinos Samuel
                </div>
              </motion.div>
            </div>
          </section>

          {/* Post Body */}
          <section className="px-6 py-16 border-b border-[#DBD9CD]">
            <div
              className="max-w-3xl mx-auto text-lg text-black/80 leading-relaxed space-y-6 [&_h2]:text-black [&_p]:text-black/80 [&_ul]:text-black/80 [&_strong]:text-black [&_a]:text-[#2F5D4C]"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
            />
          </section>

          {/* Share */}
          <section className="px-6 py-8 border-b border-[#DBD9CD]">
            <div className="max-w-3xl mx-auto flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-widest text-black/40">Share</span>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-3 py-2 border border-[#DBD9CD] rounded text-xs font-bold uppercase tracking-widest hover:bg-[#2F5D4C] transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy Link"}
              </button>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 border border-[#DBD9CD] rounded text-xs font-bold uppercase tracking-widest hover:bg-[#2F5D4C] transition-colors"
              >
                <Linkedin size={14} />
                LinkedIn
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 border border-[#DBD9CD] rounded text-xs font-bold uppercase tracking-widest hover:bg-[#2F5D4C] transition-colors"
              >
                <Twitter size={14} />
                X
              </a>
            </div>
          </section>

          {/* Email Capture */}
          <section className="px-6 py-16 border-b border-[#DBD9CD]">
            <div className="max-w-3xl mx-auto border border-[#DBD9CD] rounded-lg bg-white p-8 text-center">
              {subscribeState === "done" ? (
                <p className="text-lg font-bold">You're on the list.</p>
              ) : (
                <>
                  <h3 className="site-display text-2xl mb-2">Join the list</h3>
                  <p className="text-sm text-black/60 mb-6">
                    Future Proxy research updates. No fluff, no funnel. Emails haven't started yet.
                  </p>
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="flex-1 px-4 py-3 border border-[#DBD9CD] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D4C]"
                    />
                    <button
                      type="submit"
                      disabled={subscribeState === "loading"}
                      className="site-btn site-btn--sm disabled:opacity-50"
                    >
                      {subscribeState === "loading" ? "..." : "Subscribe"}
                    </button>
                  </form>
                  {subscribeState === "error" && (
                    <p className="text-xs text-red-600 mt-3">Something went wrong — try again.</p>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Keep Reading */}
          {relatedPosts.length > 0 && (
            <section className="px-6 py-16 border-b border-[#DBD9CD]">
              <div className="max-w-5xl mx-auto">
                <h3 className="site-display text-2xl mb-8">Keep reading</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {relatedPosts.map((p) => (
                    <Link key={p.slug} href={`/blog/${p.slug}`}>
                      <div className="border border-[#DBD9CD] rounded-lg bg-[#FBFAF6] p-5 cursor-pointer hover: hover:-translate-y-1 transition-all h-full">
                        {p.category && (
                          <span className="inline-block px-2 py-1 bg-[#2F5D4C] text-white text-[10px] font-bold uppercase tracking-widest border border-[#DBD9CD] rounded mb-3">
                            {p.category.split(",")[0].trim().replace(/-/g, " ")}
                          </span>
                        )}
                        <h4 className="site-display text-lg leading-tight">
                          {p.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <SiteFooter />
    </div>
  );
}
