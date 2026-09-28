import { useState } from "react";
import { motion } from "framer-motion";
import { SiteFooter, SiteNav } from "@/components/SiteChrome";
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
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
  });

  const filteredPosts = posts?.filter((post) => {
    if (activeFilter === "all") return true;
    const postCategories = post.category?.toLowerCase().split(",").map((c) => c.trim()) || [];
    return postCategories.includes(activeFilter);
  });

  const categories = [
    { key: "all", label: "All" },
    { key: "candidates", label: "Candidates" },
    { key: "recruiters", label: "Recruiters" },
    { key: "market-intelligence", label: "Market Intelligence" },
    { key: "future-of-employment", label: "Future of Employment" },
  ];

  return (
    <div className="site">
      <SiteNav />

      {/* Hero */}
      <section className="px-6 py-24 border-b border-[#DBD9CD]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="site-eyebrow mb-4">Insights</div>
            <h1 className="site-display content-h1 mb-6">
              Blog
            </h1>
            <p className="text-xl text-black/60 max-w-2xl mx-auto leading-relaxed">
              Insights for candidates and recruiters navigating the AI era
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Filters + Posts */}
      <section className="px-6 py-24 border-b border-[#DBD9CD]">
        <div className="max-w-5xl mx-auto">
          {/* Filter Tabs */}
          <div className="flex gap-4 mb-12">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveFilter(cat.key)}
                className={`px-4 py-2 font-semibold text-sm border border-[#DBD9CD] rounded-full transition-colors ${
                  activeFilter === cat.key
                    ? "bg-[#2F5D4C] text-white"
                    : "bg-white text-[#1B211E] hover:border-[#2F5D4C]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-24">
              <div className="text-lg text-black/50">Loading posts...</div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && (!filteredPosts || filteredPosts.length === 0) && (
            <div className="text-center py-24">
              <div className="text-lg text-black/50">No posts yet — check back soon</div>
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
                    className="border border-[#DBD9CD] rounded-lg bg-white cursor-pointer hover: hover:-translate-y-1 transition-all"
                  >
                    {post.heroImageUrl && (
                      <div className="aspect-video overflow-hidden border-b border-[#DBD9CD]">
                        <img
                          src={post.heroImageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        {post.category && post.category.split(",").map((cat) => (
                          <span key={cat.trim()} className="px-3 py-1 bg-[#2F5D4C] text-white text-xs font-bold uppercase tracking-widest border border-[#DBD9CD] rounded">
                            {cat.trim().replace(/-/g, " ")}
                          </span>
                        ))}
                        <span className="text-xs text-black/40">
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : ""}
                        </span>
                        <span className="text-xs text-black/40">
                          {Math.ceil(post.content.length / 1500)} min read
                        </span>
                      </div>
                      <h2 className="site-display text-2xl mb-3 leading-tight">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-sm text-black/60 leading-relaxed">
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

      <SiteFooter />
    </div>
  );
}
