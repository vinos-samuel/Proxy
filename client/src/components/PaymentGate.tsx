import { useState } from "react";
import { Check, Loader2, Rocket, Star, Crown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface PaymentGateProps {
  profileId: string;
}

const tiers = [
  {
    key: "launch",
    name: "LAUNCH",
    tierLabel: "TIER_01",
    price: "$99",
    originalPrice: "$199",
    icon: Rocket,
    features: [
      "AI_PORTFOLIO + CHATBOT",
      "6_MONTH_HOSTING",
      "DOWNLOADABLE_VERSION",
      "SUBDOMAIN_INCLUDED",
    ],
    useCase: "USE_CASE: Testing | Single portfolio",
  },
  {
    key: "evolve",
    name: "EVOLVE",
    tierLabel: "TIER_02",
    price: "$199",
    originalPrice: "$399",
    icon: Star,
    popular: true,
    features: [
      "ALL_LAUNCH_FEATURES",
      "CUSTOM_DOMAIN",
      "PORTFOLIO_EDITOR",
      "PROXY_TUNING",
      "THEME_SWITCHER",
      "ANALYTICS_DASH (Coming Soon)",
      "12_MONTH_HOSTING",
    ],
    useCase: "USE_CASE: Active job search | Career pivot",
  },
  {
    key: "concierge",
    name: "CONCIERGE",
    tierLabel: "TIER_03",
    price: "$499",
    originalPrice: "$999",
    icon: Crown,
    features: [
      "ALL_EVOLVE_FEATURES",
      "90MIN_INTERVIEW",
      "PRO_COPYWRITING",
      "WHITE_GLOVE_BUILD",
      "ADVANCED_TUNING",
      "PRIORITY_SUPPORT",
    ],
    useCase: "USE_CASE: Executive positioning | Brand building",
  },
];

export default function PaymentGate({ profileId }: PaymentGateProps) {
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>("evolve");
  const [published, setPublished] = useState(false);
  const [publishData, setPublishData] = useState<{ publicDomain?: string; username?: string } | null>(null);
  const [, navigate] = useLocation();

  const handleTestPublish = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/test-publish", {
        tier: selectedTier,
      });
      const data = await response.json();
      if (data.success) {
        setPublished(true);
        setPublishData(data);
      }
    } catch (error) {
      console.error("Publish error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (published && publishData) {
    return (
      <div className="md:col-span-2 bg-white border-[3px] border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-[#22C55E] border-[3px] border-black flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Check className="h-8 w-8 text-black" />
          </div>
          <h2 className="text-3xl font-bold text-black" data-testid="text-publish-success">
            PORTFOLIO_PUBLISHED
          </h2>
          <p className="mono text-sm text-black/60 uppercase tracking-wider">
            Your AI Twin is now live and ready to represent you.
          </p>
          {publishData.username && (
            <button
              onClick={() => navigate(`/portfolio/${publishData.username}`)}
              className="bg-[#22C55E] text-black px-8 py-4 font-bold border-[3px] border-black mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              data-testid="button-view-portfolio"
            >
              VIEW_PORTFOLIO &rarr;
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="md:col-span-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="text-center mb-8">
        <div className="mono text-xs text-black/50 mb-2 uppercase tracking-widest">&#9698; Deployment Ready</div>
        <h2 className="text-3xl font-bold mb-2 text-black" data-testid="text-payment-title">
          SELECT_CONFIGURATION
        </h2>
        <p className="mono text-sm text-black/60 uppercase tracking-wider">
          Choose a plan to publish your portfolio and make it public
        </p>
        <div className="inline-block mt-3 bg-black text-[#22C55E] px-4 py-2 mono text-xs uppercase tracking-wider border-[3px] border-black font-bold" data-testid="badge-launch-special">
          &#9733; LAUNCH SPECIAL — FIRST 100 MEMBERS
        </div>
        <div className="mt-2 mono text-xs text-black/50 uppercase tracking-wider" data-testid="text-founding-member">
          Founding member pricing. Full price resumes after 100 members.
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
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#22C55E] text-black px-4 py-1 font-bold mono text-xs border-[3px] border-black uppercase tracking-wider" data-testid="badge-popular">
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
                <div className="mono text-base text-black/40 line-through mb-1">{tier.originalPrice}</div>
                <div className="text-5xl font-bold mono text-black" data-testid={`text-price-${tier.key}`}>{tier.price}</div>
                <div className="mono text-xs text-black/50 mt-1 uppercase tracking-wider">Launch Special</div>
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
        onClick={handleTestPublish}
        disabled={loading}
        data-testid="button-checkout"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            DEPLOYING...
          </span>
        ) : (
          `DEPLOY_WITH_${tiers.find((t) => t.key === selectedTier)?.name}_PLAN →`
        )}
      </button>
    </div>
  );
}
