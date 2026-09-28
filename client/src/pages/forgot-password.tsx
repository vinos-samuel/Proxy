import { useState } from "react";
import ProxyLogo from "@/components/ProxyLogo";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle } from "lucide-react";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      await apiRequest("POST", "/api/auth/forgot-password", { email: data.email });
      setSubmitted(true);
    } catch {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
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
          <Link href="/">
            <span className="auth-logo"><ProxyLogo size={30} /></span>
          </Link>
          <h1 className="site-display auth-h1">Reset Password</h1>
          <p className="site-muted">Enter your email to receive a reset link</p>
        </div>

        <div className="site-card auth-card">
          {submitted ? (
            <div className="auth-message">
              <CheckCircle className="auth-icon" />
              <p className="auth-title">Check your inbox</p>
              <p className="site-muted auth-small">If that email exists, a reset link has been sent. It expires in 1 hour.</p>
              <Link href="/login">
                <Button
                  className="site-btn site-btn--quiet auth-submit"
                  data-testid="button-back-to-login"
                >
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
              <div>
                <Label htmlFor="email" className="site-label">Email Address</Label>
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

              <Button
                type="submit"
                className="site-btn auth-submit"
                disabled={form.formState.isSubmitting}
                data-testid="button-send-reset"
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Send Reset Link →"
                )}
              </Button>

              <p className="auth-center auth-foot">
                <Link href="/login" className="site-link" data-testid="link-back-login">
                  ← Back to Sign In
                </Link>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
