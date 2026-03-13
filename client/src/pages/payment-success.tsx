import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, ExternalLink, Copy, ArrowRight, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccessPage() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [domain, setDomain] = useState<string>("");
  const [tier, setTier] = useState<string>("");
  const { toast } = useToast();

  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="payment-processing">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Confirming Payment...</h1>
          <p className="text-muted-foreground">Setting up your portfolio</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6" data-testid="payment-error">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => setLocation("/dashboard")} data-testid="button-go-dashboard">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6" data-testid="payment-success">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2" data-testid="text-success-title">Payment successful! Your profile is now live.</h1>
          <p className="text-lg text-muted-foreground">
            Your AI Twin portfolio is publicly accessible
          </p>
        </div>

        {domain && (
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Your Portfolio URL:</p>
              <p className="text-xl font-mono text-primary break-all mb-3" data-testid="text-domain">
                {domain}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`https://${domain}`);
                  toast({ title: "Link copied!" });
                }}
                data-testid="button-copy-link"
              >
                <Copy className="mr-2 h-3.5 w-3.5" />
                Copy Link
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Next Steps:</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Share your link on LinkedIn, email signatures, and networking messages
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Test your chatbot by asking it career questions
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Go to your dashboard to edit or tune your Twin
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            className="flex-1"
            onClick={() => setLocation("/dashboard")}
            data-testid="button-go-dashboard"
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
          {domain && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(`https://${domain}`, "_blank")}
              data-testid="button-view-portfolio"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Portfolio
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
