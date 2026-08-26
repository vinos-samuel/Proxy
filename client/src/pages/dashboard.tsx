import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ProxyLogo from "@/components/ProxyLogo";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { buildLinkedInPost } from "@/lib/shareCopy";
import {
  Edit, Eye, Globe, LogOut,
  FileText, Sparkles, ExternalLink, ArrowRight, Copy, BarChart3, MessageSquare, Lock, Trash2, Mic, Loader2
} from "lucide-react";
import type { TwinProfile } from "@shared/schema";
import PaymentGate from "@/components/PaymentGate";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  const DELETE_REASONS = [
    "I found a job",
    "The profile doesn't sound like me",
    "I don't see the value",
    "Too much information to fill",
    "Duplicate account",
    "Just exploring — not ready to use it",
  ];

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await apiRequest("DELETE", "/api/account", { reason: deleteReason || "Not provided" });
      navigate("/");
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete account. Please try again.");
      setDeleteLoading(false);
    }
  };

  const { data: referral } = useQuery<{ count: number; referralUrl: string }>({
    queryKey: ["/api/referral/count"],
  });

  const { data: analytics } = useQuery<{ viewCount: number; recentQuestions: { question: string; askedAt: string }[] }>({
    queryKey: ["/api/analytics/my"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/my", { credentials: "include" });
      if (!res.ok) return { viewCount: 0, recentQuestions: [] };
      return res.json();
    },
    enabled: !!user,
  });

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
    if (profile?.status === 'processing' || profile?.status === 'reprocessing') {
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
    reprocessing: { label: "UPDATING", color: "bg-[#93C5FD]" },
    ready: { label: "READY TO PUBLISH", color: "bg-[#86EFAC]" },
    published: { label: "PUBLISHED", color: "bg-[#22C55E]" },
  };

  const profileStatus = profile ? statusMap[profile.status] || statusMap.draft : statusMap.draft;
  const isFree = profile?.tier === "free";
  const freeWindowExpired = isFree && profile?.freePublishedAt
    ? (Date.now() - new Date(profile.freePublishedAt).getTime()) / (1000 * 60 * 60) > 24 * 7
    : false;

  const questionCount = analytics?.recentQuestions?.length ?? 0;
  const viewCount = analytics?.viewCount ?? 0;

  const showUpgrade = profile && (
    (profile.status === "ready" && profile.paymentStatus !== "paid") ||
    (profile.status === "published" && profile.tier === "free")
  );

  return (
    <div className="min-h-screen bg-[#E8E8E3] text-black pb-12" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav className="border-b-[3px] border-black bg-[#D1D1CC] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/">
            <div className="cursor-pointer" data-testid="text-brand-name">
              <ProxyLogo />
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/job-search">
              <span className="mono text-sm font-bold text-black/60 hover:text-black uppercase tracking-wider cursor-pointer hidden sm:inline">Job Search</span>
            </Link>
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-1">DASHBOARD</h1>
            <p className="mono text-sm text-black/60">
              Welcome back, {user?.name?.split(" ")[0]}.
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

              {/* 1. Profile card */}
              <div className="md:col-span-2 bg-white border-[3px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-14 h-14 bg-[#22C55E] border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <span className="text-2xl font-bold text-black">
                          {(profile?.displayName || user?.name || "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">
                          {profile?.displayName || user?.name || "Your Digital Twin"}
                        </h2>
                        <p className="mono text-sm text-black/60">
                          {profile?.roleTitle || "No role set yet"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className={`inline-block px-3 py-1 ${profileStatus.color} border-[3px] border-black mono text-xs uppercase tracking-wider font-bold`} data-testid="badge-profile-status">
                        {profileStatus.label}
                      </div>
                      {profile?.status === "published" && (
                        <a
                          href={`/portfolio/${user?.username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 mono text-xs text-black/60 hover:text-black underline underline-offset-2"
                          data-testid="text-portfolio-url"
                        >
                          myproxy.work/portfolio/{user?.username}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {!profile && (
                      <Link href="/questionnaire">
                        <button className="bg-[#22C55E] text-black px-6 py-3 font-bold border-[3px] border-black mono text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#16A34A] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none" data-testid="button-start-questionnaire">
                          <span className="flex items-center gap-2"><FileText className="h-4 w-4" />START QUESTIONNAIRE</span>
                        </button>
                      </Link>
                    )}
                    {profile?.status === "draft" && (
                      <Link href="/questionnaire">
                        <button className="bg-[#22C55E] text-black px-6 py-3 font-bold border-[3px] border-black mono text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#16A34A] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none" data-testid="button-continue-questionnaire">
                          <span className="flex items-center gap-2"><Edit className="h-4 w-4" />CONTINUE SETUP</span>
                        </button>
                      </Link>
                    )}
                    {(profile?.status === "ready" || profile?.status === "published") && (
                      <>
                        <Link href="/preview">
                          <button className="bg-white text-black px-6 py-3 font-bold border-[3px] border-black mono text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none" data-testid="button-preview">
                            <span className="flex items-center gap-2"><Eye className="h-4 w-4" />PREVIEW</span>
                          </button>
                        </Link>
                        {profile.status === "published" && (
                          <a href={`/portfolio/${user?.username}`} target="_blank" rel="noreferrer">
                            <button className="bg-[#22C55E] text-black px-6 py-3 font-bold border-[3px] border-black mono text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#16A34A] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none" data-testid="button-view-live">
                              <span className="flex items-center gap-2"><Globe className="h-4 w-4" />VIEW LIVE<ExternalLink className="h-3 w-3" /></span>
                            </button>
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Draft ready nudge — show when AI draft exists but profile not yet complete */}
              {profile?.status === "draft" && (profile?.questionnaireData as any)?._aiDraft && (
                <div className="md:col-span-2 bg-[#22C55E] border-[3px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <div className="mono text-xs text-black/60 uppercase tracking-widest mb-1">// your_draft_is_ready</div>
                      <h3 className="text-xl font-bold mb-1">Your profile was built from your CV. Now make it yours.</h3>
                      <p className="mono text-sm text-black/70">
                        Review the AI draft, add your stories, and claim your profile URL —&nbsp;
                        <strong>myproxy.work/portfolio/{user?.username}</strong>
                      </p>
                    </div>
                    <Link href="/questionnaire?step=2">
                      <button className="bg-black text-white px-8 py-4 font-bold border-[3px] border-black mono text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:bg-gray-800 transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none whitespace-nowrap flex items-center gap-2">
                        Complete your profile <ArrowRight className="h-4 w-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {/* 2. Questionnaire + Deepen Your Twin — side by side */}
              <div className="bg-white border-[3px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#E8A75D] border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <FileText className="h-6 w-6 text-black" />
                  </div>
                  <h3 className="font-bold text-lg">QUESTIONNAIRE</h3>
                </div>
                <p className="mono text-sm text-black/60 mb-4">
                  {profile?.status === "draft"
                    ? "Fill this in to build your Twin. It takes about 10 minutes — AI does the heavy lifting."
                    : profile
                    ? "Update your career information, stories, and answers."
                    : "Tell us about your career to build your Digital Twin."}
                </p>
                <Link href="/questionnaire">
                  <button className="bg-black text-white px-5 py-2 font-bold border-[3px] border-black mono text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:bg-gray-800 transition-transform active:translate-x-[1px] active:translate-y-[1px] active:shadow-none" data-testid="button-goto-questionnaire">
                    <span className="flex items-center gap-2">{profile ? "EDIT ANSWERS" : "GET STARTED"}<ArrowRight className="h-3 w-3" /></span>
                  </button>
                </Link>
              </div>

              {(profile?.status === "ready" || profile?.status === "published") && (
                <div className="bg-white border-[3px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-[#A78BFA] border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <Mic className="h-6 w-6 text-black" />
                    </div>
                    <h3 className="font-bold text-lg">DEEPEN YOUR TWIN</h3>
                  </div>
                  <p className="mono text-sm text-black/60 mb-4">
                    {(profile as any).lastDeepenedAt
                      ? `Last deepened: ${new Date((profile as any).lastDeepenedAt).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}. Go deeper to sharpen your Twin further — just speak, no typing needed.`
                      : "Your Twin is only as good as the stories inside it. Speak naturally — no typing, no prep. A voice interview gives your Twin real depth and your actual voice."}
                  </p>
                  <Link href="/interview">
                    <button className="bg-black text-white px-5 py-2 font-bold border-[3px] border-black mono text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:bg-gray-800 transition-transform active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
                      <span className="flex items-center gap-2">{(profile as any).lastDeepenedAt ? "GO DEEPER" : "START INTERVIEW"}<ArrowRight className="h-3 w-3" /></span>
                    </button>
                  </Link>
                </div>
              )}

              {/* 3. Analytics — published users */}
              {profile?.status === "published" && (
                <div className="md:col-span-2 bg-white border-[3px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 bg-[#22C55E] border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <BarChart3 className="h-6 w-6 text-black" />
                    </div>
                    <h3 className="font-bold text-lg">YOUR TWIN'S ACTIVITY</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 mb-5">
                    <div className="border-[3px] border-black bg-[#E8E8E3] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="h-4 w-4 text-black/60" />
                        <span className="mono text-xs uppercase tracking-wider text-black/60">Profile Views</span>
                      </div>
                      <div className="text-4xl font-bold">{viewCount}</div>
                      {viewCount === 0 && (
                        <p className="mono text-xs text-black/40 mt-2">Share your link to start getting visitors</p>
                      )}
                    </div>
                    <div className="border-[3px] border-black bg-[#E8E8E3] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-black/60" />
                        <span className="mono text-xs uppercase tracking-wider text-black/60">Questions Asked</span>
                      </div>
                      <div className="text-4xl font-bold">{questionCount}</div>
                      <p className="mono text-xs text-black/40 mt-2">
                        {isFree ? "Upgrade to Pro to see what they asked" : "Last 10 shown below"}
                      </p>
                    </div>
                  </div>

                  {isFree && questionCount > 0 ? (
                    <div className="relative">
                      <div className="filter blur-sm select-none pointer-events-none opacity-50">
                        <div className="mono text-xs uppercase tracking-wider text-black/50 mb-3">Questions visitors asked your Twin</div>
                        <div className="space-y-2">
                          {analytics!.recentQuestions.slice(0, 3).map((q, i) => (
                            <div key={i} className="flex items-start gap-3 border-l-[3px] border-[#22C55E] pl-3 py-1">
                              <p className="text-sm font-medium text-black">{q.question}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 border-[3px] border-black p-4 text-center">
                        <Lock className="h-5 w-5 mb-2" />
                        <p className="font-bold text-sm mb-1">{questionCount} recruiters asked your Twin questions.</p>
                        <p className="mono text-xs text-black/60 mb-3">Upgrade to Pro to see what they wanted to know.</p>
                        <button
                          onClick={() => document.getElementById("upgrade-section")?.scrollIntoView({ behavior: "smooth" })}
                          className="bg-black text-white mono text-xs px-4 py-2 uppercase tracking-wider hover:bg-black/80 transition-colors"
                        >
                          Upgrade to Pro →
                        </button>
                      </div>
                    </div>
                  ) : !isFree && questionCount > 0 ? (
                    <div>
                      <div className="mono text-xs uppercase tracking-wider text-black/50 mb-3">Questions visitors asked your Twin</div>
                      <div className="space-y-2">
                        {analytics!.recentQuestions.map((q, i) => (
                          <div key={i} className="flex items-start gap-3 border-l-[3px] border-[#22C55E] pl-3 py-1">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-black">{q.question}</p>
                              <p className="mono text-xs text-black/40 mt-0.5">
                                {new Date(q.askedAt).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="border-[3px] border-dashed border-black/20 p-4 text-center">
                      <MessageSquare className="h-8 w-8 text-black/20 mx-auto mb-2" />
                      <p className="mono text-xs text-black/40 uppercase tracking-wider">No questions yet — share your profile to get started</p>
                    </div>
                  )}
                </div>
              )}

              {/* Analytics placeholder — not yet published */}
              {profile && profile.status !== "published" && (
                <div className="md:col-span-2 bg-white border-[3px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#D1D1CC] border-[3px] border-black flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-black/40" />
                    </div>
                    <h3 className="font-bold text-lg text-black/40">ACTIVITY</h3>
                  </div>
                  <p className="mono text-xs text-black/50 leading-relaxed">
                    Once your profile is published, you'll see how many people visited and what they asked your Twin.
                  </p>
                </div>
              )}

              {/* 3. Upgrade prompt — free window expired or ready to pay */}
              {freeWindowExpired && (
                <div className="md:col-span-2 bg-[#FDE68A] border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-black mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-sm">Your Twin is live and working.</p>
                      <p className="mono text-xs text-black/70 mt-1">
                        {viewCount > 0 || questionCount > 0
                          ? `${viewCount} people visited${questionCount > 0 ? ` and ${questionCount} asked questions` : ""}. Upgrade to Pro to keep refining your profile and see exactly what they asked.`
                          : "Your 7-day free edit window has ended. Upgrade to Pro to keep editing and see full analytics."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {showUpgrade && (
                <div id="upgrade-section" className="md:col-span-2">
                  <PaymentGate profileId={profile!.id} username={user?.username} />
                </div>
              )}

              {/* 4. Draft progress */}
              {profile && profile.status === "draft" && (
                <div className="md:col-span-2 bg-[#FDE68A] border-[3px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <div className="mono text-xs text-black/60 uppercase tracking-widest mb-4">// how to publish</div>
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { step: "1", label: "Fill Questionnaire", done: true },
                      { step: "2", label: "Submit → AI Builds Twin", done: false },
                      { step: "3", label: "Publish Your Profile", done: false },
                    ].map(({ step, label, done }) => (
                      <div key={step} className={`border-[3px] border-black p-3 flex items-center gap-3 ${done ? "bg-white" : "bg-white/50"}`}>
                        <div className={`w-8 h-8 border-[2px] border-black flex items-center justify-center font-bold text-sm shrink-0 ${done ? "bg-[#22C55E]" : "bg-white"}`}>{step}</div>
                        <span className="mono text-xs font-bold uppercase tracking-wide">{label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mono text-sm text-black/70 mb-4">
                    You're in step 1. Complete the questionnaire — it takes about 10 minutes. When you submit, AI builds your Twin.
                  </p>
                  <Link href="/questionnaire">
                    <button className="bg-black text-white px-6 py-3 font-bold border-[3px] border-black mono text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-800 transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                      <span className="flex items-center gap-2">Continue Questionnaire<ArrowRight className="h-4 w-4" /></span>
                    </button>
                  </Link>
                </div>
              )}

              {/* Processing state */}
              {(profile?.status === "processing" || profile?.status === "reprocessing") && (
                <div className="md:col-span-2 bg-white border-[3px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-[#93C5FD] border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <Loader2 className="h-6 w-6 text-black animate-spin" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">BUILDING YOUR TWIN</h3>
                      <div className="mono text-xs text-black/50 uppercase">AI is processing your profile</div>
                    </div>
                  </div>
                  <p className="mono text-sm text-black/60 mb-4">
                    This usually takes 1–2 minutes. This page will update automatically — no need to refresh.
                  </p>
                  <div className="flex items-center gap-2 px-3 py-1 bg-[#93C5FD] border-[3px] border-black mono text-xs uppercase tracking-wider font-bold w-fit">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    IN PROGRESS
                  </div>
                </div>
              )}

              {/* 5. Share — published users */}
              {profile && profile.status === "published" && (
                <div className="md:col-span-2 bg-black text-white border-[3px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-[#22C55E] border-[3px] border-[#22C55E] flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(34,197,94,0.4)]">
                      <Globe className="h-6 w-6 text-black" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">SHARE YOUR PROFILE</h3>
                      <p className="mono text-xs text-white/50">Your profile is indexed by search engines and AI sourcing tools — every share gets you more visibility.</p>
                    </div>
                  </div>
                  <div className="bg-white/10 border border-white/20 p-4 mb-4 mono text-xs text-white/80 leading-relaxed whitespace-pre-line">
                    {buildLinkedInPost(`https://myproxy.work/portfolio/${user?.username}`)}
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(buildLinkedInPost(`https://myproxy.work/portfolio/${user?.username}`));
                      }}
                      className="flex items-center gap-2 bg-[#22C55E] text-black px-5 py-3 font-bold border-[3px] border-[#22C55E] mono text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(34,197,94,0.4)] hover:bg-[#16A34A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy LinkedIn Post
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(`https://myproxy.work/portfolio/${user?.username}`)}
                      className="flex items-center gap-2 bg-white/10 text-white px-5 py-3 font-bold border-[3px] border-white/30 mono text-xs uppercase tracking-wider hover:bg-white/20 active:translate-x-[1px] active:translate-y-[1px] transition-all"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy Profile URL
                    </button>
                    <button
                      onClick={() => {
                        const signature = `${profile?.displayName || user?.name || user?.username}${profile?.roleTitle ? ` | ${profile.roleTitle}` : ""}\nAsk my AI about my work: https://myproxy.work/portfolio/${user?.username}`;
                        navigator.clipboard.writeText(signature);
                      }}
                      className="flex items-center gap-2 bg-white/10 text-white px-5 py-3 font-bold border-[3px] border-white/30 mono text-xs uppercase tracking-wider hover:bg-white/20 active:translate-x-[1px] active:translate-y-[1px] transition-all"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy Email Signature
                    </button>
                  </div>
                </div>
              )}

              {/* 7. Referral link — published users */}
              {profile && profile.status === "published" && referral && (
                <div className="md:col-span-2 bg-white border-[3px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-[#FDE68A] border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-xl">🔗</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">REFER A COLLEAGUE</h3>
                    </div>
                  </div>
                  <p className="mono text-sm text-black/60 mb-4">
                    Know someone who'd benefit from Proxy? Share your referral link — when they sign up, they're attributed to you.
                  </p>
                  <div className="bg-[#E8E8E3] border-[2px] border-black p-3 mb-4 mono text-xs text-black/70 break-all">
                    {referral.referralUrl}
                  </div>
                  {referral.count > 0 && (
                    <div className="bg-[#22C55E] border-[2px] border-black px-4 py-2 inline-block mono text-xs font-bold uppercase mb-4">
                      🎉 {referral.count} {referral.count === 1 ? "person" : "people"} signed up from your link
                    </div>
                  )}
                  <button
                    onClick={() => navigator.clipboard.writeText(referral.referralUrl)}
                    className="flex items-center gap-2 bg-black text-white px-5 py-2 font-bold border-[3px] border-black mono text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:bg-gray-800 transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  >
                    Copy Referral Link
                  </button>
                </div>
              )}

            </div>
          )}
        </motion.div>
      </div>

      {/* Danger Zone */}
      <div className="max-w-6xl mx-auto px-6 mt-16 mb-8">
        <div className="border-2 border-red-200 rounded-lg p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-red-500 mb-1 flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> Danger Zone
          </h3>
          <p className="text-black/50 text-sm mb-4">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="border-2 border-red-400 text-red-500 px-4 py-2 text-sm font-bold hover:bg-red-50 transition-colors"
            >
              Delete My Account
            </button>
          ) : (
            <div className="bg-red-50 border-2 border-red-300 p-4 rounded">
              <p className="text-red-700 font-bold text-sm mb-3">
                Are you sure? This will permanently delete your profile, all career data, and chat history. You cannot undo this.
              </p>
              <p className="text-sm font-semibold text-black/70 mb-2">Before you go — what's the main reason? (optional)</p>
              <div className="flex flex-col gap-2 mb-4">
                {DELETE_REASONS.map((reason) => (
                  <label key={reason} className="flex items-center gap-2 cursor-pointer text-sm text-black/70">
                    <input
                      type="radio"
                      name="deleteReason"
                      value={reason}
                      checked={deleteReason === reason}
                      onChange={() => setDeleteReason(reason)}
                      className="accent-red-500"
                    />
                    {reason}
                  </label>
                ))}
              </div>
              {deleteError && <p className="text-red-600 text-sm mb-3">{deleteError}</p>}
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="bg-red-500 text-white px-4 py-2 text-sm font-bold hover:bg-red-600 disabled:opacity-50"
                >
                  {deleteLoading ? "Deleting..." : "Yes, Delete Everything"}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteReason(""); }}
                  disabled={deleteLoading}
                  className="border-2 border-black/20 text-black/60 px-4 py-2 text-sm font-bold hover:bg-black/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
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
          <a href="mailto:vinos@myproxy.work" className="cursor-pointer hover:text-black">vinos@myproxy.work</a>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
}
