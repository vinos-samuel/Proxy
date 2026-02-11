import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Send, User, Mail, Phone, Linkedin, Download,
  ExternalLink, Loader2, MessageSquare, Sparkles, Globe,
  ChevronDown, ChevronUp, Terminal, Briefcase, Award, Code2
} from "lucide-react";

interface PortfolioData {
  profile: {
    displayName: string;
    roleTitle: string;
    positioning: string;
    persona: string;
    tone: string;
    photoUrl: string | null;
    videoUrl: string | null;
    resumeUrl: string | null;
    cvResumeUrl: string | null;
    brandingTheme: string;
    technicalSkills: string | null;
    achievements: string | null;
    communicationStyle: string | null;
    heroSubtitle?: string;
    stats?: Array<{ label: string; value: string }>;
    problemFit?: string[];
    howIWork?: { name: string; steps: Array<{ label: string; description: string }> };
    whyAiCv?: string[];
    portfolioSuggestedQuestions?: string[];
  };
  factBanks: Array<{
    companyName: string;
    roleName: string;
    duration: string | null;
    facts: string[];
  }>;
  knowledgeEntries: Array<{
    type: string;
    title: string;
    content: string | null;
    challenge: string | null;
    approach: string | null;
    result: string | null;
  }>;
  contact: {
    email: string | null;
    phone: string | null;
    linkedin: string | null;
    location: string | null;
  };
  suggestedQuestions: string[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const themes = {
  executive: {
    bg: "bg-[#18181b]", // deep zinc
    gradient: "bg-gradient-to-br from-indigo-900/20 via-transparent to-violet-900/20",
    glass: "bg-white/5 backdrop-blur-xl border border-white/10",
    glassHover: "hover:bg-white/8 transition-all duration-300",
    accent: "from-indigo-400 to-violet-400",
    glow: "shadow-[0_0_30px_rgba(79,70,229,0.3)]",
    text: "text-white",
    muted: "text-zinc-400",
    headingFont: "font-['Inter',sans-serif]",
    bodyFont: "font-['Inter',sans-serif]",
    chatUserBg: "bg-indigo-600 text-white",
    chatBotBg: "bg-white/10 border border-white/10 text-white",
  },
  futurist: {
    bg: "bg-[#0a0a0f]",
    gradient: "bg-gradient-to-br from-purple-900/30 via-transparent to-cyan-900/30",
    glass: "bg-white/5 backdrop-blur-2xl border border-white/10",
    glassHover: "hover:bg-white/10 transition-all duration-300",
    accent: "from-purple-400 to-cyan-400",
    glow: "shadow-[0_0_40px_rgba(168,85,247,0.2)]",
    text: "text-white",
    muted: "text-zinc-500",
    headingFont: "font-['Space_Grotesk',sans-serif]",
    bodyFont: "font-sans",
    chatUserBg: "bg-purple-600 text-white",
    chatBotBg: "bg-white/5 border border-white/10 text-white",
  },
  minimalist: {
    bg: "bg-[#fafafa]",
    gradient: "bg-gradient-to-br from-zinc-200/50 via-transparent to-zinc-200/50",
    glass: "bg-white/80 backdrop-blur-md border border-zinc-200 shadow-sm",
    glassHover: "hover:bg-white/95 transition-all duration-300",
    accent: "from-zinc-800 to-zinc-600",
    glow: "shadow-lg shadow-zinc-200/50",
    text: "text-zinc-900",
    muted: "text-zinc-500",
    headingFont: "font-sans",
    bodyFont: "font-sans",
    chatUserBg: "bg-zinc-900 text-white",
    chatBotBg: "bg-zinc-100 border border-zinc-200 text-zinc-900",
  },
};

export default function PortfolioPage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [expandedStories, setExpandedStories] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: portfolio, isLoading, error } = useQuery<PortfolioData>({
    queryKey: ["/api/portfolio", username],
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (overrideValue?: string) => {
    const msgText = overrideValue || inputValue.trim();
    if (!msgText || isStreaming) return;
    setInputValue("");
    setMessages(prev => [...prev, { role: "user", content: msgText }]);
    setIsStreaming(true);

    try {
      const res = await fetch(`/api/chat/${username}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msgText }),
      });

      if (!res.ok) throw new Error("Chat failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  assistantMsg += data.content;
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: assistantMsg };
                    return updated;
                  });
                }
              } catch {}
            }
          }
        }
      }
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Sorry, I'm having trouble responding right now. Please try again." },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const toggleStory = (index: number) => {
    setExpandedStories(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#18181b] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-[#18181b] flex items-center justify-center p-6 text-white">
        <div className="text-center">
          <Globe className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Portfolio Not Found</h2>
        </div>
      </div>
    );
  }

  const profile = portfolio.profile;
  const brandingTheme = (profile.brandingTheme?.toLowerCase() as keyof typeof themes) || "executive";
  const theme = themes[brandingTheme];

  const experienceStories = portfolio.knowledgeEntries.filter(e => e.type === "experience");
  const skills = profile.technicalSkills?.split(/[,\n]/).map(s => s.trim()).filter(Boolean) || [];

  return (
    <div className={`${theme.bg} ${theme.text} ${theme.bodyFont} min-h-screen selection:bg-indigo-500/30 overflow-x-hidden`}>
      <div className={`${theme.gradient} fixed inset-0 -z-10`} />
      
      {/* SECTION A: HERO */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className={`text-6xl font-black mb-6 tracking-tight ${theme.headingFont}`}>
              {profile.displayName}
            </h1>
            
            <p className="text-2xl font-medium text-white/70 mb-8">
              {profile.heroSubtitle?.split(' • ').map((facet, i, arr) => (
                <span key={i}>
                  {facet}
                  {i < arr.length - 1 && (
                    <span className="text-indigo-400 mx-3 opacity-50">•</span>
                  )}
                </span>
              )) || profile.roleTitle}
            </p>

            <div className="space-y-6 text-white/80 text-xl leading-relaxed">
              {profile.positioning?.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 mt-10">
              {portfolio.contact.email && (
                <a href={`mailto:${portfolio.contact.email}`}>
                  <button className={`${theme.glass} px-8 py-4 rounded-xl ${theme.glassHover} font-semibold flex items-center gap-2`}>
                    <Mail className="w-5 h-5" /> Email
                  </button>
                </a>
              )}
              {portfolio.contact.linkedin && (
                <a href={portfolio.contact.linkedin} target="_blank" rel="noreferrer">
                  <button className={`${theme.glass} px-8 py-4 rounded-xl ${theme.glassHover} font-semibold flex items-center gap-2`}>
                    <Linkedin className="w-5 h-5" /> LinkedIn
                  </button>
                </a>
              )}
              <button 
                onClick={() => document.getElementById('section-chatbot')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" /> Talk to My AI
              </button>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl rounded-full" />
            {profile.videoUrl ? (
              <div className={`${theme.glass} rounded-3xl overflow-hidden ${theme.glow} aspect-video`}>
                <video src={profile.videoUrl} controls className="w-full h-full object-cover" />
              </div>
            ) : profile.photoUrl ? (
              <div className={`${theme.glass} rounded-3xl overflow-hidden ${theme.glow} aspect-square`}>
                <img src={profile.photoUrl} className="w-full h-full object-cover" alt={profile.displayName} />
              </div>
            ) : null}
          </motion.div>
        </div>
      </section>

      {/* SECTION B: DIGITAL TWIN CONSOLE */}
      <section id="section-chatbot" className="py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-4">Digital Twin Interface</h2>
          <p className={theme.muted}>Trained on {profile.displayName}'s career history and decision models.</p>
        </div>
        
        {profile.portfolioSuggestedQuestions && profile.portfolioSuggestedQuestions.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-8 justify-center">
            {profile.portfolioSuggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(q)}
                className={`${theme.glass} px-5 py-2.5 rounded-full text-sm font-medium ${theme.glassHover} transition-all border-white/5`}
              >
                {q}
              </button>
            ))}
          </div>
        )}
        
        <div className={`${theme.glass} rounded-3xl overflow-hidden flex flex-col h-[650px] ${theme.glow}`}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-40">
                <Terminal className="w-12 h-12 mb-4" />
                <p>Initialize interaction...</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] px-6 py-4 rounded-2xl ${
                  msg.role === 'user' ? theme.chatUserBg : theme.chatBotBg
                } leading-relaxed shadow-sm`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))}
            {isStreaming && (
              <div className="flex gap-2 p-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              </div>
            )}
          </div>
          
          <div className="p-6 bg-white/5 border-t border-white/10">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about strategy, experience, or specific roles..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-white"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isStreaming || !inputValue.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 py-4 rounded-xl font-bold transition-all"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C: STATS BENTO GRID */}
      {profile.stats && profile.stats.length > 0 && (
        <section className="py-20 px-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px flex-1 bg-white/10" />
            <h2 className="text-3xl font-bold uppercase tracking-widest text-indigo-400">Impact Metrics</h2>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {profile.stats.map((stat, i) => (
              <motion.div 
                whileHover={{ y: -5 }}
                key={i} 
                className={`${theme.glass} p-10 rounded-2xl text-center ${theme.glassHover} border-white/5`}
              >
                <div className={`text-5xl font-black mb-4 bg-gradient-to-r ${theme.accent} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
                <div className="text-white/60 text-lg font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION D: PROBLEM FIT */}
      {profile.problemFit && profile.problemFit.length > 0 && (
        <section className="py-20 px-6 max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Where I'm Most Useful</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {profile.problemFit.map((problem, i) => (
              <div key={i} className={`${theme.glass} p-8 rounded-2xl ${theme.glassHover} border-white/5 group`}>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-3 group-hover:scale-150 transition-all" />
                  <p className="text-xl text-white/90 leading-relaxed font-medium">{problem}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION E: HOW I WORK */}
      {profile.howIWork && profile.howIWork.steps?.length > 0 && (
        <section className="py-20 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{profile.howIWork.name}</h2>
            <div className="w-24 h-1 bg-indigo-500 mx-auto rounded-full" />
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {profile.howIWork.steps.map((step, i) => (
              <div key={i} className={`${theme.glass} p-8 rounded-2xl ${theme.glassHover} relative overflow-hidden group border-white/5`}>
                <div className="absolute -right-4 -top-4 text-8xl font-black text-white/5 group-hover:text-indigo-500/10 transition-all">
                  {i + 1}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-indigo-400">{step.label}</h3>
                <p className="text-white/70 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CAREER TIMELINE */}
      {portfolio.factBanks.length > 0 && (
        <section className="py-20 px-6 max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 flex items-center gap-4">
            <Briefcase className="w-8 h-8 text-indigo-400" />
            Career Trajectory
          </h2>
          <div className="space-y-8 relative">
            <div className="absolute left-[27px] top-4 bottom-4 w-px bg-white/10" />
            {portfolio.factBanks.map((fb, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative pl-16"
              >
                <div className="absolute left-4 top-2 w-7 h-7 rounded-full bg-indigo-600 border-4 border-zinc-900 z-10" />
                <div className={`${theme.glass} p-8 rounded-2xl ${theme.glassHover}`}>
                  <div className="flex flex-wrap justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white">{fb.companyName}</h3>
                      <p className="text-indigo-400 font-medium">{fb.roleName}</p>
                    </div>
                    {fb.duration && <Badge variant="outline" className="h-8 border-white/10 text-white/50">{fb.duration}</Badge>}
                  </div>
                  <ul className="space-y-3">
                    {fb.facts.map((fact, fi) => (
                      <li key={fi} className="text-white/60 flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 mt-2 shrink-0" />
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* SIGNATURE STORIES */}
      {experienceStories.length > 0 && (
        <section className="py-20 px-6 max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 flex items-center gap-4">
            <Sparkles className="w-8 h-8 text-indigo-400" />
            Signature Stories
          </h2>
          <div className="space-y-6">
            {experienceStories.map((entry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className={`${theme.glass} rounded-2xl overflow-hidden`}>
                  <button 
                    onClick={() => toggleStory(i)}
                    className="w-full p-8 flex items-center justify-between hover:bg-white/5 transition-all text-left"
                  >
                    <h3 className="text-2xl font-bold text-white">{entry.title}</h3>
                    {expandedStories.has(i) ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  <AnimatePresence>
                    {expandedStories.has(i) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-8 pt-0 space-y-8 border-t border-white/5 mt-4">
                          {entry.challenge && (
                            <div>
                              <h4 className="text-sm font-black uppercase tracking-widest text-indigo-400 mb-3">The Challenge</h4>
                              <p className="text-xl text-white/80 leading-relaxed">{entry.challenge}</p>
                            </div>
                          )}
                          {entry.approach && (
                            <div>
                              <h4 className="text-sm font-black uppercase tracking-widest text-indigo-400 mb-3">The Approach</h4>
                              <p className="text-xl text-white/80 leading-relaxed">{entry.approach}</p>
                            </div>
                          )}
                          {entry.result && (
                            <div>
                              <h4 className="text-sm font-black uppercase tracking-widest text-indigo-400 mb-3">The Result</h4>
                              <p className="text-xl text-white/80 leading-relaxed">{entry.result}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* SKILL MATRIX */}
      {skills.length > 0 && (
        <section className="py-20 px-6 max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 flex items-center gap-4">
            <Code2 className="w-8 h-8 text-indigo-400" />
            Skill Matrix
          </h2>
          <div className="flex flex-wrap gap-3">
            {skills.map((skill, i) => (
              <Badge 
                key={i} 
                variant="outline" 
                className={`${theme.glass} px-6 py-3 rounded-full text-lg border-white/5 text-white/80 ${theme.glassHover}`}
              >
                {skill}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* SECTION I: WHY AI CV */}
      {profile.whyAiCv && profile.whyAiCv.length > 0 && (
        <section className="py-20 px-6 max-w-4xl mx-auto">
          <div className={`${theme.glass} p-12 rounded-3xl space-y-8 border-white/10 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Terminal className="w-32 h-32" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-8">Why an AI CV?</h2>
            <div className="space-y-6">
              {profile.whyAiCv.map((para, i) => (
                <p key={i} className="text-xl text-white/70 leading-relaxed italic">
                  "{para}"
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION J: FOOTER CTA */}
      <footer className="py-32 px-6 max-w-4xl mx-auto text-center border-t border-white/5">
        <h2 className="text-5xl font-black mb-8 tracking-tighter">Don't Just Send a Resume. <br/><span className="text-indigo-500">Deploy an Agent.</span></h2>
        <div className="flex flex-wrap gap-6 justify-center">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl shadow-indigo-500/40 transition-all">
            Book a Conversation
          </button>
          <a href="/">
            <button className={`${theme.glass} px-10 py-5 rounded-2xl text-xl font-bold ${theme.glassHover}`}>
              Build Your Own Twin
            </button>
          </a>
        </div>
        <p className="mt-16 text-white/30 text-sm tracking-widest uppercase">
          Powered by BIOS.ai • Deployment ID: {username}
        </p>
      </footer>
    </div>
  );
}
