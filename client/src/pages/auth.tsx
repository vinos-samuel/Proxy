import { useEffect, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import ProxyLogo from "@/components/ProxyLogo";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Terminal, ArrowRight, Loader2, Eye, EyeOff, Mail, CheckCircle } from "lucide-react";
import { registerSchema, loginSchema } from "@shared/schema";

export function LoginPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const nextUrl = new URLSearchParams(search).get("next");
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      await login(data.email, data.password);
      navigate(nextUrl || "/dashboard");
    } catch (err: any) {
      if (err.message?.includes("403") && err.message?.includes("unverified")) {
        setUnverifiedEmail(data.email);
      } else {
        toast({ title: "Login failed", description: err.message?.replace(/^\d+: /, "") || "Invalid credentials", variant: "destructive" });
      }
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      await apiRequest("POST", "/api/auth/resend-verification", { email: unverifiedEmail });
      setResent(true);
    } catch {
      toast({ title: "Error", description: "Could not resend email. Please try again.", variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="site auth">
      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="auth-head">
          <Link href="/" className="auth-logo" aria-label="Proxy home"><ProxyLogo size={30} /></Link>
          <h1 className="site-display auth-h1">Welcome back</h1>
          <p className="site-muted">Sign in to manage your page.</p>
        </div>

        <div className="site-card auth-card">
          {unverifiedEmail ? (
            <div className="auth-message">
              <Mail className="auth-icon" />
              <p className="auth-title">Please verify your email</p>
              <p className="site-muted auth-small">Please check <strong>{unverifiedEmail}</strong> and click the verification link before logging in.</p>
              {resent ? (
                <div className="auth-ok">
                  <CheckCircle className="h-4 w-4" /> Verification email sent again.
                </div>
              ) : (
                <Button
                  onClick={handleResend}
                  disabled={resending}
                  className="site-btn auth-submit"
                >
                  {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resend verification email"}
                </Button>
              )}
              <button onClick={() => setUnverifiedEmail(null)} className="site-link auth-back">
                Back to sign in
              </button>
            </div>
          ) : (
          <>
          <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
            <div>
              <Label htmlFor="email" className="site-label">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                data-testid="input-email"
                className="site-input h-auto"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="auth-error">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="password" className="site-label">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  data-testid="input-password"
                  className="site-input h-auto"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-eye" aria-label={showPassword ? "Hide password" : "Show password"}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="auth-error">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="site-btn auth-submit"
              disabled={form.formState.isSubmitting}
              data-testid="button-login"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>Sign in</>
              )}
            </Button>
          </form>

          <p className="auth-center auth-foot">
            <span className="site-muted">Don't have an account?</span>{" "}
            <Link href="/register" className="site-link" data-testid="link-register">
              Create one
            </Link>
          </p>

          <p className="auth-center auth-foot">
            <Link href="/forgot-password" className="site-faint auth-small" data-testid="link-forgot-password">
              Forgot password?
            </Link>
          </p>
          </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function RegisterPage() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [hasGuestDraft, setHasGuestDraft] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", name: "", username: "" },
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/builder", { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then((state) => {
        if (!cancelled && state?.document) setHasGuestDraft(true);
        const draftName = state?.document?.identity?.name?.trim();
        if (cancelled || !draftName || form.getValues("name") || form.getValues("username")) return;
        const suggestedUsername = draftName
          .toLowerCase()
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 40);
        form.setValue("name", draftName);
        if (suggestedUsername) form.setValue("username", suggestedUsername);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [form]);

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    try {
      await apiRequest("POST", "/api/auth/register", data);
      setRegisteredEmail(data.email);
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Lead');
      }
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message?.replace(/^\d+: /, "") || "Could not create account", variant: "destructive" });
    }
  };

  return (
    <div className="site auth">
      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="auth-head">
          <Link href="/" className="auth-logo" aria-label="Proxy home"><ProxyLogo size={30} /></Link>
          <h1 className="site-display auth-h1">{hasGuestDraft ? "Save your page. Make it yours." : "Create your account. Build your page."}</h1>
          <p className="site-muted">{hasGuestDraft ? "Create a free account to keep and publish your page." : "Free to start. No card needed."}</p>
        </div>

        <div className="site-card auth-card">
          {registeredEmail ? (
            <div className="auth-message">
              <Mail className="auth-icon" />
              <p className="auth-title">Check your email</p>
              <p className="site-muted auth-small">We sent a verification link to <strong>{registeredEmail}</strong>. Verify it to {hasGuestDraft ? "return to your saved page" : "start your page"}.</p>
              <p className="site-faint auth-small">Didn't get it? Check your spam folder or{" "}
                <Link href="/login" className="site-link">go to sign in</Link> to resend.
              </p>
            </div>
          ) : (
          <>
          <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
            <div>
              <Label htmlFor="name" className="site-label">Full name</Label>
              <Input
                id="name"
                placeholder="Your name"
                data-testid="input-name"
                className="site-input h-auto"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="auth-error">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="username" className="site-label">Username</Label>
              <div>
                <Input
                  id="username"
                  placeholder="your-name"
                  data-testid="input-username"
                  className="site-input h-auto"
                  {...form.register("username")}
                />
                <p className="site-faint auth-hint">Your link: myproxy.work/portfolio/{form.watch("username") || "your-name"}</p>
              </div>
              {form.formState.errors.username && (
                <p className="auth-error">{form.formState.errors.username.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="reg-email" className="site-label">Email</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                data-testid="input-reg-email"
                className="site-input h-auto"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="auth-error">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="reg-password" className="site-label">Password</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  data-testid="input-reg-password"
                  className="site-input h-auto"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-eye" aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="auth-error">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="site-btn auth-submit"
              disabled={form.formState.isSubmitting}
              data-testid="button-register"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>Create account</>
              )}
            </Button>
          </form>

          <p className="site-faint auth-small auth-center">
            By signing up you agree to our{" "}
            <Link href="/terms" className="site-link" data-testid="link-terms">
              Terms of Service
            </Link>
            {" "}and{" "}
            <Link href="/privacy" className="site-link" data-testid="link-privacy">
              Privacy Policy
            </Link>
          </p>

          <p className="auth-center auth-foot">
            <span className="site-muted">Already have an account?</span>{" "}
            <Link href="/login" className="site-link" data-testid="link-login">
              Sign in
            </Link>
          </p>
          </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
