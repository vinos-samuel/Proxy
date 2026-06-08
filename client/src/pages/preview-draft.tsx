import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import ProxyLogo from "@/components/ProxyLogo";
import ThreePanelModal from "@/components/ThreePanelModal";
import { Lock, Sparkles, ArrowRight, Eye } from "lucide-react";

interface LinkedInDraft {
  headline: string;
  about: string;
}

interface CvExcerpt {
  name: string;
  title: string;
  summary: string;
  roles: Array<{ title: string; company: string; years: string }>;
}

export default function PreviewDraftPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [linkedInDraft, setLinkedInDraft] = useState<LinkedInDraft | null>(null);
  const [cvExcerpt, setCvExcerpt] = useState<CvExcerpt | null>(null);

  useEffect(() => {
    const li = sessionStorage.getItem("linkedInDraft");
    const cv = sessionStorage.getItem("cvExcerpt");
    if (li) setLinkedInDraft(JSON.parse(li));
    if (cv) setCvExcerpt(JSON.parse(cv));
  }, []);

  const { data: profile } = useQuery<any>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  const draft = (profile?.questionnaireData as any) || {};
  const name = draft.step1?.fullName || user?.name || "Your Name";
  const title = draft.step1?.currentTitle || "Professional";
  const summary = draft.step2?.professionalSummary || "";
  const careerHistory = draft.step2?.careerHistory || [];
  const username = user?.username || "you";

  const handleComplete = () => {
    setShowModal(false);
    navigate("/questionnaire?step=2");
  };

  return (
    <div className="min-h-screen bg-[#E8E8E3] text-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Nav */}
      <nav className="border-b-[3px] border-black bg-[#D1D1CC] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <ProxyLogo />
          <span className="mono text-xs text-black/50 uppercase tracking-wider">// draft_preview</span>
        </div>
      </nav>

      {/* Banner */}
      <div className="bg-[#22C55E] border-b-[3px] border-black px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-black" />
            <p className="font-bold text-black">
              Here's your draft — built from your CV in seconds.
              <span className="font-normal ml-2 text-black/70">Review it, then complete your profile to go live.</span>
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-white border-[2px] border-black px-4 py-2 mono text-xs uppercase tracking-wider font-bold hover:bg-black hover:text-white transition-colors"
          >
            <Eye className="h-4 w-4" />
            See how this compares →
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-8">

        {/* Main profile preview */}
        <div className="lg:col-span-2 space-y-6">

          {/* Hero card */}
          <div className="bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 bg-[#22C55E] border-[3px] border-black flex items-center justify-center text-2xl font-bold text-black shrink-0">
                {name[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{name}</h1>
                <p className="mono text-sm text-black/60 mt-1">{title}</p>
              </div>
            </div>
            {summary && (
              <div>
                <div className="mono text-xs text-black/40 uppercase tracking-widest mb-2">// positioning</div>
                <p className="text-black/80 leading-relaxed">{summary}</p>
              </div>
            )}
          </div>

          {/* Career history */}
          {careerHistory.length > 0 && (
            <div className="bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8">
              <div className="mono text-xs text-black/40 uppercase tracking-widest mb-4">// career_history</div>
              <div className="space-y-5">
                {careerHistory.slice(0, 3).map((role: any, i: number) => (
                  <div key={i} className="border-l-[3px] border-[#22C55E] pl-4">
                    <div className="font-bold">{role.title}</div>
                    <div className="mono text-sm text-black/60">{role.company} · {role.years}</div>
                  </div>
                ))}
                {careerHistory.length > 3 && (
                  <div className="mono text-xs text-black/40">+{careerHistory.length - 3} more roles — complete your profile to show all</div>
                )}
              </div>
            </div>
          )}

          {/* AI chat preview */}
          <div className="bg-black border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
            <div className="mono text-xs text-[#22C55E] uppercase tracking-widest mb-4">// ai_chat · live_on_your_profile</div>
            <div className="space-y-3">
              <div className="bg-white/10 rounded px-4 py-3 text-white text-sm max-w-xs">
                "What kind of roles are you looking for?"
              </div>
              <div className="bg-[#22C55E] rounded px-4 py-3 text-black text-sm max-w-sm ml-auto">
                Your AI answers in your voice — 24/7. Complete your profile to train it on your full career story.
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar — claim URL + CTA */}
        <div className="space-y-5">

          {/* Locked URL — commitment mechanism */}
          <div className="bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 text-black/40" />
              <span className="mono text-xs text-black/50 uppercase tracking-wider">Your profile URL</span>
            </div>
            <div className="bg-[#E8E8E3] border-[2px] border-black px-4 py-3 mb-4">
              <div className="mono text-sm text-black/40 select-none">
                myproxy.work/portfolio/
                <span className="text-black font-bold blur-[3px] select-none">{username}</span>
              </div>
            </div>
            <p className="text-sm text-black/70 mb-5 leading-relaxed">
              <strong>myproxy.work/portfolio/{username}</strong> is reserved for you. Complete your profile to claim it.
            </p>
            <button
              onClick={handleComplete}
              className="w-full bg-[#22C55E] text-black py-4 font-bold hover:bg-[#16A34A] border-[3px] border-black mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              Complete your profile →
            </button>
            <p className="mono text-xs text-black/40 text-center mt-3">Takes ~30 minutes · Free to start</p>
          </div>

          {/* What's next */}
          <div className="bg-[#D1D1CC] border-[3px] border-black p-5">
            <div className="mono text-xs text-black/50 uppercase tracking-widest mb-3">// whats_next</div>
            <div className="space-y-3">
              {[
                "Review your AI-drafted answers",
                "Add 3 career stories in your own words",
                "Upload a headshot (optional)",
                "Pay $49 to publish and go live",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 border-[2px] border-black bg-white flex items-center justify-center shrink-0 mono text-xs font-bold mt-0.5">
                    {i + 1}
                  </div>
                  <span className="text-sm text-black/70">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compare link */}
          <button
            onClick={() => setShowModal(true)}
            className="w-full border-[2px] border-black bg-white hover:bg-[#E8E8E3] py-3 mono text-sm uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Eye className="h-4 w-4" />
            CV vs LinkedIn vs Proxy →
          </button>
        </div>
      </div>

      {/* Bottom sticky CTA on mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-[3px] border-black px-6 py-4 z-40">
        <button
          onClick={handleComplete}
          className="w-full bg-[#22C55E] text-black py-4 font-bold hover:bg-[#16A34A] border-[3px] border-black mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          Complete your profile →
        </button>
      </div>

      {/* Three panel modal */}
      {showModal && (
        <ThreePanelModal
          onClose={() => setShowModal(false)}
          cvExcerpt={cvExcerpt}
          linkedInDraft={linkedInDraft}
          proxyPreview={{ name, title, summary }}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
