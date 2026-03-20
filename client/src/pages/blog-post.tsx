import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";

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
  // Links
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-[#22C55E] font-bold hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  return result;
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: [`/api/blog/${slug}`],
    enabled: !!slug,
  });

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
