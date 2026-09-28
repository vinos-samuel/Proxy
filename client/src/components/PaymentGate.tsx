import { useState } from "react";
import { Check, Loader2, Star, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import InsiderKit from "@/components/InsiderKit";

interface PaymentGateProps {
  profileId: string;
  username?: string;
  // Set when this is shown because the free window is already spent (the new
  // builder only opens this once /api/builder/publish says free isn't
  // available) — offering "free" again here is misleading, so hide it.
  hideFree?: boolean;
}

const tiers = [
  {
    key: "free",
    name: "FREE",
    tierLabel: "STARTER",
    price: "$0",
    icon: Zap,
    features: [
      "Professional page with optional AI explorer",
      "Personal page (myproxy.work/you)",
      "Edit for 7 days after first publication",
      "Basic view count",
    ],
    useCase: "Build and share your first evidence page",
  },
  {
    key: "pro",
    name: "PRO",
    tierLabel: "MOST_POPULAR",
    price: "$49",
    icon: Star,
    popular: true,
    features: [
      "Everything in Free",
      "Unlimited edits",
      "Page views and recent visitor questions",
    ],
    useCase: "Active job search | Career pivot",
  },
];

export default function PaymentGate({ profileId, username, hideFree }: PaymentGateProps) {
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>(hideFree ? "pro" : "free");
  const visibleTiers = hideFree ? tiers.filter((tier) => tier.key !== "free") : tiers;
  const [published, setPublished] = useState(false);
  const [publishData, setPublishData] = useState<{ publicDomain?: string; username?: string; displayName?: string; roleTitle?: string } | null>(null);
  const [showFreeConfirm, setShowFreeConfirm] = useState(false);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const handlePublish = async (tierKey: string) => {
    setSelectedTier(tierKey);
    if (tierKey === "free" && !showFreeConfirm) {
      setShowFreeConfirm(true);
      return;
    }

    setLoading(true);
    try {
      if (tierKey === "free") {
        const response = await apiRequest("POST", "/api/publish-free");
        const data = await response.json();
        if (data.success) {
          setPublished(true);
          setPublishData({ username: data.username, displayName: data.displayName, roleTitle: data.roleTitle });
          queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        }
      } else {
        const response = await apiRequest("POST", "/api/create-checkout-session", {
          tier: tierKey,
          profileId,
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error("No checkout URL returned");
        }
      }
    } catch (error: any) {
      console.error("Publish error:", error);
      // apiRequest throws "<status>: <raw response body>" — the body is
      // usually {"message": "..."} from the server, so pull that out
      // instead of showing an opaque alert every time this fails.
      let detail = error?.message || "Something went wrong. Please try again.";
      const bodyStart = detail.indexOf("{");
      if (bodyStart >= 0) {
        try { detail = JSON.parse(detail.slice(bodyStart)).message || detail; } catch { /* keep raw text */ }
      }
      alert(detail);
    } finally {
      setLoading(false);
    }
  };

  if (published && publishData) {
    // window.location.origin so this reads correctly when tested on a
    // Replit workspace preview, not just on the production domain.
    const profileUrl = `${window.location.origin}/portfolio/${publishData.username}`;
    return (
      <div className="pg">
        <div className="pg-done">
          <span className="pg-done-mark"><Check /></span>
          <h2 className="site-display" data-testid="text-publish-success">Your page is live.</h2>
          <p className="site-muted">myproxy.work/portfolio/<b>{publishData.username}</b></p>
          <InsiderKit profileUrl={profileUrl} displayName={publishData.displayName} roleTitle={publishData.roleTitle} />
          {publishData.username && (
            <button type="button" className="site-btn" onClick={() => navigate(`/portfolio/${publishData.username}`)} data-testid="button-view-portfolio">Open your live page</button>
          )}
        </div>
      </div>
    );
  }

  // Free tier confirmation screen
  if (showFreeConfirm) {
    return (
      <div className="pg">
        <div className="pg-confirm">
          <h2 className="site-display">Publish your page for free?</h2>
          <p className="site-muted">It goes public at <b>myproxy.work/portfolio/{username}</b>.</p>
          <ul>
            <li>You can edit for <b>7 days</b> after publishing.</li>
            <li>After that, Pro ($49, once) gives you unlimited edits.</li>
            <li>Check the wording is accurate before it goes live.</li>
          </ul>
          <div className="pg-actions">
            <button type="button" className="site-btn" onClick={() => handlePublish("free")} disabled={loading}>
              {loading ? <><Loader2 className="animate-spin" /> Publishing…</> : "Publish now · free"}
            </button>
            <button type="button" className="site-btn site-btn--quiet" onClick={() => setShowFreeConfirm(false)}>Go back</button>
          </div>
          <button type="button" className="site-link pg-switch" onClick={() => { setShowFreeConfirm(false); setSelectedTier("pro"); }}>
            I'd rather have Pro with unlimited edits ($49)
          </button>
        </div>
      </div>
    );
  }

  const proTier = visibleTiers.find((tier) => tier.key === "pro");
  const freeTier = visibleTiers.find((tier) => tier.key === "free");
  const isBusy = (key: string) => loading && selectedTier === key;

  return (
    <div className="pg">
      <div className="pg-head">
        {/* hideFree means the free publish is already used (live page, or the
            builder was told free isn't available) — "Publish your page" would
            tell someone whose page is already live to publish it. */}
        <h2 className="site-display" data-testid="text-payment-title">{hideFree ? "Upgrade to Pro" : "Publish your page"}</h2>
        <p className="site-muted">
          {hideFree
            ? "Keep editing whenever you like, and see the questions visitors ask your page."
            : <>Your page goes live at <b>myproxy.work/portfolio/{username || "yourname"}</b>.</>}
        </p>
      </div>

      <div className={`pg-tiers ${freeTier ? "" : "pg-tiers--single"}`}>
        {proTier && (
          <div className="site-card pg-tier pg-tier--pro" data-testid={`card-tier-${proTier.key}`}>
            <div className="pg-tier-top">
              <h3>Pro</h3>
              <b data-testid={`text-price-${proTier.key}`}>{proTier.price}</b>
              <span>one-time payment, no subscription</span>
            </div>
            <ul>{proTier.features.map((feature) => <li key={feature}><Check /> {feature}</li>)}</ul>
            <button type="button" className="site-btn" onClick={() => handlePublish(proTier.key)} disabled={loading} data-testid={`button-checkout-${proTier.key}`}>
              {isBusy(proTier.key) ? <><Loader2 className="animate-spin" /> Opening checkout…</> : `Get Pro · ${proTier.price}`}
            </button>
          </div>
        )}
        {freeTier && (
          <div className="site-card pg-tier" data-testid={`card-tier-${freeTier.key}`}>
            <div className="pg-tier-top">
              <h3>Free</h3>
              <b>$0</b>
              <span>no card needed</span>
            </div>
            <ul>{freeTier.features.map((feature) => <li key={feature}><Check /> {feature}</li>)}</ul>
            <button type="button" className="site-btn site-btn--quiet" onClick={() => handlePublish(freeTier.key)} disabled={loading} data-testid={`button-checkout-${freeTier.key}`}>
              {isBusy(freeTier.key) ? <><Loader2 className="animate-spin" /> Publishing…</> : "Publish free"}
            </button>
          </div>
        )}
      </div>
      <p className="pg-faq site-faint">Questions before you decide? <Link className="site-link" href="/faq">Read the FAQ</Link></p>
    </div>
  );
}
