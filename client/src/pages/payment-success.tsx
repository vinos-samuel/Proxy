import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, CheckCircle, ExternalLink, Copy, ArrowRight, AlertCircle, Share2, Linkedin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

export default function PaymentSuccessPage() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [domain, setDomain] = useState<string>("");
  const [tier, setTier] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [postCopied, setPostCopied] = useState(false);
  const { toast } = useToast();

  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");

  const profileUrl = domain ? `https://${domain}` : "";

  const linkedInPost = `Just set up my AI career profile on Proxy.

Instead of sending recruiters a PDF, I now send them a link — they can ask my AI questions about my experience, skills, and career history. It answers in my voice, 24/7.

The profile is also structured to be found by AI sourcing tools — not just search engines.

If you're in hiring or talent acquisition, you can explore it here: ${profileUrl}

Built for humans. Found by AI. 👇
${profileUrl}`;

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID found. If you completed payment, please go to your dashboard.");
      setLoading(false);
      return;
    }

    const confirmPayment = async () => {
      try {
        const res = await fetch(`/api/payment/status?session_id=${encodeURIComponent(sessionId)}`, {
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to confirm payment");
        }

        if (data.status === "paid") {
          setDomain(data.domain || "");
          setTier(data.tier || "");
          if (typeof window.fbq === "function") {
            const amount = data.tier === "concierge" ? 499.00 : 49.00;
            window.fbq("track", "Purchase", { value: amount, currency: "USD" });
          }
        } else {
          setError("Payment is still processing. Please check your dashboard in a moment.");
        }
      } catch (err: any) {
        console.error("Payment confirmation error:", err);
        setError(err.message || "Failed to confirm payment. Please check your dashboard.");
      } finally {
        setLoading(false);
      }
    };

    confirmPayment();
  }, [sessionId]);

  const copyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyPost = () => {
    navigator.clipboard.writeText(linkedInPost);
    setPostCopied(true);
    setTimeout(() => setPostCopied(false), 2500);
    toast({ title: "Post copied — paste it into LinkedIn!" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E8E8E3] flex items-center justify-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#22C55E] mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Confirming Payment...</h1>
          <p className="text-black/60 mono text-sm uppercase tracking-wider">Setting up your profile</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#E8E8E3] flex items-center justify-center p-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <div className="max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-black/40 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-black/60 mb-6">{error}</p>
          <button
            onClick={() => setLocation("/dashboard")}
            className="bg-black text-white px-8 py-3 font-bold border-[3px] border-black mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:bg-black/80 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8E8E3]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-[#22C55E] border-[3px] border-black flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CheckCircle className="h-8 w-8 text-black" />
          </div>
          <div className="mono text-xs text-black/50 uppercase tracking-widest mb-3">// profile_live</div>
          <h1 className="text-4xl font-bold mb-3">Your profile is live.</h1>
          <p className="text-black/60 text-lg">
            Recruiters and AI sourcing tools can now find and explore your career.
          </p>
        </div>

        {/* Profile URL */}
        {domain && (
          <div className="border-[3px] border-black bg-white p-6 mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="mono text-xs text-black/50 uppercase tracking-widest mb-3">// your_url</div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-lg font-bold font-mono text-[#22C55E] break-all flex-1">{profileUrl}</span>
              <button
                onClick={copyLink}
                className={`flex items-center gap-2 px-4 py-2 font-bold border-[2px] border-black mono text-sm uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${copied ? "bg-[#22C55E] text-black" : "bg-black text-white hover:bg-black/80"}`}
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {/* Share section — the main action */}
        <div className="border-[3px] border-black bg-black text-white p-6 mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-[#22C55E] border-[2px] border-[#22C55E] flex items-center justify-center">
              <Share2 className="h-4 w-4 text-black" />
            </div>
            <div>
              <div className="mono text-xs text-white/50 uppercase tracking-widest">// share_now</div>
              <h2 className="font-bold text-lg">Post it on LinkedIn</h2>
            </div>
          </div>

          <p className="text-white/70 text-sm mb-4">
            Every share puts your AI-ready profile in front of recruiters and their networks. We've written the post — just copy and paste.
          </p>

          {/* Pre-written post */}
          <div className="bg-white/10 border border-white/20 p-4 mb-4 text-sm text-white/90 leading-relaxed whitespace-pre-line font-mono text-xs">
            {linkedInPost}
          </div>

          <button
            onClick={copyPost}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 font-bold border-[3px] mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(34,197,94,0.4)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${postCopied ? "bg-[#16A34A] border-[#16A34A] text-white" : "bg-[#22C55E] border-[#22C55E] text-black hover:bg-[#16A34A]"}`}
          >
            <Linkedin className="h-4 w-4" />
            {postCopied ? "Post copied — open LinkedIn and paste!" : "Copy LinkedIn Post"}
          </button>
        </div>

        {/* Next steps */}
        <div className="border-[3px] border-black bg-white p-6 mb-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="mono text-xs text-black/50 uppercase tracking-widest mb-4">// next_steps</div>
          <div className="space-y-3">
            {[
              "Add your profile link to your email signature",
              "Test your AI chatbot — ask it about your career",
              "Send your link to anyone in your network who has offered to help",
              "Check your dashboard to see who's viewed your profile",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#22C55E] border-[2px] border-black flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-black/80">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setLocation("/dashboard")}
            className="flex-1 flex items-center justify-center gap-2 bg-black text-white px-6 py-4 font-bold border-[3px] border-black mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black/80 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <ArrowRight className="h-4 w-4" />
            Go to Dashboard
          </button>
          {domain && (
            <button
              onClick={() => window.open(profileUrl, "_blank")}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-black px-6 py-4 font-bold border-[3px] border-black mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              <ExternalLink className="h-4 w-4" />
              View My Profile
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
