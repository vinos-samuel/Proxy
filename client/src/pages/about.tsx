import { motion } from "framer-motion";
import { Link } from "wouter";
import { Brain, Target, Rocket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#E8E8E3] text-black selection:bg-[#22C55E]/30" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Navigation */}
      <nav className="border-b-[3px] border-black bg-white sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-8 h-8 bg-black flex items-center justify-center border-[2px] border-black group-hover:bg-[#22C55E] transition-colors">
                <span className="text-white font-black text-xl leading-none">P</span>
              </div>
              <span className="font-bold text-xl tracking-tighter">PROXY</span>
            </div>
          </Link>
          <div className="flex gap-8 mono text-xs font-bold uppercase tracking-widest">
            <Link href="/about"><span className="cursor-pointer hover:text-[#22C55E] border-b-2 border-black">About</span></Link>
            <Link href="/faq"><span className="cursor-pointer hover:text-[#22C55E]">FAQ</span></Link>
            <Link href="/pricing"><span className="cursor-pointer hover:text-[#22C55E]">Pricing</span></Link>
          </div>
        </div>
      </nav>
      {/* Section 1 — Hero */}
      <section className="px-6 py-24 border-b-[3px] border-black bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mono text-xs text-black/50 mb-4 uppercase tracking-widest">&#9698; Mission Statement</div>
            <h1 className="text-6xl lg:text-8xl font-bold mb-8 leading-none">
              Built for the <span className="text-[#22C55E]">other side</span> of the table.
            </h1>
            <p className="mono text-xl text-black/60 max-w-2xl mx-auto leading-relaxed">
              Most recruiting technology is built for recruiters. Proxy exists for the candidate.
            </p>
          </motion.div>
        </div>
      </section>
      {/* Section 2 — The Problem */}
      <section className="px-6 py-24 border-b-[3px] border-black">
        <div className="max-w-3xl mx-auto">
          <div className="mono text-xs text-black/50 mb-8 uppercase tracking-widest">&#9698; The Context</div>
          <div className="text-3xl font-bold leading-tight mb-8">The job market in 2026 is brutal for senior professionals. Not because they lack experience. Because the systems they're navigating were never designed with them in mind.</div>
          <div className="mono text-lg text-black/70 space-y-6 leading-relaxed">
            <p>
              A PDF resume summarising 15 years of decisions and results, evaluated in 6 seconds by a screener who doesn't know the industry. That's not a talent problem. That's a communication problem.
            </p>
            <p>
              Senior professionals don't need a better resume. They need a better way to tell their story.
            </p>
          </div>
        </div>
      </section>
      {/* Section 3 — Founder */}
      <section className="px-6 py-24 border-b-[3px] border-black bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="brutal-card border-black bg-[#E8E8E3] p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-12 items-start">
            <div className="md:w-1/3">
               <div className="w-full aspect-square bg-black border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(34,197,94,1)] flex items-center justify-center">
                 <span className="text-[#22C55E] text-6xl font-bold">VS</span>
               </div>
               <div className="mt-6">
                 <div className="font-bold text-xl uppercase">Vinos Samuel</div>
                 <div className="mono text-xs text-black/50 uppercase">BUILDER | Founder</div>
               </div>
            </div>
            <div className="md:w-2/3">
              <h2 className="text-4xl font-bold mb-8 uppercase tracking-tighter">Why I built this</h2>
              <div className="mono text-lg text-black/80 space-y-6 leading-relaxed">
                <p>
                  I'm Vinos Samuel. I've spent 15+ years leading HR operations, talent acquisition, and workforce strategy across APAC at Netflix, Cielo, and Randstad Sourceright.
                </p>
                <p>
                  I've sat in the rooms where hiring decisions get made. I've seen exceptional candidates lose out not because they weren't qualified — but because their story didn't land.
                </p>
                <p>
                  Proxy is my answer to that. Not a resume builder. Not a LinkedIn makeover. An AI-powered career portfolio that represents you the way you'd represent yourself in the room.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Section 4 — Vision */}
      <section className="px-6 py-24 border-b-[3px] border-black bg-[#D1D1CC]">
        <div className="max-w-7xl mx-auto">
          <div className="mono text-xs text-black/50 mb-12 uppercase tracking-widest">&#9698; The Vision</div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="brutal-card border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 h-12 bg-[#22C55E] border-[3px] border-black flex items-center justify-center mb-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <Brain className="text-black w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-4">AI Career Portfolio</h3>
              <p className="mono text-sm text-black/70 leading-relaxed">
                An interactive portfolio that answers recruiter questions with your actual stories and results.
              </p>
            </div>
            <div className="brutal-card border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 h-12 bg-[#22C55E] border-[3px] border-black flex items-center justify-center mb-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <Target className="text-black w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Built for Senior Professionals</h3>
              <p className="mono text-sm text-black/70 leading-relaxed">
                Directors, VPs, C-suite leaders with deep experience that a PDF can't contain.
              </p>
            </div>
            <div className="brutal-card border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 h-12 bg-[#22C55E] border-[3px] border-black flex items-center justify-center mb-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <Rocket className="text-black w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Agents Coming</h3>
              <p className="mono text-sm text-black/70 leading-relaxed">
                Interview prep, job search strategy, personal brand — a full suite of AI tools built around the candidate.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Section 5 — CTA */}
      <section className="px-6 py-32 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl lg:text-7xl font-bold mb-12 leading-none">
            READY TO TELL YOUR<br />
            STORY <span className="text-[#22C55E]">PROPERLY?</span>
          </h2>
          <Link href="/pricing">
            <Button className="bg-[#22C55E] hover:bg-[#1eb054] text-black px-12 py-8 text-2xl font-bold border-[3px] border-white shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] uppercase tracking-tighter rounded-none">
              Build Your Portfolio <ArrowRight className="ml-4 w-8 h-8" />
            </Button>
          </Link>
        </div>
      </section>
      {/* Footer */}
      <footer className="px-6 py-12 border-t-[3px] border-black bg-[#E8E8E3]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black flex items-center justify-center border-[2px] border-black">
              <span className="text-white font-black text-sm leading-none">P</span>
            </div>
            <span className="font-bold text-lg tracking-tighter uppercase">Proxy</span>
          </div>
          <div className="flex gap-8 mono text-xs font-bold uppercase tracking-widest text-black/50">
            <Link href="/about"><span className="cursor-pointer hover:text-black">About</span></Link>
            <Link href="/faq"><span className="cursor-pointer hover:text-black">FAQ</span></Link>
            <Link href="/pricing"><span className="cursor-pointer hover:text-black">Pricing</span></Link>
            <a href="mailto:myproxy_work@proton.me" className="cursor-pointer hover:text-black">Support</a>
            <span>© 2026 Digital Twin Studio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
