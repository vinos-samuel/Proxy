import { useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { Loader2, Upload, ArrowRight } from "lucide-react";
import ProxyLogo from "@/components/ProxyLogo";
import { getCsrfToken } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CareerTimelineEntry {
  company: string;
  roles: Array<{ title: string; years: string; achievements?: string[] }>;
}

interface PortfolioPreview {
  positioning: string;
  heroSubtitle: string;
  stats: Array<{ value: string; label: string; icon?: string }>;
  careerTimeline: CareerTimelineEntry[];
  draftChatQuestions: string[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type Stage = "idle" | "uploading" | "ready" | "error";

// Pre-signup try-it flow: upload a CV, get a live AI draft + a taste of the
// chat, no account required. Claiming (creating an account) happens only when
// they choose to — see /api/auth/register, which picks up the session draft
// automatically.
export default function TryPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [preview, setPreview] = useState<PortfolioPreview | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [roleLine, setRoleLine] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  const sendToAnonChat = async (text: string) => {
    setIsSending(true);
    try {
      const csrfToken = getCsrfToken();
      const response = await fetch("/api/anon/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        body: JSON.stringify({ message: text }),
        credentials: "include",
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setMessages((prev) => [...prev, { role: "assistant", content: err.error || "Create a free account to keep going." }]);
        return;
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
      if (typeof data.remaining === "number") setRemaining(data.remaining);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong — please try again." }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "PDF only", description: "Please upload your CV as a PDF file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload a CV under 5MB.", variant: "destructive" });
      return;
    }

    setStage("uploading");
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const csrfToken = getCsrfToken();

      const response = await fetch("/api/anon/upload-cv", {
        method: "POST",
        headers: csrfToken ? { "x-csrf-token": csrfToken } : {},
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to process your CV. Please try again.");
      }

      const data = await response.json();
      const p: PortfolioPreview | null = data.portfolioPreview || null;
      setPreview(p);
      setDisplayName(data.extractedData?.name || "");
      setRoleLine([data.extractedData?.currentTitle, p?.careerTimeline?.[0]?.company].filter(Boolean).join(" — "));
      setSkills(Array.isArray(data.extractedData?.skills) ? data.extractedData.skills : []);
      setRemaining(8);
      setStage("ready");

      // Fire the first AI-generated question automatically — the first thing a
      // visitor sees should be their own profile answering something specific
      // about their own career, not an empty chat box asking them to type.
      const firstQuestion = p?.draftChatQuestions?.[0];
      if (firstQuestion) {
        setMessages([{ role: "user", content: firstQuestion }]);
        await sendToAnonChat(firstQuestion);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong. Please try again.");
      setStage("error");
    }
  };

  const handleSendMessage = async (question?: string) => {
    const text = (question ?? inputValue).trim();
    if (!text || isSending) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInputValue("");
    await sendToAnonChat(text);
  };

  const positioningParagraphs = (preview?.positioning || "").split("\n\n").filter(Boolean);
  const secondQuestion = preview?.draftChatQuestions?.[1];

  return (
    <div className="min-h-screen bg-white text-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav className="border-b-[3px] border-black bg-[#D1D1CC]">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/">
            <div className="cursor-pointer">
              <ProxyLogo />
            </div>
          </Link>
          <button
            onClick={() => navigate("/login")}
            className="mono text-sm text-black/60 hover:text-black uppercase tracking-wider"
          >
            Log in
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {stage === "idle" && (
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">See it work before you sign up.</h1>
            <p className="text-xl text-black/70 mb-8 max-w-2xl mx-auto">
              Upload your CV. We'll build a live draft from it and ask it a real question about your own career — no account, no credit card.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              data-testid="input-try-cv"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#22C55E] text-black px-8 py-4 font-bold hover:bg-[#16A34A] border-[3px] border-black mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all inline-flex items-center gap-2"
              data-testid="button-upload-cv"
            >
              <Upload className="h-5 w-5" /> Upload your CV (PDF)
            </button>
            <p className="mono text-xs text-black/50 mt-4 uppercase tracking-wider">
              Nothing is saved unless you create an account afterward.
            </p>
          </div>
        )}

        {stage === "uploading" && (
          <div className="text-center py-24">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-6 text-[#22C55E]" />
            <p className="text-xl font-semibold mb-2">Reading your CV and building your draft...</p>
            <p className="text-black/60">This usually takes about 30 seconds.</p>
          </div>
        )}

        {stage === "error" && (
          <div className="text-center py-16">
            <p className="text-xl font-semibold mb-2">{errorMessage}</p>
            <button
              onClick={() => setStage("idle")}
              className="mt-4 bg-white text-black px-6 py-3 font-bold border-[3px] border-black hover:bg-gray-100 mono uppercase tracking-wider"
            >
              Try again
            </button>
          </div>
        )}

        {stage === "ready" && preview && (
          <div>
            {/* Real Executive-theme card — same paper background, serif
                headline, hairline borders and mono labels as the actual
                profile page, so the draft you see here IS what you'd
                publish, not a separate bespoke preview design. */}
            <div className="border border-[#DBD9CD] bg-[#F2F1EC] text-[#1B211E] mb-8" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif" }}>
              <style>{`
                .try-dossier-serif { font-family: "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif; }
                .try-dossier-mono { font-family: "SF Mono", "IBM Plex Mono", Menlo, Consolas, monospace; }
              `}</style>

              <div className="flex items-center justify-between px-6 py-3 border-b border-[#DBD9CD]">
                <div className="try-dossier-mono text-[11px] tracking-wide text-[#5B6158]">
                  PROXY / EXECUTIVE PROFILE
                </div>
                <div className="try-dossier-mono text-[11px] uppercase tracking-wider text-[#5B6158] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F5D4C] inline-block" />
                  Draft preview — not live yet
                </div>
              </div>

              <div className="px-6 pt-6 pb-5 border-b border-[#DBD9CD]">
                {displayName && <h2 className="try-dossier-serif text-[28px] leading-tight mb-1">{displayName}</h2>}
                {roleLine && <div className="try-dossier-mono text-[12px] text-[#5B6158] uppercase tracking-wide mb-4">{roleLine}</div>}
                <div className="pl-4 border-l-2 border-[#2F5D4C] space-y-2.5">
                  {(positioningParagraphs.length > 0 ? positioningParagraphs : [preview.positioning]).map((para, i) => (
                    <p key={i} className={`try-dossier-serif ${i === 0 ? "italic text-[18px] leading-snug" : "text-[14px] not-italic text-[#5B6158] leading-relaxed"}`}>
                      {para}
                    </p>
                  ))}
                </div>
              </div>

              {preview.stats?.length > 0 && (
                <div className="grid grid-cols-3 border-b border-[#DBD9CD]">
                  {preview.stats.slice(0, 3).map((stat, i) => (
                    <div key={i} className={`px-6 py-5 ${i > 0 ? "border-l border-[#DBD9CD]" : ""}`}>
                      <div className="try-dossier-serif text-[22px] leading-tight mb-1">{stat.value}</div>
                      <div className="try-dossier-mono text-[10px] uppercase tracking-wide text-[#8B8F84] leading-snug">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {preview.careerTimeline?.length > 0 && (
                <div className="px-6 py-5 border-b border-[#DBD9CD]">
                  <div className="try-dossier-mono text-[10.5px] uppercase tracking-wide text-[#8B8F84] mb-4">Career record</div>
                  <div className="space-y-5">
                    {preview.careerTimeline.slice(0, 3).map((entry, i) => {
                      const topRole = entry.roles?.[0];
                      const bullets = (topRole?.achievements || []).slice(0, 3);
                      return (
                        <div key={i}>
                          <div className="text-[14px] mb-1.5">
                            <span className="try-dossier-serif text-[#1B211E]">{entry.company}</span>
                            {topRole?.title && <span className="text-[#5B6158]"> — {topRole.title}</span>}
                            {topRole?.years && <span className="try-dossier-mono text-[11px] text-[#8B8F84]"> ({topRole.years})</span>}
                          </div>
                          {bullets.length > 0 && (
                            <ul className="space-y-1 pl-4 list-disc marker:text-[#C3C0B0]">
                              {bullets.map((b, j) => (
                                <li key={j} className="text-[13px] text-[#5B6158] leading-relaxed">{b}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {skills.length > 0 && (
                <div className="px-6 py-5 border-b border-[#DBD9CD]">
                  <div className="try-dossier-mono text-[10.5px] uppercase tracking-wide text-[#8B8F84] mb-3">Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {skills.slice(0, 14).map((skill, i) => (
                      <span key={i} className="try-dossier-mono text-[11px] text-[#5B6158] border border-[#C3C0B0] px-2.5 py-1">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ask directly — same Q/serif-answer layout as the real
                  theme's chat, not chat bubbles. */}
              <div className="px-6 py-6">
                <h3 className="try-dossier-serif text-[19px] mb-1">Ask directly</h3>
                <p className="try-dossier-mono text-[10.5px] text-[#8B8F84] mb-5">
                  {remaining !== null && remaining > 0
                    ? `${remaining} question${remaining === 1 ? "" : "s"} left in this try-it session`
                    : "You've used your try-it questions — create a free account to keep going"}
                </p>

                <div className="flex flex-col gap-4 mb-5 max-h-[420px] overflow-y-auto">
                  {messages.map((msg, i) => (
                    msg.role === "user" ? (
                      <div key={i}>
                        <span className="try-dossier-mono text-[10.5px] text-[#2F5D4C] tracking-wide">Q — </span>
                        <span className="text-[14px] text-[#5B6158] italic">{msg.content}</span>
                      </div>
                    ) : (
                      <div key={i} className="try-dossier-serif text-[16px] leading-relaxed pl-4 border-l border-[#C3C0B0] max-w-[66ch]">
                        {msg.content}
                      </div>
                    )
                  ))}
                  {isSending && (
                    <div className="flex items-center gap-2 text-[#8B8F84] text-sm">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Answering…
                    </div>
                  )}
                  {secondQuestion && !isSending && messages.length > 0 && remaining !== 0 && (
                    <button
                      onClick={() => handleSendMessage(secondQuestion)}
                      className="try-dossier-mono text-[11px] text-[#5B6158] border border-[#C3C0B0] px-3 py-1.5 text-left self-start hover:border-[#2F5D4C] hover:text-[#2F5D4C] transition-colors"
                      data-testid="button-try-second-question"
                    >
                      {secondQuestion}
                    </button>
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2.5 border-t border-[#DBD9CD] pt-4"
                >
                  <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={remaining === 0 ? "Create an account to keep chatting" : "Ask your own question…"}
                    disabled={remaining === 0}
                    className="flex-1 bg-transparent border-b border-[#C3C0B0] px-0.5 py-2 text-[14px] text-[#1B211E] outline-none focus:border-[#2F5D4C] placeholder:text-[#8B8F84] disabled:opacity-50"
                    data-testid="input-try-chat"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !inputValue.trim() || remaining === 0}
                    className="try-dossier-mono text-[11px] uppercase tracking-wide border border-[#1B211E] px-4 disabled:opacity-40 hover:bg-[#1B211E] hover:text-[#F2F1EC] transition-colors"
                    data-testid="button-try-send"
                  >
                    {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Ask"}
                  </button>
                </form>
              </div>
            </div>

            <div className="max-w-xl mx-auto mt-10 bg-[#F0FDF4] border-[2px] border-[#22C55E] px-5 py-4 text-center">
              <p className="text-sm text-black/80">
                This preview comes from your CV alone. Complete the questionnaire next and your profile gets sharper — your own stories, your own words, and answers ready for tougher questions.
              </p>
            </div>

            <div className="text-center mt-6">
              <button
                onClick={() => navigate("/register")}
                className="bg-[#22C55E] text-black px-10 py-4 font-bold hover:bg-[#16A34A] border-[3px] border-black mono uppercase tracking-wider shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all inline-flex items-center gap-2"
                data-testid="button-claim-draft"
              >
                Claim this profile — create free account <ArrowRight className="h-5 w-5" />
              </button>
              <p className="mono text-xs text-black/50 mt-3 uppercase tracking-wider">
                This exact draft becomes your profile — nothing to redo.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
