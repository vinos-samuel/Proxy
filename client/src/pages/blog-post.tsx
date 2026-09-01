import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
      html.push(`<h2 class="text-3xl font-bold mt-10 mb-4 uppercase tracking-tight">${text}</h2>`);
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
      html.push(`<img src="${imgMatch[2]}" alt="${imgMatch[1]}" class="w-full border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" />`);
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
    '<a href="$2" class="text-[#22C55E] font-bold hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
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
    <div className="min-h-screen bg-[#E8E8E3] text-black selection:bg-[#22C55E]/30" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Navigation */}
      <nav className="border-b-[3px] border-black bg-white sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-8 h-8 bg-black flex items-center justify-center border-[2px] border-black group-hover:bg-[#22C55E] transition-colors">
                <span className="text-white font-black text-xl leading-none">P</span>
              </div>
              <span className="font-bold text-xl tracking-tighter">PROXY</span>
            </div>
          </Link>
          <div className="flex gap-8 mono text-xs font-bold uppercase tracking-widest">
            <Link href="/about"><span className="cursor-pointer hover:text-[#22C55E]">About</span></Link>
            <Link href="/blog"><span className="cursor-pointer hover:text-[#22C55E] border-b-2 border-black">Blog</span></Link>
            <Link href="/faq"><span className="cursor-pointer hover:text-[#22C55E]">FAQ</span></Link>
            <Link href="/pricing"><span className="cursor-pointer hover:text-[#22C55E]">Pricing</span></Link>
          </div>
        </div>
      </nav>

      {/* Back link */}
      <div className="px-6 py-6 border-b-[3px] border-black bg-white">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog">
            <span className="mono text-sm font-bold text-black/50 hover:text-[#22C55E] cursor-pointer uppercase tracking-widest">
              &larr; Back to Blog
            </span>
          </Link>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-24">
          <div className="mono text-lg text-black/50">Loading...</div>
        </div>
      )}

      {/* Error / Not found */}
      {error && (
        <div className="text-center py-24">
          <div className="mono text-lg text-black/50">Post not found</div>
        </div>
      )}

      {/* Post Content */}
      {post && (
        <>
          {/* Hero Image */}
          {post.heroImageUrl && (
            <div className="border-b-[3px] border-black">
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
          <section className="px-6 py-16 border-b-[3px] border-black bg-white">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  {post.category && (
                    <span className="px-3 py-1 bg-[#22C55E] text-black text-xs font-bold uppercase tracking-widest border-[2px] border-black">
                      {post.category}
                    </span>
                  )}
                  <span className="mono text-xs text-black/40">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : ""}
                  </span>
                  <span className="mono text-xs text-black/40">
                    {Math.ceil(post.content.length / 1500)} min read
                  </span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold leading-none uppercase tracking-tighter">
                  {post.title}
                </h1>
                <div className="mono text-xs font-bold uppercase tracking-widest text-black/50 mt-6">
                  Written by Vinos Samuel
                </div>
              </motion.div>
            </div>
          </section>

          {/* Post Body */}
          <section className="px-6 py-16 border-b-[3px] border-black">
            <div
              className="max-w-3xl mx-auto mono text-lg text-black/80 leading-relaxed space-y-6 [&_h2]:text-black [&_p]:text-black/80 [&_ul]:text-black/80 [&_strong]:text-black [&_a]:text-[#22C55E]"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
            />
          </section>

          {/* Share */}
          <section className="px-6 py-8 border-b-[3px] border-black bg-white">
            <div className="max-w-3xl mx-auto flex items-center gap-4">
              <span className="mono text-xs font-bold uppercase tracking-widest text-black/40">Share</span>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-3 py-2 border-[2px] border-black text-xs font-bold uppercase tracking-widest hover:bg-[#22C55E] transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy Link"}
              </button>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 border-[2px] border-black text-xs font-bold uppercase tracking-widest hover:bg-[#22C55E] transition-colors"
              >
                <Linkedin size={14} />
                LinkedIn
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 border-[2px] border-black text-xs font-bold uppercase tracking-widest hover:bg-[#22C55E] transition-colors"
              >
                <Twitter size={14} />
                X
              </a>
            </div>
          </section>

          {/* Email Capture */}
          <section className="px-6 py-16 border-b-[3px] border-black">
            <div className="max-w-3xl mx-auto border-[3px] border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8 text-center">
              {subscribeState === "done" ? (
                <p className="mono text-lg font-bold">You're on the list. New posts land in your inbox.</p>
              ) : (
                <>
                  <h3 className="text-2xl font-bold uppercase tracking-tight mb-2">Get the next post</h3>
                  <p className="mono text-sm text-black/60 mb-6">
                    One email a week. No fluff, no funnel.
                  </p>
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="flex-1 px-4 py-3 border-[2px] border-black mono text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                    />
                    <button
                      type="submit"
                      disabled={subscribeState === "loading"}
                      className="px-6 py-3 bg-black text-white border-[2px] border-black text-xs font-bold uppercase tracking-widest hover:bg-[#22C55E] hover:text-black transition-colors disabled:opacity-50"
                    >
                      {subscribeState === "loading" ? "..." : "Subscribe"}
                    </button>
                  </form>
                  {subscribeState === "error" && (
                    <p className="mono text-xs text-red-600 mt-3">Something went wrong — try again.</p>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Keep Reading */}
          {relatedPosts.length > 0 && (
            <section className="px-6 py-16 border-b-[3px] border-black bg-white">
              <div className="max-w-5xl mx-auto">
                <h3 className="text-xl font-bold uppercase tracking-tight mb-8">Keep Reading</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {relatedPosts.map((p) => (
                    <Link key={p.slug} href={`/blog/${p.slug}`}>
                      <div className="border-[3px] border-black bg-[#E8E8E3] p-5 cursor-pointer hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all h-full">
                        {p.category && (
                          <span className="inline-block px-2 py-1 bg-[#22C55E] text-black text-[10px] font-bold uppercase tracking-widest border-[2px] border-black mb-3">
                            {p.category.split(",")[0].trim().replace(/-/g, " ")}
                          </span>
                        )}
                        <h4 className="text-base font-bold uppercase tracking-tight leading-tight">
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

      {/* Footer */}
      <footer className="px-6 py-12 border-t-[3px] border-black bg-[#E8E8E3]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black flex items-center justify-center border-[2px] border-black">
              <span className="text-white font-black text-sm leading-none">P</span>
            </div>
            <span className="font-bold text-lg tracking-tighter uppercase">Proxy</span>
          </div>
          <div className="flex gap-8 mono text-xs font-bold uppercase tracking-widest text-black/50">
            <Link href="/about"><span className="cursor-pointer hover:text-black">About</span></Link>
            <Link href="/blog"><span className="cursor-pointer hover:text-black">Blog</span></Link>
            <Link href="/faq"><span className="cursor-pointer hover:text-black">FAQ</span></Link>
            <Link href="/#pricing"><span className="cursor-pointer hover:text-black">Pricing</span></Link>
            <a href="mailto:vinos@myproxy.work" className="cursor-pointer hover:text-black">vinos@myproxy.work</a>
            <span>&copy; 2026 Digital Twin Studio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
