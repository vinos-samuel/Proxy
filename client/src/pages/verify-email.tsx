import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import ProxyLogo from "@/components/ProxyLogo";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

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
          setTimeout(() => navigate("/dashboard"), 3000);
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
    <div className="min-h-screen bg-[#E8E8E3] flex items-center justify-center p-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 cursor-pointer mb-4">
              <ProxyLogo />
            </div>
          </Link>
          <h1 className="text-4xl font-bold mb-2 text-black/60">Email Verification</h1>
        </div>

        <div className="bg-white border-[3px] border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center">
          {status === "loading" && (
            <div className="py-8">
              <Loader2 className="h-12 w-12 animate-spin text-black/40 mx-auto mb-4" />
              <p className="mono text-sm text-black/60 uppercase tracking-wider">Verifying your email...</p>
            </div>
          )}

          {status === "success" && (
            <div className="py-4">
              <CheckCircle className="h-12 w-12 text-[#22C55E] mx-auto mb-4" />
              <p className="font-bold text-black mono uppercase tracking-wider">Email Verified!</p>
              <p className="text-sm text-black/60 mono mt-2">Your account is active. Redirecting to your dashboard...</p>
              <Link href="/dashboard">
                <Button className="mt-6 w-full bg-black hover:bg-black/80 text-white font-bold py-4 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mono uppercase tracking-wider rounded-none">
                  Go to Dashboard →
                </Button>
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="py-4">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="font-bold text-black mono uppercase tracking-wider">Verification Failed</p>
              <p className="text-sm text-black/60 mono mt-2">{errorMsg}</p>
              <Link href="/login">
                <Button className="mt-6 w-full bg-[#22C55E] hover:bg-[#16A34A] text-black font-bold py-4 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mono uppercase tracking-wider rounded-none">
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
