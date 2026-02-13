import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PaymentCancelledPage() {
  const [, setLocation] = useLocation();
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const params = new URLSearchParams(window.location.search);
  const profileId = params.get("profile_id");

  const handleRetry = () => {
    setLocation("/dashboard");
  };

  const handleDelete = async () => {
    if (!profileId) return;

    setDeleting(true);
    try {
      await apiRequest("POST", "/api/payment/cancel", { profileId });
      toast({ title: "Portfolio deleted", description: "You can create a new one anytime." });
      setLocation("/dashboard");
    } catch (error) {
      console.error("Delete error:", error);
      toast({ title: "Failed to delete", description: "Please try again.", variant: "destructive" });
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6" data-testid="payment-cancelled">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2" data-testid="text-cancelled-title">Payment Cancelled</h1>
          <p className="text-muted-foreground">
            Your portfolio is still in draft mode. It won't be published until payment is complete.
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6 space-y-3">
            <Button
              className="w-full"
              onClick={handleRetry}
              data-testid="button-retry-payment"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Button>

            {profileId && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleDelete}
                disabled={deleting}
                data-testid="button-delete-draft"
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Draft Portfolio
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Draft portfolios are automatically deleted after 7 days if unpaid.
        </p>
      </div>
    </div>
  );
}
