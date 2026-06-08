import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import ProxyLogo from "@/components/ProxyLogo";
import ThreePanelModal from "@/components/ThreePanelModal";
import { Lock, ArrowRight, Eye, User, Briefcase, MessageSquare, Zap, Camera, Video, CheckCircle } from "lucide-react";

interface LinkedInDraft { headline: string; about: string; }
interface CvExtracted {
  name: string; currentTitle: string; summary: string;
  roles: Array<{ title: string; company: string; years: string; achievements: string }>;
  skills: string[]; achievements: string[];
}

export default function PreviewDraftPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [linkedInDraft, setLinkedInDraft] = useState<LinkedInDraft | null>(null);
  const [cvExtracted, setCvExtracted] = useState<CvExtracted | null>(null);

  useEffect(() => {
    const li = sessionStorage.getItem("linkedInDraft");
    const cv = sessionStorage.getItem("cvExtracted");
    if (li) setLinkedInDraft(JSON.parse(li));
    if (cv) setCvExtracted(JSON.parse(cv));
  }, []);

  const { data: profile } = useQuery<any>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const draft = (profile?.questionnaireData as any) || {};
  const name = draft.step1?.fullName || user?.name || "Your Name";
  const title = draft.step1?.currentTitle || "Senior Professional";
  const location = draft.step1?.location || "";
  const summary = draft.step2?.professionalSummary || "";
  const careerHistory: Array<{ company: string; title: string; years: string; achievements: string }> = draft.step2?.careerHistory || [];
  const stories: Array<{ title: string; challenge: string; approach: string; result: string }> = draft.step4?.stories || [];
  const achievements = draft.step5?.achievements || "";
  const skills = draft.step6?.technicalSkills || "";
  const questions: Array<{ question: string; answer: string }> = draft.step8?.questions || [];
  const suggestedQs = draft.step11?.suggestedQuestions
    ? draft.step11.suggestedQuestions.split("\n").filter(Boolean).slice(0, 4)
    : ["What's your leadership style?", "Tell me about a major turnaround.", "How do you approach stakeholder management?", "What are you looking for in your next role?"];
  const username = user?.username || "you";

  const handleComplete = () => {
    setShowModal(false);
    navigate("/questionnaire?skipUpload=true");
  };

  const cleanText = (t: string) => t.replace(/\[EDIT\]/g, "...").trim();

  return (
    <div className="min-h-screen bg-[#E8E8E3] text-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Nav */}
      <nav className="border-b-[3px] border-black bg-[#D1D1CC] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <ProxyLogo />
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowModal(true)}
              className="hidden md:flex items-center gap-2 border-[2px] border-black bg-white hover:bg-[#E8E8E3] px-4 py-2 mono text-xs uppercase tracking-wider font-bold transition-colors"
            >
              <Eye className="h-4 w-4" /> CV vs LinkedIn vs Proxy
            </button>
            <button
              onClick={handleComplete}
              className="bg-[#22C55E] text-black px-6 py-3 font-bold hover:bg-[#16A34A] border-[3px] border-black mono text-sm uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-2"
            >
              Complete your profile <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Draft banner */}
      <div className="bg-[#E8A75D] border-b-[3px] border-black px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
          <div className="bg-black text-[#E8A75D] px-3 py-1 mono text-xs font-bold uppercase tracking-wider">DRAFT</div>
          <p className="mono text-sm font-bold text-black">
            This is your AI-generated profile — built from your CV in seconds.
            <span className="font-normal ml-2 text-black/70">Complete the questionnaire to personalise it, add photos, and go live.</span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Main content — left 2/3 */}
          <div className="lg:col-span-2 space-y-6">

            {/* Hero section */}
            <div className="bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="bg-black p-6 flex items-start gap-5">
                {/* Photo placeholder */}
                <div className="w-24 h-24 bg-[#333] border-[3px] border-white/20 flex flex-col items-center justify-center shrink-0 text-white/30 gap-1">
                  <Camera className="h-6 w-6" />
                  <span className="mono text-[10px] text-center leading-tight">Add photo</span>
                </div>
                <div className="text-white flex-1">
                  <h1 className="text-3xl font-bold mb-1">{name}</h1>
                  <p className="text-[#22C55E] font-bold mono text-sm mb-1">{title}</p>
                  {location && <p className="mono text-xs text-white/50">{location}</p>}
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-2 h-2 bg-[#E8A75D] rounded-full"></div>
                    <span className="mono text-xs text-[#E8A75D] uppercase tracking-wider">Profile incomplete — add your stories to make this yours</span>
                  </div>
                </div>
              </div>
              {summary && (
                <div className="p-6 border-t border-black/10">
                  <div className="mono text-xs text-black/40 uppercase tracking-widest mb-3">// about_me</div>
                  <p className="text-black/80 leading-relaxed">{cleanText(summary)}</p>
                </div>
              )}
            </div>

            {/* Intro video placeholder */}
            <div className="bg-[#1a1a1a] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8 flex flex-col items-center justify-center text-center min-h-[140px]">
              <Video className="h-8 w-8 text-white/20 mb-2" />
              <p className="mono text-xs text-white/30 uppercase tracking-wider">Add an intro video to stand out</p>
              <p className="mono text-xs text-white/20 mt-1">Recruiters who see a video are 3× more likely to reach out</p>
            </div>

            {/* Career Timeline */}
            {careerHistory.length > 0 && (
              <div className="bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
                <div className="mono text-xs text-black/40 uppercase tracking-widest mb-5">// career_timeline</div>
                <div className="space-y-5">
                  {careerHistory.map((role, i) => (
                    <div key={i} className="border-l-[3px] border-[#22C55E] pl-5">
                      <div className="font-bold text-base">{role.title}</div>
                      <div className="mono text-sm text-black/60 mb-2">{role.company} · {role.years}</div>
                      {role.achievements && (
                        <div className="mono text-xs text-black/50 leading-relaxed line-clamp-3">
                          {cleanText(role.achievements)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* War Stories */}
            {stories.length > 0 && (
              <div className="bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
                <div className="mono text-xs text-black/40 uppercase tracking-widest mb-5">// career_stories</div>
                <div className="space-y-6">
                  {stories.map((s, i) => (
                    <div key={i} className="border-[2px] border-black/10 p-5 bg-[#F9F9F7]">
                      <h3 className="font-bold mb-3">{cleanText(s.title)}</h3>
                      <div className="grid md:grid-cols-3 gap-3">
                        {[
                          { label: "Challenge", text: s.challenge },
                          { label: "Approach", text: s.approach },
                          { label: "Result", text: s.result },
                        ].map((col) => (
                          <div key={col.label}>
                            <div className="mono text-xs text-black/40 uppercase tracking-wider mb-1">{col.label}</div>
                            <p className="mono text-xs text-black/60 leading-relaxed line-clamp-4">{cleanText(col.text)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {skills && (
              <div className="bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
                <div className="mono text-xs text-black/40 uppercase tracking-widest mb-4">// skills</div>
                <div className="flex flex-wrap gap-2">
                  {skills.split(",").map((s: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-[#E8E8E3] border-[2px] border-black mono text-xs font-bold">
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Chat section */}
            <div className="bg-black border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="mono text-xs text-[#22C55E] uppercase tracking-widest mb-4">// ask_me_anything</div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-[#22C55E] border-[2px] border-white/20 flex items-center justify-center font-bold text-black">
                  {name[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{name}'s AI</div>
                  <div className="mono text-xs text-white/40">Answers questions about my career • 24/7</div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#E8A75D] rounded-full"></div>
                  <span className="mono text-xs text-[#E8A75D]">Training incomplete</span>
                </div>
              </div>

              <div className="space-y-2 mb-5">
                {suggestedQs.map((q, i) => (
                  <div key={i} className="border border-white/10 px-4 py-2 text-white/50 text-sm mono cursor-default">
                    "{q}"
                  </div>
                ))}
              </div>

              <div className="bg-[#111] border border-white/10 px-4 py-3 mono text-xs text-white/30 text-center">
                Complete your profile to train the AI on your full career story →
              </div>
            </div>

            {/* Q&A preview */}
            {questions.length > 0 && (
              <div className="bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
                <div className="mono text-xs text-black/40 uppercase tracking-widest mb-5">// common_questions</div>
                <div className="space-y-4">
                  {questions.slice(0, 3).map((qa, i) => (
                    <div key={i} className="border-b border-black/10 pb-4 last:border-0 last:pb-0">
                      <div className="font-bold text-sm mb-1">{qa.question}</div>
                      <p className="mono text-xs text-black/60 line-clamp-2">{cleanText(qa.answer)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar — right 1/3 */}
          <div className="space-y-5">

            {/* Locked URL — commitment mechanism */}
            <div className="bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="h-4 w-4 text-black/40" />
                <span className="mono text-xs text-black/50 uppercase tracking-wider">Your profile URL</span>
              </div>
              <div className="bg-[#E8E8E3] border-[2px] border-black px-4 py-3 mb-3 font-mono text-sm text-black/40 select-none overflow-hidden">
                myproxy.work/portfolio/<span className="blur-[4px] text-black font-bold select-none">{username}</span>
              </div>
              <p className="text-sm text-black/70 mb-5 leading-relaxed">
                <strong>myproxy.work/portfolio/{username}</strong> is reserved for you. Complete your profile to claim it.
              </p>
              <button
                onClick={handleComplete}
                className="w-full bg-[#22C55E] text-black py-4 font-bold hover:bg-[#16A34A] border-[3px] border-black mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                Complete your profile <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mono text-xs text-black/40 text-center mt-3">Takes ~20 min · Free to start</p>
            </div>

            {/* What's missing */}
            <div className="bg-[#D1D1CC] border-[3px] border-black p-5">
              <div className="mono text-xs text-black/50 uppercase tracking-widest mb-3">// to_go_live</div>
              <div className="space-y-3">
                {[
                  { done: true, label: "CV uploaded & parsed" },
                  { done: false, label: "Add your own words to career stories" },
                  { done: false, label: "Upload headshot" },
                  { done: false, label: "Record or upload intro video" },
                  { done: false, label: "Pay $49 to publish" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 border-[2px] flex items-center justify-center shrink-0 ${item.done ? "bg-[#22C55E] border-[#22C55E]" : "border-black bg-white"}`}>
                      {item.done && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    <span className={`mono text-xs ${item.done ? "text-black/40 line-through" : "text-black/70"}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Compare button */}
            <button
              onClick={() => setShowModal(true)}
              className="w-full border-[2px] border-black bg-white hover:bg-[#E8E8E3] py-3 mono text-sm uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Eye className="h-4 w-4" />
              CV vs LinkedIn vs Proxy →
            </button>

            {/* Mobile complete CTA */}
            <div className="lg:hidden">
              <button
                onClick={handleComplete}
                className="w-full bg-[#22C55E] text-black py-4 font-bold hover:bg-[#16A34A] border-[3px] border-black mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                Complete your profile →
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <ThreePanelModal
          onClose={() => setShowModal(false)}
          cvExtracted={cvExtracted}
          linkedInDraft={linkedInDraft}
          proxyPreview={{ name, title, summary }}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
