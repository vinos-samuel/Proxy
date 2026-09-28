import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, CheckCircle, ExternalLink, Copy, ArrowRight, AlertCircle, Share2, Linkedin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildLinkedInPost } from "@/lib/shareCopy";
import InsiderKit from "@/components/InsiderKit";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
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

  const linkedInPost = buildLinkedInPost(profileUrl);

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
          const amount = data.tier === "concierge" ? 499.00 : 49.00;
          if (typeof window.fbq === "function") {
            window.fbq("track", "Purchase", { value: amount, currency: "USD" });
          }
          if (typeof window.gtag === "function") {
            window.gtag("event", "purchase", {
              transaction_id: sessionId,
              value: amount,
              currency: "USD",
              items: [{ item_name: data.tier === "concierge" ? "Proxy Concierge" : "Proxy Pro" }],
            });
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
      <div className="site auth">
        <div className="auth-message">
          <Loader2 className="auth-icon animate-spin" />
          <h1 className="site-display auth-h1">Confirming your payment…</h1>
          <p className="site-muted">Publishing your approved page.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="site auth">
        <div className="auth-message">
          <AlertCircle className="auth-icon" />
          <h1 className="site-display auth-h1">Something went wrong</h1>
          <p className="site-muted">{error}</p>
          <button type="button" className="site-btn" onClick={() => setLocation("/dashboard")}>Go to your dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="site">
      <main className="content">
        <header className="content-head">
          <span className="pg-done-mark"><CheckCircle /></span>
          <h1 className="site-display content-h1">Your page is live.</h1>
          <p className="content-lede">Share the link when you want someone to understand your work beyond a CV.</p>
        </header>

        {domain && (
          <section className="site-card paysuccess-url">
            <span>{profileUrl}</span>
            <button type="button" className="site-btn site-btn--sm" onClick={copyLink}><Copy /> {copied ? "Copied" : "Copy link"}</button>
          </section>
        )}

        <section className="paysuccess-post">
          <h2 className="site-display content-h2">Post it on LinkedIn</h2>
          <p className="site-muted">A starting post you can edit before sharing.</p>
          <pre>{linkedInPost}</pre>
          <button type="button" className="site-btn" onClick={copyPost}><Linkedin /> {postCopied ? "Copied. Open LinkedIn and paste it." : "Copy LinkedIn post"}</button>
        </section>

        {domain && <InsiderKit profileUrl={profileUrl} />}

        <section className="paysuccess-next">
          <h2 className="site-display content-h2">Next steps</h2>
          <ol>
            <li>Add your page link to your email signature.</li>
            <li>Ask your page a visitor question to see how it answers.</li>
            <li>Send the link to anyone in your network who offered to help.</li>
            <li>Check your dashboard for page views and visitor questions.</li>
          </ol>
          <div className="dash-actions">
            <button type="button" className="site-btn" onClick={() => setLocation("/dashboard")}><ArrowRight /> Go to your dashboard</button>
            {domain && <a className="site-btn site-btn--quiet" href={profileUrl} target="_blank" rel="noreferrer"><ExternalLink /> Open live page</a>}
          </div>
        </section>
      </main>
    </div>
  );
}
