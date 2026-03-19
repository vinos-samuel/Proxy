import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function FAQPage() {
  const faqs = [
    {
      q: "What is an AI Digital Twin for your career?",
      a: "A Digital Twin is a personalized AI-powered web page that represents your professional experience. It goes beyond a static resume or LinkedIn profile - it features an interactive AI chatbot trained on your career history, achievements, and communication style. Recruiters and hiring managers can visit your Digital Twin, ask questions in natural language, and get specific, accurate answers about your skills, projects, and results. Think of it as a 24/7 career representative that speaks in your voice."
    },
    {
      q: "How is Proxy different from LinkedIn or a traditional resume?",
      a: "LinkedIn shows your job history. A resume lists your credentials in a static PDF. Proxy creates an interactive experience where people can have a real conversation with your career. Your AI Digital Twin answers specific questions ('Tell me about a time you scaled a team'), shares project details with real metrics, and represents your thinking and approach - not just your job titles. It's the difference between reading a menu and talking to the chef."
    },
    {
      q: "Who is Proxy designed for?",
      a: "Proxy is built for senior professionals - Team Leads, Managers, Directors, VPs, and C-suite executives - who have deep, complex experience that doesn't fit neatly on a two-page resume. It's particularly valuable if you're actively job searching, exploring new opportunities, positioning yourself for a career transition, or want to stand out from other candidates in competitive hiring processes. If you've ever felt that your resume undersells you, Proxy is for you."
    },
    {
      q: "How does the AI resume upload work?",
      a: "When you sign up, you can upload your CV or resume (PDF format). Proxy's AI reads your entire document and automatically pre-fills your 11-step questionnaire with your career history, key achievements, skills, and professional summary. This saves you significant time - instead of typing everything from scratch, you simply review what the AI extracted, make corrections, and add your personal stories and voice. Most users complete the entire setup in 15-20 minutes thanks to AI pre-fill."
    },
    {
      q: "How long does it take to build my Digital Twin?",
      a: "Most users complete their profile in 15-20 minutes. Here's how it works: upload your CV (AI pre-fills most of the data), review and personalize an 11-step questionnaire covering your career history, war stories, achievements, skills, and communication style, then add a headshot and optional video introduction. Once you submit, the AI processes your data and generates your portfolio page within minutes. After payment, your Digital Twin goes live instantly."
    },
    {
      q: "How much does Proxy cost?",
      a: "Proxy offers three tiers during our founding member pricing (available to the first 100 members): Launch at $99 gives you a full AI Digital Twin with interactive chatbot, career timeline, and portfolio page. Evolve at $199 includes everything in Launch plus advanced analytics and priority support. Concierge at $499 includes a personal discovery call for a higher-fidelity result, custom branding, and hands-on optimization. All tiers are a one-time payment - no monthly subscription."
    },
    {
      q: "How does the AI chatbot on my profile work?",
      a: "Your Digital Twin includes an AI chatbot powered by advanced language models, trained specifically on your career data. When someone visits your profile and asks a question - like 'What's your experience with team scaling?' or 'Walk me through a challenging project' - the AI responds in your voice, using your real examples, metrics, and stories from the questionnaire. It handles general questions, specific project deep-dives, and even gracefully redirects off-topic queries. The chatbot uses your chosen communication style (direct, warm, technical, or casual) and your actual vocabulary."
    },
    {
      q: "Can recruiters really have a conversation with my AI?",
      a: "Yes. Your Digital Twin is a public web page with a built-in chat interface. You share the link - in email signatures, LinkedIn messages, job applications, or direct outreach - and anyone who visits can ask questions and get instant, detailed responses about your career. It's designed to give recruiters and hiring managers a reason to engage with your profile rather than just filing it away. Every conversation is an opportunity to make an impression, even when you're not available."
    },
    {
      q: "What do I need to provide to get started?",
      a: "At minimum, you need your CV/resume and about 15-20 minutes to complete the intake questionnaire. The questionnaire covers: your professional summary and positioning, career history with key facts per role, 3+ detailed war stories (challenge, approach, result), key achievements with metrics, technical skills, your communication style and vocabulary preferences, and chatbot personality settings. For best results, we also recommend uploading a professional headshot and a 60-90 second video introduction."
    },
    {
      q: "Can I edit my Digital Twin after it's published?",
      a: "Yes. Once your profile is live, you can access your dashboard to edit your content at any time. You can update your career stories, add new achievements, adjust your chatbot's tone, upload new photos or videos, and refine how your AI represents you. Changes are reflected on your public profile immediately. Your Digital Twin should evolve as your career does."
    },
    {
      q: "What analytics do I get about my profile?",
      a: "Your dashboard shows key metrics about your Digital Twin's performance: total profile views (how many people visited your page), questions asked (what recruiters and visitors are asking your AI chatbot), and engagement patterns. This gives you insight into which aspects of your career are generating the most interest, helping you optimize your profile and understand what hiring managers care about most."
    },
    {
      q: "Is my information private and secure?",
      a: "Your Digital Twin is accessible via your unique profile URL - you control who sees it by choosing when and where to share the link. We don't share your data with recruiters, job boards, or third parties. Your account is protected with encrypted passwords, email verification, and secure session management. We comply with Singapore PDPA data protection standards. You can read our full privacy policy at myproxy.work/privacy."
    },
    {
      q: "What makes a good AI Digital Twin?",
      a: "The best Digital Twins have three things: specific stories with real metrics (not generic claims), a distinctive communication style that sounds like you (not corporate boilerplate), and enough detail for the AI to give substantive answers. The more specific your war stories, the better your AI performs. For example, instead of 'improved team performance', provide 'reduced delivery time by 35% across a 12-person engineering team by implementing sprint retrospectives and automated testing pipelines'. Numbers and specifics make your Twin credible and impressive."
    },
    {
      q: "Do I need technical skills to use Proxy?",
      a: "No. Proxy is designed for non-technical professionals. The entire process is guided - upload your CV, answer questionnaire steps, upload photos, and publish. There's no coding, no design work, and no technical setup required. The AI handles all the complex work of building your interactive portfolio and training your personal chatbot."
    },
    {
      q: "What's coming next for Proxy?",
      a: "We're actively building new features including LinkedIn profile enrichment (automatically pulling your posts, articles, and professional activity), conversational onboarding (build your Twin through a guided AI conversation instead of forms), advanced analytics with recruiter engagement insights, and additional AI agents for interview preparation and job search strategy. All existing members get early access to new features as they launch."
    }
  ];

  // Page title for SEO
  useEffect(() => {
    document.title = "FAQ - Proxy | AI Digital Twin & Career Portfolio Questions";
  }, []);

  // FAQ JSON-LD structured data for AEO
  useEffect(() => {
    const faqData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map((faq) => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a,
        },
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(faqData);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

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
            <Link href="/blog"><span className="cursor-pointer hover:text-[#22C55E]">Blog</span></Link>
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
            <p className="mono text-lg text-black/60 max-w-2xl mx-auto leading-relaxed">
              Everything you need to know about building your AI Digital Twin with Proxy
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="px-6 py-24 border-b-[3px] border-black">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <p className="mono text-sm text-black/60">Can't find your answer? Contact us at <a href="mailto:myproxy_work@proton.me" className="text-black font-bold hover:text-[#22C55E]">myproxy_work@proton.me</a></p>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-[3px] border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] px-6">
                <AccordionTrigger className="text-left py-6 hover:no-underline hover:text-[#22C55E] font-bold text-lg uppercase tracking-tight">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="mono text-base text-black/70 pb-6 leading-relaxed border-t-2 border-black/10 pt-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 border-b-[3px] border-black bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 uppercase tracking-tight">Ready to build your Digital Twin?</h2>
          <p className="mono text-base text-black/60 mb-8">Join senior professionals who are already using AI to represent their careers 24/7.</p>
          <Link href="/register">
            <button className="bg-[#22C55E] text-black px-8 py-4 font-bold text-sm uppercase tracking-widest border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all">
              Get Started &rarr;
            </button>
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
            <Link href="/blog"><span className="cursor-pointer hover:text-black">Blog</span></Link>
            <Link href="/faq"><span className="cursor-pointer hover:text-black">FAQ</span></Link>
            <Link href="/#pricing"><span className="cursor-pointer hover:text-black">Pricing</span></Link>
            <a href="mailto:myproxy_work@proton.me" className="cursor-pointer hover:text-black">myproxy_work@proton.me</a>
            <span>© 2026 Digital Twin Studio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
