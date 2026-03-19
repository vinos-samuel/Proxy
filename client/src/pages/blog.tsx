import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
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

export default function BlogPage() {
  const [activeFilter, setActiveFilter] = useState<"all" | "candidates" | "recruiters">("all");

  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
  });

  const filteredPosts = posts?.filter((post) => {
    if (activeFilter === "all") return true;
    return post.category?.toLowerCase() === activeFilter;
  });

  const categories = [
    { key: "all" as const, label: "All" },
    { key: "candidates" as const, label: "Candidates" },
    { key: "recruiters" as const, label: "Recruiters" },
  ];

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

      {/* Hero */}
      <section className="px-6 py-24 border-b-[3px] border-black bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mono text-xs text-black/50 mb-4 uppercase tracking-widest">&#9698; Insights</div>
            <h1 className="text-6xl lg:text-8xl font-bold mb-8 leading-none uppercase tracking-tighter">
              Blog
            </h1>
            <p className="mono text-xl text-black/60 max-w-2xl mx-auto leading-relaxed">
              Insights for candidates and recruiters navigating the AI era
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Filters + Posts */}
      <section className="px-6 py-24 border-b-[3px] border-black">
        <div className="max-w-5xl mx-auto">
          {/* Filter Tabs */}
          <div className="flex gap-4 mb-12">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveFilter(cat.key)}
                className={`px-6 py-3 font-bold text-sm uppercase tracking-widest border-[3px] border-black transition-colors ${
                  activeFilter === cat.key
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-[#22C55E]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-24">
              <div className="mono text-lg text-black/50">Loading posts...</div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && (!filteredPosts || filteredPosts.length === 0) && (
            <div className="text-center py-24">
              <div className="mono text-lg text-black/50">No posts yet — check back soon</div>
            </div>
          )}

          {/* Post Grid */}
          {filteredPosts && filteredPosts.length > 0 && (
            <div className="grid md:grid-cols-2 gap-8">
              {filteredPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-[3px] border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"
                  >
                    {post.heroImageUrl && (
                      <div className="aspect-video overflow-hidden border-b-[3px] border-black">
                        <img
                          src={post.heroImageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        {post.category && (
                          <span className="px-3 py-1 bg-[#22C55E] text-black text-xs font-bold uppercase tracking-widest border-[2px] border-black">
                            {post.category}
                          </span>
                        )}
                        <span className="mono text-xs text-black/40">
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : ""}
                        </span>
                        <span className="mono text-xs text-black/40">
                          {Math.ceil(post.content.length / 1500)} min read
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold mb-3 uppercase tracking-tight leading-tight">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="mono text-sm text-black/60 leading-relaxed">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

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
            <a href="mailto:myproxy_work@proton.me" className="cursor-pointer hover:text-black">myproxy_work@proton.me</a>
            <span>&copy; 2026 Digital Twin Studio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
