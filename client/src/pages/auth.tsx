import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Terminal, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { registerSchema, loginSchema } from "@shared/schema";

export function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message || "Invalid credentials", variant: "destructive" });
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
          <h1 className="text-4xl font-bold mb-2 text-black/60">Welcome back</h1>
          <p className="mono text-sm text-black/60 uppercase tracking-wider">Sign in to manage your Digital Twin</p>
        </div>

        <div className="bg-white border-[3px] border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="mono text-xs uppercase tracking-wider text-black/60">Email</Label>
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
            <div className="space-y-2">
              <Label htmlFor="password" className="mono text-xs uppercase tracking-wider text-black/60">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  data-testid="input-password"
                  className="border-2 border-black bg-white px-4 py-3 mono rounded-none h-auto focus-visible:ring-0 focus-visible:border-black"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="mono text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-black font-bold py-6 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mono uppercase tracking-wider rounded-none transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              disabled={form.formState.isSubmitting}
              data-testid="button-login"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>Sign In &rarr;</>
              )}
            </Button>
          </form>

          <p className="text-center text-sm mt-8">
            <span className="text-black/60 mono uppercase tracking-wider">Don't have an account?</span>{" "}
            <Link href="/register" className="text-black font-bold mono uppercase tracking-wider hover:underline" data-testid="link-register">
              Create one
            </Link>
          </p>

          <p className="text-center text-sm mt-6">
            <Link href="/forgot-password" className="text-black/50 mono text-xs uppercase tracking-wider hover:underline" data-testid="link-forgot-password">
              Forgot password?
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export function RegisterPage() {
  const [, navigate] = useLocation();
  const { register: registerUser } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", name: "", username: "" },
  });

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    try {
      await registerUser(data);
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message || "Could not create account", variant: "destructive" });
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
          <h1 className="text-4xl font-bold mb-2 text-black/60">Initialize Your Twin</h1>
          <p className="mono text-sm text-black/60 uppercase tracking-wider">Start building your AI career agent</p>
        </div>

        <div className="bg-white border-[3px] border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="mono text-xs uppercase tracking-wider text-black/60">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                data-testid="input-name"
                className="border-2 border-black bg-white px-4 py-3 mono rounded-none h-auto focus-visible:ring-0 focus-visible:border-black"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="mono text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="mono text-xs uppercase tracking-wider text-black/60">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  placeholder="john-doe"
                  data-testid="input-username"
                  className="border-2 border-black bg-white px-4 py-3 mono rounded-none h-auto focus-visible:ring-0 focus-visible:border-black"
                  {...form.register("username")}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs mono text-black/40">
                  .myproxy.work
                </span>
              </div>
              {form.formState.errors.username && (
                <p className="mono text-xs text-destructive">{form.formState.errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email" className="mono text-xs uppercase tracking-wider text-black/60">Email</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                data-testid="input-reg-email"
                className="border-2 border-black bg-white px-4 py-3 mono rounded-none h-auto focus-visible:ring-0 focus-visible:border-black"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="mono text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password" className="mono text-xs uppercase tracking-wider text-black/60">Password</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  data-testid="input-reg-password"
                  className="border-2 border-black bg-white px-4 py-3 mono rounded-none h-auto focus-visible:ring-0 focus-visible:border-black"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="mono text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-black font-bold py-6 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mono uppercase tracking-wider rounded-none transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              disabled={form.formState.isSubmitting}
              data-testid="button-register"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>Create Account &rarr;</>
              )}
            </Button>
          </form>

          <p className="text-center text-xs mt-6 leading-relaxed text-black/60 mono">
            By signing up you agree to our{" "}
            <Link href="/terms" className="text-black font-bold hover:underline" data-testid="link-terms">
              Terms of Service
            </Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-black font-bold hover:underline" data-testid="link-privacy">
              Privacy Policy
            </Link>
          </p>

          <p className="text-center text-sm mt-6">
            <span className="text-black/60 mono uppercase tracking-wider">Already have an account?</span>{" "}
            <Link href="/login" className="text-black font-bold mono uppercase tracking-wider hover:underline" data-testid="link-login">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
