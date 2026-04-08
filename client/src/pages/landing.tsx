import { Link, useLocation } from "wouter";
import { FileText, Zap, Rocket, Target, X, Check, Play } from "lucide-react";
import { useState } from "react";
import aiCv1 from "@assets/Screen_Recording_2025-12-15_at_9.20.20_PM_1771923394821.mov";
import aiCv2 from "@assets/proxy-demo-final-3.mp4";

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="min-h-screen bg-[#E8E8E3] text-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {showDemo && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-start justify-center p-4 md:p-8 overflow-y-auto">
          <div className="bg-[#E8E8E3] border-[4px] border-black w-full max-w-4xl p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative my-8">
            <button 
              onClick={() => setShowDemo(false)}
              className="absolute -top-4 -right-4 bg-red-500 text-white w-10 h-10 border-[3px] border-black flex items-center justify-center font-bold hover:bg-red-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="mono text-xs text-black/50 mb-6 uppercase tracking-widest text-center">&#9698; Demo Environment</div>
            <h2 className="text-3xl font-bold mb-8 text-center border-b-[3px] border-black pb-4">DIGITAL TWIN_SESSIONS</h2>
            
            <div className="space-y-12">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#22C55E] border-[2px] border-black flex items-center justify-center font-bold text-xs">01</div>
                  <h3 className="font-bold text-xl uppercase tracking-tight">Digital Twin aka Ai Cv - Demo 1</h3>
                </div>
                <div className="border-[3px] border-black bg-black aspect-video relative group overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <video 
                    src={aiCv1} 
                    controls 
                    className="w-full h-full object-contain"
                    poster="/demo-placeholder-1.png"
                  />
                </div>
              </div>

              <div className="space-y-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#93C5FD] border-[2px] border-black flex items-center justify-center font-bold text-xs">02</div>
                  <h3 className="font-bold text-xl uppercase tracking-tight">Digital Twin aka Ai Cv - Demo 2 (Latest)</h3>
                </div>
                <div className="border-[3px] border-black bg-black aspect-video relative group overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <video 
                    src={aiCv2} 
                    controls 
                    className="w-full h-full object-contain"
                    poster="/demo-placeholder-2.png"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t-[3px] border-black flex justify-center">
              <button
                onClick={() => navigate("/register")}
                className="bg-[#22C55E] text-black px-8 py-4 font-bold hover:bg-[#16A34A] border-[3px] border-black mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                INITIALIZE YOUR AGENT &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="border-b-[3px] border-black bg-[#D1D1CC] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 bg-[#22C55E] border-[3px] border-black flex items-center justify-center font-bold text-black text-xl">
                P
              </div>
              <span className="text-2xl font-bold tracking-tight" data-testid="text-brand-name">PROXY</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/about"><span className="mono text-sm text-black/60 hover:text-black uppercase tracking-wider cursor-pointer">About</span></Link>
            <Link href="/blog"><span className="mono text-sm text-black/60 hover:text-black uppercase tracking-wider cursor-pointer">Blog</span></Link>
            <Link href="/faq"><span className="mono text-sm text-black/60 hover:text-black uppercase tracking-wider cursor-pointer">FAQ</span></Link>
            <a href="#how" className="mono text-sm text-black/60 hover:text-black uppercase tracking-wider" data-testid="link-how">How</a>
            <a href="#pricing" className="mono text-sm text-black/60 hover:text-black uppercase tracking-wider" data-testid="link-pricing">Pricing</a>
            <button
              onClick={() => navigate("/login")}
              className="mono text-sm text-black/60 hover:text-black uppercase tracking-wider"
              data-testid="link-login"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/portfolio/test2?demo=true")}
              className="bg-[#22C55E] text-black px-6 py-3 font-bold hover:bg-[#16A34A] border-[3px] border-black mono text-sm uppercase tracking-wider"
              data-testid="link-register"
            >
              ENGAGE &rarr;
            </button>
          </div>
        </div>
      </nav>

      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">

          <div className="mb-12 p-4 border-[3px] border-black bg-white mono text-xs text-black/60 flex justify-between items-center flex-wrap gap-4">
            <div className="flex gap-6 flex-wrap">
              <span>STATUS: <span className="text-[#22C55E] font-bold">OPEN</span></span>
              <span className="hidden sm:inline">|</span>
              <span>MEMBERS: <span className="text-black font-bold">127</span></span>
              <span className="hidden sm:inline">|</span>
              <span>AVG_RECRUITER_SESSION: <span className="text-black font-bold">8_MINS</span></span>
            </div>
            <div>EST: 2025 | SINGAPORE</div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <div>
              <div className="mono text-sm text-black/50 mb-4 uppercase tracking-widest" data-testid="text-hero-label">&#9698; Your career, represented well</div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-none mb-8" data-testid="text-hero-headline">
                STOP<br />
                APPLYING.<br />
                START <span className="text-[#22C55E]">ENGAGING</span>.
              </h1>
              <div className="space-y-4 text-xl text-black/70 mb-8">
                <p>You've built something real over 10+ years.</p>
                <p>200+ applications. 6 interviews. Maybe 1 offer.</p>
                <p className="text-black font-bold">A PDF can't show any of it.</p>
              </div>

              <div className="terminal-input border-[#E8A75D] text-[#D4941D] mb-8">
                <span className="text-black/30">$</span> DEPLOY_CAREER_PROXY --user=YOUR_NAME
              </div>

              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => navigate("/portfolio/test2?demo=true")}
                  className="bg-[#22C55E] text-black px-8 py-4 font-bold hover:bg-[#16A34A] border-[3px] border-black mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  data-testid="button-hero-cta"
                >
                  INITIALIZE &rarr;
                </button>
                <button
                  onClick={() => setShowDemo(true)}
                  className="bg-white text-black px-8 py-4 font-bold border-[3px] border-black hover:bg-gray-100 mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  data-testid="button-view-demo"
                >
                  <span className="flex items-center gap-2">
                    <Play className="h-4 w-4 fill-current" />
                    VIEW_DEMO
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="brutal-card bg-[#E8A75D] border-black p-6 relative overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" data-testid="card-avg-session">
                <div className="scan-line"></div>
                <div className="mono text-xs text-black/60 mb-2 uppercase">AVG_SESSION</div>
                <div className="text-5xl font-bold text-black">8m</div>
                <div className="mono text-sm text-black/70 mt-2">vs. 6 seconds (PDF)</div>
              </div>

              <div className="brutal-card bg-[#93C5FD] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" data-testid="card-response-rate">
                <div className="mono text-xs text-black/60 mb-2 uppercase">RESPONSE_RATE</div>
                <div className="text-5xl font-bold text-black">3.2x</div>
                <div className="mono text-sm text-black/70 mt-2">higher than resume</div>
              </div>

              <div className="brutal-card bg-[#86EFAC] border-black p-6 col-span-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" data-testid="card-engagement-model">
                <div className="mono text-xs text-black/60 mb-2 uppercase">YOUR_TWIN</div>
                <div className="text-3xl font-bold text-black mb-2">ALWAYS ON. ALWAYS READY.</div>
                <div className="mono text-sm text-black/70">
                  Answers every recruiter question. Represents you accurately. Available at midnight, on weekends, across time zones.
                </div>
              </div>

              <div className="brutal-card bg-[#C4B5FD] border-black p-6 col-span-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" data-testid="card-operational-status">
                <div className="mono text-xs text-black/60 mb-2 uppercase">YOUR_PROXY</div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <div className="text-2xl font-bold text-black">24/7</div>
                    <div className="mono text-xs text-black/60">AVAILABLE</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-black">0</div>
                    <div className="mono text-xs text-black/60">MISSED_CALLS</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-black">&infin;</div>
                    <div className="mono text-xs text-black/60">PATIENCE</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="px-6 py-20 border-t-[3px] border-b-[3px] border-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">

            <div className="border-[3px] border-black p-8 bg-[#D1D1CC] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="mono text-xs text-black/50 mb-4 uppercase tracking-widest">&#9698; The Broken System</div>
              <h2 className="text-4xl font-bold mb-6 text-black/60">THE RESUME</h2>
              <div className="space-y-4 text-black/70">
                {[
                  { title: "Send PDF \u2192 Silence", desc: "One-way broadcast into void" },
                  { title: "ATS Black Hole", desc: "87% never reach human" },
                  { title: "6 Second Scan", desc: "If they even open it" },
                  { title: "200+ Applications", desc: "6 interviews. Maybe 1 offer." },
                ].map((item, i) => (
                  <div key={i} className={`flex items-start gap-3 ${i < 3 ? "pb-3 border-b-2 border-black/20" : ""}`}>
                    <X className="h-4 w-4 text-red-600 mt-1 shrink-0" />
                    <div>
                      <div className="font-bold text-black">{item.title}</div>
                      <div className="text-sm mono">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-[3px] border-black p-8 bg-[#22C55E] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="mono text-xs text-black/60 mb-4 uppercase tracking-widest">&#9698; The Proxy Solution</div>
              <h2 className="text-4xl font-bold mb-6 text-black">THE AGENT</h2>
              <div className="space-y-4 text-black">
                {[
                  { title: "Send Link \u2192 Conversation", desc: "Two-way engagement 24/7" },
                  { title: "Direct Access", desc: "No ATS. Straight to recruiter." },
                  { title: "8 Minute Sessions", desc: "They actually learn about you" },
                  { title: "50 Engagements", desc: "Quality > Quantity. 3x response rate." },
                ].map((item, i) => (
                  <div key={i} className={`flex items-start gap-3 ${i < 3 ? "pb-3 border-b-2 border-black/20" : ""}`}>
                    <Check className="h-4 w-4 text-black mt-1 shrink-0" />
                    <div>
                      <div className="font-bold">{item.title}</div>
                      <div className="text-sm mono text-black/80">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      <section id="how" className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-xs text-black/50 mb-4 uppercase tracking-widest">&#9698; How it works</div>
          <h2 className="text-5xl font-bold mb-16">HOW_IT_WORKS</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                module: "MODULE_01",
                icon: <FileText className="h-8 w-8" />,
                color: "bg-[#E8A75D]",
                title: "YOUR\nSTORY",
                desc: "Upload your CV — then choose: fill the guided questionnaire OR let the AI interview you in a natural conversation. Either way captures: career trajectory | real stories | how you communicate | how you handle hard situations",
                footer: "DURATION: ~20_MINUTES | TWO PATHS",
                badge: null,
              },
              {
                module: "MODULE_02",
                icon: <Zap className="h-8 w-8" />,
                color: "bg-[#93C5FD]",
                title: "TWIN\nBUILDS",
                desc: "Your stories, skills, and voice get structured into a knowledge base. The AI learns how you think, how you communicate, and what makes you different from everyone else in your field.",
                footer: "PROCESSING: MINUTES_NOT_DAYS",
                badge: null,
              },
              {
                module: "MODULE_03",
                icon: <Rocket className="h-8 w-8" />,
                color: "bg-[#86EFAC]",
                title: "YOU\nGO LIVE",
                desc: "Your profile goes live at myproxy.work/you — a public page with an AI chatbot that answers recruiter questions in your voice, 24/7, without you having to be there.",
                footer: "STATUS: PRODUCTION_READY",
                badge: null,
              },
              {
                module: "MODULE_04",
                icon: <Target className="h-8 w-8" />,
                color: "bg-[#FDE68A]",
                title: "YOUR\nAGENT",
                desc: "Track applications | Research companies | Draft outreach | Prep for interviews — your job search, organised and intelligent. One place for the whole journey.",
                footer: "STATUS: COMING_SOON",
                badge: "SOON",
              },
            ].map((item, i) => (
              <div key={i} className={`brutal-card border-black ${item.color} p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative`} data-testid={`card-module-${i + 1}`}>
                {item.badge && (
                  <div className="absolute top-2 right-2 bg-black text-white px-2 py-1 mono text-xs">{item.badge}</div>
                )}
                <div className="mono text-sm text-black/60 mb-4 uppercase">{item.module}</div>
                <div className="w-16 h-16 bg-white border-[3px] border-black flex items-center justify-center mb-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 whitespace-pre-line">{item.title}</h3>
                <div className="mono text-sm text-black/80 leading-relaxed">
                  {item.desc}
                </div>
                <div className="mt-6 mono text-xs text-black/60">
                  {item.footer}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-6 py-20 border-t-[3px] border-black bg-[#D1D1CC]">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-xs text-black/50 mb-4 uppercase tracking-widest">&#9698; Deployment Tiers</div>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <h2 className="text-5xl font-bold">CHOOSE YOUR PLAN</h2>
            <div className="bg-black text-[#22C55E] px-4 py-2 font-bold mono text-sm border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(34,197,94,1)] uppercase tracking-wider" data-testid="badge-launch-special">
              &#9733; FOUNDING MEMBER PRICING
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-8">

            <div className="brutal-card border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" data-testid="card-tier-free">
              <div className="mono text-xs text-black/50 mb-2 uppercase">STARTER</div>
              <h3 className="text-3xl font-bold mb-4">FREE</h3>
              <div className="mb-6">
                <div className="text-6xl font-bold mono" data-testid="text-price-free">$0</div>
                <div className="mono text-xs text-black/50 mt-1 uppercase tracking-wider">No credit card needed</div>
              </div>
              <div className="space-y-3 mb-8 text-sm">
                {["AI_PORTFOLIO + CHATBOT", "PERSONAL_PAGE (myproxy.work/you)", "1_EDIT WITHIN 48HRS", "BASIC_VIEW_COUNT"].map((f, i) => (
                  <div key={i} className="flex gap-2 mono text-black/70">
                    <span className="text-[#22C55E] font-bold shrink-0">&#10003;</span> {f}
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/portfolio/test2?demo=true")}
                className="w-full bg-black hover:bg-gray-800 text-white py-4 font-bold mono border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
                data-testid="button-deploy-free"
              >
                GET STARTED FREE &rarr;
              </button>
              <div className="mt-4 mono text-xs text-black/50">USE_CASE: Try it out | See your Twin in action</div>
            </div>

            <div className="brutal-card border-black bg-[#22C55E] p-8 relative transform lg:scale-105 lg:-mt-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" data-testid="card-tier-pro">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 font-bold mono text-xs border-[3px] border-black">
                RECOMMENDED
              </div>
              <div className="mono text-xs text-black/60 mb-2 uppercase">MOST_POPULAR</div>
              <h3 className="text-3xl font-bold mb-4">PRO</h3>
              <div className="mb-6">
                <div className="mono text-lg text-black/40 line-through mb-1" data-testid="text-original-price-pro">$99</div>
                <div className="text-6xl font-bold mono" data-testid="text-price-pro">$49</div>
                <div className="mono text-xs text-black/60 mt-1 uppercase tracking-wider">One-time payment</div>
              </div>
              <div className="space-y-3 mb-8 text-sm">
                {["EVERYTHING_IN_FREE", "UNLIMITED_EDITS", "FULL_ANALYTICS_DASHBOARD", "VISITOR_QUESTIONS_FEED", "PRIORITY_PROCESSING"].map((f, i) => (
                  <div key={i} className="flex gap-2 mono text-black">
                    <span className="text-black font-bold shrink-0">&#10003;</span> {f}
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/portfolio/test2?demo=true")}
                className="w-full bg-black hover:bg-gray-800 text-white py-4 font-bold mono border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
                data-testid="button-deploy-pro"
              >
                GET PRO — $49 &rarr;
              </button>
              <div className="mt-4 mono text-xs text-black/70">USE_CASE: Active job search | Career pivot</div>
            </div>

            <div className="brutal-card border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" data-testid="card-tier-concierge">
              <div className="mono text-xs text-black/50 mb-2 uppercase">PREMIUM</div>
              <h3 className="text-3xl font-bold mb-4">CONCIERGE</h3>
              <div className="mb-6">
                <div className="mono text-lg text-black/40 line-through mb-1" data-testid="text-original-price-concierge">$999</div>
                <div className="text-6xl font-bold mono" data-testid="text-price-concierge">$499</div>
                <div className="mono text-xs text-black/50 mt-1 uppercase tracking-wider">One-time payment</div>
              </div>
              <div className="space-y-3 mb-8 text-sm">
                {["EVERYTHING_IN_PRO", "PERSONAL_DISCOVERY_CALL", "PRO_COPYWRITING", "CUSTOM_BRANDING", "HANDS_ON_OPTIMIZATION", "PRIORITY_SUPPORT"].map((f, i) => (
                  <div key={i} className="flex gap-2 mono text-black/70">
                    <span className="text-[#22C55E] font-bold shrink-0">&#10003;</span> {f}
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/portfolio/test2?demo=true")}
                className="w-full bg-black hover:bg-gray-800 text-white py-4 font-bold mono border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
                data-testid="button-deploy-concierge"
              >
                GET CONCIERGE — $499 &rarr;
              </button>
              <div className="mt-4 mono text-xs text-black/50">USE_CASE: Executive positioning | Brand building</div>
            </div>

          </div>

          <div className="text-center py-4 border-t-[2px] border-black/20" data-testid="text-founding-member">
            <p className="mono text-sm text-black/60 uppercase tracking-wider">
              Founding member pricing &mdash; Start free, upgrade when you're ready.
            </p>
            <Link href="/faq">
              <span className="block mt-4 text-black/50 text-sm hover:text-black/80 transition cursor-pointer">
                Questions before you decide? Read our FAQ &rarr;
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-32">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-5xl lg:text-7xl font-bold mb-8 leading-none" data-testid="text-final-cta">
            DON'T JUST<br />
            SEND A RESUME.<br />
            <span className="text-[#22C55E]">DEPLOY AN AGENT.</span>
          </h2>

          <div className="mono text-xl text-black/60 mb-12">
            127 PROFESSIONALS ALREADY DEPLOYED
          </div>

          <div className="terminal-input border-black text-black mb-8 max-w-2xl mx-auto shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-black/30">$</span> BUILD_YOUR_PROXY --name=YOUR_NAME
          </div>

          <button
            onClick={() => navigate("/portfolio/test2?demo=true")}
            className="bg-[#22C55E] hover:bg-[#16A34A] text-black px-16 py-5 text-xl font-bold mono border-[3px] border-black uppercase tracking-wider shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            data-testid="button-final-cta"
          >
            ENGAGE &rarr;
          </button>
        </div>
      </section>

      <footer className="border-t-[3px] border-black py-12 px-6 bg-[#D1D1CC]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#22C55E] border-[3px] border-black flex items-center justify-center font-bold text-black text-xl">
                P
              </div>
              <div>
                <div className="font-bold text-xl">PROXY</div>
                <div className="mono text-xs text-black/50">24/7 Career Representative</div>
              </div>
            </div>
            <div className="flex gap-6 mono text-xs font-bold uppercase tracking-widest text-black/50">
              <Link href="/about"><span className="cursor-pointer hover:text-black">About</span></Link>
              <Link href="/blog"><span className="cursor-pointer hover:text-black">Blog</span></Link>
              <Link href="/faq"><span className="cursor-pointer hover:text-black">FAQ</span></Link>
              <Link href="/privacy"><span className="cursor-pointer hover:text-black">Privacy</span></Link>
              <Link href="/terms"><span className="cursor-pointer hover:text-black">Terms</span></Link>
              <a href="#pricing" className="cursor-pointer hover:text-black">Pricing</a>
              <a href="mailto:vinos@myproxy.work" className="cursor-pointer hover:text-black">vinos@myproxy.work</a>
              <span className="opacity-30">SYS_ID: PROXY_v1.0 | &copy;2026</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
