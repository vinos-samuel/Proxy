import { useState } from "react";
import { Check, Loader2, Rocket, Star, Crown, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { buildLinkedInPost } from "@/lib/shareCopy";

interface PaymentGateProps {
  profileId: string;
  username?: string;
}

const tiers = [
  {
    key: "free",
    name: "FREE",
    tierLabel: "STARTER",
    price: "$0",
    icon: Zap,
    features: [
      "AI_PORTFOLIO + CHATBOT",
      "PERSONAL_PAGE (myproxy.work/you)",
      "7_DAYS_OF_EDITS_AFTER_PUBLISH",
      "BASIC_VIEW_COUNT",
    ],
    useCase: "USE_CASE: Try it out | See your Twin in action",
  },
  {
    key: "pro",
    name: "PRO",
    tierLabel: "MOST_POPULAR",
    price: "$49",
    originalPrice: "$99",
    icon: Star,
    popular: true,
    features: [
      "EVERYTHING_IN_FREE",
      "UNLIMITED_EDITS",
      "FULL_ANALYTICS_DASHBOARD",
      "VISITOR_QUESTIONS_FEED",
      "PRIORITY_PROCESSING",
    ],
    useCase: "USE_CASE: Active job search | Career pivot",
  },
  {
    key: "concierge",
    name: "CONCIERGE",
    tierLabel: "PREMIUM",
    price: "$499",
    originalPrice: "$999",
    icon: Crown,
    features: [
      "EVERYTHING_IN_PRO",
      "PERSONAL_DISCOVERY_CALL",
      "PRO_COPYWRITING",
      "CUSTOM_BRANDING",
      "HANDS_ON_OPTIMIZATION",
      "PRIORITY_SUPPORT",
    ],
    useCase: "USE_CASE: Executive positioning | Brand building",
  },
];

export default function PaymentGate({ profileId, username }: PaymentGateProps) {
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>("free");
  const [published, setPublished] = useState(false);
  const [publishData, setPublishData] = useState<{ publicDomain?: string; username?: string; displayName?: string; roleTitle?: string } | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [showFreeConfirm, setShowFreeConfirm] = useState(false);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const handlePublish = async () => {
    if (selectedTier === "free" && !showFreeConfirm) {
      setShowFreeConfirm(true);
      return;
    }

    setLoading(true);
    try {
      if (selectedTier === "free") {
        const response = await apiRequest("POST", "/api/publish-free");
        const data = await response.json();
        if (data.success) {
          setPublished(true);
          setPublishData({ username: data.username, displayName: data.displayName, roleTitle: data.roleTitle });
          queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        }
      } else {
        const response = await apiRequest("POST", "/api/create-checkout-session", {
          tier: selectedTier,
          profileId,
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error("No checkout URL returned");
        }
      }
    } catch (error) {
      console.error("Publish error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (published && publishData) {
    const profileUrl = `https://myproxy.work/portfolio/${publishData.username}`;
    const linkedInPost = buildLinkedInPost(profileUrl);
    const emailSignature = `${publishData.displayName || publishData.username}${publishData.roleTitle ? ` | ${publishData.roleTitle}` : ""}\nAsk my AI about my work: ${profileUrl}`;
    const copyItem = (key: string, text: string) => {
      navigator.clipboard.writeText(text);
      setCopiedItem(key);
      setTimeout(() => setCopiedItem(null), 2000);
    };
    return (
      <div className="md:col-span-2 bg-white border-[3px] border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-[#22C55E] border-[3px] border-black flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Check className="h-8 w-8 text-black" />
          </div>
          <h2 className="text-3xl font-bold text-black" data-testid="text-publish-success">
            YOUR TWIN IS LIVE
          </h2>
          <p className="mono text-sm text-black/60 uppercase tracking-wider">
            Your Digital Twin is now live at <strong>myproxy.work/portfolio/{publishData.username}</strong>
          </p>

          {/* Share kit — a profile only works if people see it */}
          <div className="text-left max-w-lg mx-auto space-y-4">
            <p className="mono text-xs text-black/50 uppercase tracking-widest text-center">// now put it to work</p>

            <div className="bg-[#E8E8E3] border-[3px] border-black p-4">
              <p className="mono text-xs font-bold uppercase tracking-wider mb-2">1. Post it on LinkedIn</p>
              <p className="mono text-xs text-black/60 mb-3 whitespace-pre-line max-h-28 overflow-hidden">{linkedInPost}</p>
              <button
                onClick={() => copyItem("post", linkedInPost)}
                className="bg-black text-white px-4 py-2 font-bold border-[3px] border-black mono text-xs uppercase tracking-wider"
                data-testid="button-copy-linkedin-post"
              >
                {copiedItem === "post" ? "Copied!" : "Copy Post"}
              </button>
            </div>

            <div className="bg-[#E8E8E3] border-[3px] border-black p-4">
              <p className="mono text-xs font-bold uppercase tracking-wider mb-2">2. Add it to your email signature</p>
              <p className="mono text-xs text-black/60 mb-3 whitespace-pre-line">{emailSignature}</p>
              <button
                onClick={() => copyItem("signature", emailSignature)}
                className="bg-black text-white px-4 py-2 font-bold border-[3px] border-black mono text-xs uppercase tracking-wider"
                data-testid="button-copy-signature"
              >
                {copiedItem === "signature" ? "Copied!" : "Copy Signature"}
              </button>
            </div>

            <div className="bg-[#E8E8E3] border-[3px] border-black p-4">
              <p className="mono text-xs font-bold uppercase tracking-wider mb-2">3. Send it to your network</p>
              <p className="mono text-xs text-black/60 mb-3">Anyone who offered to help your search — send them the link. Your Twin does the explaining.</p>
              <button
                onClick={() => copyItem("url", profileUrl)}
                className="bg-black text-white px-4 py-2 font-bold border-[3px] border-black mono text-xs uppercase tracking-wider"
                data-testid="button-copy-url"
              >
                {copiedItem === "url" ? "Copied!" : "Copy Profile URL"}
              </button>
            </div>
          </div>

          {publishData.username && (
            <button
              onClick={() => navigate(`/portfolio/${publishData.username}`)}
              className="bg-[#22C55E] text-black px-8 py-4 font-bold border-[3px] border-black mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              data-testid="button-view-portfolio"
            >
              VIEW YOUR TWIN &rarr;
            </button>
          )}
        </div>
      </div>
    );
  }

  // Free tier confirmation screen
  if (showFreeConfirm) {
    return (
      <div className="md:col-span-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <div className="bg-white border-[3px] border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-[#E8A75D] border-[3px] border-black flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <Zap className="h-8 w-8 text-black" />
            </div>
            <h2 className="text-2xl font-bold text-black">REVIEW BEFORE PUBLISHING</h2>
            <div className="text-left max-w-lg mx-auto space-y-4">
              <p className="mono text-sm text-black/70 leading-relaxed">
                Your profile will go live at <strong>myproxy.work/portfolio/{username}</strong>
              </p>
              <div className="bg-[#FEF3C7] border-[3px] border-black p-4">
                <p className="mono text-sm text-black/80 font-bold mb-2">FREE PLAN — WHAT TO KNOW:</p>
                <ul className="mono text-sm text-black/70 space-y-1">
                  <li>&#8226; You'll have <strong>7 days</strong> to make edits after publishing</li>
                  <li>&#8226; After that, upgrade to Pro ($49) for unlimited edits</li>
                  <li>&#8226; Make sure your questionnaire answers are detailed and accurate</li>
                </ul>
              </div>
              <p className="mono text-xs text-black/50">
                Tip: Go back and review your questionnaire if you want to refine anything before going live.
              </p>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => setShowFreeConfirm(false)}
                className="bg-white text-black px-6 py-3 font-bold border-[3px] border-black mono text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100"
              >
                &larr; GO BACK
              </button>
              <button
                onClick={handlePublish}
                disabled={loading}
                className="bg-[#22C55E] text-black px-8 py-3 font-bold border-[3px] border-black mono text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> PUBLISHING...
                  </span>
                ) : (
                  "PUBLISH NOW — FREE"
                )}
              </button>
            </div>
            <button
              onClick={() => { setShowFreeConfirm(false); setSelectedTier("pro"); }}
              className="mono text-xs text-black/50 hover:text-black/80 underline"
            >
              Actually, I want Pro with unlimited edits — $49
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="md:col-span-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="text-center mb-8">
        <div className="mono text-xs text-black/50 mb-2 uppercase tracking-widest">&#9698; Your Twin is Ready</div>
        <h2 className="text-3xl font-bold mb-2 text-black" data-testid="text-payment-title">
          PUBLISH YOUR DIGITAL TWIN
        </h2>
        <p className="mono text-sm text-black/60 uppercase tracking-wider">
          Your personal page at <strong>myproxy.work/portfolio/{username || "yourname"}</strong>
        </p>
        <div className="inline-block mt-3 bg-black text-[#22C55E] px-4 py-2 mono text-xs uppercase tracking-wider border-[3px] border-black font-bold" data-testid="badge-launch-special">
          &#9733; FOUNDING MEMBER PRICING
        </div>
        <Link href="/faq">
          <div className="text-center mt-4 text-black/50 text-sm hover:text-black/80 transition cursor-pointer">
            Questions before you decide? Read our FAQ &rarr;
          </div>
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          const isSelected = selectedTier === tier.key;
          const isPopular = tier.popular;
          return (
            <div
              key={tier.key}
              className={`brutal-card border-black cursor-pointer relative p-8 ${
                isPopular && isSelected
                  ? "bg-[#22C55E] transform lg:scale-105 lg:-mt-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                  : isSelected
                  ? "bg-[#22C55E] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  : isPopular
                  ? "bg-white transform lg:scale-105 lg:-mt-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              }`}
              onClick={() => setSelectedTier(tier.key)}
              data-testid={`card-tier-${tier.key}`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 font-bold mono text-xs border-[3px] border-black uppercase tracking-wider" data-testid="badge-popular">
                  RECOMMENDED
                </div>
              )}
              <div className="mono text-xs text-black/50 mb-2 uppercase">{tier.tierLabel}</div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white border-[3px] border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Icon className="h-5 w-5 text-black" />
                </div>
                <h3 className="text-2xl font-bold text-black">{tier.name}</h3>
              </div>
              <div className="mb-6">
                {tier.originalPrice && (
                  <div className="mono text-base text-black/40 line-through mb-1">{tier.originalPrice}</div>
                )}
                <div className="text-5xl font-bold mono text-black" data-testid={`text-price-${tier.key}`}>{tier.price}</div>
                {tier.key !== "free" && (
                  <div className="mono text-xs text-black/50 mt-1 uppercase tracking-wider">One-time payment</div>
                )}
                {tier.key === "free" && (
                  <div className="mono text-xs text-black/50 mt-1 uppercase tracking-wider">No credit card needed</div>
                )}
              </div>
              <div className="space-y-3 mb-6 text-sm">
                {tier.features.map((feature, i) => (
                  <div key={i} className={`flex gap-2 mono ${isSelected ? "text-black" : "text-black/70"}`}>
                    <span className={`font-bold shrink-0 ${isSelected ? "text-black" : "text-[#22C55E]"}`}>&#10003;</span> {feature}
                  </div>
                ))}
              </div>
              {isSelected && (
                <div className="mono text-xs text-black/60 mt-4 pt-4 border-t-2 border-black/20">
                  {tier.useCase}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        className="w-full bg-[#22C55E] text-black py-4 font-bold mono border-[3px] border-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handlePublish}
        disabled={loading}
        data-testid="button-checkout"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            PROCESSING...
          </span>
        ) : selectedTier === "free" ? (
          "PUBLISH FREE →"
        ) : (
          `GET ${tiers.find((t) => t.key === selectedTier)?.name} — ${tiers.find((t) => t.key === selectedTier)?.price} →`
        )}
      </button>
    </div>
  );
}
