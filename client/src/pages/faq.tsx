import { motion } from "framer-motion";
import { Link } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function FAQPage() {
  const faqs = [
    {
      q: "What exactly is an AI career portfolio?",
      a: "It's an interactive web page that represents your career. Recruiters and hiring managers can visit it, ask questions, and get specific answers about your experience - powered by a personalized AI bot trained on your background, your stories, and how you think."
    },
    {
      q: "How is this different from LinkedIn or a resume?",
      a: "LinkedIn shows your history. A resume lists your credentials. Proxy lets people have a conversation with your experience. It answers questions, shares specific results, and represents your thinking - not just your job titles."
    },
    {
      q: "Who is this for?",
      a: "Senior professionals - Leads, Managers, Directors, VPs, C-suite - who have deep experience and want a modern way to present it. Particularly useful if you're actively looking, exploring opportunities, or positioning yourself for a career transition."
    },
    {
      q: "How long does it take to build?",
      a: "Once you complete the detailed intake questionnaire, upload your CV, your profile image, and a 60-second personal video, your portfolio will be ready in less than 10 minutes. The Concierge tier includes a personal discovery call for a higher-fidelity result and customization."
    },
    {
      q: "What do I need to provide?",
      a: "Your CV and answers to our intake questionnaire. For best results, a short video introduction (60-90 seconds) and a professional headshot are highly recommended. The questionnaire guides you through everything."
    },
    {
      q: "Will recruiters actually use it?",
      a: "Yes - but you control when. Most clients share their Proxy link in outreach messages, email signatures, or alongside their resume. It gives whoever receives it a reason to engage rather than just file."
    },
    {
      q: "Is my information private?",
      a: "Your portfolio is only accessible via your unique link. You control who sees it. We don't share your data with recruiters or third parties."
    },
    {
      q: "What's coming next?",
      a: "We're building additional AI agents to help with interview preparation, job search strategy, and personal brand development. Sign up for any tier, and you'll be first in line for early access."
    }
  ];

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
            <Link href="/about"><span className="cursor-pointer hover:text-[#22C55E]">About</span></Link>
            <Link href="/faq"><span className="cursor-pointer hover:text-[#22C55E] border-b-2 border-black">FAQ</span></Link>
            <Link href="/pricing"><span className="cursor-pointer hover:text-[#22C55E]">Pricing</span></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 border-b-[3px] border-black bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mono text-xs text-black/50 mb-4 uppercase tracking-widest">&#9698; Support</div>
            <h1 className="text-6xl lg:text-8xl font-bold mb-8 leading-none uppercase tracking-tighter">
              Questions & <span className="text-[#22C55E]">Answers</span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="px-6 py-24 border-b-[3px] border-black">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <p className="mono text-sm text-black/60">Need more help? Contact support at <a href="mailto:myproxy_work@proton.me" className="text-black font-bold hover:text-[#22C55E]">myproxy_work@proton.me</a></p>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-[3px] border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] px-6">
                <AccordionTrigger className="text-left py-6 hover:no-underline hover:text-[#22C55E] font-bold text-xl uppercase tracking-tight">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="mono text-lg text-black/70 pb-6 leading-relaxed border-t-2 border-black/10 pt-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
            <a href="mailto:myproxy_work@proton.me" className="cursor-pointer hover:text-black">myproxy_work@proton.me</a>
            <span>© 2026 Digital Twin Studio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
