import { useState } from "react";
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
    <div className="min-h-screen bg-[#E8E8E3] flex items-center justify-center p-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 cursor-pointer mb-4">
              <div className="h-10 w-10 bg-[#22C55E] border-[3px] border-black flex items-center justify-center font-bold text-black text-xl">
                P
              </div>
              <span className="text-2xl font-bold tracking-tight text-black">PROXY</span>
            </div>
          </Link>
          <h1 className="text-4xl font-bold mb-2 text-black/60">Reset Password</h1>
          <p className="mono text-sm text-black/60 uppercase tracking-wider">Enter your email to receive a reset link</p>
        </div>

        <div className="bg-white border-[3px] border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          {submitted ? (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-[#22C55E] mx-auto mb-4" />
              <p className="font-bold text-black mono uppercase tracking-wider">Check your inbox</p>
              <p className="text-sm text-black/60 mono mt-2">If that email exists, a reset link has been sent. It expires in 1 hour.</p>
              <Link href="/login">
                <Button
                  className="mt-6 w-full bg-black hover:bg-black/80 text-white font-bold py-4 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mono uppercase tracking-wider rounded-none"
                  data-testid="button-back-to-login"
                >
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="mono text-xs uppercase tracking-wider text-black/60">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  data-testid="input-email"
                  className="border-2 border-black bg-white px-4 py-3 mono rounded-none h-auto focus-visible:ring-0 focus-visible:border-black"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="mono text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-black font-bold py-6 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mono uppercase tracking-wider rounded-none transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                disabled={form.formState.isSubmitting}
                data-testid="button-send-reset"
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Send Reset Link →"
                )}
              </Button>

              <p className="text-center text-sm mt-2">
                <Link href="/login" className="text-black font-bold mono uppercase tracking-wider hover:underline text-xs" data-testid="link-back-login">
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
