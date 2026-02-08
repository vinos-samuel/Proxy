import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, Globe, ArrowRight, CheckCircle, Zap, Shield, Users } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-md border border-white/10 bg-white/5 backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="h-9 w-9 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight" data-testid="text-brand-name">Digital Twin Studio</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" data-testid="link-login">Log In</Button>
            </Link>
            <Link href="/register">
              <Button data-testid="link-register">
                Get Started
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-3xl" />

        <motion.div
          className="relative mx-auto max-w-4xl px-6 text-center"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <motion.div variants={fadeUp}>
            <Badge variant="secondary" className="mb-6 px-4 py-1.5">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              AI-Powered Career Portfolios
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Your Career,{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Reimagined
            </span>
            <br />
            as a Digital Twin
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Create an AI-powered interactive portfolio with a chatbot that knows your career inside out.
            Let your Digital Twin answer questions, tell your stories, and impress recruiters 24/7.
          </motion.p>

          <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register">
              <Button size="lg" className="text-base px-8" data-testid="button-hero-cta">
                Create Your Digital Twin
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/portfolio/demo">
              <Button size="lg" variant="outline" className="text-base px-8" data-testid="button-view-demo">
                View Demo
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="py-24 relative">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Three simple steps to create your AI-powered portfolio
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: <Users className="h-6 w-6" />,
                title: "Tell Your Story",
                description: "Fill out our guided questionnaire about your career history, achievements, and signature stories.",
              },
              {
                step: "02",
                icon: <Sparkles className="h-6 w-6" />,
                title: "AI Transforms It",
                description: "Gemini AI processes your answers into structured content and builds your personal knowledge base.",
              },
              {
                step: "03",
                icon: <Globe className="h-6 w-6" />,
                title: "Go Live",
                description: "Preview, pay, and publish. Your AI CV is live at a unique URL with a working chatbot.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <GlassCard className="p-8 h-full">
                  <div className="text-xs font-mono text-muted-foreground mb-4">{item.step}</div>
                  <div className="h-12 w-12 rounded-md bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center mb-5 text-indigo-400">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/3 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Digital Twin Studio</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Stand out from the crowd with an AI-powered portfolio
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: <Bot className="h-5 w-5" />,
                title: "AI Chatbot Twin",
                description: "Your visitors can chat with your AI twin that answers career questions using your real experiences.",
              },
              {
                icon: <Zap className="h-5 w-5" />,
                title: "Instant Setup",
                description: "Answer a guided questionnaire and AI does the rest. Your portfolio is ready in minutes, not days.",
              },
              {
                icon: <Shield className="h-5 w-5" />,
                title: "Authentic Stories",
                description: "CAR-format stories ensure your twin gives detailed, genuine answers about your career.",
              },
              {
                icon: <Globe className="h-5 w-5" />,
                title: "Unique URL",
                description: "Your portfolio lives at a permanent, shareable URL. Add it to your LinkedIn or email signature.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className="p-7 hover-elevate">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1.5">{item.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-muted-foreground text-lg">One price to publish your AI-powered portfolio</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-sm mx-auto"
          >
            <GlassCard className="p-8 text-center relative overflow-visible">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0">
                  Most Popular
                </Badge>
              </div>
              <h3 className="text-2xl font-bold mt-2 mb-2">Lifetime Access</h3>
              <div className="flex items-baseline justify-center gap-1 mb-4">
                <span className="text-5xl font-bold">$99</span>
                <span className="text-muted-foreground">one-time</span>
              </div>
              <ul className="text-left space-y-3 mb-8">
                {[
                  "AI-powered interactive portfolio",
                  "Digital Twin chatbot",
                  "Unique shareable URL",
                  "Unlimited visitor chats",
                  "Career story knowledge base",
                  "Professional dark-theme design",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full" size="lg" data-testid="button-pricing-cta">
                  Get Started
                </Button>
              </Link>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">Digital Twin Studio</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built with AI. Powered by Gemini.
          </p>
        </div>
      </footer>
    </div>
  );
}
