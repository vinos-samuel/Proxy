import { useState, useRef, useEffect } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Loader2, MessageSquare, Globe } from "lucide-react";

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

// The four branding themes a profile can pick — each one is a fully
// self-contained layout below (search "if (brandingTheme ===" for each).
// This used to be a big object of per-theme style tokens (colors, fonts,
// card styles) shared by one generic template; now that each theme has its
// own dedicated JSX, nothing reads those token values anymore, so this is
// just the canonical list of valid keys.
type BrandingThemeKey = "corporate" | "tech" | "creative" | "executive";

export default function PortfolioPage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [expandedHighlights, setExpandedHighlights] = useState<Set<number>>(new Set());
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(false);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const search = useSearch();
  const isDraftMode = new URLSearchParams(search).get("draft") === "true";
  const isDemo = username === "test2" && new URLSearchParams(search).get("demo") === "true" && !user && !demoBannerDismissed;
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAutoFiredRef = useRef(false);

  const { data: portfolio, isLoading, error } = useQuery<PortfolioData>({
    queryKey: ["/api/portfolio", username, isDraftMode],
    queryFn: async () => {
      const url = isDraftMode
        ? `/api/portfolio/${username}?draft=true`
        : `/api/portfolio/${username}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        // Draft link clicked while not logged in — send to login then back
        if (res.status === 403 && isDraftMode) {
          const returnUrl = `/portfolio/${username}?draft=true`;
          window.location.href = `/login?next=${encodeURIComponent(returnUrl)}`;
          return new Promise(() => {}); // suspend while redirecting
        }
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

  // Auto-fire the first suggested question once, on real page loads only —
  // a recruiter gets a real, specific answer already sitting there instead of
  // an empty chat box to type into. Skipped in draft mode, where the chat is a
  // locked teaser, not a live conversation.
  useEffect(() => {
    if (!portfolio || isDraftMode || hasAutoFiredRef.current) return;
    const firstQuestion =
      portfolio.suggestedQuestions?.[0] || portfolio.profile.portfolioSuggestedQuestions?.[0];
    if (!firstQuestion) return;
    hasAutoFiredRef.current = true;
    handleSendMessage(firstQuestion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolio, isDraftMode]);

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
              <span className="text-[#22C55E] font-bold">Ask it something real.</span> Explore the profile, then build your own.
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
  const rawTheme = profile.brandingTheme?.toLowerCase() || "executive";
  const themeMap: Record<string, BrandingThemeKey> = {
    executive: "executive", futurist: "tech", minimalist: "creative",
    corporate: "corporate", tech: "tech", creative: "creative",
  };
  const brandingTheme = themeMap[rawTheme] || "executive";
  const hasVideo = !!profile.videoUrl;
  const hasPhoto = !!profile.photoUrl;

  // Draft mode: use CV-specific questions, limit to 2
  const draftChatQuestions: string[] = (portfolio as any).draftChatQuestions || [];
  const suggestedQs = isDraftMode && draftChatQuestions.length
    ? draftChatQuestions
    : portfolio.suggestedQuestions?.length
      ? portfolio.suggestedQuestions
      : profile.portfolioSuggestedQuestions?.length
        ? profile.portfolioSuggestedQuestions
        : ["Tell me about yourself", "What's your biggest achievement?", "How do you handle challenges?"];

  // Shared across all four branding themes below — each theme is its own
  // self-contained layout (not a recolor of a shared template), but they all
  // read from the same derived data, so it's extracted once here rather than
  // re-derived per theme.
  const dCareer = profile.careerTimeline || [];
  const dSkillsMatrix = profile.skillsMatrix || [];
  const dSkillTags = profile.skillTags || [];
  // Up to 16 — matches the edit UI's cap. AI generates 8 by default; a user
  // can add more themselves. Grids below use a fixed 2-col mobile / 4-col
  // desktop layout that wraps to further rows on its own, rather than a
  // length-dependent column count that only ever worked up to 4 items.
  const dStats = (profile.stats || []).slice(0, 16);
  const dPositioning = (profile.positioning || "").split("\n\n").filter(Boolean);
  const dRoleLine = [profile.roleTitle, dCareer[0]?.company].filter(Boolean).join(" — ");
  const dRemainingQs = suggestedQs.filter((q) => !messages.some((m) => m.role === "user" && m.content === q)).slice(0, 3);
  // First name for the AI-disclosure line on each theme — "Priya's AI proxy",
  // not the ungendered-but-grammatically-broken "Priya AI proxy" (missing the
  // possessive) or a fully generic line that drops the name entirely.
  const firstName = profile.displayName?.split(" ")[0] || "";
  const possessive = firstName ? `${firstName}'s` : "their";

  const renderAnswer = (content: string) => (
    <div className="space-y-3">
      {content.split(/\n\n+/).map((paragraph, pi) => {
        const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={pi}>
            {parts.map((part, partI) =>
              part.startsWith("**") && part.endsWith("**")
                ? <strong key={partI}>{part.slice(2, -2)}</strong>
                : <span key={partI}>{part}</span>
            )}
          </p>
        );
      })}
    </div>
  );

  // ==========================================================================
  // EXECUTIVE THEME — rendered as its own layout, not a recolor of the shared
  // template. A confidential-briefing-document concept: margin annotations
  // instead of a nav, the positioning line as the headline, a ledger "scope
  // band" of real figures, an interrogation transcript instead of chat
  // bubbles, career record instead of cards. See docs design review for the
  // full rationale. Empty sections collapse rather than showing placeholders
  // or lock overlays, in both draft and live — the chat itself is fully live
  // in draft mode too (handleSendMessage already routes to /api/chat/draft),
  // consistent with the publish-first direction: gate the account, not the
  // conversation.
  if (brandingTheme === "executive") {
    return (
      <div className="min-h-screen bg-[#F2F1EC] text-[#1B211E]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif" }}>
        <style>{`
          .dossier-serif { font-family: "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif; }
          .dossier-mono { font-family: "SF Mono", "IBM Plex Mono", Menlo, Consolas, monospace; }
          .dossier-tab { font-variant-numeric: tabular-nums; }
        `}</style>

        {/* Document header */}
        <header className="border-b border-[#DBD9CD] py-4 px-6">
          <div className="max-w-[920px] mx-auto flex justify-between items-center gap-4 flex-wrap">
            <div className="dossier-mono text-[11px] tracking-wide text-[#5B6158]">
              PROXY / EXECUTIVE PROFILE
            </div>
            <div className="dossier-mono text-[11px] uppercase tracking-wider text-[#5B6158] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F5D4C] inline-block" />
              {isDraftMode ? "Draft preview — not live yet" : "Published"}
            </div>
          </div>
        </header>

        {/* Hero — video (when present) takes the prominent top-right slot, same
            job the landing page's own hero video does. The photo, when there
            is one, is just an identity marker next to the name — small and
            circular, not competing with the video for space. */}
        <section className="py-14 px-6 border-b border-[#DBD9CD]">
          <div className={`max-w-[920px] mx-auto grid gap-10 ${hasVideo ? "md:grid-cols-[1fr_380px]" : ""}`}>
            <div>
              <div className="flex items-center gap-3 mb-5">
                {hasPhoto && (
                  <img
                    src={profile.photoUrl!}
                    alt={profile.displayName}
                    className="w-12 h-12 rounded-full object-cover border border-[#DBD9CD]"
                  />
                )}
                {portfolio.contact.location && (
                  <div className="dossier-mono text-[12px] text-[#8B8F84]">Based in {portfolio.contact.location}</div>
                )}
              </div>
              <h1 className="dossier-serif text-[40px] leading-tight mb-2">{profile.displayName}</h1>
              {dRoleLine && <div className="dossier-mono text-[13px] text-[#5B6158] uppercase mb-6">{dRoleLine}</div>}

              {dPositioning.length > 0 && (
                <div className="pl-5 border-l-2 border-[#2F5D4C] my-7">
                  {dPositioning.map((para, i) => (
                    <p key={i} className={`dossier-serif italic text-[#1B211E] max-w-[62ch] ${i === 0 ? "text-[27px] leading-snug" : "text-[17px] leading-relaxed mt-3 not-italic text-[#5B6158]"}`}>
                      {para}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-6 flex-wrap mt-7">
                <button
                  onClick={() => document.getElementById("dossier-interrogation")?.scrollIntoView({ behavior: "smooth" })}
                  className="dossier-mono text-xs uppercase tracking-wider bg-[#2F5D4C] text-[#F2F1EC] px-6 py-3 inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
                  data-testid="button-dossier-ask"
                >
                  <MessageSquare className="w-4 h-4" /> Ask directly
                </button>
                {portfolio.contact.linkedin && (
                  <a
                    href={portfolio.contact.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="dossier-mono text-xs text-[#5B6158] border-b border-[#C3C0B0] pb-0.5 hover:text-[#1B211E] hover:border-[#5B6158] transition-colors"
                  >
                    LinkedIn
                  </a>
                )}
                {profile.cvResumeUrl && (
                  <a
                    href={profile.cvResumeUrl}
                    download
                    className="dossier-mono text-xs text-[#5B6158] border-b border-[#C3C0B0] pb-0.5 hover:text-[#1B211E] hover:border-[#5B6158] transition-colors"
                  >
                    Download CV
                  </a>
                )}
              </div>
            </div>

            {hasVideo && (
              <video
                src={profile.videoUrl!}
                controls
                className="w-full border border-[#DBD9CD] md:mt-1"
                data-testid="video-intro"
              />
            )}
          </div>
        </section>

        {/* Scope band */}
        {dStats.length > 0 && (
          <section className="border-b border-[#DBD9CD]">
            <div
              className={
                "max-w-[920px] mx-auto grid grid-cols-2 " +
                (dStats.length >= 4 ? "md:grid-cols-4" : dStats.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2")
              }
            >
              {dStats.map((stat, i) => (
                <div
                  key={i}
                  className={`px-6 py-8 border-[#DBD9CD] md:border-l md:first:border-l-0 ${i >= 2 ? "border-t" : ""} ${i < 4 ? "md:border-t-0" : "md:border-t"}`}
                >
                  <div className="dossier-serif dossier-tab text-[26px] leading-none mb-2 whitespace-nowrap">{stat.value}</div>
                  <div className="dossier-mono text-[10.5px] uppercase tracking-wide text-[#8B8F84] leading-snug">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Interrogation */}
        <section className="py-14 px-6 border-b border-[#DBD9CD]" id="dossier-interrogation">
          <div className="max-w-[920px] mx-auto">
            <div className="flex justify-between items-baseline gap-5 flex-wrap mb-8">
              <h2 className="dossier-serif text-[26px]">Ask directly</h2>
              <div className="text-sm text-[#5B6158] max-w-[46ch]">Answered from the actual record — not a summary of it.</div>
            </div>
            <div className="dossier-mono text-[11px] text-[#8B8F84] -mt-5 mb-8">Answered by {possessive} AI proxy, from their own record.</div>

            <div ref={scrollRef} className="flex flex-col gap-6 mb-6 max-h-[480px] overflow-y-auto">
              {messages.length === 0 && !isStreaming && (
                <p className="text-[14.5px] text-[#8B8F84] italic">Ask about a project, a decision, or a specific result.</p>
              )}
              {messages.map((msg, i) => (
                msg.role === "user" ? (
                  <div key={i}>
                    <span className="dossier-mono text-[10.5px] text-[#2F5D4C] tracking-wide">Q — </span>
                    <span className="text-[14.5px] text-[#5B6158] italic">{msg.content}</span>
                  </div>
                ) : (
                  <div key={i} className="dossier-serif text-[17.5px] leading-relaxed pl-5 border-l border-[#C3C0B0] max-w-[66ch]">
                    {renderAnswer(msg.content)}
                  </div>
                )
              ))}
              {isStreaming && (
                <div className="flex items-center gap-2 text-[#8B8F84] text-sm">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Answering…
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex gap-2.5 border-t border-[#DBD9CD] pt-5 mt-1"
            >
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about a project, a decision, or a number above…"
                className="flex-1 bg-transparent border-b border-[#C3C0B0] px-0.5 py-2 text-[14.5px] outline-none focus:border-[#2F5D4C] placeholder:text-[#8B8F84]"
                data-testid="input-dossier-chat"
              />
              <button
                type="submit"
                disabled={isStreaming || !inputValue.trim()}
                className="dossier-mono text-[11.5px] uppercase tracking-wide border border-[#1B211E] px-4 disabled:opacity-40 hover:bg-[#1B211E] hover:text-[#F2F1EC] transition-colors"
                data-testid="button-dossier-send"
              >
                Ask
              </button>
            </form>
            {dRemainingQs.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {dRemainingQs.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="dossier-mono text-[11px] text-[#5B6158] border border-[#C3C0B0] px-3 py-1.5 hover:border-[#2F5D4C] hover:text-[#2F5D4C] transition-colors"
                    data-testid={`button-dossier-suggestion-${i}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Career record */}
        {dCareer.length > 0 && (
          <section className="py-14 px-6 border-b border-[#DBD9CD]">
            <div className="max-w-[920px] mx-auto">
              <h2 className="dossier-serif text-[26px] mb-7">Career record</h2>
              {dCareer.map((entry: any, i: number) => (
                <div key={i} className={`py-5 ${i > 0 ? "border-t border-[#DBD9CD]" : ""}`}>
                  <div className="flex justify-between items-baseline gap-4 flex-wrap mb-3">
                    <h3 className="dossier-serif text-[20px]">{entry.company}</h3>
                  </div>
                  {(entry.roles || []).map((role: any, j: number) => (
                    <div key={j} className={`grid md:grid-cols-[200px_1fr] gap-5 py-3 ${j > 0 ? "border-t border-dashed border-[#DBD9CD]" : ""}`}>
                      <div>
                        <div className="font-semibold text-[14.5px]">{role.title}</div>
                        {role.years && <div className="dossier-mono dossier-tab text-[11.5px] text-[#8B8F84] mt-0.5">{role.years}</div>}
                      </div>
                      {(role.achievements || []).length > 0 && (
                        <ul className="flex flex-col gap-1.5">
                          {role.achievements.map((a: string, k: number) => (
                            <li key={k} className="text-[14.5px] text-[#5B6158] pl-3.5 relative before:content-['—'] before:absolute before:left-0 before:text-[#8B8F84]">
                              {a}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* How I work */}
        {profile.howIWork && profile.howIWork.steps?.length > 0 && (
          <section className="py-14 px-6 border-b border-[#DBD9CD]">
            <div className="max-w-[920px] mx-auto">
              <h2 className="dossier-serif text-[26px] mb-2">How I work</h2>
              {profile.howIWork.name && <div className="dossier-mono text-[13px] text-[#5B6158] uppercase mb-7">{profile.howIWork.name}</div>}
              <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
                {profile.howIWork.steps.map((step, i) => (
                  <div key={i}>
                    <div className="dossier-mono text-[11px] text-[#8B8F84] uppercase tracking-wide mb-1">{step.label}</div>
                    <p className="text-[14.5px] text-[#5B6158] leading-relaxed">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Areas of record (skills) */}
        {(dSkillsMatrix.length > 0 || dSkillTags.length > 0) && (
          <section className="py-14 px-6">
            <div className="max-w-[920px] mx-auto">
              <h2 className="dossier-serif text-[26px] mb-7">Areas of record</h2>
              {dSkillsMatrix.length > 0 && (
                <div className="columns-1 sm:columns-2 gap-10">
                  {dSkillsMatrix.map((skill: any, i: number) => (
                    <div key={i} className={`break-inside-avoid py-3 ${i > 1 ? "border-t border-[#DBD9CD]" : ""}`}>
                      <div className="flex justify-between items-baseline gap-3">
                        <span className="text-[14.5px]">{skill.title}</span>
                        <span className="dossier-mono text-[10px] text-[#8B8F84] tracking-wide whitespace-nowrap">{skill.proficiency}</span>
                      </div>
                      {skill.description && <p className="text-[12.5px] text-[#8B8F84] mt-1 leading-snug">{skill.description}</p>}
                    </div>
                  ))}
                </div>
              )}
              {dSkillTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {dSkillTags.map((tag: string, i: number) => (
                    <span key={i} className="dossier-mono text-[11px] text-[#5B6158] border border-[#C3C0B0] px-2.5 py-1">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="py-8 px-6 border-t border-[#DBD9CD]">
          <div className="max-w-[920px] mx-auto flex justify-between items-center gap-4 flex-wrap">
            <div className="dossier-mono text-[11px] text-[#8B8F84]">
              {profile.displayName}{profile.roleTitle ? ` · ${profile.roleTitle}` : ""}
            </div>
            <div className="flex items-center gap-5">
              {portfolio.contact.email && (
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="dossier-mono text-xs text-[#2F5D4C] border-b border-[#2F5D4C] pb-0.5"
                  data-testid="button-dossier-footer-email"
                >
                  Get in touch
                </button>
              )}
              <a href="/register" className="dossier-mono text-xs text-[#5B6158] hover:text-[#1B211E]">
                Build your own record →
              </a>
            </div>
          </div>
        </footer>

        {showEmailModal && portfolio.contact.email && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60">
            <div className="bg-[#FBFAF7] border border-[#DBD9CD] w-full max-w-md p-7">
              <div className="flex items-center justify-between mb-5">
                <h3 className="dossier-serif text-[20px]">Get in touch</h3>
                <button onClick={() => setShowEmailModal(false)} className="text-[#8B8F84] hover:text-[#1B211E] text-xl leading-none" aria-label="Close">×</button>
              </div>
              <div className="border border-[#DBD9CD] p-4 mb-4">
                <div className="dossier-mono text-[11px] text-[#8B8F84] uppercase mb-1">Contact email</div>
                <div className="dossier-mono text-[15px]">{portfolio.contact.email}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigator.clipboard.writeText(portfolio.contact.email!)}
                  className="border border-[#1B211E] py-2.5 text-sm hover:bg-[#1B211E] hover:text-[#F2F1EC] transition-colors"
                >
                  Copy email
                </button>
                <a
                  href={`mailto:${portfolio.contact.email}`}
                  className="bg-[#2F5D4C] text-[#F2F1EC] py-2.5 text-sm text-center hover:opacity-90 transition-opacity"
                >
                  Open mail app
                </a>
              </div>
            </div>
          </div>
        )}

        {isDemo && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t-[3px] border-[#22C55E] px-4 py-4 flex items-center justify-between gap-4 flex-wrap shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
            <p className="text-white text-sm font-medium flex-1 min-w-0">
              <span className="text-[#22C55E] font-bold">Ask it something real.</span> Explore the profile, then build your own.
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

  // ==========================================================================
  // DARK THEME — "the career report". An audited annual-report concept: a
  // contents strip, a ledger of figures, "record of service" instead of a
  // career list. Deliberately not Executive-in-dark-colors — see design
  // review notes — chat still sits right after the hero so the product's
  // core differentiator isn't buried, same principle as Executive.
  if (brandingTheme === "corporate") {
    return (
      <div className="min-h-screen bg-[#0D1117] text-[#E9E7DE]" style={{ fontFamily: "Charter, Cambria, Georgia, serif" }}>
        <style>{`.rpt-mono { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; } .rpt-tab { font-variant-numeric: tabular-nums; }`}</style>

        <header className="border-b border-[#AD8A4E] py-4 px-6">
          <div className="max-w-[920px] mx-auto flex justify-between items-center gap-4 flex-wrap">
            <div className="rpt-mono text-[11px] tracking-wide uppercase text-[#AD8A4E]">Proxy / Career Report</div>
            <div className="rpt-mono text-[11px] uppercase tracking-wider text-[#8A8F98] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#AD8A4E] inline-block" />
              {isDraftMode ? "Draft preview — not live yet" : "Published"}
            </div>
          </div>
        </header>

        <div className="border-b border-[#262B33] py-3 px-6">
          <div className="max-w-[920px] mx-auto flex gap-7 flex-wrap">
            {[
              ["rpt-qa", "Questions & answers"],
              ["rpt-figures", "Key figures"],
              ["rpt-service", "Record of service"],
              ...(profile.howIWork && profile.howIWork.steps?.length > 0 ? [["rpt-how", "How I work"]] : []),
              ["rpt-activities", "Principal activities"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
                className="rpt-mono text-[10.5px] uppercase tracking-wide text-[#8A8F98] hover:text-[#E9E7DE] transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <section className="py-14 px-6 border-b border-[#262B33]">
          <div className={`max-w-[920px] mx-auto grid gap-10 ${hasVideo ? "md:grid-cols-[1fr_380px]" : ""}`}>
            <div>
              <div className="flex items-center gap-3 mb-5">
                {hasPhoto && (
                  <img
                    src={profile.photoUrl!}
                    alt={profile.displayName}
                    className="w-12 h-12 rounded-full object-cover border border-[#262B33]"
                  />
                )}
                {portfolio.contact.location && (
                  <div className="rpt-mono text-[12px] text-[#8A8F98]">Based in {portfolio.contact.location}</div>
                )}
              </div>
              <h1 className="text-[38px] font-medium leading-tight mb-2">{profile.displayName}</h1>
              {dRoleLine && <div className="rpt-mono text-[12.5px] uppercase tracking-wide text-[#AD8A4E] mb-7">{dRoleLine}</div>}
              {dPositioning.length > 0 && (
                <div className="border-l-2 border-[#AD8A4E] pl-5 mb-7">
                  {dPositioning.map((para, i) => (
                    <p key={i} className={`text-[18px] leading-relaxed text-[#C9C7BB] max-w-[62ch] ${i > 0 ? "mt-3" : ""}`}>{para}</p>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-6 flex-wrap">
                <button
                  onClick={() => document.getElementById("rpt-qa")?.scrollIntoView({ behavior: "smooth" })}
                  className="rpt-mono text-[11.5px] uppercase tracking-wide bg-[#AD8A4E] text-[#0D1117] px-6 py-3 hover:opacity-90 transition-opacity"
                  data-testid="button-rpt-ask"
                >
                  Ask directly
                </button>
                {portfolio.contact.linkedin && (
                  <a href={portfolio.contact.linkedin} target="_blank" rel="noreferrer" className="rpt-mono text-[11.5px] text-[#8A8F98] border-b border-[#33383F] pb-0.5 hover:text-[#E9E7DE] transition-colors">LinkedIn</a>
                )}
                {profile.cvResumeUrl && (
                  <a href={profile.cvResumeUrl} download className="rpt-mono text-[11.5px] text-[#8A8F98] border-b border-[#33383F] pb-0.5 hover:text-[#E9E7DE] transition-colors">Download CV</a>
                )}
              </div>
            </div>
            {hasVideo && (
              <video src={profile.videoUrl!} controls className="w-full border border-[#262B33] md:mt-1" data-testid="video-intro" />
            )}
          </div>
        </section>

        <section className="py-14 px-6 border-b border-[#262B33]" id="rpt-qa">
          <div className="max-w-[820px] mx-auto">
            <h2 className="text-[21px] font-medium mb-1">Questions &amp; answers</h2>
            <div className="rpt-mono text-[11px] text-[#6B7078] mb-7">Answered by {possessive} AI proxy, from their own record.</div>
            <div ref={scrollRef} className="flex flex-col gap-6 mb-6 max-h-[480px] overflow-y-auto">
              {messages.length === 0 && !isStreaming && (
                <p className="text-[14.5px] text-[#6B7078] italic">Ask about a project, a decision, or a figure above.</p>
              )}
              {messages.map((msg, i) =>
                msg.role === "user" ? (
                  <div key={i}>
                    <span className="rpt-mono text-[11px] text-[#AD8A4E]">Q{messages.slice(0, i + 1).filter(m => m.role === "user").length} — </span>
                    <span className="text-[14.5px] text-[#C9C7BB] italic">{msg.content}</span>
                  </div>
                ) : (
                  <div key={i} className="text-[16px] leading-relaxed pl-5 border-l border-[#33383F] max-w-[66ch]">{renderAnswer(msg.content)}</div>
                )
              )}
              {isStreaming && (
                <div className="flex items-center gap-2 text-[#8A8F98] text-sm"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Answering…</div>
              )}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2.5 border-t border-[#262B33] pt-5 mt-1">
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about a project, a decision, or a figure above…"
                className="flex-1 bg-transparent border-b border-[#33383F] px-0.5 py-2 text-[14.5px] outline-none focus:border-[#AD8A4E] placeholder:text-[#6B7078] text-[#E9E7DE]"
                data-testid="input-rpt-chat"
              />
              <button type="submit" disabled={isStreaming || !inputValue.trim()} className="rpt-mono text-[11px] uppercase tracking-wide border border-[#E9E7DE] px-4 disabled:opacity-40 hover:bg-[#E9E7DE] hover:text-[#0D1117] transition-colors" data-testid="button-rpt-send">Ask</button>
            </form>
            {dRemainingQs.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {dRemainingQs.map((q, i) => (
                  <button key={i} onClick={() => handleSendMessage(q)} className="rpt-mono text-[11px] text-[#C9C7BB] border border-[#33383F] px-3 py-1.5 hover:border-[#AD8A4E] hover:text-[#AD8A4E] transition-colors" data-testid={`button-rpt-suggestion-${i}`}>{q}</button>
                ))}
              </div>
            )}
          </div>
        </section>

        {dStats.length > 0 && (
          <section className="border-b border-[#262B33]" id="rpt-figures">
            <div className={`max-w-[920px] mx-auto grid grid-cols-2 ${dStats.length >= 4 ? "md:grid-cols-4" : dStats.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
              {dStats.map((stat, i) => (
                <div key={i} className={`px-6 py-8 border-[#262B33] md:border-l md:first:border-l-0 ${i >= 2 ? "border-t" : ""} ${i < 4 ? "md:border-t-0" : "md:border-t"}`}>
                  <div className={`font-medium leading-tight mb-2 rpt-tab whitespace-nowrap ${stat.value.length > 10 ? "text-[20px]" : "text-[30px]"}`}>{stat.value}</div>
                  <div className="rpt-mono text-[10.5px] uppercase tracking-wide text-[#8A8F98]">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {dCareer.length > 0 && (
          <section className="py-14 px-6 border-b border-[#262B33]" id="rpt-service">
            <div className="max-w-[820px] mx-auto">
              <h2 className="text-[21px] font-medium mb-7">Record of service</h2>
              {dCareer.map((entry: any, i: number) => (
                <div key={i} className={`py-5 ${i > 0 ? "border-t border-dashed border-[#262B33]" : ""}`}>
                  <div className="text-[17px] font-medium mb-3">{entry.company}</div>
                  {(entry.roles || []).map((role: any, j: number) => (
                    <div key={j} className={`grid md:grid-cols-[180px_1fr] gap-4 py-2.5 ${j > 0 ? "border-t border-dashed border-[#262B33]" : ""}`}>
                      <div>
                        <div className="text-[14px] font-semibold">{role.title}</div>
                        {role.years && <div className="rpt-mono text-[11px] text-[#8A8F98] mt-0.5 rpt-tab">{role.years}</div>}
                      </div>
                      {(role.achievements || []).length > 0 && (
                        <ul className="flex flex-col gap-1">
                          {role.achievements.map((a: string, k: number) => (
                            <li key={k} className="text-[14px] text-[#C9C7BB]">{a}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {profile.howIWork && profile.howIWork.steps?.length > 0 && (
          <section className="py-14 px-6 border-b border-[#262B33]" id="rpt-how">
            <div className="max-w-[820px] mx-auto">
              <h2 className="text-[21px] font-medium mb-2">How I work</h2>
              {profile.howIWork.name && <div className="rpt-mono text-[11px] uppercase tracking-wide text-[#AD8A4E] mb-7">{profile.howIWork.name}</div>}
              <div className="grid sm:grid-cols-2 gap-x-10 gap-y-5">
                {profile.howIWork.steps.map((step, i) => (
                  <div key={i}>
                    <div className="rpt-mono text-[10.5px] text-[#8A8F98] uppercase tracking-wide mb-1">{step.label}</div>
                    <p className="text-[14px] text-[#C9C7BB] leading-relaxed">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {(dSkillTags.length > 0 || dSkillsMatrix.length > 0) && (
          <section className="py-14 px-6" id="rpt-activities">
            <div className="max-w-[820px] mx-auto">
              <h2 className="text-[21px] font-medium mb-7">Principal activities</h2>
              <div className="flex flex-wrap gap-2">
                {(dSkillTags.length > 0 ? dSkillTags : dSkillsMatrix.map((s: any) => s.title)).map((tag: string, i: number) => (
                  <span key={i} className="rpt-mono text-[11px] text-[#C9C7BB] border border-[#33383F] px-3 py-1.5">{tag}</span>
                ))}
              </div>
            </div>
          </section>
        )}

        <footer className="py-8 px-6 border-t border-[#262B33]">
          <div className="max-w-[920px] mx-auto flex justify-between items-center gap-5 flex-wrap">
            <div className="rpt-mono text-[11px] text-[#8A8F98]">{profile.displayName}{profile.roleTitle ? ` · ${profile.roleTitle}` : ""}</div>
            <div className="flex items-center gap-5">
              {portfolio.contact.email && (
                <button onClick={() => setShowEmailModal(true)} className="rpt-mono text-[11px] text-[#AD8A4E] border border-[#AD8A4E] px-4 py-1.5" data-testid="button-rpt-footer-email">Get in touch</button>
              )}
              <a href="/register" className="rpt-mono text-[11px] text-[#8A8F98] hover:text-[#E9E7DE]">Build your own record →</a>
            </div>
          </div>
        </footer>

        {showEmailModal && portfolio.contact.email && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60">
            <div className="bg-[#0D1117] border border-[#262B33] w-full max-w-md p-7">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[20px] font-medium">Get in touch</h3>
                <button onClick={() => setShowEmailModal(false)} className="text-[#8A8F98] hover:text-[#E9E7DE] text-xl leading-none" aria-label="Close">×</button>
              </div>
              <div className="border border-[#262B33] p-4 mb-4">
                <div className="rpt-mono text-[11px] text-[#8A8F98] uppercase mb-1">Contact email</div>
                <div className="rpt-mono text-[15px]">{portfolio.contact.email}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => navigator.clipboard.writeText(portfolio.contact.email!)} className="border border-[#E9E7DE] py-2.5 text-sm hover:bg-[#E9E7DE] hover:text-[#0D1117] transition-colors">Copy email</button>
                <a href={`mailto:${portfolio.contact.email}`} className="bg-[#AD8A4E] text-[#0D1117] py-2.5 text-sm text-center hover:opacity-90 transition-opacity">Open mail app</a>
              </div>
            </div>
          </div>
        )}

        {isDemo && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t-[3px] border-[#22C55E] px-4 py-4 flex items-center justify-between gap-4 flex-wrap shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
            <p className="text-white text-sm font-medium flex-1 min-w-0"><span className="text-[#22C55E] font-bold">Ask it something real.</span> Explore the profile, then build your own.</p>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => navigate("/register")} className="bg-[#22C55E] text-black px-5 py-2 font-bold text-sm border-[2px] border-[#22C55E] hover:bg-[#16A34A] mono uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(34,197,94,0.4)]">Create Mine Free →</button>
              <button onClick={() => setDemoBannerDismissed(true)} className="text-white/50 hover:text-white text-lg leading-none font-bold" aria-label="Dismiss">×</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // TECH THEME — "the terminal". One typeface throughout, on purpose — a real
  // terminal doesn't mix fonts. Positioning as a README, chat as a REPL
  // session, career as a git log, skills as plain badges (no fake proficiency
  // meters — an early version of these misrepresented strong numbers as low
  // scores; see design review).
  if (brandingTheme === "tech") {
    const flatCommits = dCareer.flatMap((entry: any) => (entry.roles || []).map((role: any) => ({ company: entry.company, ...role })));
    return (
      <div className="min-h-screen bg-[#0A0E12] text-[#D7DEE2]" style={{ fontFamily: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace' }}>
        <div className="flex justify-between items-center px-8 py-3 border-b border-[#1B222A] text-xs">
          <div className="text-[#46C2B3]">proxy://{username}</div>
          <div className="flex items-center gap-2 text-[#6E7885]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#46C2B3] inline-block" />
            {isDraftMode ? "AI · DRAFT" : "AI · ONLINE"}
          </div>
        </div>

        <div className="px-8 py-11 pb-8 border-b border-[#1B222A]">
          <div className={`grid gap-10 ${hasVideo ? "md:grid-cols-[1fr_380px]" : "max-w-[760px]"}`}>
            <div>
              <div className="text-[#6E7885] text-[13px] mb-2.5"><span className="text-[#46C2B3]">$</span> whoami</div>
              <div className="flex items-center gap-3 mb-5">
                {hasPhoto && <img src={profile.photoUrl!} alt={profile.displayName} className="w-11 h-11 rounded-full border border-[#1B222A] object-cover shrink-0" />}
                <div>
                  <h1 className="text-[28px] font-bold text-[#EDF1F2] leading-tight">{profile.displayName}</h1>
                  {dRoleLine && (
                    <div className="text-[13px] text-[#46C2B3]">
                      {dRoleLine.toLowerCase().split(/ — |,\s*/).map((seg) => seg.trim().replace(/\s+/g, "_")).filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
              </div>
              {dPositioning.length > 0 && (
                <div className="bg-[#10151B] border border-[#1B222A] rounded-md mb-6">
                  <div className="flex gap-1.5 px-3.5 py-2 border-b border-[#1B222A]"><span className="w-2 h-2 rounded-full bg-[#232B34]" /><span className="w-2 h-2 rounded-full bg-[#232B34]" /><span className="w-2 h-2 rounded-full bg-[#232B34]" /></div>
                  <div className="px-5 py-4 text-[14px] leading-relaxed text-[#C3CAD0]">
                    <div className="text-[#6E7885] text-xs mb-2">$ cat README.md</div>
                    {dPositioning.map((para, i) => <p key={i} className={i > 0 ? "mt-2" : ""}>{para}</p>)}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-5 flex-wrap">
                <button onClick={() => document.getElementById("trm-qa")?.scrollIntoView({ behavior: "smooth" })} className="text-[12.5px] font-bold bg-[#46C2B3] text-[#05201C] px-5 py-2.5 rounded-[3px]" data-testid="button-trm-ask">$ ask</button>
                {portfolio.contact.linkedin && <a href={portfolio.contact.linkedin} target="_blank" rel="noreferrer" className="text-[12.5px] text-[#6E7885] border-b border-dotted border-[#2A333D]">linkedin</a>}
                {profile.cvResumeUrl && <a href={profile.cvResumeUrl} download className="text-[12.5px] text-[#6E7885] border-b border-dotted border-[#2A333D]">download_cv</a>}
              </div>
            </div>
            {hasVideo && (
              <div className="bg-[#10151B] border border-[#1B222A] rounded-md md:mt-6 h-fit">
                <div className="flex gap-1.5 px-3.5 py-2 border-b border-[#1B222A]"><span className="w-2 h-2 rounded-full bg-[#232B34]" /><span className="w-2 h-2 rounded-full bg-[#232B34]" /><span className="w-2 h-2 rounded-full bg-[#232B34]" /></div>
                <video src={profile.videoUrl!} controls className="w-full block" data-testid="video-intro" />
              </div>
            )}
          </div>
        </div>

        {dStats.length > 0 && (
          <div className={`grid grid-cols-1 border-b border-[#1B222A] ${dStats.length >= 4 ? "sm:grid-cols-4" : dStats.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {dStats.map((stat, i) => (
              <div key={i} className={`px-8 py-6 border-[#1B222A] sm:border-r sm:last:border-r-0 ${i > 0 ? "border-t" : ""} ${i < 4 ? "sm:border-t-0" : "sm:border-t"}`}>
                <div className="text-[11px] text-[#6E7885] mb-2.5">{stat.label.toLowerCase().replace(/\s+/g, "_")}</div>
                <div className="text-[22px] font-bold text-[#EDF1F2] whitespace-nowrap">{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="px-8 py-10 border-b border-[#1B222A] max-w-[760px]" id="trm-qa">
          <div className="text-xs text-[#6E7885] mb-1.5">$ ask</div>
          <div className="text-[11px] text-[#4A535E] mb-5">answers come from {possessive} own record, generated by AI — not a live human</div>
          <div ref={scrollRef} className="flex flex-col gap-4 mb-5 max-h-[420px] overflow-y-auto">
            {messages.length === 0 && !isStreaming && (
              <p className="text-[13.5px] text-[#4A535E]">ask about a project, a decision, a number above…</p>
            )}
            {messages.map((msg, i) =>
              msg.role === "user" ? (
                <div key={i} className="text-[13.5px] text-[#6E7885]"><span className="text-[#46C2B3]">&gt;&gt;&gt;</span> {msg.content}</div>
              ) : (
                <div key={i} className="bg-[#10151B] border-l-2 border-[#46C2B3] px-4 py-3 text-[14px] leading-relaxed text-[#C3CAD0]">{renderAnswer(msg.content)}</div>
              )
            )}
            {isStreaming && <div className="flex items-center gap-2 text-[#6E7885] text-sm"><Loader2 className="w-3.5 h-3.5 animate-spin" /> running…</div>}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2 items-center">
            <span className="text-[#46C2B3] text-sm">&gt;&gt;&gt;</span>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="ask about a project, a decision, a number above…"
              className="flex-1 bg-transparent border-none text-[#D7DEE2] text-sm outline-none placeholder:text-[#4A535E]"
              data-testid="input-trm-chat"
            />
            <button type="submit" disabled={isStreaming || !inputValue.trim()} className="bg-[#1B222A] text-[#46C2B3] text-[11px] px-3.5 py-2 rounded-[3px] disabled:opacity-40" data-testid="button-trm-send">run</button>
          </form>
          {dRemainingQs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {dRemainingQs.map((q, i) => (
                <button key={i} onClick={() => handleSendMessage(q)} className="text-[11px] text-[#6E7885] border border-[#1B222A] px-2.5 py-1.5 rounded-[3px] hover:text-[#46C2B3] hover:border-[#46C2B3] transition-colors" data-testid={`button-trm-suggestion-${i}`}>{q}</button>
              ))}
            </div>
          )}
        </div>

        {flatCommits.length > 0 && (
          <div className="px-8 py-10 border-b border-[#1B222A] max-w-[760px]">
            <div className="text-xs text-[#6E7885] mb-5">$ git log --all</div>
            {dCareer.map((entry: any, ci: number) => (
              <div key={ci} className="mb-5 last:mb-0">
                <div className="text-[14px] font-bold text-[#EDF1F2] mb-2.5">{(entry.company || "").toLowerCase().replace(/\s+/g, "-")} <span className="text-[#46C2B3]">/{(entry.roles?.[0]?.title || "").toLowerCase().replace(/[,]/g, "").replace(/\s+/g, "-")}</span></div>
                {(entry.roles || []).map((role: any, ri: number) => (
                  <div key={ri} className="flex gap-3.5 py-1.5 text-[13px]">
                    <span className="text-[#4A535E]">{(role.years || "").split(/[—-]/)[0]?.trim()}—</span>
                    <div className="flex-1">
                      <div className="text-[#C3CAD0]">{role.title}</div>
                      {(role.achievements || []).map((a: string, ai: number) => (
                        <div key={ai} className="text-[#5FBF8F] text-[12.5px] mt-0.5">+{a}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {profile.howIWork && profile.howIWork.steps?.length > 0 && (
          <div className="px-8 py-10 border-b border-[#1B222A] max-w-[760px]">
            <div className="text-xs text-[#6E7885] mb-1.5">$ cat methodology.md</div>
            {profile.howIWork.name && <div className="text-[13px] text-[#46C2B3] mb-5">{profile.howIWork.name}</div>}
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
              {profile.howIWork.steps.map((step, i) => (
                <div key={i}>
                  <div className="text-[11px] text-[#6E7885] mb-1">{step.label.toLowerCase().replace(/\s+/g, "_")}</div>
                  <p className="text-[13.5px] text-[#C3CAD0] leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(dSkillTags.length > 0 || dSkillsMatrix.length > 0) && (
          <div className="px-8 py-10">
            <div className="text-xs text-[#6E7885] mb-5">$ cat skills.json</div>
            <div className="flex flex-wrap gap-2">
              {(dSkillTags.length > 0 ? dSkillTags : dSkillsMatrix.map((s: any) => s.title)).map((tag: string, i: number) => (
                <span key={i} className="text-[11.5px] bg-[#10151B] border border-[#1B222A] rounded-[3px] px-2.5 py-1.5 text-[#C3CAD0]">{tag.toLowerCase().replace(/[(),]/g, "").replace(/\s+/g, "_")}</span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center px-8 py-5 text-[12.5px]">
          {portfolio.contact.email ? (
            <button onClick={() => setShowEmailModal(true)} className="text-[#6E7885]" data-testid="button-trm-footer-email"><span className="text-[#46C2B3]">$</span> contact --email</button>
          ) : <span />}
          <a href="/register" className="text-[#46C2B3]">build_your_own() →</a>
        </div>

        {showEmailModal && portfolio.contact.email && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60">
            <div className="bg-[#0A0E12] border border-[#1B222A] w-full max-w-md p-7 rounded-md">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[16px] font-bold text-[#EDF1F2]">$ contact --email</h3>
                <button onClick={() => setShowEmailModal(false)} className="text-[#6E7885] hover:text-[#D7DEE2] text-xl leading-none" aria-label="Close">×</button>
              </div>
              <div className="border border-[#1B222A] p-4 mb-4 rounded-[3px]">
                <div className="text-[11px] text-[#6E7885] mb-1">contact_email</div>
                <div className="text-[14px]">{portfolio.contact.email}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => navigator.clipboard.writeText(portfolio.contact.email!)} className="border border-[#1B222A] py-2.5 text-sm rounded-[3px] hover:border-[#46C2B3] hover:text-[#46C2B3] transition-colors">copy</button>
                <a href={`mailto:${portfolio.contact.email}`} className="bg-[#46C2B3] text-[#05201C] py-2.5 text-sm text-center rounded-[3px] font-bold">open_mail()</a>
              </div>
            </div>
          </div>
        )}

        {isDemo && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t-[3px] border-[#22C55E] px-4 py-4 flex items-center justify-between gap-4 flex-wrap shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
            <p className="text-white text-sm font-medium flex-1 min-w-0"><span className="text-[#22C55E] font-bold">Ask it something real.</span> Explore the profile, then build your own.</p>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => navigate("/register")} className="bg-[#22C55E] text-black px-5 py-2 font-bold text-sm border-[2px] border-[#22C55E] hover:bg-[#16A34A] mono uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(34,197,94,0.4)]">Create Mine Free →</button>
              <button onClick={() => setDemoBannerDismissed(true)} className="text-white/50 hover:text-white text-lg leading-none font-bold" aria-label="Dismiss">×</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // CREATIVE THEME — "the feature story". A magazine profile, not a resume:
  // asymmetric photo/text hero, a serif pull-quote, stats as a sidebar
  // factbox, career as flat editorial highlights (not grouped by company),
  // skills as a keyword line.
  if (brandingTheme === "creative") {
    const flatHighlights = dCareer.flatMap((entry: any) => (entry.roles || []).map((role: any) => ({ company: entry.company, ...role })));
    return (
      <div className="min-h-screen bg-[#17140F] text-[#EDE7DC]" style={{ fontFamily: 'ui-serif, "New York", "Times New Roman", Georgia, serif' }}>
        <div className="flex justify-between items-baseline px-11 py-5 border-b border-[#322C22]">
          <div style={{ fontFamily: "-apple-system, sans-serif" }} className="text-[11px] tracking-[0.14em] uppercase text-[#96AD86]">Profile</div>
          <div style={{ fontFamily: "-apple-system, sans-serif" }} className="text-[11px] text-[#7A7568]">{isDraftMode ? "Draft preview — not live yet" : "Published"}</div>
        </div>

        <div className={`grid gap-10 px-11 py-12 border-b border-[#322C22] ${hasVideo ? "md:grid-cols-[1fr_420px]" : ""}`}>
          <div className="max-w-[560px]">
            <div className="flex items-center gap-3 mb-3.5">
              {hasPhoto && (
                <img src={profile.photoUrl!} alt={profile.displayName} className="w-10 h-10 rounded-full object-cover border border-[#322C22]" />
              )}
              {dRoleLine && <div style={{ fontFamily: "-apple-system, sans-serif" }} className="text-[11.5px] tracking-wide uppercase text-[#96AD86]">{dRoleLine}</div>}
            </div>
            <h1 className="text-[38px] md:text-[42px] font-medium leading-[1.05] mb-4 tracking-tight">{profile.displayName}</h1>
            {dPositioning.length > 0 && (
              <div className="relative pl-2 mb-6">
                <span className="absolute -left-[30px] -top-[18px] text-[64px] leading-none text-[#8C5A3E] opacity-35" style={{ fontFamily: "Georgia, serif" }}>&ldquo;</span>
                <p className="text-[20px] italic leading-[1.5] text-[#D8CFC0] mb-0">{dPositioning[0]}</p>
                {dPositioning.slice(1).map((para, i) => <p key={i} className="text-[15px] not-italic text-[#A69C89] leading-relaxed mt-3">{para}</p>)}
              </div>
            )}
            <div style={{ fontFamily: "-apple-system, sans-serif" }} className="flex items-center gap-5 flex-wrap text-[12.5px]">
              <button onClick={() => document.getElementById("mag-qa")?.scrollIntoView({ behavior: "smooth" })} className="bg-[#96AD86] text-[#1B2117] px-6 py-2.5" data-testid="button-mag-ask">Start the interview</button>
              {portfolio.contact.linkedin && <a href={portfolio.contact.linkedin} target="_blank" rel="noreferrer" className="text-[#A69C89] border-b border-[#4A4335]">LinkedIn</a>}
              {profile.cvResumeUrl && <a href={profile.cvResumeUrl} download className="text-[#A69C89] border-b border-[#4A4335]">Download CV</a>}
            </div>
          </div>
          {hasVideo && (
            <video src={profile.videoUrl!} controls className="w-full border border-[#322C22] h-fit" data-testid="video-intro" />
          )}
        </div>

        {dStats.length > 0 && (
          <div className="px-11 pb-11 border-b border-[#322C22]">
            <div style={{ fontFamily: "-apple-system, sans-serif" }} className="text-[11px] tracking-[0.1em] uppercase text-[#7A7568] mb-5">By the numbers</div>
            <div className={`grid gap-x-8 gap-y-6 ${dStats.length >= 4 ? "sm:grid-cols-4" : dStats.length === 3 ? "sm:grid-cols-3" : dStats.length === 2 ? "sm:grid-cols-2" : ""} max-w-[920px]`}>
              {dStats.map((stat, i) => (
                <div key={i} className="border-t border-[#241F17] pt-4">
                  <div className="text-[26px] font-medium leading-tight whitespace-nowrap">{stat.value}</div>
                  <div style={{ fontFamily: "-apple-system, sans-serif" }} className="text-[11.5px] text-[#A69C89] mt-1.5 leading-snug">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-11 py-12 border-b border-[#322C22] max-w-[680px]" id="mag-qa">
          <h2 style={{ fontFamily: "-apple-system, sans-serif" }} className="text-[13px] tracking-[0.1em] uppercase text-[#96AD86] mb-1">In {possessive} words, answered live</h2>
          <div style={{ fontFamily: "-apple-system, sans-serif" }} className="text-[11.5px] text-[#7A7568] mb-6">{firstName ? `${firstName}'s` : "Their"} answers, through an AI trained on their own record.</div>
          <div ref={scrollRef} className="flex flex-col gap-6 mb-6 max-h-[480px] overflow-y-auto">
            {messages.length === 0 && !isStreaming && (
              <p className="text-[15px] text-[#7A7568] italic">Ask about a project, a decision, or a number above.</p>
            )}
            {messages.map((msg, i) =>
              msg.role === "user" ? (
                <div key={i}>
                  <div style={{ fontFamily: "-apple-system, sans-serif" }} className="text-[11.5px] font-bold tracking-wide uppercase text-[#96AD86] mb-1.5">{msg.content}</div>
                </div>
              ) : (
                <div key={i} className="text-[18px] leading-relaxed border-l border-[#4A4335] pl-5">{renderAnswer(msg.content)}</div>
              )
            )}
            {isStreaming && <div style={{ fontFamily: "-apple-system, sans-serif" }} className="flex items-center gap-2 text-[#7A7568] text-sm"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Answering…</div>}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2.5 border-t border-[#322C22] pt-6 mt-2.5">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about a project, a decision, a number above…"
              className="flex-1 bg-transparent border-b border-[#4A4335] px-0.5 py-1.5 italic text-[16px] outline-none placeholder:text-[#7A7568] placeholder:not-italic text-[#EDE7DC]"
              style={{ fontFamily: 'ui-serif, Georgia, serif' }}
              data-testid="input-mag-chat"
            />
            <button type="submit" disabled={isStreaming || !inputValue.trim()} style={{ fontFamily: "-apple-system, sans-serif" }} className="text-[11px] uppercase tracking-wide border border-[#EDE7DC] px-4 disabled:opacity-40 hover:bg-[#EDE7DC] hover:text-[#1B2117] transition-colors" data-testid="button-mag-send">Ask</button>
          </form>
          {dRemainingQs.length > 0 && (
            <div style={{ fontFamily: "-apple-system, sans-serif" }} className="flex flex-wrap gap-4 mt-4">
              {dRemainingQs.map((q, i) => (
                <button key={i} onClick={() => handleSendMessage(q)} className="text-[11.5px] text-[#7A7568] hover:text-[#96AD86] transition-colors underline decoration-[#4A4335]" data-testid={`button-mag-suggestion-${i}`}>{q}</button>
              ))}
            </div>
          )}
        </div>

        {flatHighlights.length > 0 && (
          <div className="px-11 py-12 border-b border-[#322C22] max-w-[680px]">
            <h2 style={{ fontFamily: "-apple-system, sans-serif" }} className="text-[13px] tracking-[0.1em] uppercase text-[#96AD86] mb-6">Career highlights</h2>
            {flatHighlights.map((item: any, i: number) => {
              const achievements: string[] = item.achievements || [];
              const isExpanded = expandedHighlights.has(i);
              const visible = isExpanded ? achievements : achievements.slice(0, 3);
              const remaining = achievements.length - 3;
              return (
                <div key={i} className="grid grid-cols-[84px_1fr] gap-4 mb-5 last:mb-0">
                  <div style={{ fontFamily: "-apple-system, sans-serif" }} className="text-[11px] text-[#7A7568] pt-0.5 leading-snug">{item.years}</div>
                  <div>
                    <div className="text-[19px] mb-1">{item.company}</div>
                    <div style={{ fontFamily: "-apple-system, sans-serif" }} className="text-[12.5px] text-[#96AD86] mb-2">{item.title}</div>
                    {visible.length > 0 && (
                      <ul className="flex flex-col gap-2">
                        {visible.map((a: string, ai: number) => (
                          <li key={ai} className="text-[15px] leading-relaxed text-[#D8CFC0] pl-4 relative before:content-['—'] before:absolute before:left-0 before:text-[#7A7568]">{a}</li>
                        ))}
                      </ul>
                    )}
                    {remaining > 0 && (
                      <button
                        onClick={() => setExpandedHighlights((prev) => {
                          const next = new Set(prev);
                          isExpanded ? next.delete(i) : next.add(i);
                          return next;
                        })}
                        style={{ fontFamily: "-apple-system, sans-serif" }}
                        className="text-[11.5px] text-[#96AD86] hover:text-[#EDE7DC] transition-colors mt-2.5 underline decoration-[#4A4335]"
                        data-testid={`button-mag-highlight-toggle-${i}`}
                      >
                        {isExpanded ? "Show less" : `+${remaining} more`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {profile.howIWork && profile.howIWork.steps?.length > 0 && (
          <div className="px-11 py-12 border-b border-[#322C22] max-w-[680px]">
            <h2 style={{ fontFamily: "-apple-system, sans-serif" }} className="text-[13px] tracking-[0.1em] uppercase text-[#96AD86] mb-1">How I work</h2>
            {profile.howIWork.name && <p className="text-[18px] italic text-[#D8CFC0] mb-6">{profile.howIWork.name}</p>}
            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-5">
              {profile.howIWork.steps.map((step, i) => (
                <div key={i}>
                  <div style={{ fontFamily: "-apple-system, sans-serif" }} className="text-[11.5px] font-bold tracking-wide uppercase text-[#96AD86] mb-1.5">{step.label}</div>
                  <p className="text-[15px] leading-relaxed text-[#D8CFC0]">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(dSkillTags.length > 0 || dSkillsMatrix.length > 0) && (
          <div className="px-11 py-12" style={{ fontFamily: "-apple-system, sans-serif" }}>
            <h2 className="text-[13px] tracking-[0.1em] uppercase text-[#96AD86] mb-6">Filed under</h2>
            <div className="flex flex-wrap gap-2.5">
              {(dSkillTags.length > 0 ? dSkillTags : dSkillsMatrix.map((s: any) => s.title)).map((tag: string, i: number, arr: string[]) => (
                <span key={i} className="text-[11.5px] text-[#A69C89]">{tag}{i < arr.length - 1 ? <span className="text-[#4A4335] ml-2.5">·</span> : null}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{ fontFamily: "-apple-system, sans-serif" }} className="flex justify-between items-center px-11 py-6 text-[12px] text-[#7A7568] flex-wrap gap-4">
          <div>{profile.displayName}{profile.roleTitle ? ` · ${profile.roleTitle}` : ""}</div>
          <div className="flex items-center gap-5">
            {portfolio.contact.email && (
              <button onClick={() => setShowEmailModal(true)} className="border border-[#96AD86] text-[#96AD86] px-3.5 py-1.5" data-testid="button-mag-footer-email">Get in touch</button>
            )}
            <a href="/register" className="text-[#96AD86]">Build your own profile →</a>
          </div>
        </div>

        {showEmailModal && portfolio.contact.email && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60">
            <div className="bg-[#17140F] border border-[#322C22] w-full max-w-md p-7">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[20px]">Get in touch</h3>
                <button onClick={() => setShowEmailModal(false)} style={{ fontFamily: "-apple-system, sans-serif" }} className="text-[#7A7568] hover:text-[#EDE7DC] text-xl leading-none" aria-label="Close">×</button>
              </div>
              <div className="border border-[#322C22] p-4 mb-4" style={{ fontFamily: "-apple-system, sans-serif" }}>
                <div className="text-[11px] text-[#7A7568] uppercase mb-1">Contact email</div>
                <div className="text-[15px] text-[#EDE7DC]">{portfolio.contact.email}</div>
              </div>
              <div className="grid grid-cols-2 gap-3" style={{ fontFamily: "-apple-system, sans-serif" }}>
                <button onClick={() => navigator.clipboard.writeText(portfolio.contact.email!)} className="border border-[#EDE7DC] py-2.5 text-sm hover:bg-[#EDE7DC] hover:text-[#1B2117] transition-colors">Copy email</button>
                <a href={`mailto:${portfolio.contact.email}`} className="bg-[#96AD86] text-[#1B2117] py-2.5 text-sm text-center">Open mail app</a>
              </div>
            </div>
          </div>
        )}

        {isDemo && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t-[3px] border-[#22C55E] px-4 py-4 flex items-center justify-between gap-4 flex-wrap shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
            <p className="text-white text-sm font-medium flex-1 min-w-0"><span className="text-[#22C55E] font-bold">Ask it something real.</span> Explore the profile, then build your own.</p>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => navigate("/register")} className="bg-[#22C55E] text-black px-5 py-2 font-bold text-sm border-[2px] border-[#22C55E] hover:bg-[#16A34A] mono uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(34,197,94,0.4)]">Create Mine Free →</button>
              <button onClick={() => setDemoBannerDismissed(true)} className="text-white/50 hover:text-white text-lg leading-none font-bold" aria-label="Dismiss">×</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // brandingTheme is exhaustively handled by the branches above (executive,
  // corporate, tech, creative are the only keys in the theme map).
  return null;
}
