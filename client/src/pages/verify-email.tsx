import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import ProxyLogo from "@/components/ProxyLogo";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { profileCreationPath } from "@/lib/profile-builder-rollout";

export default function VerifyEmailPage() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setErrorMsg("No verification token found.");
      setStatus("error");
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
          setStatus("success");
          setTimeout(() => navigate(profileCreationPath), 3000);
        } else {
          setErrorMsg(d.error || "This verification link is invalid or has expired.");
          setStatus("error");
        }
      })
      .catch(() => {
        setErrorMsg("Something went wrong. Please try again.");
        setStatus("error");
      });
  }, []);

  return (
    <div className="site auth">
      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="auth-head">
          <Link href="/">
            <span className="auth-logo"><ProxyLogo size={30} /></span>
          </Link>
          <h1 className="site-display auth-h1">Email Verification</h1>
        </div>

        <div className="site-card auth-card auth-message">
          {status === "loading" && (
            <div className="py-8">
              <Loader2 className="auth-icon animate-spin" />
              <p className="site-muted">Verifying your email...</p>
            </div>
          )}

          {status === "success" && (
            <div className="py-4">
              <CheckCircle className="auth-icon" />
              <p className="auth-title">Email Verified!</p>
              <p className="site-muted auth-small">Your account is active. Redirecting to your page builder...</p>
              <Link href={profileCreationPath}>
                <Button className="site-btn site-btn--quiet auth-submit">
                  Build my page →
                </Button>
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="py-4">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="auth-title">Verification Failed</p>
              <p className="site-muted auth-small">{errorMsg}</p>
              <Link href="/login">
                <Button className="site-btn auth-submit">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
