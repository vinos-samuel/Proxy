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
      q: "What is an AI Digital Twin for your career?",
      plainText: "A Digital Twin is a personalized AI-powered web page that represents your professional experience. It goes beyond a static resume or LinkedIn profile - it features an interactive AI chatbot trained on your career history, achievements, and communication style. Recruiters and hiring managers can visit your Digital Twin, ask questions in natural language, and get specific, accurate answers about your skills, projects, and results. Think of it as a 24/7 career representative that speaks in your voice.",
      a: (
        <div className="space-y-4">
          <p>A Digital Twin is a <strong className="text-black">personalized AI-powered web page</strong> that represents your professional experience. It goes beyond a static resume or LinkedIn profile.</p>
          <p>It features an <strong className="text-black">interactive AI chatbot</strong> trained on your career history, achievements, and communication style. Recruiters and hiring managers can visit your Digital Twin, ask questions in natural language, and get specific, accurate answers about your skills, projects, and results.</p>
          <p>Think of it as a <strong className="text-black">24/7 career representative</strong> that speaks in your voice.</p>
        </div>
      ),
    },
    {
      q: "How is Proxy different from LinkedIn or a traditional resume?",
      plainText: "LinkedIn shows your job history. A resume lists your credentials in a static PDF. Proxy creates an interactive experience where people can have a real conversation with your career. Your AI Digital Twin answers specific questions, shares project details with real metrics, and represents your thinking and approach - not just your job titles. It's the difference between reading a menu and talking to the chef.",
      a: (
        <div className="space-y-4">
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">LinkedIn</strong> shows your job history</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">A resume</strong> lists your credentials in a static PDF</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Proxy</strong> creates an interactive experience where people can have a real conversation with your career</span></li>
          </ul>
          <p>Your AI Digital Twin answers specific questions (<em>"Tell me about a time you scaled a team"</em>), shares project details with real metrics, and represents your thinking and approach — not just your job titles.</p>
          <p>It's the difference between reading a menu and talking to the chef.</p>
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
      plainText: "Referred candidates get hired 5 to 10 times more often than cold applications. But getting referred requires someone who understands your work well enough to vouch for you — and most connections don't. They want to help, but they don't know enough to make a credible referral. Proxy fixes this. When someone offers to help, share your Proxy link instead of your CV. They can ask your AI anything — what you've built, how you work, what kind of problems you solve. They get a real picture of your capabilities in minutes, and can refer you with genuine confidence instead of a vague endorsement. Every published profile also gets a personal referral link on the dashboard — share it with your network and track how many people sign up from your recommendation.",
      a: (
        <div className="space-y-4">
          <p><strong className="text-black">Referred candidates get hired 5–10x more often</strong> than cold applications. But a referral only works if your connection understands your work well enough to stake their reputation on it.</p>
          <p>Most people want to help — they just don't have the context to make a credible introduction. Sending a CV doesn't solve that. A two-page document can't answer follow-up questions or explain the nuance of what you've actually built.</p>
          <p>Share your Proxy link instead. Your connection can chat with your AI, ask about specific projects, understand how you think, and get a genuine sense of what you'd bring to a role. They go from "I vaguely know this person" to "I can genuinely vouch for this person" — and the referral actually happens.</p>
          <p className="border-l-[3px] border-[#22C55E] pl-4"><strong className="text-black">The ask:</strong> <em>"Here's my Proxy link — it'll give you a real sense of what I do. If it resonates, I'd love your thoughts on who I should be talking to."</em></p>
          <p>Every published profile also gets a <strong className="text-black">personal referral link</strong> on the dashboard. Share it with your network — you can see exactly how many people signed up from your recommendation.</p>
        </div>
      ),
    },
    {
      q: "How does the AI resume upload work?",
      plainText: "When you sign up, you can upload your CV or resume in PDF format. Proxy's AI reads your entire document and automatically pre-fills your 11-step questionnaire with your career history, key achievements, skills, and professional summary. Instead of typing everything from scratch, you simply review what the AI extracted, make corrections, and add your personal stories and voice. Most users complete the entire setup in around 10 minutes thanks to AI pre-fill.",
      a: (
        <div className="space-y-4">
          <p>When you sign up, you can upload your CV or resume <strong className="text-black">(PDF format)</strong>. Proxy's AI reads your entire document and automatically pre-fills your 11-step questionnaire with:</p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Career history and role details</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Key achievements and metrics</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Skills and competencies</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Professional summary</span></li>
          </ul>
          <p>Instead of typing everything from scratch, you simply <strong className="text-black">review what the AI extracted</strong>, make corrections, and add your personal stories and voice.</p>
          <p>Most users complete the entire setup in <strong className="text-black">around 10 minutes</strong> thanks to AI pre-fill.</p>
        </div>
      ),
    },
    {
      q: "How long does it take to build my Digital Twin?",
      plainText: "Most users complete their profile in around 10 minutes. After uploading your CV, you choose your path: fill the guided 11-step questionnaire, or have a conversation with the AI — it's read your CV and interviews you naturally. Either path covers career history, war stories, achievements, skills, and communication style. Then add a headshot and optional video. Once you submit, the AI processes your data and generates your portfolio within minutes. After payment, your Digital Twin goes live instantly.",
      a: (
        <div className="space-y-4">
          <p>Most users complete their profile in <strong className="text-black">around 10 minutes</strong>. After uploading your CV, you pick your path:</p>
          <div className="space-y-3 ml-1">
            <div className="flex gap-3">
              <span className="bg-[#22C55E] text-black font-bold text-xs w-6 h-6 flex items-center justify-center border-[2px] border-black flex-shrink-0 mt-0.5">1</span>
              <span><strong className="text-black">Upload your CV</strong> — AI pre-fills most of your data automatically</span>
            </div>
            <div className="flex gap-3">
              <span className="bg-[#22C55E] text-black font-bold text-xs w-6 h-6 flex items-center justify-center border-[2px] border-black flex-shrink-0 mt-0.5">2</span>
              <span><strong className="text-black">Choose your path</strong> — fill the guided questionnaire (11 steps) or chat with the AI. Same result, different experience.</span>
            </div>
            <div className="flex gap-3">
              <span className="bg-[#22C55E] text-black font-bold text-xs w-6 h-6 flex items-center justify-center border-[2px] border-black flex-shrink-0 mt-0.5">3</span>
              <span><strong className="text-black">Add your media</strong> — headshot and optional 60-second video introduction</span>
            </div>
          </div>
          <p>Once you submit, the AI processes your data and generates your portfolio page within minutes. After payment, your Digital Twin <strong className="text-black">goes live instantly</strong>.</p>
        </div>
      ),
    },
    {
      q: "Can I build my Twin through a conversation instead of filling forms?",
      plainText: "Yes. After uploading your CV, you choose between two paths: fill the guided questionnaire (11 structured steps) or chat with the AI. The conversation path feels like talking to a smart colleague who's already read your CV. It asks about your career, listens to your answers, and builds your profile from what you share naturally. No bullet points, no structured fields — just talk. Most people find it faster and less stressful. You can also start with the conversation and review the filled questionnaire afterwards.",
      a: (
        <div className="space-y-4">
          <p>Yes. After uploading your CV, you choose between two paths:</p>
          <div className="space-y-3 ml-1">
            <div className="flex gap-3">
              <span className="bg-black text-white font-bold text-xs w-6 h-6 flex items-center justify-center border-[2px] border-black flex-shrink-0 mt-0.5">A</span>
              <span><strong className="text-black">Guided questionnaire</strong> — 11 structured steps, you fill in the fields</span>
            </div>
            <div className="flex gap-3">
              <span className="bg-[#22C55E] text-black font-bold text-xs w-6 h-6 flex items-center justify-center border-[2px] border-black flex-shrink-0 mt-0.5">B</span>
              <span><strong className="text-black">Conversation</strong> — the AI has read your CV and interviews you naturally. You just talk.</span>
            </div>
          </div>
          <p>The conversation path feels like a smart colleague asking about your career — not a form, not a job interview. It asks about the real stuff: the decision you made under pressure, what the team you built actually looked like, what happened after that career move. The more naturally you talk, the better your Twin represents you.</p>
          <p>Afterwards, you can review and edit the filled questionnaire before submitting.</p>
        </div>
      ),
    },
    {
      q: "How much does Proxy cost?",
      plainText: "Proxy has three plans. Free gives you a published AI Digital Twin with chatbot and a personal page — no credit card needed. You get one edit within 48 hours to fine-tune your profile. Pro at $49 (one-time) gives you unlimited edits and a full analytics dashboard showing who's visiting and what they ask. Concierge at $499 (one-time) includes a personal discovery call, professional copywriting, custom branding, and hands-on optimization.",
      a: (
        <div className="space-y-4">
          <p>Start free, upgrade when you're ready:</p>
          <div className="space-y-3 ml-1">
            <div className="flex gap-3 items-start">
              <span className="bg-[#22C55E] text-black font-bold text-xs px-2 py-1 flex-shrink-0 mt-0.5">FREE</span>
              <span><strong className="text-black">Free</strong> — Published AI portfolio + chatbot + personal page. 1 edit within 48 hours. No credit card needed.</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="bg-black text-white font-bold text-xs px-2 py-1 flex-shrink-0 mt-0.5">$49</span>
              <span><strong className="text-black">Pro</strong> — Everything in Free plus unlimited edits, full analytics dashboard, and visitor questions feed</span>
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
      plainText: "SEO (Search Engine Optimisation) is how websites get found by Google. AEO — Agent Engine Optimisation — is the emerging equivalent for AI agents like ChatGPT, Perplexity, Gemini, and Claude. As AI tools become part of how recruiters source candidates, the professionals who get surfaced will be the ones whose profiles are structured, machine-readable, and publicly accessible. A PDF resume is invisible to these agents. A Proxy profile is not. Every Proxy profile includes schema.org Person structured data — a technical standard that tells AI agents exactly who you are, what you've done, where you've worked, and what you're known for. When a recruiter or their AI asks 'find me a senior finance leader with APAC experience', structured profiles like yours get parsed and surfaced. This is a real shift happening now. Proxy profiles are built for it from day one.",
      a: (
        <div className="space-y-4">
          <p><strong className="text-black">SEO</strong> (Search Engine Optimisation) is how websites get found by Google. <strong className="text-black">AEO — Agent Engine Optimisation</strong> — is the emerging equivalent for AI agents like ChatGPT, Perplexity, Gemini, and recruiter-specific AI tools.</p>
          <p>As AI becomes part of how recruiters source candidates, the professionals who get surfaced will be the ones whose profiles are <strong className="text-black">structured, machine-readable, and publicly accessible.</strong></p>
          <p>A PDF resume is invisible to these agents. A Proxy profile is not.</p>
          <p><strong className="text-black">What Proxy does technically:</strong></p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">schema.org Person markup</strong> — embedded structured data that tells AI agents your name, title, skills, career history, and location in a format they can parse</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Public, indexable URL</strong> — your profile lives on the open web at myproxy.work/you, crawlable by all major search engines and AI tools</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Distribution surface area</strong> — every time you share your link, you increase the chances an AI agent retrieves it in a relevant search</span></li>
          </ul>
          <p>This is a real shift happening now. Proxy profiles are built for it from day one.</p>
        </div>
      ),
    },
    {
      q: "Will AI tools and recruiting agents find my Proxy profile automatically?",
      plainText: "Not automatically from day one — but structured and distributed Proxy profiles are far more likely to be surfaced than a LinkedIn page or a PDF. Here is how it works: search engines like Google index your profile as soon as it is live. AI tools like Perplexity and ChatGPT that draw from the web can parse your structured data. Recruiter-specific AI sourcing tools look for machine-readable candidate profiles. The more you share your profile link — in your email signature, LinkedIn, direct outreach — the more indexed surface area it builds. The combination of structured data plus public distribution is what makes Proxy profiles agent-discoverable. LinkedIn profiles have structured data too, but they sit behind a login wall and are not fully parseable by external AI agents. Your Proxy profile is fully public and structured from the ground up.",
      a: (
        <div className="space-y-4">
          <p>Not automatically from day one — but a structured, distributed Proxy profile is far more likely to be surfaced than a LinkedIn page or a PDF.</p>
          <p><strong className="text-black">Here is how it works:</strong></p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Search engines like Google index your profile as soon as it is live</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>AI tools like Perplexity and ChatGPT that draw from the web can parse your structured data</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Recruiter-specific AI sourcing tools look for machine-readable candidate profiles</span></li>
          </ul>
          <p>The more you share your profile link — in your email signature, LinkedIn, direct outreach — the more indexed surface area it builds. More surface area means more chances an AI surfaces your profile when a recruiter asks it to find someone like you.</p>
          <p><strong className="text-black">Why not just use LinkedIn?</strong> LinkedIn profiles have structured data too, but they sit behind a login wall and are not fully parseable by external AI agents. Your Proxy profile is fully public and structured from the ground up.</p>
        </div>
      ),
    },
    {
      q: "How does the AI chatbot on my profile work?",
      plainText: "Your Digital Twin includes an AI chatbot powered by advanced language models, trained specifically on your career data. When someone visits your profile and asks a question, the AI responds in your voice, using your real examples, metrics, and stories. It handles general exploratory questions, specific project deep-dives, transferable skills queries, and gracefully redirects off-topic questions. The chatbot uses your chosen communication style and your actual vocabulary.",
      a: (
        <div className="space-y-4">
          <p>Your Digital Twin includes an <strong className="text-black">AI chatbot powered by advanced language models</strong>, trained specifically on your career data.</p>
          <p>When someone visits your profile and asks a question — like <em>"What's your experience with team scaling?"</em> or <em>"Walk me through a challenging project"</em> — the AI responds in your voice, using your real examples, metrics, and stories.</p>
          <p>The chatbot handles four types of questions:</p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">General exploratory</strong> — overview of your capabilities</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Specific project deep-dives</strong> — detailed walkthroughs with metrics</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Transferable skills</strong> — honest about gaps, shows relevance</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Off-topic</strong> — graceful redirect to your expertise</span></li>
          </ul>
          <p>It uses your chosen communication style (direct, warm, technical, or casual) and your actual vocabulary.</p>
        </div>
      ),
    },
    {
      q: "Can recruiters really have a conversation with my AI?",
      plainText: "Yes. Your Digital Twin is a public web page with a built-in chat interface. You share the link in email signatures, LinkedIn messages, job applications, or direct outreach, and anyone who visits can ask questions and get instant, detailed responses about your career. It's designed to give recruiters and hiring managers a reason to engage with your profile rather than just filing it away. Every conversation is an opportunity to make an impression, even when you're not available.",
      a: (
        <div className="space-y-4">
          <p><strong className="text-black">Yes.</strong> Your Digital Twin is a public web page with a built-in chat interface.</p>
          <p>You share the link — in email signatures, LinkedIn messages, job applications, or direct outreach — and anyone who visits can <strong className="text-black">ask questions and get instant, detailed responses</strong> about your career.</p>
          <p>It's designed to give recruiters and hiring managers a reason to <strong className="text-black">engage</strong> with your profile rather than just filing it away. Every conversation is an opportunity to make an impression, even when you're not available.</p>
        </div>
      ),
    },
    {
      q: "What do I need to provide to get started?",
      plainText: "At minimum, you need your CV/resume and around 10 minutes to complete the intake questionnaire. The questionnaire covers: professional summary and positioning, career history with key facts per role, 3 or more detailed war stories with challenge approach and result, key achievements with metrics, technical skills, communication style and vocabulary preferences, and chatbot personality settings. For best results, we also recommend a professional headshot and a 60-90 second video introduction.",
      a: (
        <div className="space-y-4">
          <p>At minimum: your <strong className="text-black">CV/resume</strong> and around <strong className="text-black">10 minutes</strong> to complete the intake questionnaire.</p>
          <p>The questionnaire covers:</p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Professional summary and positioning</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Career history with key facts per role</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>3+ detailed war stories (challenge, approach, result)</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Key achievements with metrics</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Technical skills</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Communication style and vocabulary preferences</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Chatbot personality settings</span></li>
          </ul>
          <p>For best results, we also recommend a <strong className="text-black">professional headshot</strong> and a <strong className="text-black">60-90 second video introduction</strong>.</p>
        </div>
      ),
    },
    {
      q: "Is this ATS-readable? Can it replace my resume?",
      plainText: "No - and it's not designed to. Proxy is not a replacement for your resume or CV. Applicant Tracking Systems (ATS) require traditional document formats like PDF or Word. Your Digital Twin is a complementary tool that works alongside your resume. Think of it as the next step after someone receives your CV. Where to use your Proxy link: in your email signature alongside your LinkedIn URL, in outreach messages to recruiters and hiring managers, on your personal website or portfolio page, in cover letters as a 'learn more about me' link, in LinkedIn connection requests and messages, and on job applications where there's a portfolio or website field. The combination is powerful: your resume gets you through the ATS, your Proxy link gets you remembered.",
      a: (
        <div className="space-y-4">
          <p><strong className="text-black">No — and it's not designed to.</strong> Proxy is not a replacement for your resume or CV. Applicant Tracking Systems (ATS) require traditional document formats like PDF or Word.</p>
          <p>Your Digital Twin is a <strong className="text-black">complementary tool</strong> that works alongside your resume. Think of it as the next step after someone receives your CV.</p>
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
      q: "Can I edit my Digital Twin after it's published?",
      plainText: "Yes. Once your profile is live, you can access your dashboard to edit your content at any time. You can update career stories, add new achievements, adjust your chatbot's tone, upload new photos or videos, and refine how your AI represents you. Changes are reflected on your public profile immediately. Your Digital Twin should evolve as your career does.",
      a: (
        <div className="space-y-4">
          <p><strong className="text-black">Yes.</strong> Once your profile is live, you can access your dashboard to edit your content at any time.</p>
          <p>You can:</p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Update career stories and add new achievements</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Adjust your chatbot's tone and vocabulary</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Upload new photos or videos</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Refine how your AI represents you</span></li>
          </ul>
          <p>Changes are reflected on your public profile <strong className="text-black">immediately</strong>. Your Digital Twin should evolve as your career does.</p>
        </div>
      ),
    },
    {
      q: "What analytics do I get about my profile?",
      plainText: "Your dashboard shows key metrics about your Digital Twin's performance: total profile views showing how many people visited your page, questions asked showing what recruiters and visitors are asking your AI chatbot, and engagement patterns. This gives you insight into which aspects of your career are generating the most interest, helping you optimize your profile and understand what hiring managers care about most.",
      a: (
        <div className="space-y-4">
          <p>Your dashboard shows key metrics about your Digital Twin's performance:</p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Profile views</strong> — how many people visited your page</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Questions asked</strong> — what recruiters and visitors are asking your AI chatbot</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Engagement patterns</strong> — understand what's generating interest</span></li>
          </ul>
          <p>This helps you <strong className="text-black">optimize your profile</strong> and understand what hiring managers care about most.</p>
        </div>
      ),
    },
    {
      q: "Is my information private and secure?",
      plainText: "Your Digital Twin is accessible via your unique profile URL. You control who sees it by choosing when and where to share the link. We don't share your data with recruiters, job boards, or third parties. Your account is protected with encrypted passwords, email verification, and secure session management. We comply with Singapore PDPA data protection standards. You can read our full privacy policy at myproxy.work/privacy.",
      a: (
        <div className="space-y-4">
          <p>Your Digital Twin is accessible via your <strong className="text-black">unique profile URL</strong> — you control who sees it by choosing when and where to share the link.</p>
          <p>Security measures:</p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>We <strong className="text-black">don't share</strong> your data with recruiters, job boards, or third parties</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Encrypted passwords and email verification</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Secure session management</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span>Singapore PDPA compliant</span></li>
          </ul>
          <p>Read our full <Link href="/privacy"><span className="text-[#22C55E] font-bold cursor-pointer hover:underline">privacy policy</span></Link>.</p>
        </div>
      ),
    },
    {
      q: "What makes a good AI Digital Twin?",
      plainText: "The best Digital Twins have three things: specific stories with real metrics (not generic claims), a distinctive communication style that sounds like you (not corporate boilerplate), and enough detail for the AI to give substantive answers. The more specific your war stories, the better your AI performs. For example, instead of 'improved team performance', provide 'reduced delivery time by 35% across a 12-person engineering team by implementing sprint retrospectives and automated testing pipelines'. Numbers and specifics make your Twin credible and impressive.",
      a: (
        <div className="space-y-4">
          <p>The best Digital Twins have three things:</p>
          <div className="space-y-3 ml-1">
            <div className="flex gap-3">
              <span className="bg-[#22C55E] text-black font-bold text-xs w-6 h-6 flex items-center justify-center border-[2px] border-black flex-shrink-0 mt-0.5">1</span>
              <span><strong className="text-black">Specific stories with real metrics</strong> — not generic claims</span>
            </div>
            <div className="flex gap-3">
              <span className="bg-[#22C55E] text-black font-bold text-xs w-6 h-6 flex items-center justify-center border-[2px] border-black flex-shrink-0 mt-0.5">2</span>
              <span><strong className="text-black">A distinctive communication style</strong> — that sounds like you, not corporate boilerplate</span>
            </div>
            <div className="flex gap-3">
              <span className="bg-[#22C55E] text-black font-bold text-xs w-6 h-6 flex items-center justify-center border-[2px] border-black flex-shrink-0 mt-0.5">3</span>
              <span><strong className="text-black">Enough detail</strong> — for the AI to give substantive answers</span>
            </div>
          </div>
          <p className="border-l-[3px] border-black/20 pl-4 text-sm">
            <strong className="text-black">Example:</strong> Instead of <em>"improved team performance"</em>, provide <em>"reduced delivery time by 35% across a 12-person engineering team by implementing sprint retrospectives and automated testing pipelines"</em>.
          </p>
          <p>Numbers and specifics make your Twin credible and impressive.</p>
        </div>
      ),
    },
    {
      q: "Do I need technical skills to use Proxy?",
      plainText: "No. Proxy is designed for non-technical professionals. The entire process is guided: upload your CV, answer questionnaire steps, upload photos, and publish. There's no coding, no design work, and no technical setup required. The AI handles all the complex work of building your interactive portfolio and training your personal chatbot.",
      a: (
        <div className="space-y-4">
          <p><strong className="text-black">No.</strong> Proxy is designed for non-technical professionals.</p>
          <p>The entire process is guided: upload your CV, answer questionnaire steps, upload photos, and publish. There's <strong className="text-black">no coding, no design work, and no technical setup</strong> required.</p>
          <p>The AI handles all the complex work of building your interactive portfolio and training your personal chatbot.</p>
        </div>
      ),
    },
    {
      q: "How accurate is the AI? Can it make things up about me?",
      plainText: "This is the right question to ask. Proxy uses strict grounding rules: the AI can only answer from your actual profile data — your war stories, career timeline, and achievements. If a question requires information not in your profile, the AI says so and redirects the recruiter to contact you directly. It will not invent numbers, fabricate company experience, or present general knowledge as personal experience. The system also prevents cross-company contamination — facts from one employer cannot be attributed to another. If someone provides incorrect information in a question (for example, assuming you worked somewhere you didn't), the AI corrects the premise before answering. No system is perfect, but Proxy's guardrails are designed to fail safely: when in doubt, redirect — never fabricate.",
      a: (
        <div className="space-y-4">
          <p>This is the right question to ask. Proxy uses strict grounding rules so the AI <strong className="text-black">can only answer from your actual profile data</strong> — your war stories, career timeline, and achievements.</p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">No fabrication</strong> — numbers, metrics, company names, and project details must exist in your profile. The AI will not invent specifics to fill a gap.</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">No cross-company contamination</strong> — facts from one employer cannot be attributed to another, even if the number exists elsewhere in your profile.</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Honest redirects</strong> — when the AI reaches the edge of your data, it says so and directs the recruiter to contact you directly. A clean "I don't have that detail" is more credible than a confident fabrication.</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">False premise correction</strong> — if someone assumes something incorrect about your background, the AI corrects it immediately.</span></li>
          </ul>
          <p>No AI system is perfect. But Proxy is designed to fail safely: when in doubt, redirect — never fabricate.</p>
        </div>
      ),
    },
    {
      q: "What's coming next for Proxy?",
      plainText: "Recently shipped: referral attribution (track signups from your personal referral link), session analytics via PostHog (real recruiter engagement data), tightened AI accuracy guardrails, and full blog SEO with structured data so articles rank on Google and get parsed by AI agents. Coming next: LinkedIn enrichment (automatically pulling your professional activity to enrich your profile), recruiter session tracking (see individual visit sessions and what each visitor asked your AI), and suggested question chips on portfolio pages to remove cold-start friction for recruiters. All existing members get early access to new features as they launch.",
      a: (
        <div className="space-y-4">
          <p><strong className="text-black">Recently shipped:</strong></p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Referral attribution</strong> — every published profile gets a personal referral link; track how many people sign up from your recommendation</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Session analytics</strong> — real engagement data showing time spent on your profile and chat interactions</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Tightened AI accuracy</strong> — stricter grounding rules, false premise correction, and explicit no-fabrication enforcement</span></li>
          </ul>
          <p><strong className="text-black">Coming next:</strong></p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">LinkedIn enrichment</strong> — automatically pulling your professional activity to enrich your profile</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Recruiter session tracking</strong> — see individual visit sessions and what each visitor asked your AI</span></li>
            <li className="flex gap-2"><span className="text-[#22C55E] font-bold">-</span><span><strong className="text-black">Suggested question chips</strong> — prompt cards on your profile that help recruiters start the conversation</span></li>
          </ul>
          <p>All existing members get <strong className="text-black">early access</strong> to new features as they launch.</p>
        </div>
      ),
    },
  ];

  // Page title for SEO
  useEffect(() => {
    document.title = "FAQ - Proxy | AI Digital Twin & Career Portfolio Questions";
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
              Everything you need to know about building your AI Digital Twin with Proxy
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
          <h2 className="text-3xl font-bold mb-4 uppercase tracking-tight">Ready to build your Digital Twin?</h2>
          <p className="mono text-base text-black/60 mb-8">Join mid to senior professionals who are already using AI to represent their careers 24/7.</p>
          <Link href="/register">
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
            <span>© 2026 Digital Twin Studio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
