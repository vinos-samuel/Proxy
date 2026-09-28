import { Link } from "wouter";
import { SiteNav } from "@/components/SiteChrome";

export default function PaymentCancelledPage() {
  return (
    <div className="site" data-testid="payment-cancelled">
      <SiteNav minimal />
      <div className="auth">
        <div className="auth-message">
          <h1 className="site-display auth-h1" data-testid="text-cancelled-title">Payment cancelled</h1>
          <p className="site-muted">You weren't charged. Your page is saved exactly as you left it.</p>
          <Link className="site-btn" href="/dashboard" data-testid="button-retry-payment">Back to your dashboard</Link>
        </div>
      </div>
    </div>
  );
}
