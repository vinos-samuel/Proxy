import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, Globe, ArrowRight, CheckCircle, Zap, Shield, Users, Terminal, MessageSquare } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center">
                <Terminal className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold tracking-tight" data-testid="text-brand-name">BIOS.ai</span>
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

      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />

        <motion.div
          className="relative mx-auto max-w-4xl px-6 text-center"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <motion.div variants={fadeUp}>
            <Badge variant="secondary" className="mb-6 px-4 py-1.5">
              <Terminal className="mr-1.5 h-3.5 w-3.5" />
              AI-Powered Career Agents
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Don't Just Send a Resume.{" "}
            <span className="text-primary">
              Deploy an Agent.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Static PDFs stay in the inbox. Your Digital Twin engages stakeholders 24/7 — answering strategy questions, sharing war stories, and selling your value while you sleep.
          </motion.p>

          <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register">
              <Button size="lg" className="text-base px-8" data-testid="button-hero-cta">
                Initialize Your Twin
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/portfolio/demo">
              <Button size="lg" variant="outline" className="text-base px-8" data-testid="button-view-demo">
                <MessageSquare className="mr-2 h-4 w-4" />
                Talk to a Demo
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

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
              Three steps from raw career data to a live AI agent
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: <Users className="h-6 w-6" />,
                title: "Context Ingestion",
                description: "Complete a guided intake covering career history, war stories, voice personality, and objection handling.",
              },
              {
                step: "02",
                icon: <Sparkles className="h-6 w-6" />,
                title: "AI Processes Everything",
                description: "Gemini AI rewrites, structures, and transforms your raw input into a polished knowledge base.",
              },
              {
                step: "03",
                icon: <Globe className="h-6 w-6" />,
                title: "Deploy Your Twin",
                description: "Your AI CV goes live with a working chatbot that answers questions like you would.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <Card className="p-8 h-full">
                  <div className="text-xs font-mono text-muted-foreground mb-4">{item.step}</div>
                  <div className="h-12 w-12 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 text-primary">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why BIOS.ai</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Your career deserves more than a static document
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: <Bot className="h-5 w-5" />,
                title: "24/7 Digital Twin",
                description: "Your AI agent answers career questions, shares war stories, and handles objections — even while you sleep.",
              },
              {
                icon: <Zap className="h-5 w-5" />,
                title: "AI-Polished Content",
                description: "Raw input gets rewritten for maximum impact. Your twin speaks with clarity and authority.",
              },
              {
                icon: <Shield className="h-5 w-5" />,
                title: "Trained on Your Real Experience",
                description: "CAR-format stories, metrics, and communication style ensure authentic, detailed responses.",
              },
              {
                icon: <Globe className="h-5 w-5" />,
                title: "One Link, Full Impact",
                description: "A permanent, shareable URL. Add it to LinkedIn, email signatures, or pitch decks.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-7 hover-elevate">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1.5">{item.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-muted-foreground text-lg">One price to deploy your AI agent</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-sm mx-auto"
          >
            <Card className="p-8 text-center relative overflow-visible">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground border-0">
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
                  "Digital Twin chatbot agent",
                  "Unique shareable URL",
                  "Unlimited visitor conversations",
                  "AI-rewritten professional content",
                  "Three premium visual themes",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full" size="lg" data-testid="button-pricing-cta">
                  Initialize Your Twin
                </Button>
              </Link>
            </Card>
          </motion.div>
        </div>
      </section>

      <footer className="border-t py-12">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <Terminal className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">BIOS.ai</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Deploy your career agent. Powered by AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
