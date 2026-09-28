import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import ProxyLogo from "@/components/ProxyLogo";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

const schema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [token, setToken] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) {
      setTokenValid(false);
      return;
    }
    setToken(t);
    fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(t)}`)
      .then((r) => r.json())
      .then((d) => {
        setTokenValid(d.valid);
        if (!d.valid) console.error("[Reset] invalid token reason:", d.reason, d.detail || "");
      })
      .catch(() => setTokenValid(false));
  }, []);

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      await apiRequest("POST", "/api/auth/reset-password", { token, newPassword: data.newPassword });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      toast({
        title: "Reset failed",
        description: err?.message || "Invalid or expired token. Please request a new reset link.",
        variant: "destructive",
      });
    }
  };

  const renderContent = () => {
    if (tokenValid === null) {
      return (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="auth-icon animate-spin" />
        </div>
      );
    }

    if (!tokenValid) {
      return (
        <div className="auth-message">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="auth-title">Invalid or Expired Link</p>
          <p className="site-muted auth-small">This password reset link is invalid or has expired.</p>
          <Link href="/forgot-password">
            <Button
              className="site-btn auth-submit"
              data-testid="button-request-new-link"
            >
              Request New Link
            </Button>
          </Link>
        </div>
      );
    }

    if (success) {
      return (
        <div className="auth-message">
          <CheckCircle className="auth-icon" />
          <p className="auth-title">Password Updated</p>
          <p className="site-muted auth-small">Your password has been reset. Redirecting to sign in...</p>
          <Link href="/login">
            <Button
              className="site-btn site-btn--quiet auth-submit"
              data-testid="button-go-to-login"
            >
              Sign In Now
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
        <div>
          <Label htmlFor="newPassword" className="site-label">New Password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Min 8 characters"
              data-testid="input-new-password"
              className="site-input h-auto"
              {...form.register("newPassword")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="auth-eye"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.newPassword && (
            <p className="auth-error">{form.formState.errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword" className="site-label">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat new password"
              data-testid="input-confirm-password"
              className="site-input h-auto"
              {...form.register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="auth-eye"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.confirmPassword && (
            <p className="auth-error">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="site-btn auth-submit"
          disabled={form.formState.isSubmitting}
          data-testid="button-reset-password"
        >
          {form.formState.isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Set New Password →"
          )}
        </Button>
      </form>
    );
  };

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
          <h1 className="site-display auth-h1">New Password</h1>
          <p className="site-muted">Choose a strong password</p>
        </div>

        <div className="site-card auth-card">
          {renderContent()}
        </div>
      </motion.div>
    </div>
  );
}
