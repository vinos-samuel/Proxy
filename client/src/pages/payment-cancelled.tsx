import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function PaymentCancelledPage() {
  const [, setLocation] = useLocation();

  const handleRetry = () => {
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6" data-testid="payment-cancelled">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2" data-testid="text-cancelled-title">Payment Cancelled</h1>
          <p className="text-muted-foreground">
            Your page is still saved. Return to the builder to choose a publishing option.
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <Button
              className="w-full"
              onClick={handleRetry}
              data-testid="button-retry-payment"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
