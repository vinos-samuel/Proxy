import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import {
  Edit, Eye, Globe, LogOut,
  FileText, Sparkles, ExternalLink, ArrowRight, Copy
} from "lucide-react";
import type { TwinProfile } from "@shared/schema";
import PaymentGate from "@/components/PaymentGate";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const { data: profile, isLoading } = useQuery<TwinProfile | null>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  useEffect(() => {
    if (profile?.status === 'processing') {
      const interval = setInterval(async () => {
        try {
          const res = await fetch('/api/profile/status', { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            if (data.status !== 'processing') {
              queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
              clearInterval(interval);
            }
          }
        } catch {}
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [profile?.status]);

  const statusMap: Record<string, { label: string; color: string }> = {
    draft: { label: "DRAFT", color: "bg-[#FDE68A]" },
    processing: { label: "PROCESSING", color: "bg-[#93C5FD]" },
    ready: { label: "READY_TO_PUBLISH", color: "bg-[#86EFAC]" },
    published: { label: "PUBLISHED", color: "bg-[#22C55E]" },
  };

  const profileStatus = profile ? statusMap[profile.status] || statusMap.draft : statusMap.draft;

  return (
    <div className="min-h-screen bg-[#E8E8E3] text-black pb-12" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav className="border-b-[3px] border-black bg-[#D1D1CC] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/dashboard">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 bg-[#22C55E] border-[3px] border-black flex items-center justify-center font-bold text-black text-xl">
                P
              </div>
              <span className="text-2xl font-bold tracking-tight" data-testid="text-brand-name">PROXY</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <span className="mono text-sm text-black/60 hidden sm:inline uppercase tracking-wider">{user?.name}</span>
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 mono text-sm text-black/60 hover:text-black uppercase tracking-wider"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <div className="mono text-xs text-black/50 mb-2 uppercase tracking-widest">&#9698; Control Panel</div>
            <h1 className="text-4xl font-bold mb-2">DASHBOARD</h1>
            <p className="mono text-sm text-black/60">
              Welcome back, {user?.name}. Manage your Digital Twin below.
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white border-[3px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <Skeleton className="h-6 w-32 mb-4 bg-black/10" />
                  <Skeleton className="h-4 w-full mb-2 bg-black/10" />
                  <Skeleton className="h-4 w-2/3 bg-black/10" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2 bg-white border-[3px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-[#22C55E] border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <span className="text-2xl font-bold text-black">
                          {(profile?.displayName || user?.name || "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">
                          {profile?.displayName || "Your Digital Twin"}
                        </h2>
                        <p className="mono text-sm text-black/60">
                          {profile?.roleTitle || "No role set yet"}
                        </p>
                      </div>
                    </div>
                    <div className={`inline-block px-3 py-1 ${profileStatus.color} border-[3px] border-black mono text-xs uppercase tracking-wider font-bold`} data-testid="badge-profile-status">
                      {profileStatus.label}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {!profile && (
                      <Link href="/questionnaire">
                        <button
                          className="bg-[#22C55E] text-black px-6 py-3 font-bold border-[3px] border-black mono text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#16A34A] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                          data-testid="button-start-questionnaire"
                        >
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            START QUESTIONNAIRE
                          </span>
                        </button>
                      </Link>
                    )}
                    {profile?.status === "draft" && (
                      <Link href="/questionnaire">
                        <button
                          className="bg-[#22C55E] text-black px-6 py-3 font-bold border-[3px] border-black mono text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#16A34A] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                          data-testid="button-continue-questionnaire"
                        >
                          <span className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            CONTINUE SETUP
                          </span>
                        </button>
                      </Link>
                    )}
                    {(profile?.status === "ready" || profile?.status === "published") && (
                      <>
                        <Link href="/preview">
                          <button
                            className="bg-white text-black px-6 py-3 font-bold border-[3px] border-black mono text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                            data-testid="button-preview"
                          >
                            <span className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              PREVIEW
                            </span>
                          </button>
                        </Link>
                        {profile.status === "published" && (
                          <a
                            href={`/portfolio/${user?.username}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <button
                              className="bg-[#22C55E] text-black px-6 py-3 font-bold border-[3px] border-black mono text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#16A34A] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                              data-testid="button-view-live"
                            >
                              <span className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                VIEW LIVE
                                <ExternalLink className="h-3 w-3" />
                              </span>
                            </button>
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white border-[3px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] brutal-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#E8A75D] border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <FileText className="h-6 w-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">QUESTIONNAIRE</h3>
                    <div className="mono text-xs text-black/50 uppercase">CONTEXT_INGESTION</div>
                  </div>
                </div>
                <p className="mono text-sm text-black/60 mb-4">
                  {profile ? "Update your career information and stories." : "Tell us about your career to build your Digital Twin."}
                </p>
                <Link href="/questionnaire">
                  <button
                    className="bg-black text-white px-5 py-2 font-bold border-[3px] border-black mono text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:bg-gray-800 transition-transform active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    data-testid="button-goto-questionnaire"
                  >
                    <span className="flex items-center gap-2">
                      {profile ? "EDIT ANSWERS" : "GET STARTED"}
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </button>
                </Link>
              </div>

              <div className="bg-white border-[3px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] brutal-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#93C5FD] border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <Sparkles className="h-6 w-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">AI PROCESSING</h3>
                    <div className="mono text-xs text-black/50 uppercase">NEURAL_ENGINE</div>
                  </div>
                </div>
                <p className="mono text-sm text-black/60 mb-4">
                  {profile?.status === "ready" || profile?.status === "published"
                    ? "Your content has been processed by AI."
                    : "Submit your questionnaire to start AI processing."}
                </p>
                <div className={`inline-block px-3 py-1 ${
                  profile?.status === "processing" ? "bg-[#93C5FD]" :
                  profile?.status === "ready" || profile?.status === "published" ? "bg-[#86EFAC]" :
                  "bg-[#D1D1CC]"
                } border-[3px] border-black mono text-xs uppercase tracking-wider font-bold`}>
                  {profile?.status === "processing" ? "IN_PROGRESS" : profile?.status === "ready" || profile?.status === "published" ? "COMPLETE" : "WAITING_FOR_INPUT"}
                </div>
              </div>

              {profile?.status === "ready" && profile?.paymentStatus !== "paid" && (
                <PaymentGate profileId={profile.id} />
              )}

              {profile?.status === "published" && (
                <div className="md:col-span-2 bg-white border-[3px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="h-5 w-5 text-black" />
                    <h3 className="font-bold text-lg">PORTFOLIO_URL</h3>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-0 border-[3px] border-black bg-[#D1D1CC] px-4 py-3 mono text-sm text-black overflow-x-auto" data-testid="text-portfolio-url">
                      <span className="text-black/40">$ </span>{user?.username}.myproxy.work
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://${user?.username}.myproxy.work`);
                      }}
                      className="bg-black text-white px-5 py-3 font-bold border-[3px] border-black mono text-xs uppercase tracking-wider hover:bg-gray-800 transition-transform active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-2"
                      data-testid="button-copy-url"
                    >
                      <Copy className="h-3 w-3" />
                      COPY
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      <footer className="max-w-6xl mx-auto px-6 pt-12 border-t-2 border-black/10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 opacity-50">
          <div className="w-6 h-6 bg-black flex items-center justify-center border-[2px] border-black">
            <span className="text-white font-black text-sm leading-none">P</span>
          </div>
          <span className="font-bold text-lg tracking-tighter uppercase">Proxy</span>
        </div>
        <div className="flex gap-6 mono text-xs font-bold uppercase tracking-widest text-black/40">
          <Link href="/about"><span className="cursor-pointer hover:text-black">About</span></Link>
          <Link href="/faq"><span className="cursor-pointer hover:text-black">FAQ</span></Link>
          <a href="mailto:myproxy_work@proton.me" className="cursor-pointer hover:text-black">myproxy_work@proton.me</a>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
}
