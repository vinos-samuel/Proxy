import { Link, useLocation } from "wouter";
import { FileText, Zap, Rocket, X, Check } from "lucide-react";
import ProxyLogo from "@/components/ProxyLogo";

export default function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-white text-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Nav */}
      <nav className="border-b-[3px] border-black bg-[#D1D1CC] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/">
            <div className="cursor-pointer" data-testid="text-brand-name">
              <ProxyLogo />
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/about"><span className="mono text-sm text-black/60 hover:text-black uppercase tracking-wider cursor-pointer">About</span></Link>
            <Link href="/blog"><span className="mono text-sm text-black/60 hover:text-black uppercase tracking-wider cursor-pointer">Blog</span></Link>
            <Link href="/faq"><span className="mono text-sm text-black/60 hover:text-black uppercase tracking-wider cursor-pointer">FAQ</span></Link>
            <a href="#how" className="mono text-sm text-black/60 hover:text-black uppercase tracking-wider">How</a>
            <a href="#pricing" className="mono text-sm text-black/60 hover:text-black uppercase tracking-wider">Pricing</a>
            <button
              onClick={() => navigate("/login")}
              className="mono text-sm text-black/60 hover:text-black uppercase tracking-wider"
              data-testid="link-login"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/portfolio/priya?demo=true")}
              className="bg-[#22C55E] text-black px-6 py-3 font-bold hover:bg-[#16A34A] border-[3px] border-black mono text-sm uppercase tracking-wider"
              data-testid="link-register"
            >
              ENGAGE &rarr;
            </button>
          </div>
        </div>
      </nav>

      {/* 1. Hero */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left column */}
            <div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-4" data-testid="text-hero-headline">
                Every candidate at your level has the same CV.<br />
                <span className="text-[#22C55E]">Proxy is how you stop looking like the other 200 applicants.</span>
              </h1>
              <p className="text-lg text-black/60 mb-8">
                They've all led teams. Cut costs. Hit targets. Proxy builds a career profile that answers recruiter questions in your voice — so the right people actually understand what makes you different.
              </p>
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => navigate("/register")}
                  className="bg-[#22C55E] text-black px-8 py-4 font-bold hover:bg-[#16A34A] border-[3px] border-black mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  data-testid="button-hero-cta"
                >
                  Build Your Profile Free &rarr;
                </button>
                <a
                  href="https://myproxy.work/portfolio/priya"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-black px-8 py-4 font-bold border-[3px] border-black hover:bg-gray-100 mono shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex flex-col items-center"
                  data-testid="button-view-demo"
                >
                  <span className="uppercase tracking-wider text-sm">See a live example &rarr;</span>
                  <span className="text-xs text-black/50 font-normal normal-case tracking-normal mt-0.5">Try asking the AI a question</span>
                </a>
              </div>
              <p className="text-sm text-black/60 mt-4 italic">
                Professional enough to send to a headhunter. Personal enough to actually represent you.
              </p>
              <p className="text-sm text-black/70 mt-6 border-l-[3px] border-[#22C55E] pl-4">
                Your profile is private until you publish it. We don't sell your data or use it to train AI models.
              </p>
            </div>

            {/* Right column — demo video */}
            <div className="border-[3px] border-black bg-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="bg-black text-white p-3 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#22C55E] border-[2px] border-black flex items-center justify-center font-bold text-black text-sm">P</div>
                  <span className="font-bold text-sm">Priya — VP, Talent Acquisition & Workforce Strategy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse"></div>
                  <span className="mono text-xs text-white/60">LIVE</span>
                </div>
              </div>
              <video
                src="/priya-demo.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full"
              />
              <div className="border-t border-white/10 p-3 mono text-xs text-white/40 text-center">
                // real conversation · try it yourself ·{" "}
                <a href="https://myproxy.work/portfolio/priya" target="_blank" rel="noopener noreferrer" className="text-[#22C55E] hover:underline">myproxy.work/portfolio/priya</a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Who it's for */}
      <section className="px-6 py-20 border-t-[3px] border-black bg-[#E8E8E3]">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-sm text-black/50 mb-4 uppercase tracking-widest">// who_its_for</div>
          <h2 className="text-5xl font-bold mb-8">Built for people with more to say.</h2>
          <div className="space-y-4 max-w-3xl">
            <p className="text-xl text-black/70">Mid to senior professionals who have built real careers that don't fit neatly on two pages. Managers, directors, and VPs who know their resume undersells them.</p>
            <p className="text-xl text-black/70">If you've ever been passed over not because you weren't qualified — but because your story didn't land — Proxy is for you.</p>
          </div>
        </div>
      </section>

      {/* 3. Problem / Solution */}
      <section className="px-6 py-20 border-t-[3px] border-black bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-sm text-black/50 mb-4 uppercase tracking-widest">// the_problem</div>
          <h2 className="text-5xl font-bold mb-16">The resume had a good run.</h2>

          <div className="grid lg:grid-cols-2 gap-8">
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

      {/* 4. See it live */}
      <section className="px-6 py-20 border-t-[3px] border-black bg-[#E8E8E3]">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mono text-sm text-black/50 mb-4 uppercase tracking-widest">// see_it_live</div>
          <h2 className="text-5xl font-bold mb-4">Don't take our word for it.</h2>
          <p className="text-xl text-black/60 mb-10 max-w-2xl mx-auto">
            Priya is a real Proxy user — VP of Talent Acquisition with 15+ years across APAC. Her AI Twin is live and answers real questions.
          </p>
          <a
            href="https://myproxy.work/portfolio/priya"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#22C55E] text-black px-10 py-4 font-bold hover:bg-[#16A34A] border-[3px] border-black mono uppercase tracking-wider shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            Visit Priya's Profile &rarr;
          </a>
          <p className="mono text-xs text-black/40 mt-4">Try asking the AI a question — "How did you build the MSP program?"</p>
        </div>
      </section>

      {/* 5. How It Works */}
      <section id="how" className="px-6 py-20 border-t-[3px] border-black bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-sm text-black/50 mb-4 uppercase tracking-widest">// how_it_works</div>
          <h2 className="text-5xl font-bold mb-16">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border-[3px] border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="mono text-xs text-black/60 mb-2 uppercase tracking-widest">// step_01</div>
              <div className="text-6xl font-bold text-[#22C55E]">01</div>
              <div className="w-12 h-12 bg-[#E8E8E3] border-[2px] border-black flex items-center justify-center mb-4 mt-4">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold mt-4 mb-3">Upload your CV</h3>
              <p className="mono text-sm text-black/70 leading-relaxed">AI writes the first draft — your experience, your roles, your language. You review, correct anything that feels off, and add the stories only you know. Most people are done in 30 minutes. Worth it once to stand out from every other candidate at your level.</p>
            </div>

            <div className="border-[3px] border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="mono text-xs text-black/60 mb-2 uppercase tracking-widest">// step_02</div>
              <div className="text-6xl font-bold text-[#22C55E]">02</div>
              <div className="w-12 h-12 bg-[#E8E8E3] border-[2px] border-black flex items-center justify-center mb-4 mt-4">
                <Rocket className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold mt-4 mb-3">Your profile goes live</h3>
              <p className="mono text-sm text-black/70 leading-relaxed">A personal page at myproxy.work/you — with an AI chatbot trained on your exact background, available 24/7.</p>
            </div>

            <div className="border-[3px] border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="mono text-xs text-black/60 mb-2 uppercase tracking-widest">// step_03</div>
              <div className="text-6xl font-bold text-[#22C55E]">03</div>
              <div className="w-12 h-12 bg-[#E8E8E3] border-[2px] border-black flex items-center justify-center mb-4 mt-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold mt-4 mb-3">Recruiters engage</h3>
              <p className="mono text-sm text-black/70 leading-relaxed">They ask questions, get real answers from your AI, and reach out already knowing why you're a fit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. How to use it — NEW */}
      <section className="px-6 py-20 border-t-[3px] border-black bg-[#E8E8E3]">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-sm text-black/50 mb-4 uppercase tracking-widest">// how_to_use_it</div>
          <h2 className="text-5xl font-bold mb-16">Three ways to put it to work.</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border-[3px] border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-4xl mb-4">✉️</div>
              <h3 className="text-xl font-bold mb-3">Add it to your email signature</h3>
              <p className="mono text-sm text-black/70 leading-relaxed">Every email you send becomes a door to your full career story. One click and they're talking to your AI.</p>
            </div>

            <div className="border-[3px] border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-xl font-bold mb-3">Put it on your LinkedIn</h3>
              <p className="mono text-sm text-black/70 leading-relaxed">Add the link to your About section. Let recruiters explore before they reach out — they arrive already informed.</p>
            </div>

            <div className="border-[3px] border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-4xl mb-4">📎</div>
              <h3 className="text-xl font-bold mb-3">Share it instead of a CV</h3>
              <p className="mono text-sm text-black/70 leading-relaxed">When someone asks for your resume, send your Proxy link instead. Give them context, not a document.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. AEO — reframed */}
      <section className="px-6 py-20 border-t-[3px] border-black bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-sm text-[#22C55E] mb-4 uppercase tracking-widest">// ai_discovery</div>
          <h2 className="text-5xl font-bold mb-6">Recruiters search for talent.<br />Their AI does too.</h2>
          <p className="text-xl text-white/70 mb-12 max-w-3xl">
            A recruiter searches "Senior HR Director APAC open to work." Their AI sourcing tool does the same scan. A PDF never shows up in those results. A Proxy profile does — indexed, structured, and readable by both humans and AI.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
            {[
              { label: "Indexed by Google", desc: "Your profile is a live web page — searchable the moment it goes live." },
              { label: "Readable by AI sourcing tools", desc: "When AI agents scan for candidates, structured profiles get surfaced. PDFs don't." },
              { label: "Shareable as a link", desc: "Every share adds more indexed surface area. More surface area means more chances to be found." },
              { label: "Always available", desc: "A recruiter looks at your profile at 11pm on a Sunday. Your AI answers. You don't have to." },
            ].map((item, i) => (
              <div key={i} className="border border-white/20 p-5 bg-white/5 flex items-start gap-4">
                <div className="w-2 h-2 bg-[#22C55E] mt-2 shrink-0"></div>
                <div>
                  <div className="font-bold mb-1">{item.label}</div>
                  <div className="mono text-sm text-white/60 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Referral edge */}
      <section className="px-6 py-20 border-t-[3px] border-black bg-[#E8E8E3]">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-sm text-black/50 mb-6 uppercase tracking-widest">// the_referral_edge</div>
          <div className="flex flex-col lg:flex-row gap-4 items-start mb-10">
            <div className="text-8xl lg:text-9xl font-bold leading-none text-black">5–10x</div>
            <div className="lg:pt-4 max-w-xl">
              <p className="text-xl font-bold text-black mb-1">Referred candidates get hired 5 to 10 times more often than cold applications.</p>
              <p className="mono text-sm text-black/50">— Laszlo Bock, former SVP People Operations, Google</p>
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="border-[3px] border-black p-8 bg-[#D1D1CC] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-2xl font-bold mb-4 text-black/50">THE PROBLEM</h3>
              <div className="space-y-4 text-black/70 mono text-sm leading-relaxed">
                <p>Your network wants to help. But "let me send over their CV" isn't enough to stake a professional reputation on.</p>
                <p>To make a real referral, someone needs to understand your work — what you've built, how you think, what makes you different. A PDF doesn't give them that.</p>
                <p className="font-bold text-black">Most referrals don't happen because the goodwill is there, but the context isn't.</p>
              </div>
            </div>
            <div className="border-[3px] border-black p-8 bg-[#22C55E] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-2xl font-bold mb-4">THE PROXY EDGE</h3>
              <div className="space-y-4 mono text-sm leading-relaxed">
                <p>Share your Proxy link with anyone who's offered to help. They chat with your AI, ask real questions, and get a genuine picture of what you've done.</p>
                <p>They go from "I vaguely know this person" to "I can genuinely vouch for this person" — in minutes, not months.</p>
                <p className="font-bold">The referral happens because they actually understood you.</p>
              </div>
            </div>
          </div>
          <div className="mt-6 mono text-xs text-black/40 text-right">// send a link, not a file</div>
        </div>
      </section>

      {/* 9. Pricing */}
      <section id="pricing" className="px-6 py-20 border-t-[3px] border-black bg-[#D1D1CC]">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-xs text-black/50 mb-4 uppercase tracking-widest">// pricing</div>
          <p className="text-lg text-black/70 mb-6 max-w-2xl">Resume writers charge $500–$800 to reword your CV. Proxy builds you a living profile with an AI that represents you 24/7 — for $49, once.</p>
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

      {/* 10. Final CTA */}
      <section className="px-6 py-32 bg-white">
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
              <ProxyLogo />
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
