import { useState } from "react";
import { Link, useLocation } from "wouter";
import { FileText, Zap, Rocket, X, Check, Send, Loader2 } from "lucide-react";
import ProxyLogo from "@/components/ProxyLogo";
import { getCsrfToken } from "@/lib/queryClient";

export default function LandingPage() {
  const [, navigate] = useLocation();

  // Live chat-in-hero — ask the demo profile a real question, no click-through.
  // Uses the same public, unauthenticated /api/chat/:username endpoint the
  // portfolio page itself uses.
  const [heroQuestion, setHeroQuestion] = useState("");
  const [heroAnswer, setHeroAnswer] = useState("");
  const [heroAsking, setHeroAsking] = useState(false);
  // Real answers for the two suggested questions, matching Priya's actual profile
  // content — used as a fallback if the live API call fails, so a slow proxy or a
  // cold demo environment never shows a visible error in the hero.
  const heroSuggestions: Array<{ q: string; fallback: string }> = [
    {
      q: "How did you migrate 40,000 accounts with zero downtime?",
      fallback: "We ran three full rehearsal cutovers before the live weekend, with a six-week parallel reconciliation window so we could catch discrepancies before they touched a client account. That discipline is how we got to zero downtime on 40,000 accounts.",
    },
    {
      q: "What's your approach when you inherit a struggling team?",
      fallback: "I spend the first 30 days listening before changing anything. Most operational problems are process problems, not people problems — you can't tell the difference until you understand how the work actually gets done.",
    },
  ];

  const askHeroDemo = async (question: string, fallback?: string) => {
    const text = question.trim();
    if (!text || heroAsking) return;
    setHeroAsking(true);
    setHeroAnswer("");
    try {
      const csrfToken = getCsrfToken();
      const response = await fetch("/api/chat/priya", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        body: JSON.stringify({ message: text }),
      });
      if (!response.ok) {
        setHeroAnswer(fallback || "That's worth a real answer — ask it on the full profile below.");
        return;
      }
      const data = await response.json();
      setHeroAnswer(data.content || fallback || "");
    } catch {
      setHeroAnswer(fallback || "That's worth a real answer — ask it on the full profile below.");
    } finally {
      setHeroAsking(false);
    }
  };

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
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-3" data-testid="text-hero-headline">
                Every candidate at your level has the same CV.
              </h1>
              <p className="text-2xl lg:text-3xl font-bold text-[#22C55E] mb-6">
                Get more recruiter responses. Get to interview faster.
              </p>
              <p className="text-xl text-black/70 mb-8">
                Give recruiters a way to know you better, before they speak with you. Share one link — your personalised bot explains what made your work matter, and gets you to the call already ahead.
              </p>
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => navigate("/try")}
                  className="bg-[#22C55E] text-black px-8 py-4 font-bold hover:bg-[#16A34A] border-[3px] border-black mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  data-testid="button-hero-cta"
                >
                  Try It With Your CV — Free &rarr;
                </button>
                <a
                  href="https://myproxy.work/portfolio/priya"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-black px-8 py-4 font-bold border-[3px] border-black hover:bg-gray-100 mono shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex flex-col items-center"
                  data-testid="button-view-demo"
                >
                  <span className="uppercase tracking-wider text-sm">See a live example &rarr;</span>
                  <span className="text-xs text-black/50 font-normal normal-case tracking-normal mt-0.5">Try asking Priya's Bot a question</span>
                </a>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5 mono text-xs font-bold uppercase tracking-wider text-black/60">
                <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#22C55E]" /> No account to try it</span>
                <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#22C55E]" /> Free to start</span>
                <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#22C55E]" /> Private until you publish</span>
              </div>
              <button
                onClick={() => navigate("/register")}
                className="text-sm text-black/50 hover:text-black underline mt-3"
              >
                Already sure? Create an account directly &rarr;
              </button>
              <p className="text-base font-semibold text-black mt-5">
                Professional enough to send to a headhunter. Personal enough to actually represent you.
              </p>
              <div className="mt-4 bg-[#F0FDF4] border-[2px] border-[#22C55E] px-4 py-3">
                <p className="text-sm text-black/80">
                  🔒 <strong>Your data stays yours.</strong> Your profile is private until you publish it. We don't sell your data or use it to train AI models.
                </p>
              </div>
            </div>

            {/* Right column — a live, scaled Executive-theme card. Same paper
                background, serif headline, hairline borders and mono labels
                as the real portfolio page, so what you see here is what you
                get — not the landing page's own separate look. */}
            <div className="border border-[#DBD9CD] bg-[#F2F1EC] text-[#1B211E]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif" }}>
              <style>{`
                .hero-dossier-serif { font-family: "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif; }
                .hero-dossier-mono { font-family: "SF Mono", "IBM Plex Mono", Menlo, Consolas, monospace; }
              `}</style>

              <div className="flex items-center justify-between px-5 py-3 border-b border-[#DBD9CD]">
                <div className="hero-dossier-mono text-[11px] tracking-wide text-[#5B6158]">
                  PROXY / EXECUTIVE PROFILE
                </div>
                <div className="hero-dossier-mono text-[11px] uppercase tracking-wider text-[#5B6158] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F5D4C] inline-block" />
                  Published
                </div>
              </div>

              <div className="px-5 pt-5 pb-4 border-b border-[#DBD9CD]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#2F5D4C] flex items-center justify-center hero-dossier-serif text-[#F2F1EC] text-lg shrink-0">P</div>
                  <div>
                    <div className="hero-dossier-serif text-[20px] leading-tight">Priya Anand</div>
                    <div className="hero-dossier-mono text-[11px] text-[#5B6158] uppercase tracking-wide">VP, Talent Acquisition & Workforce Strategy</div>
                  </div>
                </div>
              </div>

              <video
                src="/priya-demo.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full border-b border-[#DBD9CD] block"
              />

              <div className="px-5 py-5">
                <h3 className="hero-dossier-serif text-[17px] mb-1">Ask directly</h3>
                <div className="hero-dossier-mono text-[10.5px] text-[#8B8F84] mb-4">Answered by her AI proxy, from her own record.</div>

                {heroAnswer && (
                  <div className="hero-dossier-serif text-[15px] leading-relaxed pl-4 border-l border-[#C3C0B0] mb-4" data-testid="text-hero-answer">
                    {heroAnswer}
                  </div>
                )}
                {heroAsking && (
                  <div className="flex items-center gap-2 text-[#8B8F84] text-sm mb-4">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Answering…
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    askHeroDemo(heroQuestion);
                  }}
                  className="flex gap-2.5 border-t border-[#DBD9CD] pt-4"
                >
                  <input
                    value={heroQuestion}
                    onChange={(e) => setHeroQuestion(e.target.value)}
                    placeholder="Ask about a project, a decision, or a result…"
                    className="flex-1 bg-transparent border-b border-[#C3C0B0] px-0.5 py-2 text-[14px] text-[#1B211E] outline-none focus:border-[#2F5D4C] placeholder:text-[#8B8F84]"
                    data-testid="input-hero-chat"
                  />
                  <button
                    type="submit"
                    disabled={heroAsking || !heroQuestion.trim()}
                    className="hero-dossier-mono text-[11px] uppercase tracking-wide border border-[#1B211E] px-4 disabled:opacity-40 hover:bg-[#1B211E] hover:text-[#F2F1EC] transition-colors"
                    data-testid="button-hero-chat-send"
                  >
                    {heroAsking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Ask"}
                  </button>
                </form>

                {!heroAnswer && !heroAsking && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {heroSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => { setHeroQuestion(s.q); askHeroDemo(s.q, s.fallback); }}
                        className="hero-dossier-mono text-[10.5px] text-[#5B6158] border border-[#C3C0B0] px-3 py-1.5 text-left hover:border-[#2F5D4C] hover:text-[#2F5D4C] transition-colors"
                        data-testid={`button-hero-suggestion-${i}`}
                      >
                        {s.q}
                      </button>
                    ))}
                  </div>
                )}

                <p className="hero-dossier-mono text-[10.5px] text-[#8B8F84] mt-4 text-center">
                  Real conversation ·{" "}
                  <a href="https://myproxy.work/portfolio/priya" target="_blank" rel="noopener noreferrer" className="text-[#2F5D4C] hover:underline">see the full profile</a>
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 1.5 Trust strip */}
      <div className="border-t-[3px] border-b-[3px] border-black bg-[#F5F5F0] py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 mono text-xs uppercase tracking-widest text-black/50">
          <span>Trusted by professionals at</span>
          <span className="font-bold text-black">Airtable</span>
          <span>·</span>
          <span className="font-bold text-black">HSBC</span>
          <span>·</span>
          <span className="font-bold text-black">J&amp;J</span>
        </div>
      </div>

      {/* 2. Problem / Solution */}
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

      {/* 4. How It Works */}
      <section id="how" className="px-6 py-20 border-t-[3px] border-black bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-sm text-black/50 mb-4 uppercase tracking-widest">// how_it_works</div>
          <h2 className="text-5xl font-bold mb-16">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border-[3px] border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="mono text-xs text-black/60 mb-2 uppercase tracking-widest">// step_01</div>
              <div className="text-6xl font-bold text-[#22C55E]">01</div>
              <div className="flex items-center gap-3 mb-4 mt-4">
                <div className="w-12 h-12 bg-[#E8E8E3] border-[2px] border-black flex items-center justify-center shrink-0">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="mono text-xs font-bold border-[2px] border-black bg-white px-2 py-1 uppercase tracking-wider">~30 min</span>
              </div>
              <h3 className="text-2xl font-bold mt-4 mb-3">Upload your CV</h3>
              <p className="mono text-sm text-black/70 leading-relaxed">AI writes the first draft — your experience, your roles, your language. You review, correct anything that feels off, and add the stories only you know. Most people are done in 30 minutes. Worth it once to stand out from every other candidate at your level.</p>
            </div>

            <div className="border-[3px] border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="mono text-xs text-black/60 mb-2 uppercase tracking-widest">// step_02</div>
              <div className="text-6xl font-bold text-[#22C55E]">02</div>
              <div className="flex items-center gap-3 mb-4 mt-4">
                <div className="w-12 h-12 bg-[#E8E8E3] border-[2px] border-black flex items-center justify-center shrink-0">
                  <Rocket className="h-6 w-6" />
                </div>
                <span className="mono text-xs font-bold border-[2px] border-black bg-white px-2 py-1 uppercase tracking-wider">Automatic</span>
              </div>
              <h3 className="text-2xl font-bold mt-4 mb-3">Your profile goes live</h3>
              <p className="mono text-sm text-black/70 leading-relaxed">A personal page at myproxy.work/you — with an AI chatbot trained on your exact background, available 24/7.</p>
            </div>

            <div className="border-[3px] border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="mono text-xs text-black/60 mb-2 uppercase tracking-widest">// step_03</div>
              <div className="text-6xl font-bold text-[#22C55E]">03</div>
              <div className="flex items-center gap-3 mb-4 mt-4">
                <div className="w-12 h-12 bg-[#E8E8E3] border-[2px] border-black flex items-center justify-center shrink-0">
                  <Zap className="h-6 w-6" />
                </div>
                <span className="mono text-xs font-bold border-[2px] border-black bg-white px-2 py-1 uppercase tracking-wider">24/7</span>
              </div>
              <h3 className="text-2xl font-bold mt-4 mb-3">Recruiters engage</h3>
              <p className="mono text-sm text-black/70 leading-relaxed">They ask questions, get real answers from your AI, and reach out already knowing why you're a fit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Why candidates use Proxy */}
      <section className="px-6 py-20 border-t-[3px] border-black bg-[#E8E8E3]">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-sm text-black/50 mb-4 uppercase tracking-widest">// why_candidates_use_proxy</div>
          <h2 className="text-5xl font-bold mb-16">What you actually get.</h2>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left — why */}
            <div>
              <h3 className="text-xl font-bold mb-6 mono uppercase tracking-wider">Why candidates use it</h3>
              <div className="space-y-4">
                {[
                  { title: "More recruiter responses", desc: "Recruiters get answers before they ask. Less friction = more replies." },
                  { title: "Get referred more easily", desc: "Give contacts the context to actually vouch for you — not just forward your CV." },
                  { title: "Start the interview before it begins", desc: "They arrive already knowing your work. The call starts one step ahead." },
                  { title: "One link instead of five documents", desc: "Resume, LinkedIn, portfolio, references — all in one place, always up to date." },
                  { title: "Stand out from candidates using only resumes", desc: "At your level, everyone has the same CV. This is how you don't." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-[#22C55E] mt-2 shrink-0 border border-black"></div>
                    <div>
                      <div className="font-bold text-black">{item.title}</div>
                      <div className="mono text-sm text-black/60 leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — what happens after */}
            <div>
              <h3 className="text-xl font-bold mb-6 mono uppercase tracking-wider">What happens after you create one</h3>
              <div className="space-y-4">
                {[
                  { step: "01", text: "Share your link in LinkedIn DMs when reaching out to recruiters" },
                  { step: "02", text: "Add it to job applications alongside your CV" },
                  { step: "03", text: "Put it in your email signature — every email becomes a door" },
                  { step: "04", text: "Recruiters ask your AI questions, get real answers in your voice" },
                  { step: "05", text: "More qualified conversations. Fewer cold rejections." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 border-[2px] border-black bg-white p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <div className="mono text-2xl font-bold text-[#22C55E] shrink-0">{item.step}</div>
                    <p className="mono text-sm text-black/70 leading-relaxed pt-1">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Referral edge */}
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

      {/* 7.7 Comparison table */}
      <section className="px-6 py-20 border-t-[3px] border-black bg-[#E8E8E3]">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-sm text-black/50 mb-4 uppercase tracking-widest">// the_comparison</div>
          <h2 className="text-5xl font-bold mb-4">A portfolio page is a résumé you can scroll.</h2>
          <p className="text-2xl font-bold text-[#22C55E] mb-16">Proxy is a résumé you can talk to.</p>

          <div className="overflow-x-auto border-[3px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-b-[3px] border-black">
                  <th className="text-left p-5 mono text-xs uppercase tracking-widest text-black/50 font-bold">Feature</th>
                  <th className="text-left p-5 bg-[#22C55E] mono text-sm uppercase tracking-widest font-bold">Proxy</th>
                  <th className="text-left p-5 mono text-sm uppercase tracking-widest text-black/60 font-bold">Resume / CV</th>
                  <th className="text-left p-5 mono text-sm uppercase tracking-widest text-black/60 font-bold">LinkedIn Profile</th>
                  <th className="text-left p-5 mono text-sm uppercase tracking-widest text-black/60 font-bold">Portfolio Site</th>
                </tr>
              </thead>
              <tbody className="mono text-sm">
                {[
                  { feature: "Answers a recruiter's follow-up question", proxy: "✓ 24/7", resume: "✗", linkedin: "✗", portfolio: "✗" },
                  { feature: "Explains why an achievement mattered", proxy: "✓", resume: "✗ Lists only", linkedin: "Partial", portfolio: "✗ Lists only" },
                  { feature: "One link, always current", proxy: "✓", resume: "✗", linkedin: "Partial", portfolio: "✓" },
                  { feature: "Tracks your job search", proxy: "✓ Built-in CRM", resume: "✗", linkedin: "✗", portfolio: "✗" },
                  { feature: "Setup time", proxy: "~30 min", resume: "Redone per application", linkedin: "Ongoing upkeep", portfolio: "~2 min" },
                  { feature: "Cost", proxy: "Free to start · $49 once", resume: "$500–800 (writer)", linkedin: "Free", portfolio: "Often free" },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-black/10 last:border-b-0">
                    <td className="p-5 font-bold text-black">{row.feature}</td>
                    <td className="p-5 bg-[#F0FDF4] font-bold text-black">{row.proxy}</td>
                    <td className="p-5 text-black/60">{row.resume}</td>
                    <td className="p-5 text-black/60">{row.linkedin}</td>
                    <td className="p-5 text-black/60">{row.portfolio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mono text-xs text-black/50 mt-4">
            Yes, a bare portfolio link is faster to set up. It also can't answer a single question about your work after someone reads it.
          </p>
        </div>
      </section>

      {/* 7.5 Testimonials */}
      <section className="px-6 py-20 border-t-[3px] border-black bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-sm text-black/50 mb-4 uppercase tracking-widest">// what_people_say</div>
          <h2 className="text-5xl font-bold mb-16">Real profiles. Real results.</h2>
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="border-[3px] border-black bg-[#E8E8E3] p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-base text-black/80 mb-6 leading-relaxed">
                "I honestly didn't expect the 45 minutes I spent building my Proxy profile to make such a difference. I went beyond my CV and talked about the projects I've worked on, the lessons I've learned, the decisions I've made and, importantly, how I actually work. That context <strong className="text-black">made the AI bot sound surprisingly like me — not like a generic career assistant.</strong> When someone is evaluating you for a senior role, that ability to communicate the story behind the experience is incredibly valuable."
              </p>
              <div className="mono text-sm font-bold text-black">Steven Bong</div>
              <div className="mono text-xs text-black/50 uppercase tracking-wider mt-0.5">TA Strategy @ Airtable</div>
            </div>
            <div className="border-[3px] border-black bg-[#E8E8E3] p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-base text-black/80 mb-6 leading-relaxed">
                "I started by simply uploading my CV to see what Proxy would do with it. The initial profile was already impressive, but what I really liked was being able to keep adding detail and customise the story around my experience. The designs are clean and genuinely <strong className="text-black">make your career look more interesting than a traditional CV ever could.</strong> I've shared my portfolio with recruiters and the feedback has been very positive — it gives them a much better way to understand what I've actually done."
              </p>
              <div className="mono text-sm font-bold text-black">John Lima</div>
              <div className="mono text-xs text-black/50 uppercase tracking-wider mt-0.5">Portfolio Manager @ HSBC</div>
            </div>
            <div className="border-[3px] border-black bg-[#E8E8E3] p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-base text-black/80 mb-6 leading-relaxed">
                "<strong className="text-black">The Job Search CRM is probably the feature I didn't know I needed.</strong> Once you're managing multiple conversations, applications, recruiters and follow-ups, it's surprisingly easy to lose track of things. Proxy gives me one place to organise the search and actually stay on top of it. The combination of the portfolio, AI assistant and CRM makes the whole process much more structured — I'm spending less time trying to remember what I need to do and more time actually moving opportunities forward."
              </p>
              <div className="mono text-sm font-bold text-black">Anthony Souza</div>
              <div className="mono text-xs text-black/50 uppercase tracking-wider mt-0.5">Clinical Research Strategy @ J&J</div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Pricing */}
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

      {/* 9. Final CTA */}
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
