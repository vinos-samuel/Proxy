import { useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageSquare } from "lucide-react";

interface FaqItem {
  q: string;
  a: ReactNode;
  plainText: string; // Plain text version for JSON-LD
}

export default function FAQPage() {
  const faqs: FaqItem[] = [
    {
      q: "What does Proxy make?",
      plainText: "Proxy turns your CV and experience into a professional evidence page you can share with employers, clients, or people making introductions. You see a finished first page quickly, improve selected sections, approve the exact public version, and choose whether to enable an AI explorer.",
      a: (
        <div className="space-y-4">
          <p>Proxy creates a <strong className="text-black">professional evidence page</strong> from your CV and the experience you choose to add.</p>
          <p>You get a complete first version before answering more questions. You can improve one section at a time, edit it yourself, choose a design, and approve the exact version that becomes public.</p>
          <p>The <strong className="text-black">Ask about my work</strong> AI explorer is optional and off by default.</p>
        </div>
      ),
    },
    {
      q: "How is Proxy different from LinkedIn or a traditional resume?",
      plainText: "LinkedIn shows your job history and a resume lists credentials in a static PDF. Proxy turns supported facts from your CV into a designed evidence page that makes projects, decisions, and results easy to scan. You can also enable an optional AI explorer after you approve the public content it may use.",
      a: (
        <div className="space-y-4">
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">LinkedIn</strong> shows your job history</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">A resume</strong> lists your credentials in a static PDF</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Proxy</strong> turns supported experience into a designed page built around evidence</span></li>
          </ul>
          <p>The page shows what you did, how you approached the work, and what changed. If you enable the optional AI explorer, visitors can ask follow-up questions using only the public information you approved.</p>
        </div>
      ),
    },
    {
      q: "Who is Proxy designed for?",
      plainText: "Proxy is built for mid to senior professionals — Managers, Team Leads, Directors, VPs, and experienced executives — who have deep experience that doesn't fit neatly on a two-page resume. It's particularly valuable if you're actively job searching, exploring new opportunities, positioning yourself for a career transition, or want to stand out from other candidates in competitive hiring processes.",
      a: (
        <div className="space-y-4">
          <p>Proxy is built for <strong className="text-black">mid to senior professionals</strong> — Managers, Team Leads, Directors, VPs, and experienced executives — who have deep experience that doesn't fit neatly on a two-page resume.</p>
          <p>It's particularly valuable if you're:</p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Actively job searching</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Exploring new opportunities</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Positioning yourself for a career transition</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Want to stand out from other candidates in competitive hiring processes</span></li>
          </ul>
          <p>If you've ever felt that your resume undersells you, Proxy is for you.</p>
        </div>
      ),
    },
    {
      q: "How does Proxy help me get referrals?",
      plainText: "A useful referral requires enough evidence for someone to explain why you fit. Share your Proxy page so a connection can review specific projects, outcomes, and ways of working before making an introduction. If you enable the optional AI explorer, they can also ask follow-up questions using your approved public information.",
      a: (
        <div className="space-y-4">
          <p>A referral only works if your connection understands your work well enough to stake their reputation on it.</p>
          <p>Most people want to help, but they need enough context to make a credible introduction. A Proxy page gives them specific projects, outcomes, and ways of working they can point to.</p>
          <p>If you enable the optional AI explorer, they can also ask follow-up questions using only the public information you approved.</p>
          <p className="border-l-[3px] border-[#22C55E] pl-4"><strong className="text-black">The ask:</strong> <em>"Here's my Proxy link — it'll give you a real sense of what I do. If it resonates, I'd love your thoughts on who I should be talking to."</em></p>
          <p>Every published profile also gets a <strong className="text-black">personal referral link</strong> on the dashboard. Share it with your network — you can see exactly how many people signed up from your recommendation.</p>
        </div>
      ),
    },
    {
      q: "How does the AI resume upload work?",
      plainText: "Upload a PDF CV and Proxy builds a complete first page from the experience, achievements, and skills it can support from that document. You can then edit directly or answer optional targeted questions to improve selected sections. Nothing becomes public until you approve and publish it.",
      a: (
        <div className="space-y-4">
          <p>Upload your CV or resume <strong className="text-black">(PDF format)</strong>. Proxy uses it to build a finished first page with:</p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Career history and role details</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Key achievements and metrics</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Skills and competencies</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Professional summary</span></li>
          </ul>
          <p>You can <strong className="text-black">review and edit the page directly</strong>, or answer an optional question when one section needs stronger evidence.</p>
          <p>Nothing becomes public until you approve the exact page and publish it.</p>
        </div>
      ),
    },
    {
      q: "How long does it take to see my page?",
      plainText: "Proxy starts building the page as soon as your PDF CV is uploaded. Processing time depends on the document and service load, so Proxy does not promise a fixed time. You see the first usable page before any optional improvement questions and can publish without completing a questionnaire.",
      a: (
        <div className="space-y-4">
          <p>Proxy starts building as soon as you upload your CV. Processing time depends on the document and service load, so we do not promise a fixed time.</p>
          <div className="space-y-3 ml-1">
            <div className="flex gap-3">
              <span className="bg-[#22C55E] text-black font-bold text-xs w-6 h-6 flex items-center justify-center border-[2px] border-black flex-shrink-0 mt-0.5">1</span>
              <span><strong className="text-black">Upload your CV</strong> — Proxy extracts supported experience and skills</span>
            </div>
            <div className="flex gap-3">
              <span className="bg-[#22C55E] text-black font-bold text-xs w-6 h-6 flex items-center justify-center border-[2px] border-black flex-shrink-0 mt-0.5">2</span>
              <span><strong className="text-black">See the page</strong> — review a finished first version before answering more questions</span>
            </div>
            <div className="flex gap-3">
              <span className="bg-[#22C55E] text-black font-bold text-xs w-6 h-6 flex items-center justify-center border-[2px] border-black flex-shrink-0 mt-0.5">3</span>
              <span><strong className="text-black">Improve if useful</strong> — edit directly or answer one targeted question</span>
            </div>
          </div>
          <p>You can stop when the page is useful. There is no mandatory question count.</p>
        </div>
      ),
    },
    {
      q: "Do I have to complete a questionnaire?",
      plainText: "No. Proxy builds a complete first page from your CV before asking optional improvement questions. You can edit any wording directly, answer one useful question at a time, skip questions, or publish without answering more. Existing users can still access their earlier questionnaire content.",
      a: (
        <div className="space-y-4">
          <p><strong className="text-black">No.</strong> Proxy builds a complete first page from your CV before asking anything else.</p>
          <div className="space-y-3 ml-1">
            <div className="flex gap-3">
              <span className="bg-black text-white font-bold text-xs w-6 h-6 flex items-center justify-center border-[2px] border-black flex-shrink-0 mt-0.5">A</span>
              <span><strong className="text-black">Edit directly</strong> — change any headline, summary, project, or role wording yourself</span>
            </div>
            <div className="flex gap-3">
              <span className="bg-[#22C55E] text-black font-bold text-xs w-6 h-6 flex items-center justify-center border-[2px] border-black flex-shrink-0 mt-0.5">B</span>
              <span><strong className="text-black">Answer one useful question</strong> — see the exact section improve, then keep, edit, skip, or undo</span>
            </div>
          </div>
          <p>You can stop answering whenever the page is useful. There is no required question count.</p>
        </div>
      ),
    },
    {
      q: "How much does Proxy cost?",
      plainText: "Proxy has three plans. Free gives you a published professional page, with an optional AI explorer, and 7 days of edits after publishing. Pro at $49 one-time adds unlimited edits plus page views and recent visitor questions. Concierge at $499 one-time adds a discovery call, professional copywriting, custom branding, and hands-on optimization.",
      a: (
        <div className="space-y-4">
          <p>Start free, upgrade when you're ready:</p>
          <div className="space-y-3 ml-1">
            <div className="flex gap-3 items-start">
              <span className="bg-[#22C55E] text-black font-bold text-xs px-2 py-1 flex-shrink-0 mt-0.5">FREE</span>
              <span><strong className="text-black">Free</strong> — Published evidence page with an optional AI explorer. Unlimited edits while in draft; 7 days of edits after you publish. No credit card needed.</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="bg-black text-white font-bold text-xs px-2 py-1 flex-shrink-0 mt-0.5">$49</span>
              <span><strong className="text-black">Pro</strong> — Everything in Free plus unlimited edits, page views, and recent visitor questions</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="bg-black text-white font-bold text-xs px-2 py-1 flex-shrink-0 mt-0.5">$499</span>
              <span><strong className="text-black">Concierge</strong> — Everything in Pro plus personal discovery call, custom branding, and hands-on optimization</span>
            </div>
          </div>
          <p className="border-l-[3px] border-[#22C55E] pl-4">Pro and Concierge are <strong className="text-black">one-time payments</strong> — no monthly subscription.</p>
        </div>
      ),
    },
    {
      q: "What is the Job Search Agent?",
      plainText: "The Job Search Agent is a built-in CRM and AI assistant that actively helps you with your job search — not just your profile. Once your profile is live, the agent can write cover letters in your voice, research companies before you apply, draft cold outreach messages, coach your interview preparation, help you think through offer negotiation, and write thank you notes after interviews. Everything is grounded in your actual background, so nothing sounds generic. The Job Search Agent is included with the Pro plan.",
      a: (
        <div className="space-y-4">
          <p>The Job Search Agent is a built-in CRM and AI assistant included with Pro — it actively works on your job search, not just your profile.</p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Write cover letters in your voice</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Research companies before you apply</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Draft cold outreach messages</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Coach your interview preparation</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Help you think through offer negotiation</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Write thank you notes after interviews</span></li>
          </ul>
          <p>Everything is grounded in your actual background, so nothing sounds generic.</p>
        </div>
      ),
    },
    {
      q: "What is AEO (Agent Engine Optimisation) and how does it benefit my job search?",
      plainText: "SEO (Search Engine Optimisation) is how websites get found by Google. AEO — Agent Engine Optimisation — is the emerging equivalent for AI agents like ChatGPT, Perplexity, Gemini, and Claude. As AI tools become part of how recruiters source candidates, structured, machine-readable, publicly accessible profiles have a better chance of being parsed correctly. A PDF resume generally isn't parsed the way a structured web page can be. Every Proxy profile includes schema.org Person structured data — a technical standard that tells AI agents your name, what you've done, where you've worked, and what you're known for. Structured data can help a profile like yours get parsed and surfaced when a recruiter or their AI searches for someone with your background, but appearing in results is never guaranteed. Proxy profiles are built with this structure from day one.",
      a: (
        <div className="space-y-4">
          <p><strong className="text-black">SEO</strong> (Search Engine Optimisation) is how websites get found by Google. <strong className="text-black">AEO — Agent Engine Optimisation</strong> — is the emerging equivalent for AI agents like ChatGPT, Perplexity, Gemini, and recruiter-specific AI tools.</p>
          <p>As AI becomes part of how recruiters source candidates, <strong className="text-black">structured, machine-readable, and publicly accessible</strong> profiles have a better chance of being parsed correctly — though appearing in results is never guaranteed.</p>
          <p>A PDF resume generally isn't parsed by these agents the way a structured web page can be.</p>
          <p><strong className="text-black">What Proxy does technically:</strong></p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">schema.org Person markup</strong> — embedded structured data that tells AI agents your name, title, skills, career history, and location in a format they can parse</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Public, indexable URL</strong> — your profile lives on the open web at myproxy.work/you, crawlable by all major search engines and AI tools</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Distribution surface area</strong> — every time you share your link, you increase the chances an AI agent retrieves it in a relevant search</span></li>
          </ul>
          <p>This structure gives your profile the best chance of being read correctly by AI agents. It doesn't guarantee you'll be surfaced — share the link directly with people you want to reach.</p>
        </div>
      ),
    },
    {
      q: "Will AI tools and recruiting agents find my Proxy profile automatically?",
      plainText: "Not automatically, and not guaranteed. Structured, publicly shared profiles are generally easier for search engines and AI tools to discover than a LinkedIn page behind a login wall or a PDF that isn't crawlable at all — but indexing and appearing in results still depend on factors Proxy doesn't control. Here is how it works: search engines like Google can index a public profile once it's live, though timing varies. AI tools like Perplexity and ChatGPT that draw from the web can parse your structured data. Recruiter-specific AI sourcing tools look for machine-readable candidate profiles. The more you share your profile link — in your email signature, LinkedIn, direct outreach — the more chances it has of being found. Structured data plus public distribution gives your profile the best shot at being agent-discoverable, but sharing the link directly with people you want to reach is still the most reliable path.",
      a: (
        <div className="space-y-4">
          <p>Not automatically, and not guaranteed — but a structured, publicly shared Proxy profile is generally easier to discover than a LinkedIn page behind a login wall or a PDF that isn't crawlable at all.</p>
          <p><strong className="text-black">Here is how it works:</strong></p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Search engines like Google can index a public profile once it's live, though timing and inclusion vary</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>AI tools like Perplexity and ChatGPT that draw from the web can parse your structured data</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Recruiter-specific AI sourcing tools look for machine-readable candidate profiles</span></li>
          </ul>
          <p>The more you share your profile link — in your email signature, LinkedIn, direct outreach — the more chances it has of being found. Sharing the link directly with people you want to reach is still the most reliable path.</p>
          <p><strong className="text-black">Why not just use LinkedIn?</strong> LinkedIn profiles have structured data too, but they sit behind a login wall and are not fully parseable by external AI agents. Your Proxy profile is fully public and structured from the ground up.</p>
        </div>
      ),
    },
    {
      q: "How does the optional AI explorer work?",
      plainText: "The AI explorer is optional and off by default. If you enable it, visitors can ask questions about your published page plus any follow-up Q&A you've accepted into it. It does not receive your raw CV, source excerpts, skipped suggestions, or answers you never accepted. You can turn it off again from the builder.",
      a: (
        <div className="space-y-4">
          <p>The <strong className="text-black">Ask about my work</strong> explorer is optional and off by default.</p>
          <p>If you turn it on, visitors can ask follow-up questions about your published page, plus any follow-up Q&A you've accepted into it via the "Add stronger evidence" flow.</p>
          <p>Your raw CV, source excerpts, skipped suggestions, and answers you never accepted stay outside the public chat context. You can turn the explorer off again at any time.</p>
        </div>
      ),
    },
    {
      q: "Can recruiters ask questions about my work?",
      plainText: "Yes, if you enable the optional AI explorer. The main product is the evidence page and it works without chat. When the explorer is on, visitors can ask follow-up questions grounded in the public content you approved.",
      a: (
        <div className="space-y-4">
          <p><strong className="text-black">Yes, if you choose to enable it.</strong></p>
          <p>The evidence page is complete without chat. When the optional explorer is on, a recruiter can ask follow-up questions grounded in the exact public version you approved.</p>
        </div>
      ),
    },
    {
      q: "What do I need to provide to get started?",
      plainText: "You only need a PDF CV to see the first page. Proxy extracts supported experience, projects, results, and skills. After that, you can edit directly or answer optional targeted questions. A portrait is optional.",
      a: (
        <div className="space-y-4">
          <p>At minimum, you need a <strong className="text-black">PDF CV or resume</strong>.</p>
          <p>Proxy uses supported information from it to create:</p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Your positioning and career history</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Selected projects, achievements, and supported results</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Your skills and a finished first design</span></li>
          </ul>
          <p>After you see the page, you can edit it directly or answer optional questions that improve one section at a time. A portrait is optional.</p>
        </div>
      ),
    },
    {
      q: "Is this ATS-readable? Can it replace my resume?",
      plainText: "No - and it's not designed to. Proxy is not a replacement for your resume or CV. Applicant Tracking Systems (ATS) require traditional document formats like PDF or Word. Your Proxy page is a complementary tool that works alongside your resume. Think of it as the next step after someone receives your CV. Where to use your Proxy link: in your email signature alongside your LinkedIn URL, in outreach messages to recruiters and hiring managers, on your personal website or portfolio page, in cover letters as a 'learn more about me' link, in LinkedIn connection requests and messages, and on job applications where there's a portfolio or website field. The combination is powerful: your resume gets you through the ATS, your Proxy link gets you remembered.",
      a: (
        <div className="space-y-4">
          <p><strong className="text-black">No — and it's not designed to.</strong> Proxy is not a replacement for your resume or CV. Applicant Tracking Systems (ATS) require traditional document formats like PDF or Word.</p>
          <p>Your Proxy page is a <strong className="text-black">complementary tool</strong> that works alongside your resume. Think of it as the next step after someone receives your CV.</p>
          <p><strong className="text-black">Where to use your Proxy link:</strong></p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>In your <strong className="text-black">email signature</strong> alongside your LinkedIn URL</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>In <strong className="text-black">outreach messages</strong> to recruiters and hiring managers</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>On your <strong className="text-black">personal website</strong> or portfolio page</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>In <strong className="text-black">cover letters</strong> as a "learn more about me" link</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>In <strong className="text-black">LinkedIn</strong> connection requests and messages</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>On <strong className="text-black">job applications</strong> where there's a portfolio or website field</span></li>
          </ul>
          <p className="border-l-[3px] border-[#22C55E] pl-4">The combination is powerful: your resume gets you through the ATS, your Proxy link gets you <strong className="text-black">remembered</strong>.</p>
        </div>
      ),
    },
    {
      q: "Can I edit my page after it's published?",
      plainText: "Yes. Your edits stay private while you work. Review and publish the version you want visitors to see. Free pages include seven days of edits after first publication; Pro includes ongoing edits.",
      a: (
        <div className="space-y-4">
          <p><strong className="text-black">Yes.</strong> Once your profile is live, you can access your dashboard to edit your content — how long depends on your plan (see below).</p>
          <p>You can:</p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Update career stories and add new achievements</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Choose whether to show the optional AI explorer</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Update your portrait and contact choices</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Refine your headline, career detail, and selected work</span></li>
          </ul>
          <p>Your edits remain private until you review and publish them. Free pages include seven days of edits after first publication; Pro includes ongoing edits.</p>
        </div>
      ),
    },
    {
      q: "What analytics do I get about my profile?",
      plainText: "Your dashboard shows basic page views and, when the optional AI explorer is enabled, how many questions visitors asked. These signals do not prove hiring intent, but they show whether the page is being opened and explored.",
      a: (
        <div className="space-y-4">
          <p>Your dashboard shows key metrics about your page's performance:</p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Page views</strong> — how many times your page was viewed</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Questions asked</strong> — how often visitors used the optional AI explorer</span></li>
          </ul>
          <p>These are basic engagement signals. They do not prove hiring intent or identify every visitor.</p>
        </div>
      ),
    },
    {
      q: "Is my information private and secure?",
      plainText: "Your page is accessible via your unique profile URL. You control who sees it by choosing when and where to share the link. We do not sell your data. We use the service providers listed in our privacy policy (payments, email, hosting, analytics) to run Proxy — we don't hand your data to recruiters or job boards. Your account is protected with encrypted passwords, email verification, and secure session management. We follow Singapore PDPA principles for how we collect, use, and let you control your data. You can read our full privacy policy at myproxy.work/privacy.",
      a: (
        <div className="space-y-4">
          <p>Your page is accessible via your <strong className="text-black">unique profile URL</strong> — you control who sees it by choosing when and where to share the link.</p>
          <p>Security measures:</p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>We <strong className="text-black">do not sell</strong> your data, and don't hand it to recruiters or job boards — see our privacy policy for the service providers we use to run Proxy</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Encrypted passwords and email verification</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Secure session management</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>We follow Singapore PDPA principles for your data rights</span></li>
          </ul>
          <p>Read our full <Link href="/privacy"><span className="text-[#22C55E] font-bold cursor-pointer hover:underline">privacy policy</span></Link>.</p>
        </div>
      ),
    },
    {
      q: "What makes a strong evidence page?",
      plainText: "A strong page uses specific supported examples, explains the decisions or approach behind the work, and states the result without inventing precision. Real numbers help when you have them. Clear qualitative outcomes are also valid evidence.",
      a: (
        <div className="space-y-4">
          <p>A strong evidence page has three things:</p>
          <div className="space-y-3 ml-1">
            <div className="flex gap-3">
              <span className="bg-[#22C55E] text-black font-bold text-xs w-6 h-6 flex items-center justify-center border-[2px] border-black flex-shrink-0 mt-0.5">1</span>
              <span><strong className="text-black">Specific, supported examples</strong> — not generic claims</span>
            </div>
            <div className="flex gap-3">
              <span className="bg-[#22C55E] text-black font-bold text-xs w-6 h-6 flex items-center justify-center border-[2px] border-black flex-shrink-0 mt-0.5">2</span>
              <span><strong className="text-black">Your actual approach</strong> — the decisions and actions behind the result</span>
            </div>
            <div className="flex gap-3">
              <span className="bg-[#22C55E] text-black font-bold text-xs w-6 h-6 flex items-center justify-center border-[2px] border-black flex-shrink-0 mt-0.5">3</span>
              <span><strong className="text-black">An honest outcome</strong> — quantitative when supported, qualitative when that is what the evidence shows</span>
            </div>
          </div>
          <p className="border-l-[3px] border-black/20 pl-4 text-sm">
            <strong className="text-black">Example:</strong> Instead of <em>"improved team performance"</em>, provide <em>"reduced delivery time by 35% across a 12-person engineering team by implementing sprint retrospectives and automated testing pipelines"</em>.
          </p>
          <p>Never add a number only to make the story sound stronger. Specificity builds trust; unsupported precision removes it.</p>
        </div>
      ),
    },
    {
      q: "Do I need technical skills to use Proxy?",
      plainText: "No. Upload a PDF CV, review the first page, make any useful edits, approve it, and publish. Proxy handles the page structure and design. No coding or technical setup is required.",
      a: (
        <div className="space-y-4">
          <p><strong className="text-black">No.</strong> Proxy is designed for non-technical professionals.</p>
          <p>Upload a PDF CV, review the first page, make any useful edits, approve it, and publish. There is <strong className="text-black">no coding, design work, or technical setup</strong> required.</p>
          <p>Proxy handles the structure and design while you keep control of the exact public content.</p>
        </div>
      ),
    },
    {
      q: "How accurate is the AI? Can it make things up about me?",
      plainText: "This is the right question to ask. Proxy's AI explorer is instructed to answer only from your actual profile data — your war stories, career timeline, and achievements — and to say plainly when a detail isn't there, redirecting the recruiter to contact you directly. It's instructed not to invent numbers, fabricate company experience, present general knowledge as personal experience, or attribute a fact from one employer to another. It's also instructed to correct an incorrect premise before answering. These are strict prompt instructions, not a technical guarantee — no AI system is perfect. Test it yourself before you turn it on, and treat a wrong answer as something to fix, not something that can't happen.",
      a: (
        <div className="space-y-4">
          <p>This is the right question to ask. Proxy's AI explorer is <strong className="text-black">instructed to answer only from your actual profile data</strong> — your war stories, career timeline, and achievements. These are strict prompt instructions, not a technical guarantee.</p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Instructed not to fabricate</strong> — numbers, metrics, company names, and project details are meant to come only from your profile.</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Instructed against cross-company mixing</strong> — facts from one employer aren't meant to be attributed to another, even if the number exists elsewhere in your profile.</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Instructed to redirect honestly</strong> — when it reaches the edge of your data, it's meant to say so and point the recruiter to contact you directly.</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Instructed to correct false premises</strong> — if someone assumes something incorrect about your background, it's meant to correct it.</span></li>
          </ul>
          <p>No AI system is perfect. Test it yourself before you turn it on, and treat a wrong answer as something to fix, not something that can't happen.</p>
        </div>
      ),
    },
    {
      q: "What's shipped so far on Proxy?",
      plainText: "Referral attribution (track signups from your personal referral link), basic profile analytics (view counts and visitor questions), tightened AI explorer instructions, suggested question chips on portfolio pages, and full blog SEO with structured data so articles rank on Google and get parsed by AI agents. We announce new features in product updates as they ship.",
      a: (
        <div className="space-y-4">
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Referral attribution</strong> — every published profile gets a personal referral link; track how many people sign up from your recommendation</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Basic profile analytics</strong> — view counts and the questions visitors ask through your page, shown on your dashboard</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Tightened AI explorer instructions</strong> — stricter grounding, false-premise correction, and explicit no-fabrication instructions</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Suggested question chips</strong> — prompt cards on your portfolio page that help recruiters start the conversation instantly</span></li>
          </ul>
          <p>We announce new features in product updates as they ship.</p>
        </div>
      ),
    },
  ];

  // Page title for SEO
  useEffect(() => {
    document.title = "FAQ - Proxy | Professional Evidence Page Questions";
  }, []);

  // FAQ JSON-LD structured data for AEO (uses plainText for clean schema)
  useEffect(() => {
    const faqData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map((faq) => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.plainText,
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
              Everything you need to know about building and sharing your professional evidence page
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="px-6 py-24 border-b-[3px] border-black">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <p className="mono text-sm text-black/60">Can't find your answer? Contact us at <a href="mailto:vinos@myproxy.work" className="text-black font-bold hover:text-[#22C55E]">vinos@myproxy.work</a></p>
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

      {/* Feedback Section */}
      <section className="px-6 py-16 border-b-[3px] border-black bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="border-[3px] border-black bg-[#f5f5f0] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-[#22C55E] border-[3px] border-black flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-black" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-3 uppercase tracking-tight">We'd love your feedback</h2>
            <p className="mono text-base text-black/60 mb-6 max-w-lg mx-auto leading-relaxed">
              Have a suggestion, feature request, or something that could be better? We read every message and use your input to shape what we build next.
            </p>
            <a
              href="mailto:vinos@myproxy.work?subject=Proxy%20Feedback"
              className="inline-block bg-[#22C55E] text-black px-8 py-4 font-bold text-sm uppercase tracking-widest border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"
            >
              Send Feedback &rarr;
            </a>
            <p className="mono text-xs text-black/40 mt-4">Opens your email with subject "Proxy Feedback"</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 border-b-[3px] border-black bg-[#E8E8E3]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 uppercase tracking-tight">Ready to prepare your evidence?</h2>
          <p className="mono text-base text-black/60 mb-8">Upload your CV and see the page before you create an account.</p>
          <Link href="/try">
            <button className="bg-black text-white px-8 py-4 font-bold text-sm uppercase tracking-widest border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] hover:bg-[#22C55E] hover:text-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all">
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
            <a href="mailto:vinos@myproxy.work" className="cursor-pointer hover:text-black">vinos@myproxy.work</a>
            <span>© 2026 Proxy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
