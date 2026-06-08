import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import ProxyLogo from "@/components/ProxyLogo";
import ThreePanelModal from "@/components/ThreePanelModal";
import {
  Lock, ArrowRight, Eye, Camera, Video, CheckCircle,
  Target, BarChart3, Users, Award, Zap, Globe, Send, Loader2
} from "lucide-react";
import { getCsrfToken } from "@/lib/queryClient";

interface LinkedInDraft { headline: string; about: string; }
interface CvExtracted {
  name: string; currentTitle: string; summary: string;
  roles: Array<{ title: string; company: string; years: string; achievements: string }>;
  skills: string[]; achievements: string[];
}

const iconMap: Record<string, any> = {
  target: Target, chart: BarChart3, users: Users,
  ribbon: Award, lightning: Zap, globe: Globe,
};

export default function PreviewDraftPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [linkedInDraft, setLinkedInDraft] = useState<LinkedInDraft | null>(null);
  const [cvExtracted, setCvExtracted] = useState<CvExtracted | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  // Real processed data from profile (set by generatePortfolioPreview)
  const name = profile?.displayName || user?.name || "Your Name";
  const title = profile?.roleTitle || "Senior Professional";
  const heroSubtitle = profile?.heroSubtitle || "";
  const positioning = profile?.positioning || "";
  const stats: Array<{ value: string; label: string; icon: string }> = profile?.stats || [];
  const careerTimeline: Array<{ company: string; roles: Array<{ title: string; years: string; achievements: string[] }> }> = profile?.careerTimeline || [];

  // Fallback to raw draft data for sections not yet processed
  const draft = (profile?.questionnaireData as any) || {};
  const location = draft.step1?.location || "";
  const skills = draft.step6?.technicalSkills || cvExtracted?.skills?.join(", ") || "";
  const stories: Array<{ title: string; challenge: string; approach: string; result: string }> = draft.step4?.stories || [];
  const questions: Array<{ question: string; answer: string }> = draft.step8?.questions || [];
  const suggestedQs = draft.step11?.suggestedQuestions
    ? draft.step11.suggestedQuestions.split("\n").filter(Boolean).slice(0, 4)
    : ["What's your leadership style?", "Tell me about your biggest achievement.", "How do you approach stakeholder management?", "What are you looking for in your next role?"];
  const username = user?.username || "you";

  const handleComplete = () => {
    setShowModal(false);
    navigate("/questionnaire?skipUpload=true");
  };

  const cleanText = (t: string) => (t || "").replace(/\[EDIT\]/g, "...").trim();

  const sendChatMessage = async (q?: string) => {
    const msg = q || chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const csrf = getCsrfToken();
      const res = await fetch("/api/chat/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(csrf ? { "x-csrf-token": csrf } : {}) },
        credentials: "include",
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: "ai", text: data.reply || "Let's connect to discuss this further." }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "ai", text: "Let's connect to discuss this further." }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  // Build linkedin draft fallback from extracted CV if API didn't return one
  const effectiveLinkedIn = linkedInDraft || (cvExtracted ? {
    headline: cvExtracted.currentTitle || title,
    about: cvExtracted.summary || positioning,
  } : null);

  return (
    <div className="min-h-screen bg-[#E8E8E3] text-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Nav */}
      <nav className="border-b-[3px] border-black bg-[#D1D1CC] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <ProxyLogo />
          <div className="flex items-center gap-3">
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
          <div className="bg-black text-[#E8A75D] px-3 py-1 mono text-xs font-bold uppercase tracking-wider shrink-0">DRAFT</div>
          <p className="mono text-sm font-bold text-black">
            Your AI-generated profile — built from your CV in seconds.
            <span className="font-normal ml-2 text-black/70">Complete the questionnaire to personalise it, add your stories, photos, and go live.</span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Main — left 2/3 */}
          <div className="lg:col-span-2 space-y-6">

            {/* Hero */}
            <div className="bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="bg-black p-8 flex items-start gap-6">
                <div className="w-24 h-24 bg-[#333] border-[3px] border-white/20 flex flex-col items-center justify-center shrink-0 text-white/30 gap-1 cursor-default">
                  <Camera className="h-6 w-6" />
                  <span className="mono text-[10px] text-center leading-tight">Add photo</span>
                </div>
                <div className="text-white flex-1 min-w-0">
                  <h1 className="text-3xl lg:text-4xl font-bold mb-1">{name}</h1>
                  {heroSubtitle ? (
                    <p className="text-[#22C55E] mono text-sm mb-2">{heroSubtitle}</p>
                  ) : (
                    <p className="text-[#22C55E] mono text-sm mb-2">{title}</p>
                  )}
                  {location && <p className="mono text-xs text-white/50 mb-3">{location}</p>}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#E8A75D] rounded-full shrink-0"></div>
                    <span className="mono text-xs text-[#E8A75D] uppercase tracking-wider">Draft — personalise to make it yours</span>
                  </div>
                </div>
              </div>

              {positioning && (
                <div className="p-6 border-t border-black/10">
                  <div className="mono text-xs text-black/40 uppercase tracking-widest mb-3">// positioning</div>
                  <div className="space-y-3 text-black/80 leading-relaxed">
                    {positioning.split("\n\n").filter(Boolean).map((p, i) => (
                      <p key={i}>{cleanText(p)}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Intro video placeholder */}
            <div className="bg-[#1a1a1a] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8 flex flex-col items-center justify-center text-center min-h-[120px]">
              <Video className="h-7 w-7 text-white/20 mb-2" />
              <p className="mono text-xs text-white/30 uppercase tracking-wider">Add a 60-second intro video</p>
              <p className="mono text-xs text-white/20 mt-1">Recruiters who see a video are 3× more likely to reach out</p>
            </div>

            {/* Impact metrics */}
            {stats.length > 0 && (
              <div className="bg-black border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
                <div className="mono text-xs text-[#22C55E] uppercase tracking-widest mb-5">// impact_metrics</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {stats.map((s, i) => {
                    const Icon = iconMap[s.icon] || Target;
                    return (
                      <div key={i} className="border border-white/10 p-4 bg-white/5">
                        <Icon className="h-4 w-4 text-[#22C55E] mb-2" />
                        <div className="text-2xl font-bold text-white mb-1">{s.value}</div>
                        <div className="mono text-[10px] text-white/50 uppercase tracking-wider leading-tight">{s.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Career Timeline */}
            {careerTimeline.length > 0 && (
              <div className="bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
                <div className="mono text-xs text-black/40 uppercase tracking-widest mb-5">// career_timeline</div>
                <div className="space-y-6">
                  {careerTimeline.map((company, ci) => (
                    <div key={ci}>
                      <div className="font-bold text-lg mb-3 flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#E8E8E3] border-[2px] border-black flex items-center justify-center mono text-xs font-bold shrink-0">
                          {company.company?.[0]?.toUpperCase()}
                        </div>
                        {company.company}
                      </div>
                      <div className="space-y-4 pl-11">
                        {company.roles?.map((role, ri) => (
                          <div key={ri} className="border-l-[3px] border-[#22C55E] pl-4">
                            <div className="font-bold">{role.title}</div>
                            <div className="mono text-xs text-black/50 mb-2">{role.years}</div>
                            {role.achievements?.slice(0, 3).map((a, ai) => (
                              <div key={ai} className="flex items-start gap-2 mono text-xs text-black/60 mb-1">
                                <span className="text-[#22C55E] shrink-0 mt-0.5">›</span>
                                <span>{cleanText(a)}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* War Stories */}
            {stories.length > 0 && (
              <div className="bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
                <div className="mono text-xs text-black/40 uppercase tracking-widest mb-5">// career_stories</div>
                <div className="space-y-5">
                  {stories.map((s, i) => (
                    <div key={i} className="border-[2px] border-black/10 p-5 bg-[#F9F9F7]">
                      <h3 className="font-bold mb-4 text-base">{cleanText(s.title)}</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        {[
                          { label: "Challenge", text: s.challenge, color: "border-red-300" },
                          { label: "Approach", text: s.approach, color: "border-blue-300" },
                          { label: "Result", text: s.result, color: "border-[#22C55E]" },
                        ].map((col) => (
                          <div key={col.label} className={`border-l-[3px] ${col.color} pl-3`}>
                            <div className="mono text-[10px] text-black/40 uppercase tracking-wider mb-1">{col.label}</div>
                            <p className="mono text-xs text-black/60 leading-relaxed">{cleanText(col.text)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 mono text-xs text-black/40 text-center border-t border-black/10 pt-4">
                  These are AI-drafted from your CV. Complete the questionnaire to add your real stories in your words.
                </div>
              </div>
            )}

            {/* Skills */}
            {skills && (
              <div className="bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
                <div className="mono text-xs text-black/40 uppercase tracking-widest mb-4">// skills</div>
                <div className="flex flex-wrap gap-2">
                  {skills.split(",").slice(0, 20).map((s: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-[#E8E8E3] border-[2px] border-black mono text-xs font-bold">
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Locked sections — unlocked after questionnaire */}
            <div className="bg-[#D1D1CC] border-[3px] border-black border-dashed p-6 text-center">
              <Lock className="h-6 w-6 text-black/40 mx-auto mb-2" />
              <p className="font-bold text-black/60 mb-1">More sections unlock after completing your profile</p>
              <p className="mono text-xs text-black/40">Where I'm Most Useful · How I Work · Skills Matrix · Full Q&A</p>
            </div>

            {/* AI Chat — live, powered by draft data */}
            <div className="bg-black border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
              <div className="mono text-xs text-[#22C55E] uppercase tracking-widest mb-4">// ask_me_anything</div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#22C55E] border-[2px] border-white/20 flex items-center justify-center font-bold text-black">
                  {name[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{name}'s AI</div>
                  <div className="mono text-xs text-white/40">Answers questions about my career · 24/7</div>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse"></div>
                  <span className="mono text-xs text-[#22C55E]">Live draft</span>
                </div>
              </div>

              {/* Chat messages */}
              {chatMessages.length === 0 ? (
                <div className="space-y-2 mb-4">
                  <p className="mono text-xs text-white/40 mb-3">Try asking a question:</p>
                  {suggestedQs.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendChatMessage(q)}
                      className="w-full text-left border border-white/10 px-4 py-2 text-white/60 text-sm mono hover:border-[#22C55E] hover:text-white transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] px-4 py-2 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-white/10 text-white/80 mono"
                          : "bg-[#22C55E] text-black font-medium"
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[#22C55E]/20 px-4 py-2 flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin text-[#22C55E]" />
                        <span className="mono text-xs text-[#22C55E]">Thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}

              {/* Input */}
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendChatMessage()}
                  placeholder="Ask anything about my career..."
                  className="flex-1 bg-white/10 border border-white/20 px-4 py-2 text-white text-sm mono placeholder-white/30 focus:outline-none focus:border-[#22C55E]"
                />
                <button
                  onClick={() => sendChatMessage()}
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-[#22C55E] text-black px-4 py-2 border-[2px] border-[#22C55E] hover:bg-[#16A34A] disabled:opacity-40 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mono text-[10px] text-white/20 mt-2 text-center">
                Powered by your CV data · Complete questionnaire for the full version
              </p>
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-5">

            {/* Locked URL */}
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

            {/* Progress checklist */}
            <div className="bg-[#D1D1CC] border-[3px] border-black p-5">
              <div className="mono text-xs text-black/50 uppercase tracking-widest mb-3">// to_go_live</div>
              <div className="space-y-3">
                {[
                  { done: true, label: "CV uploaded & AI profile built" },
                  { done: false, label: "Add your career stories in your words" },
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

            {/* Compare */}
            <button
              onClick={() => setShowModal(true)}
              className="w-full border-[2px] border-black bg-white hover:bg-[#E8E8E3] py-3 mono text-sm uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Eye className="h-4 w-4" /> CV vs LinkedIn vs Proxy →
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-[3px] border-black px-6 py-4 z-40">
        <button
          onClick={handleComplete}
          className="w-full bg-[#22C55E] text-black py-4 font-bold hover:bg-[#16A34A] border-[3px] border-black mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          Complete your profile →
        </button>
      </div>

      {showModal && (
        <ThreePanelModal
          onClose={() => setShowModal(false)}
          cvExtracted={cvExtracted}
          linkedInDraft={effectiveLinkedIn}
          proxyPreview={{ name, title: heroSubtitle || title, summary: positioning, stats, careerTimeline }}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
