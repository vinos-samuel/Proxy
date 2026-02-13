import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Rocket, Star, Crown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PaymentGateProps {
  profileId: string;
}

const tiers = [
  {
    key: "launch",
    name: "Launch",
    price: "$199",
    icon: Rocket,
    features: [
      "AI portfolio + chatbot",
      "6-month hosting",
      "Downloadable version",
      "username.biosai.com domain",
    ],
  },
  {
    key: "evolve",
    name: "Evolve",
    price: "$399",
    icon: Star,
    popular: true,
    features: [
      "Everything in Launch",
      "Custom domain support",
      "Portfolio editor",
      "Tune Your Twin dashboard",
      "Theme switcher",
      "Analytics dashboard",
      "12-month hosting",
    ],
  },
  {
    key: "concierge",
    name: "Concierge",
    price: "$1,199",
    icon: Crown,
    features: [
      "Everything in Evolve",
      "90-min strategy interview",
      "Professional copywriting",
      "White-glove build",
      "Advanced chatbot tuning",
      "Priority support",
      "60-day conversation guarantee",
    ],
  },
];

export default function PaymentGate({ profileId }: PaymentGateProps) {
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>("evolve");

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/create-checkout-session", {
        tier: selectedTier,
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Payment error:", error);
      setLoading(false);
    }
  };

  return (
    <Card className="md:col-span-2">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2" data-testid="text-payment-title">
            Your AI Twin is Ready
          </h2>
          <p className="text-muted-foreground">
            Choose a plan to publish your portfolio and make it public
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const isSelected = selectedTier === tier.key;
            return (
              <Card
                key={tier.key}
                className={`cursor-pointer transition-all relative ${
                  isSelected
                    ? "border-primary ring-1 ring-primary"
                    : "hover-elevate"
                }`}
                onClick={() => setSelectedTier(tier.key)}
                data-testid={`card-tier-${tier.key}`}
              >
                {tier.popular && (
                  <Badge
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2"
                    data-testid="badge-popular"
                  >
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-4 pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">{tier.name}</h3>
                  </div>
                  <div className="text-3xl font-bold mb-4" data-testid={`text-price-${tier.key}`}>
                    {tier.price}
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handleCheckout}
          disabled={loading}
          data-testid="button-checkout"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Publish with ${tiers.find((t) => t.key === selectedTier)?.name} Plan`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
