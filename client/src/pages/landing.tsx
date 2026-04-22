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

      {/* Hero */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left column */}
            <div>
              <div className="mono text-sm text-black/50 mb-4 uppercase tracking-widest">// career_portfolio</div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6" data-testid="text-hero-headline">
                You've done the work.<br />
                A PDF shouldn't be<br />
                how you're <span className="text-[#22C55E]">judged for it.</span>
              </h1>
              <p className="text-xl text-black/70 mt-6 mb-8 max-w-xl">
                Proxy is a digital portfolio that goes deeper than a resume — it lets recruiters and hiring leaders explore your career, ask questions, and understand what makes you the right fit. Before you even get on a call.
              </p>
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => navigate("/register")}
                  className="bg-[#22C55E] text-black px-8 py-4 font-bold hover:bg-[#16A34A] border-[3px] border-black mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  data-testid="button-hero-cta"
                >
                  Build Your Profile Free &rarr;
                </button>
                <button
                  onClick={() => setShowDemo(true)}
                  className="bg-white text-black px-8 py-4 font-bold border-[3px] border-black hover:bg-gray-100 mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  data-testid="button-view-demo"
                >
                  <span className="flex items-center gap-2">
                    <Play className="h-4 w-4 fill-current" />
                    See a live example
                  </span>
                </button>
              </div>
              <div className="flex gap-8 mt-8 mono text-sm text-black/60">
                <span><strong className="text-black">8 min avg session</strong> · vs 6 sec for a PDF</span>
                <span><strong className="text-black">127 professionals</strong> live</span>
              </div>
            </div>

            {/* Right column — chatbot mockup */}
            <div className="border-[3px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              {/* Top bar */}
              <div className="bg-black text-white p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#22C55E] border-[2px] border-black flex items-center justify-center font-bold text-black text-sm">P</div>
                  <span className="font-bold text-sm">Alex Rivera — VP of Product</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#22C55E] rounded-full"></div>
                  <span className="mono text-xs">LIVE</span>
                </div>
              </div>

              {/* Chat area */}
              <div className="p-4 space-y-3">
                {/* Recruiter bubble */}
                <div className="bg-[#E8E8E3] border border-black/20 p-3 rounded-sm max-w-[80%]">
                  <div className="mono text-xs text-black/40 mb-1">Recruiter</div>
                  <p className="text-sm">What's your approach to cross-functional alignment?</p>
                </div>

                {/* Reply bubble */}
                <div className="bg-[#22C55E] border border-black/20 p-3 rounded-sm max-w-[80%] ml-auto">
                  <div className="mono text-xs text-black/60 mb-1 text-right">Alex's Proxy</div>
                  <p className="text-sm">At my last role, I ran a weekly ritual between eng, design and GTM — 30 mins, no slides, just blockers and decisions...</p>
                </div>

                {/* Typing indicator */}
                <div className="flex items-center gap-1 mt-2">
                  <div className="w-2 h-2 bg-black/30 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-black/30 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-black/30 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="border-t border-black/10 p-3 mono text-xs text-black/40 text-center">
                // responding in real time · myproxy.work/alexrivera
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* One-line strip */}
      <div className="bg-black text-white py-6 text-center border-t-[3px] border-b-[3px] border-black">
        <p className="text-xl font-bold">"Think of it as your LinkedIn — but it actually talks back."</p>
      </div>

      {/* How It Works */}
      <section id="how" className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-sm text-black/50 mb-4 uppercase tracking-widest">// how_it_works</div>
          <h2 className="text-5xl font-bold mb-16">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-8">

            {/* Step 1 */}
            <div className="border-[3px] border-black bg-[#E8A75D] p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="mono text-xs text-black/60 mb-2 uppercase tracking-widest">// step_01</div>
              <div className="text-6xl font-bold">01</div>
              <div className="w-12 h-12 bg-white border-[2px] border-black flex items-center justify-center mb-4 mt-4">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold mt-4 mb-3">Upload your CV</h3>
              <p className="mono text-sm text-black/80 leading-relaxed">AI reads it and pre-fills your profile in minutes. You review, refine, and add your voice.</p>
            </div>

            {/* Step 2 */}
            <div className="border-[3px] border-black bg-[#93C5FD] p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="mono text-xs text-black/60 mb-2 uppercase tracking-widest">// step_02</div>
              <div className="text-6xl font-bold">02</div>
              <div className="w-12 h-12 bg-white border-[2px] border-black flex items-center justify-center mb-4 mt-4">
                <Rocket className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold mt-4 mb-3">Your profile goes live</h3>
              <p className="mono text-sm text-black/80 leading-relaxed">A personal page at myproxy.work/you — with an AI chatbot trained on your exact background, available 24/7.</p>
            </div>

            {/* Step 3 */}
            <div className="border-[3px] border-black bg-[#86EFAC] p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="mono text-xs text-black/60 mb-2 uppercase tracking-widest">// step_03</div>
              <div className="text-6xl font-bold">03</div>
              <div className="w-12 h-12 bg-white border-[2px] border-black flex items-center justify-center mb-4 mt-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold mt-4 mb-3">Recruiters engage</h3>
              <p className="mono text-sm text-black/80 leading-relaxed">They ask questions, get real answers from your AI, and reach out already knowing why you're a fit.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Job Search Agent */}
      <section className="px-6 py-20 bg-black text-white border-t-[3px] border-black">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-sm text-[#22C55E] mb-4 uppercase tracking-widest">// agent_suite</div>
          <h2 className="text-5xl font-bold mb-4">Your AI doesn't just sit there waiting.</h2>
          <p className="text-xl text-white/70 mb-12 max-w-2xl">The Job Search Agent actively works for you — inside a CRM built around your job hunt.</p>

          <div className="grid md:grid-cols-2 gap-4 mb-10">
            {[
              "Write cover letters in your voice",
              "Research companies before you apply",
              "Draft cold outreach messages",
              "Coach your interview prep",
              "Help you negotiate the offer",
              "Write thank you notes after interviews",
            ].map((item, i) => (
              <div key={i} className="border border-white/20 p-5 bg-white/5 flex items-start gap-3">
                <Check className="text-[#22C55E] h-5 w-5 mt-0.5 shrink-0" />
                <span className="font-bold">{item}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate("/register")}
              className="bg-[#22C55E] text-black px-10 py-4 font-bold hover:bg-[#16A34A] border-[3px] border-[#22C55E] mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(34,197,94,0.4)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              Included with Pro &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* Problem comparison */}
      <section className="px-6 py-20 border-t-[3px] border-black">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-sm text-black/50 mb-4 uppercase tracking-widest">// the_problem</div>
          <h2 className="text-5xl font-bold mb-16">The resume had a good run.</h2>

          <div className="grid lg:grid-cols-2 gap-8">

            {/* Resume card */}
            <div className="bg-[#D1D1CC] border-[3px] border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-3xl font-bold mb-6 text-black/50">THE RESUME</h3>
              <div className="space-y-5">
                {[
                  { title: "6-second scan, then silence", desc: "One-way broadcast" },
                  { title: "Lost in the ATS", desc: "87% never reach a human" },
                  { title: "Static — says what you did", desc: "Doesn't explain why it mattered" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <X className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-black">{item.title}</div>
                      <div className="mono text-sm text-black/60">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Proxy card */}
            <div className="bg-[#22C55E] border-[3px] border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-3xl font-bold mb-6">YOUR PROXY</h3>
              <div className="space-y-5">
                {[
                  { title: "8-minute conversation, then a call", desc: "Two-way engagement" },
                  { title: "Shared as a link, direct to a human", desc: "No ATS. Straight to the person." },
                  { title: "Dynamic — explains why it mattered", desc: "Your stories, your metrics, your voice" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-black mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-black">{item.title}</div>
                      <div className="mono text-sm text-black/70">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="px-6 py-20 border-t-[3px] border-black bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-sm text-black/50 mb-4 uppercase tracking-widest">// who_its_for</div>
          <h2 className="text-5xl font-bold mb-8">Built for people with more to say.</h2>
          <div className="space-y-4 max-w-3xl">
            <p className="text-xl text-black/70">Mid to senior professionals who have built real careers that don't fit neatly on two pages. Managers, directors, and VPs who know their resume undersells them.</p>
            <p className="text-xl text-black/70">If you've ever been passed over not because you weren't qualified — but because your story didn't land — Proxy is for you.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-20 border-t-[3px] border-black bg-[#D1D1CC]">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-xs text-black/50 mb-4 uppercase tracking-widest">// pricing</div>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <h2 className="text-5xl font-bold">CHOOSE YOUR PLAN</h2>
            <div className="bg-black text-[#22C55E] px-4 py-2 font-bold mono text-sm border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(34,197,94,1)] uppercase tracking-wider" data-testid="badge-launch-special">
              &#9733; FOUNDING MEMBER PRICING
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-8">

            {/* Free */}
            <div className="border-[3px] border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" data-testid="card-tier-free">
              <div className="mono text-xs text-black/50 mb-2 uppercase">STARTER</div>
              <h3 className="text-3xl font-bold mb-4">FREE</h3>
              <div className="mb-6">
                <div className="text-6xl font-bold mono" data-testid="text-price-free">$0</div>
                <div className="mono text-xs text-black/50 mt-1 uppercase tracking-wider">No credit card needed</div>
              </div>
              <div className="space-y-3 mb-8 text-sm">
                {[
                  "AI portfolio + chatbot",
                  "Personal page (myproxy.work/you)",
                  "1 edit within 48hrs",
                  "Basic view count",
                ].map((f, i) => (
                  <div key={i} className="flex gap-2 mono text-black/70">
                    <span className="text-[#22C55E] font-bold shrink-0">&#10003;</span> {f}
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/register")}
                className="w-full bg-black hover:bg-gray-800 text-white py-4 font-bold mono border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
                data-testid="button-deploy-free"
              >
                Get Started Free &rarr;
              </button>
            </div>

            {/* Pro */}
            <div className="border-[3px] border-black bg-[#22C55E] p-8 relative transform lg:scale-105 lg:-mt-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" data-testid="card-tier-pro">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 font-bold mono text-xs border-[3px] border-black">
                RECOMMENDED
              </div>
              <div className="mono text-xs text-black/60 mb-2 uppercase">MOST_POPULAR</div>
              <h3 className="text-3xl font-bold mb-4">PRO</h3>
              <div className="mb-6">
                <div className="text-6xl font-bold mono" data-testid="text-price-pro">$49</div>
                <div className="mono text-xs text-black/60 mt-1 uppercase tracking-wider">One-time payment</div>
              </div>
              <div className="space-y-3 mb-8 text-sm">
                {[
                  "Everything in Free",
                  "Unlimited edits",
                  "Full analytics dashboard",
                  "Visitor questions feed",
                  "Job Search Agent (CRM)",
                  "Priority processing",
                ].map((f, i) => (
                  <div key={i} className="flex gap-2 mono text-black">
                    <span className="text-black font-bold shrink-0">&#10003;</span> {f}
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/register")}
                className="w-full bg-black hover:bg-gray-800 text-white py-4 font-bold mono border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
                data-testid="button-deploy-pro"
              >
                Get Pro — $49 &rarr;
              </button>
            </div>

            {/* Concierge */}
            <div className="border-[3px] border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" data-testid="card-tier-concierge">
              <div className="mono text-xs text-black/50 mb-2 uppercase">PREMIUM</div>
              <h3 className="text-3xl font-bold mb-4">CONCIERGE</h3>
              <div className="mb-6">
                <div className="text-6xl font-bold mono" data-testid="text-price-concierge">$499</div>
                <div className="mono text-xs text-black/50 mt-1 uppercase tracking-wider">One-time payment</div>
              </div>
              <div className="space-y-3 mb-8 text-sm">
                {[
                  "Everything in Pro",
                  "Personal discovery call",
                  "Professional copywriting",
                  "Custom branding",
                  "Hands-on optimization",
                  "Priority support",
                ].map((f, i) => (
                  <div key={i} className="flex gap-2 mono text-black/70">
                    <span className="text-[#22C55E] font-bold shrink-0">&#10003;</span> {f}
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/register")}
                className="w-full bg-black hover:bg-gray-800 text-white py-4 font-bold mono border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
                data-testid="button-deploy-concierge"
              >
                Get Concierge — $499 &rarr;
              </button>
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

      {/* Final CTA */}
      <section className="px-6 py-32">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight" data-testid="text-final-cta">
            Your career deserves<br />
            a better first impression.
          </h2>
          <p className="mono text-xl text-black/60 mb-10">Free to start. Takes 10 minutes.</p>
          <button
            onClick={() => navigate("/register")}
            className="bg-[#22C55E] hover:bg-[#16A34A] text-black px-16 py-5 text-xl font-bold mono border-[3px] border-black uppercase tracking-wider shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            data-testid="button-final-cta"
          >
            Build Your Profile &rarr;
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
