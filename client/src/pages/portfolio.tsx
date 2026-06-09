import { useState, useRef, useEffect } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Send, Mail, Linkedin, Download,
  Loader2, MessageSquare, Globe,
  Terminal, ArrowRight, Target, Users,
  Award, Briefcase, BarChart3, Zap, Lock
} from "lucide-react";

interface PortfolioData {
  profile: {
    displayName: string;
    roleTitle: string;
    positioning: string;
    persona: string;
    tone: string;
    photoUrl: string | null;
    videoUrl: string | null;
    resumeUrl: string | null;
    cvResumeUrl: string | null;
    brandingTheme: string;
    technicalSkills: string | null;
    achievements: string | null;
    communicationStyle: string | null;
    heroSubtitle?: string;
    stats?: Array<{ label: string; value: string; icon?: string }>;
    problemFit?: string[];
    howIWork?: { name: string; steps: Array<{ label: string; description: string }> };
    whyAiCv?: string[];
    portfolioSuggestedQuestions?: string[];
    careerTimeline?: Array<{ company: string; title?: string; years?: string; achievements?: string[]; roles?: Array<{ title: string; years: string; achievements?: string[] }> }>;
    skillsMatrix?: Array<{ title: string; proficiency: string; description: string; icon: string }>;
    skillTags?: string[];
    whereImMostUseful?: { intro: string; scenarios: Array<{ title: string; description: string; icon: string }> };
  };
  factBanks: Array<{
    companyName: string;
    roleName: string;
    duration: string | null;
    facts: string[];
  }>;
  knowledgeEntries: Array<{
    type: string;
    title: string;
    content: string | null;
    challenge: string | null;
    approach: string | null;
    result: string | null;
  }>;
  contact: {
    email: string | null;
    phone: string | null;
    linkedin: string | null;
    location: string | null;
  };
  suggestedQuestions: string[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function getIcon(name: string, className: string) {
  const icons: Record<string, any> = {
    target: Target,
    users: Users,
    ribbon: Award,
    briefcase: Briefcase,
    chart: BarChart3,
    lightning: Zap,
    globe: Globe,
  };
  const Icon = icons[name] || Target;
  return <Icon className={className} />;
}

const themes = {
  corporate: {
    name: "Corporate",
    bg: "bg-[#0F1623]",
    fontFamily: "'Playfair Display', Georgia, serif",
    cardStyle: "rounded-sm border border-white/20 bg-white/5",
    metricStyle: { className: "text-4xl font-bold tracking-tight", style: {} as Record<string, string> },
    gradient: "bg-gradient-to-br from-[#1A1A2E]/40 via-transparent to-[#6B2C3E]/20",
    glass: "bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md border-2 border-[#C9A961]",
    glassHover: "hover:shadow-[0_4px_24px_rgba(201,169,97,0.25)] transition-all duration-300",
    accent: "from-[#C9A961] to-[#D4AF37]",
    accentSolid: "text-[#C9A961]",
    glow: "shadow-[0_0_20px_rgba(201,169,97,0.2)]",
    text: "text-white",
    muted: "text-zinc-400",
    headingClass: "font-serif",
    bodyClass: "font-sans",
    chatUserBg: "bg-[#C9A961] text-[#0A1128]",
    chatBotBg: "bg-white/10 border border-[#C9A961]/30 text-white",
    ctaBg: "bg-[#C9A961] hover:bg-[#D4AF37]",
    ctaGlow: "shadow-lg shadow-[#C9A961]/20",
    sectionLabel: (_num: number) => "",
    moduleStyle: "formal" as const,
    dotColor: "bg-[#C9A961]",
    timelineLineColor: "bg-[#C9A961]/30",
    selectionColor: "selection:bg-[#C9A961]/30",
  },
  tech: {
    name: "Tech",
    bg: "bg-[#18181b]",
    fontFamily: "'DM Mono', monospace",
    cardStyle: "rounded-md bg-zinc-900/80 border border-white/10 transition-shadow hover:shadow-[0_0_15px_rgba(34,211,238,0.12)]",
    metricStyle: { className: "text-4xl font-bold", style: { textShadow: "0 0 24px currentColor" } as Record<string, string> },
    gradient: "bg-gradient-to-br from-blue-600/20 via-transparent to-cyan-400/20",
    glass: "bg-slate-900/80 backdrop-blur-xl border border-blue-500/50",
    glassHover: "hover:border-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all duration-300",
    accent: "from-blue-500 to-cyan-400",
    accentSolid: "text-blue-500",
    glow: "shadow-[0_0_24px_rgba(59,130,246,0.4)]",
    text: "text-white",
    muted: "text-zinc-300",
    headingClass: "font-['Space_Grotesk',sans-serif] tracking-tight",
    bodyClass: "font-sans",
    chatUserBg: "bg-blue-600 text-white",
    chatBotBg: "bg-white/5 border border-blue-500/30 text-white",
    ctaBg: "bg-blue-600 hover:bg-blue-700",
    ctaGlow: "shadow-lg shadow-blue-500/20",
    sectionLabel: (_num: number) => "",
    moduleStyle: "system" as const,
    dotColor: "bg-blue-500",
    timelineLineColor: "bg-blue-500/30",
    selectionColor: "selection:bg-blue-500/30",
  },
  creative: {
    name: "Creative",
    bg: "bg-[#1C1814]",
    fontFamily: "'Fraunces', serif",
    cardStyle: "rounded-2xl bg-white/5 border border-white/[0.08]",
    metricStyle: { className: "text-5xl font-light tracking-tight", style: {} as Record<string, string> },
    gradient: "bg-gradient-to-br from-transparent via-[#8BA888]/5 to-transparent",
    glass: "bg-white/[0.03] backdrop-blur-sm border border-white/[0.08]",
    glassHover: "hover:bg-white/[0.05] transition-all duration-500",
    accent: "from-[#8BA888] to-[#9BB89A]",
    accentSolid: "text-[#8BA888]",
    glow: "shadow-[0_2px_12px_rgba(0,0,0,0.15)]",
    text: "text-white",
    muted: "text-zinc-500",
    headingClass: "font-serif tracking-tight",
    bodyClass: "font-sans",
    chatUserBg: "bg-[#8BA888] text-[#18181B]",
    chatBotBg: "bg-white/5 border border-white/[0.08] text-white",
    ctaBg: "bg-[#8BA888] hover:bg-[#9BB89A]",
    ctaGlow: "shadow-lg shadow-[#8BA888]/20",
    sectionLabel: (_num: number) => "",
    moduleStyle: "minimal" as const,
    dotColor: "bg-[#8BA888]",
    timelineLineColor: "bg-[#8BA888]/30",
    selectionColor: "selection:bg-[#8BA888]/30",
  },
};

export default function PortfolioPage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAllStats, setShowAllStats] = useState(false);
  const [expandedTimeline, setExpandedTimeline] = useState<Set<number>>(new Set());
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(false);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const search = useSearch();
  const isDraftMode = new URLSearchParams(search).get("draft") === "true";
  const isDemo = username === "test2" && new URLSearchParams(search).get("demo") === "true" && !user && !demoBannerDismissed;
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: portfolio, isLoading, error } = useQuery<PortfolioData>({
    queryKey: ["/api/portfolio", username, isDraftMode],
    queryFn: async () => {
      const url = isDraftMode
        ? `/api/portfolio/${username}?draft=true`
        : `/api/portfolio/${username}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Portfolio not found");
      }
      return res.json();
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Fire-and-forget: count this as a profile view
  useEffect(() => {
    if (username) {
      fetch(`/api/analytics/view/${username}`, { method: "POST" }).catch(() => {});
      // PostHog: track portfolio view with username for per-profile analytics
      if (typeof (window as any).posthog !== "undefined") {
        (window as any).posthog.capture("portfolio_viewed", { username });
      }
    }
  }, [username]);

  // JSON-LD structured data for AEO — Person schema on every public profile
  useEffect(() => {
    if (!portfolio) return;
    const p = portfolio.profile;
    const c = portfolio.contact;
    const skills = p.technicalSkills?.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean) || [];
    const currentRole = p.careerTimeline?.[0];

    const schema: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: p.displayName,
      jobTitle: p.roleTitle,
      description: p.positioning,
      url: `https://myproxy.work/portfolio/${username}`,
    };

    if (p.photoUrl) schema.image = p.photoUrl;
    if (c?.location) schema.address = { "@type": "PostalAddress", addressLocality: c.location };
    if (c?.linkedin) schema.sameAs = [c.linkedin];
    if (skills.length > 0) schema.knowsAbout = skills;
    if (currentRole?.company) {
      schema.worksFor = { "@type": "Organization", name: currentRole.company };
    }

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "proxy-person-schema";
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById("proxy-person-schema");
      if (existing) document.head.removeChild(existing);
    };
  }, [portfolio, username]);

  const handleSendMessage = async (overrideValue?: string) => {
    const msgText = overrideValue || inputValue.trim();
    if (!msgText || isStreaming) return;
    setInputValue("");
    setMessages(prev => [...prev, { role: "user", content: msgText }]);
    setIsStreaming(true);
    // PostHog: track chat engagement per portfolio
    if (typeof (window as any).posthog !== "undefined") {
      (window as any).posthog.capture("chat_message_sent", {
        username,
        message_count: messages.length + 1,
      });
    }

    try {
      const chatUrl = isDraftMode ? `/api/chat/draft` : `/api/chat/${username}`;
      const res = await fetch(chatUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: msgText }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(`[${res.status}] ${errBody.message || errBody.error || "Chat failed"}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.content || "No response." }]);
    } catch (err: any) {
      const errorDetail = err?.message || "Unknown error";
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: `Sorry, I'm having trouble responding right now. (${errorDetail}) — Please try again.` },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#18181b] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-[#18181b] flex items-center justify-center p-6 text-white">
        <div className="text-center">
          <Globe className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Portfolio Not Found</h2>
        </div>
        {isDemo && !demoBannerDismissed && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t-[3px] border-[#22C55E] px-4 py-4 flex items-center justify-between gap-4 flex-wrap shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
            <p className="text-white text-sm font-medium flex-1 min-w-0">
              <span className="text-[#22C55E] font-bold">This is a real AI Twin.</span> Chat with it, explore the profile — then build yours.
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => navigate("/register")}
                className="bg-[#22C55E] text-black px-5 py-2 font-bold text-sm border-[2px] border-[#22C55E] hover:bg-[#16A34A] mono uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(34,197,94,0.4)]"
              >
                Create Mine Free →
              </button>
              <button
                onClick={() => setDemoBannerDismissed(true)}
                className="text-white/50 hover:text-white text-lg leading-none font-bold"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const profile = portfolio.profile;
  const rawTheme = profile.brandingTheme?.toLowerCase() || "corporate";
  const themeMap: Record<string, keyof typeof themes> = {
    executive: "corporate", futurist: "tech", minimalist: "creative",
    corporate: "corporate", tech: "tech", creative: "creative",
  };
  const brandingTheme = themeMap[rawTheme] || "corporate";
  const theme = themes[brandingTheme];
  const hasVideo = !!profile.videoUrl;
  const hasPhoto = !!profile.photoUrl;
  // In draft mode always show the media column so placeholders appear
  const hasMedia = hasVideo || hasPhoto || isDraftMode;
  const initials = profile.displayName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "DT";

  const skills = profile.technicalSkills?.split(/[,\n]/).map(s => s.trim()).filter(Boolean) || [];

  // Draft mode: use CV-specific questions, limit to 2
  const draftChatQuestions: string[] = (portfolio as any).draftChatQuestions || [];
  const suggestedQs = isDraftMode && draftChatQuestions.length
    ? draftChatQuestions
    : portfolio.suggestedQuestions?.length
      ? portfolio.suggestedQuestions
      : profile.portfolioSuggestedQuestions?.length
        ? profile.portfolioSuggestedQuestions
        : ["Tell me about yourself", "What's your biggest achievement?", "How do you handle challenges?"];

  const visibleStats = showAllStats ? (profile.stats || []) : (profile.stats || []).slice(0, 6);

  return (
    <div className={`${theme.bg} ${theme.text} ${theme.bodyClass} min-h-screen ${theme.selectionColor} overflow-x-hidden`}>
      <div className={`${theme.gradient} fixed inset-0 pointer-events-none`} />

      {/* Draft banner */}
      {isDraftMode && (
        <div className="relative z-50 bg-[#E8A75D] border-b-[3px] border-black px-6 py-3 flex items-center justify-between gap-4 flex-wrap" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <div className="flex items-center gap-3">
            <div className="bg-black text-[#E8A75D] px-3 py-1 mono text-xs font-bold uppercase tracking-wider shrink-0">DRAFT</div>
            <p className="mono text-sm font-bold text-black">
              AI built this from your CV.
              <span className="font-normal ml-2 text-black/70">Complete the questionnaire to make it yours — then go live.</span>
            </p>
          </div>
          <button
            onClick={() => navigate("/questionnaire?skipUpload=true")}
            className="bg-black text-white px-5 py-2 mono text-xs font-bold uppercase tracking-wider hover:bg-black/80 shrink-0 border-[2px] border-black"
          >
            Complete your profile →
          </button>
        </div>
      )}
      
      {/* 3-panel comparison CTA — draft mode only */}
      {isDraftMode && (
        <div className="relative z-40 bg-[#0f1117] border-b border-white/10 px-6 py-8">
          <div className="max-w-5xl mx-auto">
            <p className="text-center mono text-xs text-white/40 uppercase tracking-widest mb-6">Your profile, upgraded</p>
            <div className="grid grid-cols-3 gap-4">
              {/* CV */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-5 opacity-60">
                <p className="text-white/40 text-xs mb-2 italic">Static · Your depth is invisible</p>
                <div className="mono text-xs text-white/40 uppercase tracking-wider mb-3">📄 Your CV</div>
                <div className="space-y-1.5">
                  {["Name + job titles", "Bullet point duties", "Date ranges", "Static document"].map(t => (
                    <div key={t} className="text-xs text-white/50 flex items-center gap-2">
                      <span className="text-red-400/70">✗</span> {t}
                    </div>
                  ))}
                </div>
              </div>
              {/* LinkedIn */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-5 opacity-70">
                <p className="text-white/40 text-xs mb-2 italic">Passive · Same as everyone else</p>
                <div className="mono text-xs text-white/40 uppercase tracking-wider mb-3">💼 LinkedIn</div>
                <div className="space-y-1.5">
                  {["Summary paragraph", "Role descriptions", "Skills list", "No AI interaction"].map(t => (
                    <div key={t} className="text-xs text-white/50 flex items-center gap-2">
                      <span className="text-yellow-400/70">~</span> {t}
                    </div>
                  ))}
                </div>
              </div>
              {/* Proxy */}
              <div className="rounded-lg border-2 border-[#E8A75D] bg-[#E8A75D]/5 p-5 relative">
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#E8A75D] text-black mono text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">You, completed</div>
                <p className="text-[#E8A75D]/70 text-xs mb-2 italic">Interactive · Your depth, on demand</p>
                <div className="mono text-xs text-[#E8A75D] uppercase tracking-wider mb-3">⚡ Proxy</div>
                <div className="space-y-1.5">
                  {["AI-powered positioning", "Impact metrics & stories", "Answers recruiter questions", "Works while you sleep"].map(t => (
                    <div key={t} className="text-xs text-white/80 flex items-center gap-2">
                      <span className="text-[#E8A75D]">✓</span> {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-center mt-6">
              <button
                onClick={() => navigate("/questionnaire?skipUpload=true")}
                className="bg-[#E8A75D] text-black px-8 py-3 mono text-sm font-bold uppercase tracking-wider hover:bg-[#d4944a] transition-colors"
              >
                Complete your profile to go live →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section className="pt-16 pb-12 px-6 max-w-6xl mx-auto relative">
        {hasMedia ? (
          <div className="grid md:grid-cols-5 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="md:col-span-3"
            >
              <div className="flex items-center gap-4 mb-6">
                {hasVideo && hasPhoto && (
                  <div className="relative shrink-0">
                    <Avatar className="h-20 w-20 border-2 border-white/20">
                      <AvatarImage src={profile.photoUrl!} alt={profile.displayName} />
                      <AvatarFallback className="bg-white/10 text-white text-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 ${theme.dotColor} text-[9px] font-black text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider`}>
                      Open
                    </div>
                  </div>
                )}
                <div>
                  <h1 className={`text-5xl md:text-6xl font-black tracking-tight ${theme.headingClass}`} style={{ fontFamily: theme.fontFamily }} data-testid="text-display-name">
                    {profile.displayName}
                  </h1>
                </div>
              </div>
              
              <p className={`text-xl font-medium ${theme.muted} mb-6`} data-testid="text-subtitle">
                {profile.heroSubtitle?.split(' • ').map((facet, i, arr) => (
                  <span key={i}>
                    {facet}
                    {i < arr.length - 1 && (
                      <span className={`${theme.accentSolid} mx-2`}>•</span>
                    )}
                  </span>
                )) || profile.roleTitle}
              </p>

              <div className={`space-y-4 ${theme.muted} text-lg leading-relaxed mb-8`} data-testid="text-positioning">
                {profile.positioning?.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              {theme.moduleStyle === 'system' && (
                <div className="flex flex-wrap gap-4 text-xs font-mono text-white/60 mb-6" data-testid="tech-status-bar">
                  <span>STATUS: <span className="text-lime-400">ONLINE</span></span>
                  <span>|</span>
                  <span>LATENCY: 0.8s</span>
                  <span>|</span>
                  <span>PORTFOLIO_ID: {profile.displayName?.toUpperCase().replace(/\s/g, '_')}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => document.getElementById('section-chatbot')?.scrollIntoView({ behavior: 'smooth' })}
                  className={`${theme.ctaBg} text-white px-6 py-3 rounded-xl font-semibold ${theme.ctaGlow} transition-all flex items-center gap-2`}
                  data-testid="button-talk-to-ai"
                >
                  <MessageSquare className="w-4 h-4" /> Talk to My AI Twin
                </button>
                {portfolio.contact.email && (
                  <button 
                    onClick={() => setShowEmailModal(true)}
                    className={`${theme.glass} px-6 py-3 rounded-xl ${theme.glassHover} font-medium flex items-center gap-2`} 
                    data-testid="button-email"
                  >
                    <Mail className="w-4 h-4" /> Email
                  </button>
                )}
                {portfolio.contact.linkedin && (
                  <a href={portfolio.contact.linkedin} target="_blank" rel="noreferrer">
                    <button className={`${theme.glass} px-6 py-3 rounded-xl ${theme.glassHover} font-medium flex items-center gap-2`} data-testid="button-linkedin">
                      <Linkedin className="w-4 h-4" /> LinkedIn
                    </button>
                  </a>
                )}
                {profile.cvResumeUrl && (
                  <a href={profile.cvResumeUrl} download>
                    <button className={`${theme.glass} px-6 py-3 rounded-xl ${theme.glassHover} font-medium flex items-center gap-2`} data-testid="button-cv">
                      <Download className="w-4 h-4" /> CV
                    </button>
                  </a>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="md:col-span-2 relative"
            >
              <div className={`absolute -inset-6 bg-gradient-to-r ${theme.accent} opacity-15 blur-3xl rounded-full pointer-events-none`} />
              {hasVideo ? (
                <div className="relative">
                  <div className={`${theme.glass} rounded-2xl overflow-hidden ${theme.glow}`}>
                    <video
                      src={profile.videoUrl!}
                      controls
                      autoPlay
                      muted
                      poster={profile.photoUrl || undefined}
                      className="w-full aspect-video object-cover"
                      data-testid="video-intro"
                    />
                  </div>
                  <p className={`text-center text-sm ${theme.muted} mt-3`}>A 60-second self introduction</p>
                </div>
              ) : hasPhoto ? (
                <div className="relative">
                  <div className={`${theme.glass} rounded-2xl overflow-hidden ${theme.glow}`}>
                    <img src={profile.photoUrl!} className="w-full aspect-[4/5] object-cover" alt={profile.displayName} />
                  </div>
                  <div className={`absolute bottom-4 left-4 ${theme.dotColor} text-xs font-black text-white px-3 py-1.5 rounded-full uppercase tracking-wider`}>
                    Open to Work
                  </div>
                </div>
              ) : isDraftMode ? (
                <div className="space-y-4">
                  <div className={`${theme.glass} rounded-2xl overflow-hidden aspect-[4/5] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/20`}>
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white/30">{initials}</span>
                    </div>
                    <p className="text-white/30 text-sm font-medium">Add your photo</p>
                    <p className="text-white/20 text-xs text-center px-6">Complete your profile to add a headshot</p>
                  </div>
                  <div className={`${theme.glass} rounded-2xl overflow-hidden aspect-video flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/20`}>
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-white/30" />
                    </div>
                    <p className="text-white/30 text-sm font-medium">Add intro video</p>
                    <p className="text-white/20 text-xs">3× more recruiter responses</p>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className={`text-6xl font-black mb-6 tracking-tight ${theme.headingClass}`} style={{ fontFamily: theme.fontFamily }}>{profile.displayName}</h1>
            <p className={`text-xl font-medium ${theme.muted} mb-6`}>
              {profile.heroSubtitle || profile.roleTitle}
            </p>
            <div className={`space-y-4 ${theme.muted} text-lg leading-relaxed mb-8`}>
              {profile.positioning?.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <button 
                onClick={() => document.getElementById('section-chatbot')?.scrollIntoView({ behavior: 'smooth' })}
                className={`${theme.ctaBg} text-white px-6 py-3 rounded-xl font-semibold ${theme.ctaGlow} transition-all flex items-center gap-2`}
              >
                <MessageSquare className="w-4 h-4" /> Talk to My AI Twin
              </button>
              {portfolio.contact.email && (
                <a href={`mailto:${portfolio.contact.email}`}>
                  <button className={`${theme.glass} px-6 py-3 rounded-xl ${theme.glassHover} font-medium flex items-center gap-2`}>
                    <Mail className="w-4 h-4" /> Email
                  </button>
                </a>
              )}
            </div>
          </motion.div>
        )}
      </section>

      {/* 2. DIGITAL TWIN CONSOLE — THE STAR */}
      <section id="section-chatbot" className="py-12 px-6 max-w-4xl mx-auto opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
        <div className="text-center mb-6">
          <h2 className={`text-3xl font-bold mb-2 ${theme.headingClass}`} style={{ fontFamily: theme.fontFamily }}>{theme.name === 'Tech' && <span className="text-white/30">// </span>}Twin Interface</h2>
          <p className={`${theme.muted} text-sm`}>Trained on {profile.displayName}'s career data, decision models, and communication style.</p>
        </div>
        
        <div className={`${theme.glass} rounded-3xl overflow-hidden flex flex-col ${theme.glow} relative`} style={{ minHeight: "600px" }}>
          {/* PERSONALITY HEADER */}
          <div className={`flex items-center gap-4 p-4 bg-white/5 backdrop-blur-xl border-b border-white/10`}>
            <div className="relative">
              <Avatar className="w-14 h-14 border-2 border-white/20">
                <AvatarImage src={profile.photoUrl || ""} alt={profile.displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className={`absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 ${theme.bg}`}></div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">I'm {profile.displayName?.split(' ')[0]}'s Digital Twin</h3>
              <p className="text-sm text-white/70">Ask me about my experience, approach, or war stories</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <Terminal className={`w-10 h-10 mb-4 opacity-30 ${theme.accentSolid}`} />
                <p className={`${theme.muted} text-sm mb-6`}>Ask me anything about {profile.displayName}'s experience</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-xl">
                  {suggestedQs.slice(0, 6).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(q)}
                      className={`${theme.glass} px-4 py-2 rounded-full text-xs font-medium ${theme.glassHover} cursor-pointer`}
                      data-testid={`button-suggested-q-${i}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start items-start gap-3'}>
                {msg.role === 'assistant' && (
                  <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                    <AvatarImage src={profile.photoUrl || ""} alt={profile.displayName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                )}
                <div className={
                  msg.role === 'user'
                    ? `inline-block ${theme.chatUserBg} px-4 py-2 rounded-lg max-w-[80%] text-sm`
                    : `inline-block ${theme.chatBotBg} px-4 py-3 rounded-lg max-w-[80%] text-sm leading-relaxed`
                }>
                  {msg.role === 'user' ? msg.content : (
                    <div className="space-y-3">
                      {msg.content.split(/\n\n+/).map((paragraph, pi) => {
                        // Check if paragraph is a bullet list
                        const lines = paragraph.split('\n');
                        const isBulletList = lines.every(l => /^[\s]*[-•*]\s/.test(l) || l.trim() === '');
                        if (isBulletList && lines.filter(l => l.trim()).length > 0) {
                          return (
                            <ul key={pi} className="list-disc list-inside space-y-1">
                              {lines.filter(l => l.trim()).map((line, li) => (
                                <li key={li}>{line.replace(/^[\s]*[-•*]\s*/, '')}</li>
                              ))}
                            </ul>
                          );
                        }
                        // Check for bold (**text**)
                        const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
                        return (
                          <p key={pi}>
                            {parts.map((part, partI) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={partI}>{part.slice(2, -2)}</strong>;
                              }
                              return <span key={partI}>{part}</span>;
                            })}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isStreaming && (
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile.photoUrl || ""} alt={profile.displayName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                  <span className="text-white/70 text-xs">{profile.displayName?.split(' ')[0]} is typing</span>
                  <div className="flex gap-1">
                    <div className={`w-1.5 h-1.5 ${theme.dotColor} rounded-full animate-bounce`} style={{animationDelay: '0ms'}}></div>
                    <div className={`w-1.5 h-1.5 ${theme.dotColor} rounded-full animate-bounce`} style={{animationDelay: '150ms'}}></div>
                    <div className={`w-1.5 h-1.5 ${theme.dotColor} rounded-full animate-bounce`} style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-white/10 bg-white/[0.02]">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about strategy, experience, or specific roles..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-white placeholder:text-white/30"
                data-testid="input-chat"
              />
              <button
                type="submit"
                disabled={isStreaming || !inputValue.trim()}
                className={`${theme.ctaBg} disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2`}
                data-testid="button-send"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 3. IMPACT METRICS */}
      {profile.stats && profile.stats.length > 0 && (
        <section className="py-12 px-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-white/10" />
            <h2 className={`text-2xl font-bold uppercase tracking-widest ${theme.accentSolid} ${theme.headingClass}`} style={{ fontFamily: theme.fontFamily }}>{theme.name === 'Tech' && <span className="text-white/30">// </span>}Impact Metrics</h2>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className={`grid ${brandingTheme === 'creative' ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'} ${brandingTheme === 'corporate' ? 'gap-3' : 'gap-4'}`}>
            {visibleStats.map((stat, i) => (
              <motion.div 
                whileHover={{ y: -3 }}
                key={i} 
                className={`${theme.cardStyle} p-8 text-center ${brandingTheme === 'creative' && i === 0 ? 'col-span-2' : ''}`}
                data-testid={`stat-card-${i}`}
              >
                {stat.icon && (
                  <div className={`w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center bg-gradient-to-r ${theme.accent} bg-opacity-20`}>
                    {getIcon(stat.icon, "w-5 h-5 text-white")}
                  </div>
                )}
                <div className={`${theme.metricStyle.className} mb-2 bg-gradient-to-r ${theme.accent} bg-clip-text text-transparent`} style={theme.metricStyle.style}>
                  {stat.value}
                </div>
                <div className={`${theme.muted} text-xs uppercase tracking-wider`}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
          {(profile.stats?.length || 0) > 6 && !showAllStats && (
            <div className="text-center mt-6">
              <button
                onClick={() => setShowAllStats(true)}
                className={`${theme.glass} px-6 py-2 rounded-full text-sm ${theme.glassHover} ${theme.accentSolid}`}
              >
                View All Metrics
              </button>
            </div>
          )}
          {isDraftMode && (
            <p className="text-center mt-6 mono text-xs text-white/40 italic">
              Based on your CV only. Complete the questionnaire to show your full impact.{" "}
              <button onClick={() => navigate("/questionnaire?skipUpload=true")} className="text-[#E8A75D] hover:underline">Complete now →</button>
            </p>
          )}
        </section>
      )}

      {/* 4. WHERE I'M MOST USEFUL */}
      {isDraftMode && !profile.whereImMostUseful?.scenarios?.length && (
        <section className="py-12 px-6 max-w-5xl mx-auto">
          <div className="relative">
            <div className="filter blur-sm pointer-events-none select-none opacity-40">
              <h2 className={`text-3xl font-bold mb-4 ${theme.headingClass}`}>Where I'm Most Useful</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className={`${theme.glass} p-5 rounded-xl h-24`} />
                ))}
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="bg-black/80 border border-white/20 px-6 py-4 rounded-xl text-center">
                <Lock className="w-5 h-5 text-white/50 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Unlocks after completing your profile</p>
                <button onClick={() => navigate("/questionnaire?skipUpload=true")} className="mt-2 text-xs text-[#22C55E] hover:underline">Complete now →</button>
              </div>
            </div>
          </div>
        </section>
      )}
      {(profile.whereImMostUseful?.scenarios?.length || (profile.problemFit && profile.problemFit.length > 0)) && (
        <section className="py-12 px-6 max-w-5xl mx-auto">
          <h2 className={`text-3xl font-bold mb-2 ${theme.headingClass}`} style={{ fontFamily: theme.fontFamily }}>{theme.name === 'Tech' && <span className="text-white/30">// </span>}Where I'm Most Useful</h2>
          {profile.whereImMostUseful?.intro && (
            <p className={`text-lg ${theme.muted} mb-8 leading-relaxed`}>{profile.whereImMostUseful.intro}</p>
          )}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${brandingTheme === 'corporate' ? 'gap-3' : 'gap-4'}`}>
            {profile.whereImMostUseful?.scenarios ? (
              profile.whereImMostUseful.scenarios.map((scenario, i) => (
                <div key={i} className={`${theme.cardStyle} p-6 group`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-gradient-to-r ${theme.accent} bg-opacity-20`}>
                    {getIcon(scenario.icon, "w-6 h-6 text-white/80")}
                  </div>
                  <h3 className="font-semibold text-sm mb-2 text-white/90">{scenario.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{scenario.description}</p>
                </div>
              ))
            ) : (
              profile.problemFit?.slice(0, 6).map((problem, i) => (
                <div key={i} className={`${theme.glass} p-6 rounded-xl ${theme.glassHover} group`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full ${theme.dotColor} mt-2.5 shrink-0 group-hover:scale-150 transition-transform`} />
                    <p className={`text-base ${theme.muted} leading-relaxed`}>{problem}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* 5. HOW I WORK — Horizontal timeline with arrows */}
      {isDraftMode && !profile.howIWork && (
        <section className="py-12 px-6 max-w-6xl mx-auto">
          <div className="relative">
            <div className="filter blur-sm pointer-events-none select-none opacity-40">
              <h2 className={`text-3xl font-bold mb-4 text-center ${theme.headingClass}`}>My Operating Model</h2>
              <div className="flex flex-col md:flex-row gap-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`${theme.glass} p-5 rounded-xl flex-1 h-28`} />
                ))}
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="bg-black/80 border border-white/20 px-6 py-4 rounded-xl text-center">
                <Lock className="w-5 h-5 text-white/50 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Unlocks after completing your profile</p>
                <button onClick={() => navigate("/questionnaire?skipUpload=true")} className="mt-2 text-xs text-[#22C55E] hover:underline">Complete now →</button>
              </div>
            </div>
          </div>
        </section>
      )}
      {profile.howIWork && profile.howIWork.steps?.length > 0 && (
        <section className="py-12 px-6 max-w-6xl mx-auto">
          <h2 className={`text-3xl font-bold mb-2 text-center ${theme.headingClass}`} style={{ fontFamily: theme.fontFamily }}>{theme.name === 'Tech' && <span className="text-white/30">// </span>}{profile.howIWork.name || "My Operating Model"}</h2>
          <p className={`text-center ${theme.muted} mb-8`}>How I approach engagements and deliver results</p>
          <div className="flex flex-col md:flex-row items-stretch gap-2">
            {profile.howIWork.steps.map((step, i, arr) => (
              <div key={i} className="flex items-center flex-1 gap-2">
                <div className={`${theme.glass} p-5 rounded-xl flex-1 ${theme.glassHover} relative`}>
                  <div className={`text-3xl font-black ${theme.accentSolid} opacity-30 absolute top-2 right-3`}>{i + 1}</div>
                  <h3 className={`text-lg font-bold mb-2 ${theme.accentSolid}`}>{step.label}</h3>
                  <p className={`text-sm ${theme.muted} leading-relaxed`}>{step.description}</p>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className={`w-5 h-5 shrink-0 ${theme.accentSolid} opacity-40 hidden md:block`} />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. CAREER TRAJECTORY */}
      {profile.careerTimeline && profile.careerTimeline.length > 0 && (
        <section className="py-12 px-6 max-w-6xl mx-auto opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
          <h2 className={`text-3xl font-bold mb-8 ${theme.headingClass}`} style={{ fontFamily: theme.fontFamily }}>
            {theme.name === 'Tech' && <span className="text-white/30">// </span>}Career Trajectory
          </h2>
          
          <div className={`space-y-8 border-l-2 ${theme.timelineLineColor} pl-8`}>
            {profile.careerTimeline.map((entry, i) => {
              const isGrouped = entry.roles && entry.roles.length > 0;
              const cleanAch = (achs: string[] | undefined) => 
                (achs || []).filter(a => a && !['na', 'n/a', 'none', 'nil', 'null', '-', '—'].includes(a.toLowerCase().trim()));
              
              if (isGrouped) {
                return (
                  <div key={i} className="relative">
                    <div className={`absolute -left-[calc(2rem+5px)] top-4 w-4 h-4 ${theme.dotColor} rounded-full border-4 ${theme.bg}`}></div>
                    <div className={`${theme.glass} rounded-xl overflow-hidden`}>
                      <div className={`px-6 py-4 border-b ${theme.timelineLineColor}`}>
                        <h3 className={`text-2xl font-bold ${theme.headingClass}`}>{entry.company}</h3>
                      </div>
                      <div className="p-4 space-y-3">
                      {entry.roles!.map((role, j) => (
                        <div key={j} className={`bg-white/5 border border-white/10 p-5 rounded-lg ${theme.glassHover} w-full overflow-hidden`}>
                          <div className="flex flex-wrap justify-between items-start mb-2 gap-2">
                            <h4 className="text-xl font-bold text-white/90">{role.title}</h4>
                            <span className="text-sm text-white/75 font-medium">{role.years}</span>
                          </div>
                          {cleanAch(role.achievements).length > 0 && (
                            <details className="mt-4">
                              <summary className={`cursor-pointer text-sm ${theme.accentSolid} font-bold hover:opacity-80 transition-opacity flex items-center gap-1`}>
                                <span>▸</span> Role Context & Achievements ({cleanAch(role.achievements).length})
                              </summary>
                              <ul className="mt-3 space-y-2 pl-5 border-l border-white/10">
                                {cleanAch(role.achievements).map((a, k) => (
                                  <li key={k} className="text-white/80 text-sm leading-relaxed">{a.replace(/^[\s•\-\*]+/, '').trim()}</li>
                                ))}
                              </ul>
                            </details>
                          )}
                        </div>
                      ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={i} className="relative">
                  <div className={`absolute -left-[calc(2rem+5px)] top-2 w-4 h-4 ${theme.dotColor} rounded-full border-4 ${theme.bg}`}></div>
                  <div className={theme.glass + " p-8 rounded-xl w-full overflow-hidden " + theme.glassHover}>
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                      <div>
                        <h3 className={`text-2xl font-bold mb-1 ${theme.headingClass} text-white`}>{entry.title}</h3>
                        <p className={`text-xl font-bold ${theme.accentSolid}`}>{entry.company}</p>
                      </div>
                      <span className="text-sm text-white/75 font-medium">{entry.years}</span>
                    </div>
                    {cleanAch(entry.achievements).length > 0 && (
                      <details className="mt-6">
                        <summary className={`cursor-pointer text-sm ${theme.accentSolid} font-bold hover:opacity-80 transition-opacity flex items-center gap-1`}>
                          <span>▸</span> Role Context & Achievements ({cleanAch(entry.achievements).length})
                        </summary>
                        <ul className="mt-4 space-y-3 pl-6 border-l border-white/10">
                          {cleanAch(entry.achievements).map((a, j) => (
                            <li key={j} className="text-white/85 text-sm leading-relaxed">{a.replace(/^[\s•\-\*]+/, '').trim()}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 7. SKILL MATRIX */}
      {isDraftMode && !(profile.skillsMatrix && profile.skillsMatrix.length > 0) && (
        <section className="py-12 px-6 max-w-5xl mx-auto">
          <div className="relative">
            <div className="filter blur-sm pointer-events-none select-none opacity-40">
              <h2 className={`text-3xl font-bold mb-6 ${theme.headingClass}`}>Skill Matrix</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`${theme.glass} p-6 rounded-xl h-24`} />
                ))}
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="bg-black/80 border border-white/20 px-6 py-4 rounded-xl text-center">
                <Lock className="w-5 h-5 text-white/50 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Unlocks after completing your profile</p>
                <button onClick={() => navigate("/questionnaire?skipUpload=true")} className="mt-2 text-xs text-[#22C55E] hover:underline">Complete now →</button>
              </div>
            </div>
          </div>
        </section>
      )}
      {(profile.skillsMatrix && profile.skillsMatrix.length > 0) ? (
        <section className="py-12 px-6 max-w-5xl mx-auto">
          <h2 className={`text-3xl font-bold mb-8 ${theme.headingClass}`} style={{ fontFamily: theme.fontFamily }}>
            {theme.name === 'Tech' && <span className="text-white/30">// </span>}Skill Matrix
          </h2>
          <div className={`grid ${brandingTheme === 'creative' ? 'grid-cols-1 md:grid-cols-3' : 'md:grid-cols-2'} ${brandingTheme === 'corporate' ? 'gap-3' : 'gap-4'}`}>
            {profile.skillsMatrix.map((skill, i) => (
              <div key={i} className={`${theme.cardStyle} p-6 ${brandingTheme === 'creative' && i === 0 ? 'md:col-span-2' : ''}`} data-testid={`skill-card-${i}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white/10 border border-white/20 group-hover:border-white/30 transition-colors shadow-sm`}>
                      {getIcon(skill.icon, `w-6 h-6 ${theme.accentSolid} opacity-100 drop-shadow-md`)}
                    </div>
                    <h3 className="text-lg font-bold">{skill.title}</h3>
                  </div>
                  <span className={`text-[10px] px-3 py-1 rounded-full font-bold tracking-wider ${
                    skill.proficiency === 'EXPERT' 
                      ? `bg-gradient-to-r ${theme.accent} text-white` 
                      : `${theme.glass} ${theme.accentSolid}`
                  }`}>
                    {skill.proficiency}
                  </span>
                </div>
                <p className={`${theme.muted} text-sm leading-relaxed`}>{skill.description}</p>
              </div>
            ))}
          </div>
          {profile.skillTags && profile.skillTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8" data-testid="skill-tags">
              {profile.skillTags.map((tag, i) => (
                <span
                  key={i}
                  className={`px-4 py-1.5 rounded-full text-sm border ${theme.glass} ${theme.accentSolid} font-medium`}
                  data-testid={`skill-tag-${i}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </section>
      ) : skills.length > 0 && !isDraftMode ? (
        <section className="py-12 px-6 max-w-5xl mx-auto">
          <h2 className={`text-3xl font-bold mb-8 ${theme.headingClass}`}>
            Skill Matrix
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, i) => (
              <Badge 
                key={i} 
                variant="outline" 
                className={`${theme.glass} px-4 py-2 rounded-full text-sm border-white/5 ${theme.muted} ${theme.glassHover}`}
                data-testid={`skill-${i}`}
              >
                {skill}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}

      {/* 9. FOOTER */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div className={`text-sm ${theme.muted}`}>
              {profile.displayName} {profile.roleTitle ? `• ${profile.roleTitle}` : ""}
            </div>
            <div className="flex gap-6">
              {portfolio.contact.linkedin && (
                <a href={portfolio.contact.linkedin} target="_blank" rel="noreferrer" className={`${theme.accentSolid} hover:opacity-80 transition-opacity text-sm`}>
                  LinkedIn
                </a>
              )}
              {portfolio.contact.email && !isDraftMode && (
                <a href={`mailto:${portfolio.contact.email}`} className={`${theme.accentSolid} hover:opacity-80 transition-opacity text-sm`}>
                  {portfolio.contact.email}
                </a>
              )}
              {isDraftMode && !portfolio.contact.email && (
                <span className="text-white/30 text-sm italic">Add your email in the questionnaire</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {portfolio.contact.email && (
              <button 
                onClick={() => setShowEmailModal(true)}
                className={`${theme.ctaBg} text-white px-8 py-4 rounded-xl text-lg font-bold ${theme.ctaGlow} transition-all flex items-center gap-2`} 
                data-testid="button-footer-email"
              >
                <Mail className="w-5 h-5" /> Get in Touch
              </button>
            )}
            <a href="/register">
              <button className={`${theme.glass} px-8 py-4 rounded-xl text-lg font-bold ${theme.glassHover}`} data-testid="button-build-twin">
                Build Your Own Twin
              </button>
            </a>
          </div>
          <div className="text-center">
            <p className={`${theme.muted} text-xs tracking-widest uppercase opacity-50`}>
              Powered by <a href="/" className={`${theme.accentSolid} hover:opacity-80`}>myproxy.work</a>
            </p>
            <p className={`${theme.muted} text-xs mt-2 opacity-30`}>
              &copy; {new Date().getFullYear()} All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${theme.glass} w-full max-w-lg rounded-3xl overflow-hidden ${theme.glow} border-white/20`}
          >
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className={`text-2xl font-bold ${theme.headingClass}`}>Get in Touch</h3>
                <button 
                  onClick={() => setShowEmailModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <Globe className="w-6 h-6 rotate-45" /> {/* Use Globe as a close X if X is missing, or just a placeholder */}
                  <span className="sr-only">Close</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className={`${theme.muted} text-sm mb-1`}>Contact Email</p>
                  <p className="font-mono text-lg">{portfolio.contact.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(portfolio.contact.email!);
                      // Optional: add toast or feedback here
                    }}
                    className={`${theme.glass} p-4 rounded-xl flex flex-col items-center gap-2 ${theme.glassHover} transition-all`}
                  >
                    <Download className="w-6 h-6" />
                    <span className="text-sm font-semibold">Copy Email</span>
                  </button>
                  
                  <a 
                    href={`mailto:${portfolio.contact.email}`}
                    className={`${theme.ctaBg} p-4 rounded-xl flex flex-col items-center gap-2 text-white transition-all`}
                  >
                    <Mail className="w-6 h-6" />
                    <span className="text-sm font-semibold">Open Mail App</span>
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <p className={`${theme.muted} text-xs text-center`}>
                  Feel free to reach out regarding collaborations, opportunities, or just to say hi.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Demo banner — only visible when arriving from landing page as unauthenticated visitor */}
      {isDemo && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t-[3px] border-[#22C55E] px-4 py-4 flex items-center justify-between gap-4 flex-wrap shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          <p className="text-white text-sm font-medium flex-1 min-w-0">
            <span className="text-[#22C55E] font-bold">This is a real AI Twin.</span> Chat with it, explore the profile — then build yours.
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate("/register")}
              className="bg-[#22C55E] text-black px-5 py-2 font-bold text-sm border-[2px] border-[#22C55E] hover:bg-[#16A34A] mono uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(34,197,94,0.4)]"
            >
              Create Mine Free →
            </button>
            <button
              onClick={() => setDemoBannerDismissed(true)}
              className="text-white/50 hover:text-white text-lg leading-none font-bold"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
