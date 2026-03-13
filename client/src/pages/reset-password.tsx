import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
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
      .then((d) => setTokenValid(d.valid))
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
          <Loader2 className="h-8 w-8 animate-spin text-black/40" />
        </div>
      );
    }

    if (!tokenValid) {
      return (
        <div className="text-center py-4">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="font-bold text-black mono uppercase tracking-wider">Invalid or Expired Link</p>
          <p className="text-sm text-black/60 mono mt-2">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password">
            <Button
              className="mt-6 w-full bg-[#22C55E] hover:bg-[#16A34A] text-black font-bold py-4 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mono uppercase tracking-wider rounded-none"
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
        <div className="text-center py-4">
          <CheckCircle className="h-12 w-12 text-[#22C55E] mx-auto mb-4" />
          <p className="font-bold text-black mono uppercase tracking-wider">Password Updated</p>
          <p className="text-sm text-black/60 mono mt-2">Your password has been reset. Redirecting to sign in...</p>
          <Link to="/login">
            <Button
              className="mt-6 w-full bg-black hover:bg-black/80 text-white font-bold py-4 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mono uppercase tracking-wider rounded-none"
              data-testid="button-go-to-login"
            >
              Sign In Now
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="newPassword" className="mono text-xs uppercase tracking-wider text-black/60">New Password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Min 8 characters"
              data-testid="input-new-password"
              className="border-2 border-black bg-white px-4 py-3 mono rounded-none h-auto focus-visible:ring-0 focus-visible:border-black"
              {...form.register("newPassword")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.newPassword && (
            <p className="mono text-xs text-destructive">{form.formState.errors.newPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="mono text-xs uppercase tracking-wider text-black/60">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat new password"
              data-testid="input-confirm-password"
              className="border-2 border-black bg-white px-4 py-3 mono rounded-none h-auto focus-visible:ring-0 focus-visible:border-black"
              {...form.register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.confirmPassword && (
            <p className="mono text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-black font-bold py-6 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mono uppercase tracking-wider rounded-none transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
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
    <div className="min-h-screen bg-[#E8E8E3] flex items-center justify-center p-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-8">
          <Link to="/">
            <div className="inline-flex items-center gap-2 cursor-pointer mb-4">
              <div className="h-10 w-10 bg-[#22C55E] border-[3px] border-black flex items-center justify-center font-bold text-black text-xl">
                P
              </div>
              <span className="text-2xl font-bold tracking-tight text-black">PROXY</span>
            </div>
          </Link>
          <h1 className="text-4xl font-bold mb-2 text-black/60">New Password</h1>
          <p className="mono text-sm text-black/60 uppercase tracking-wider">Choose a strong password</p>
        </div>

        <div className="bg-white border-[3px] border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          {renderContent()}
        </div>
      </motion.div>
    </div>
  );
}
