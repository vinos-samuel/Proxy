import { useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { Loader2, Upload, Send, ArrowRight } from "lucide-react";
import ProxyLogo from "@/components/ProxyLogo";
import { getCsrfToken } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PortfolioPreview {
  positioning: string;
  heroSubtitle: string;
  stats: Array<{ value: string; label: string; icon?: string }>;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type Stage = "idle" | "uploading" | "ready" | "error";

// Pre-signup try-it flow: upload a CV, get a live AI draft + a taste of the chat,
// no account required. Claiming (creating an account) happens only when they
// choose to — see /api/auth/register, which picks up the session draft automatically.
export default function TryPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [preview, setPreview] = useState<PortfolioPreview | null>(null);
  const [displayName, setDisplayName] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

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
      setPreview(data.portfolioPreview || null);
      setDisplayName(data.extractedData?.name || "");
      setRemaining(8);
      setStage("ready");
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
        setMessages((prev) => [...prev, { role: "assistant", content: err.error || "Create a free account to keep the conversation going." }]);
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
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">See your AI Twin before you sign up.</h1>
            <p className="text-xl text-black/70 mb-8 max-w-2xl mx-auto">
              Upload your CV. We'll build a live draft and let you ask it a real question — no account, no credit card.
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
            <div className="border-[3px] border-black bg-[#FAFAF7] p-8 mb-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="mono text-xs text-black/50 mb-2 uppercase tracking-widest">// your_draft</div>
              {displayName && <h2 className="text-2xl font-bold mb-2">{displayName}</h2>}
              <p className="text-lg text-black/80 mb-4 leading-relaxed">{preview.positioning}</p>
              {preview.stats?.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-4">
                  {preview.stats.slice(0, 3).map((stat, i) => (
                    <div key={i} className="border-[2px] border-black px-4 py-2 bg-white">
                      <div className="text-2xl font-bold text-[#15803D]">{stat.value}</div>
                      <div className="mono text-xs text-black/50 uppercase">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-[3px] border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col" style={{ minHeight: "400px" }}>
              <div className="border-b-[3px] border-black p-4">
                <h3 className="font-bold">Ask your Twin something</h3>
                <p className="text-sm text-black/60">
                  {remaining !== null && remaining > 0
                    ? `${remaining} question${remaining === 1 ? "" : "s"} left in this try-it session`
                    : "You've used your try-it questions — create a free account to keep going"}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-black/50 text-sm">Ask about a project, a decision, or how they'd approach something.</p>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    <div
                      className={
                        msg.role === "user"
                          ? "inline-block bg-[#15803D] text-white px-4 py-2 rounded-lg max-w-[80%] text-sm"
                          : "inline-block bg-[#F5F5F0] border border-black/10 px-4 py-2 rounded-lg max-w-[80%] text-sm"
                      }
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isSending && <Loader2 className="h-4 w-4 animate-spin text-black/40" />}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="border-t-[3px] border-black p-4 flex gap-2"
              >
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={remaining === 0 ? "Create an account to keep chatting" : "Ask a question..."}
                  disabled={remaining === 0}
                  className="flex-1 border-[2px] border-black px-4 py-2 text-sm focus:outline-none disabled:opacity-50"
                  data-testid="input-try-chat"
                />
                <button
                  type="submit"
                  disabled={isSending || !inputValue.trim() || remaining === 0}
                  className="bg-[#22C55E] disabled:opacity-50 text-black px-4 py-2 font-bold border-[2px] border-black"
                  data-testid="button-try-send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>

            <div className="text-center mt-10">
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
