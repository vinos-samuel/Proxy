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

function getThemeStyles(theme: string) {
  switch(theme) {
    case "futurist":
      return {
        bg: "bg-[#0a0a0f]",
        text: "text-white",
        muted: "text-gray-400",
        accent: "text-purple-400",
        accentBg: "bg-purple-500",
        accentBorder: "border-purple-500/30",
        secondaryAccent: "text-cyan-400",
        cardBg: "bg-white/5 border-white/10",
        headingFont: "font-['Space_Grotesk',sans-serif]",
        bodyFont: "font-sans",
        chatUserBg: "bg-purple-500 text-white",
        chatBotBg: "bg-white/5 border border-white/10",
        sectionBorder: "border-white/5",
        heroGradient: "from-purple-500/15 via-cyan-500/5 to-transparent",
      };
    case "minimalist":
      return {
        bg: "bg-white",
        text: "text-black",
        muted: "text-gray-500",
        accent: "text-black",
        accentBg: "bg-black",
        accentBorder: "border-black/20",
        secondaryAccent: "text-gray-600",
        cardBg: "bg-gray-50 border-gray-200",
        headingFont: "font-['Helvetica_Neue',Arial,sans-serif]",
        bodyFont: "font-['Helvetica_Neue',Arial,sans-serif]",
        chatUserBg: "bg-black text-white",
        chatBotBg: "bg-gray-50 border border-gray-200",
        sectionBorder: "border-gray-200",
        heroGradient: "from-gray-100 to-white",
      };
    default:
      return {
        bg: "bg-[#faf9f7]",
        text: "text-[#1a1a2e]",
        muted: "text-[#6b7280]",
        accent: "text-[#1e3a5f]",
        accentBg: "bg-[#1e3a5f]",
        accentBorder: "border-[#1e3a5f]/20",
        secondaryAccent: "text-[#c8a951]",
        cardBg: "bg-white border-[#e5e5e0]",
        headingFont: "font-['Playfair_Display',serif]",
        bodyFont: "font-serif",
        chatUserBg: "bg-[#1e3a5f] text-white",
        chatBotBg: "bg-[#f5f4f0] border border-[#e5e5e0]",
        sectionBorder: "border-[#e5e5e0]",
        heroGradient: "from-[#1e3a5f]/5 via-[#c8a951]/5 to-transparent",
      };
  }
}

export default function PortfolioPage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [expandedStories, setExpandedStories] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const embeddedScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const embeddedInputRef = useRef<HTMLInputElement>(null);

  const { data: portfolio, isLoading, error } = useQuery<PortfolioData>({
    queryKey: ["/api/portfolio", username],
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (embeddedScrollRef.current) {
      embeddedScrollRef.current.scrollTop = embeddedScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (overrideValue?: string) => {
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
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#1e3a5f] mx-auto" />
          <p className="text-[#6b7280]">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-[#e5e5e0]">
          <CardContent className="p-8 text-center">
            <Globe className="h-12 w-12 text-[#6b7280] mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-[#1a1a2e]">Portfolio Not Found</h2>
            <p className="text-[#6b7280] text-sm">
              This portfolio doesn't exist or hasn't been published yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const theme = getThemeStyles(portfolio.profile.brandingTheme);
  const initials = portfolio.profile.displayName
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "DT";

  const experienceStories = portfolio.knowledgeEntries.filter(e => e.type === "experience");
  const achievementLines = portfolio.profile.achievements
    ? portfolio.profile.achievements.split("\n").filter(Boolean).map(a => a.replace(/^[-•]\s*/, ""))
    : [];
  const skills = portfolio.profile.technicalSkills
    ? portfolio.profile.technicalSkills.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
    : [];

  const suggestedQs = portfolio?.suggestedQuestions?.length
    ? portfolio.suggestedQuestions
    : ["Tell me about yourself", "What's your biggest achievement?", "How do you handle challenges?"];

  const renderChatMessages = (refObj: typeof scrollRef, isEmbedded: boolean) => (
    <div
      ref={refObj}
      className={`overflow-y-auto p-4 space-y-4 ${isEmbedded ? "h-[400px]" : "h-[350px]"}`}
      data-testid={isEmbedded ? "embedded-chat-messages" : "chat-messages"}
    >
      {messages.length === 0 && (
        <div className="text-center py-8">
          <Terminal className={`h-10 w-10 mx-auto mb-3 opacity-40 ${theme.accent}`} />
          <p className={`text-sm ${theme.muted}`}>
            Ask me anything about {portfolio.profile.displayName}'s career
          </p>
        </div>
      )}

      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {msg.role === "assistant" && (
            <div className={`h-7 w-7 shrink-0 rounded-md ${theme.accentBg} flex items-center justify-center mt-0.5`}>
              <Terminal className="h-3.5 w-3.5 text-white" />
            </div>
          )}
          <div
            className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${
              msg.role === "user" ? theme.chatUserBg : theme.chatBotBg
            }`}
            data-testid={`chat-message-${i}`}
          >
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
          {msg.role === "user" && (
            <div className="h-7 w-7 shrink-0 rounded-md bg-black/10 flex items-center justify-center mt-0.5">
              <User className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
      ))}

      {isStreaming && messages[messages.length - 1]?.content === "" && (
        <div className="flex items-center gap-2">
          <div className={`h-7 w-7 shrink-0 rounded-md ${theme.accentBg} flex items-center justify-center`}>
            <Terminal className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex gap-1">
            <span className={`w-1.5 h-1.5 ${theme.accentBg} rounded-full animate-bounce`} style={{ animationDelay: "0ms" }} />
            <span className={`w-1.5 h-1.5 ${theme.accentBg} rounded-full animate-bounce`} style={{ animationDelay: "150ms" }} />
            <span className={`w-1.5 h-1.5 ${theme.accentBg} rounded-full animate-bounce`} style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )}
    </div>
  );

  const renderChatInput = (refObj: typeof inputRef, testIdPrefix: string) => (
    <div className={`p-3 border-t ${theme.sectionBorder}`}>
      <form
        onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
        className="flex items-center gap-2"
      >
        <Input
          ref={refObj}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Ask a question..."
          disabled={isStreaming}
          className={theme.bodyFont}
          data-testid={`${testIdPrefix}input-chat-message`}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!inputValue.trim() || isStreaming}
          className={`${theme.accentBg} text-white`}
          data-testid={`${testIdPrefix}button-send-message`}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} ${theme.bodyFont} relative`}>
      {/* Hero Section */}
      <section data-testid="section-hero" className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.heroGradient}`} />
        <div className="relative mx-auto max-w-5xl px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center gap-8"
          >
            {portfolio.profile.videoUrl ? (
              <div className="w-full md:w-1/2 shrink-0">
                <video
                  src={portfolio.profile.videoUrl}
                  controls
                  poster={portfolio.profile.photoUrl || undefined}
                  className="w-full rounded-md max-h-[400px] object-cover"
                />
              </div>
            ) : (
              <Avatar className={`h-36 w-36 border-2 ${theme.accentBorder} shrink-0`}>
                {portfolio.profile.photoUrl ? (
                  <AvatarImage src={portfolio.profile.photoUrl} alt={portfolio.profile.displayName} />
                ) : null}
                <AvatarFallback className={`text-3xl ${theme.accentBg} text-white`}>
                  {initials}
                </AvatarFallback>
              </Avatar>
            )}

            <div className={`text-center ${portfolio.profile.videoUrl ? "md:text-left md:w-1/2" : "md:text-left"}`}>
              <h1 className={`text-4xl md:text-5xl font-bold mb-2 ${theme.headingFont}`} data-testid="text-display-name">
                {portfolio.profile.displayName}
              </h1>
              <p className={`text-xl ${theme.accent} mb-3`} data-testid="text-role-title">
                {portfolio.profile.roleTitle}
              </p>
              <p className={`${theme.muted} max-w-lg`} data-testid="text-positioning">
                {portfolio.profile.positioning}
              </p>

              <div className="flex items-center gap-3 mt-6 justify-center md:justify-start flex-wrap">
                {portfolio.contact.email && (
                  <a href={`mailto:${portfolio.contact.email}`}>
                    <Button variant="outline" size="sm" data-testid="button-contact-email">
                      <Mail className="mr-1.5 h-3.5 w-3.5" /> Email
                    </Button>
                  </a>
                )}
                {portfolio.contact.linkedin && (
                  <a href={portfolio.contact.linkedin.startsWith("http") ? portfolio.contact.linkedin : `https://${portfolio.contact.linkedin}`} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" data-testid="button-contact-linkedin">
                      <Linkedin className="mr-1.5 h-3.5 w-3.5" /> LinkedIn
                    </Button>
                  </a>
                )}
                {portfolio.profile.cvResumeUrl && (
                  <a href={portfolio.profile.cvResumeUrl} download>
                    <Button variant="outline" size="sm" data-testid="button-cv-download">
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Download CV
                    </Button>
                  </a>
                )}
                {portfolio.profile.resumeUrl && !portfolio.profile.cvResumeUrl && (
                  <a href={portfolio.profile.resumeUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" data-testid="button-resume">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Resume
                    </Button>
                  </a>
                )}
                <Button
                  size="sm"
                  onClick={() => {
                    const chatSection = document.getElementById("section-chatbot");
                    if (chatSection) chatSection.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`${theme.accentBg} text-white`}
                  data-testid="button-open-chat"
                >
                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Talk to My Twin
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Impact Metrics */}
      {achievementLines.length > 0 && (
        <section data-testid="section-metrics" className={`border-t ${theme.sectionBorder}`}>
          <div className="mx-auto max-w-5xl px-6 py-12">
            <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${theme.headingFont}`}>
              <Award className={`h-5 w-5 ${theme.secondaryAccent}`} />
              Impact Metrics
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
              {achievementLines.map((achievement, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="shrink-0"
                >
                  <Card className={`border ${theme.cardBg} min-w-[220px] max-w-[280px]`} data-testid={`achievement-${i}`}>
                    <CardContent className="p-4">
                      <p className={`text-sm ${theme.text}`}>
                        {achievement.split(/(\d[\d,.%+]*\w*)/g).map((part, pi) =>
                          /\d/.test(part) ? (
                            <span key={pi} className={`font-bold ${theme.secondaryAccent}`}>{part}</span>
                          ) : (
                            <span key={pi}>{part}</span>
                          )
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Skill Matrix */}
      {skills.length > 0 && (
        <section data-testid="section-skills" className={`border-t ${theme.sectionBorder}`}>
          <div className="mx-auto max-w-5xl px-6 py-12">
            <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${theme.headingFont}`}>
              <Code2 className={`h-5 w-5 ${theme.accent}`} />
              Skill Matrix
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Badge
                    variant="outline"
                    className={`${theme.accentBorder} ${theme.accent}`}
                    data-testid={`skill-badge-${i}`}
                  >
                    {skill}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Career Timeline */}
      {portfolio.factBanks.length > 0 && (
        <section data-testid="section-timeline" className={`border-t ${theme.sectionBorder}`}>
          <div className="mx-auto max-w-5xl px-6 py-12">
            <h2 className={`text-2xl font-bold mb-8 flex items-center gap-2 ${theme.headingFont}`}>
              <Briefcase className={`h-5 w-5 ${theme.accent}`} />
              Career Timeline
            </h2>
            <div className="relative">
              <div className={`absolute left-[11px] top-2 bottom-2 w-0.5 ${theme.accentBg} opacity-30`} />
              <div className="space-y-8">
                {portfolio.factBanks.map((fb, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative pl-10"
                    data-testid={`card-company-${i}`}
                  >
                    <div className={`absolute left-0 top-1 h-6 w-6 rounded-full ${theme.accentBg} flex items-center justify-center`}>
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                    <Card className={`border ${theme.cardBg}`}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <h3 className={`font-semibold text-lg ${theme.headingFont}`}>{fb.companyName}</h3>
                          <Badge variant="secondary" className="text-xs">{fb.roleName}</Badge>
                        </div>
                        {fb.duration && (
                          <p className={`text-xs ${theme.muted} mb-3`}>{fb.duration}</p>
                        )}
                        <ul className="space-y-1.5 mt-2">
                          {fb.facts.slice(0, 5).map((fact, fi) => (
                            <li key={fi} className={`text-sm ${theme.muted} flex items-start gap-2`}>
                              <span className={`${theme.accent} mt-1 shrink-0`}>&#8226;</span>
                              <span>{fact}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Signature Stories */}
      {experienceStories.length > 0 && (
        <section data-testid="section-stories" className={`border-t ${theme.sectionBorder}`}>
          <div className="mx-auto max-w-5xl px-6 py-12">
            <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${theme.headingFont}`}>
              <Sparkles className={`h-5 w-5 ${theme.secondaryAccent}`} />
              Signature Stories
            </h2>
            <div className="space-y-4">
              {experienceStories.map((entry, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className={`border ${theme.cardBg} overflow-visible`} data-testid={`card-story-${i}`}>
                    <CardContent className="p-0">
                      <button
                        onClick={() => toggleStory(i)}
                        className={`w-full flex items-center justify-between gap-4 p-5 text-left ${theme.text}`}
                        data-testid={`button-toggle-story-${i}`}
                      >
                        <h3 className={`font-semibold text-lg ${theme.headingFont}`}>{entry.title}</h3>
                        {expandedStories.has(i) ? (
                          <ChevronUp className={`h-5 w-5 shrink-0 ${theme.muted}`} />
                        ) : (
                          <ChevronDown className={`h-5 w-5 shrink-0 ${theme.muted}`} />
                        )}
                      </button>
                      <AnimatePresence>
                        {expandedStories.has(i) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className={`px-5 pb-5 grid md:grid-cols-3 gap-6 border-t ${theme.sectionBorder} pt-5`}>
                              {entry.challenge && (
                                <div>
                                  <h4 className={`text-xs font-medium ${theme.accent} uppercase tracking-wider mb-2`}>Challenge</h4>
                                  <p className={`text-sm ${theme.muted}`}>{entry.challenge}</p>
                                </div>
                              )}
                              {entry.approach && (
                                <div>
                                  <h4 className={`text-xs font-medium ${theme.accent} uppercase tracking-wider mb-2`}>Approach</h4>
                                  <p className={`text-sm ${theme.muted}`}>{entry.approach}</p>
                                </div>
                              )}
                              {entry.result && (
                                <div>
                                  <h4 className={`text-xs font-medium ${theme.secondaryAccent} uppercase tracking-wider mb-2`}>Result</h4>
                                  <p className={`text-sm ${theme.muted}`}>{entry.result}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Embedded Chatbot Section */}
      <section id="section-chatbot" data-testid="section-chatbot" className={`border-t ${theme.sectionBorder}`}>
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h2 className={`text-2xl font-bold mb-2 ${theme.headingFont} text-center`}>
            Ask My Digital Twin
          </h2>
          <p className={`${theme.muted} text-center text-sm mb-6`}>
            Chat with an AI trained on {portfolio.profile.displayName}'s experience
          </p>

          {messages.length === 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {suggestedQs.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className={`px-3 py-1.5 rounded-full text-sm border ${theme.accentBorder} ${theme.accent} hover:opacity-80 transition-opacity`}
                  data-testid={`button-suggestion-${i}`}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <Card className={`border ${theme.cardBg} overflow-hidden`}>
            <CardContent className="p-0">
              {renderChatMessages(embeddedScrollRef, true)}
              {renderChatInput(embeddedInputRef, "")}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Floating Chat Panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[400px] max-w-[calc(100vw-3rem)] z-50"
          >
            <Card className={`border ${theme.cardBg} ${theme.bg} shadow-2xl overflow-hidden`}>
              <div className={`px-4 py-3 border-b ${theme.sectionBorder} flex items-center justify-between gap-2`}>
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-md ${theme.accentBg} flex items-center justify-center`}>
                    <Terminal className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${theme.text}`}>{portfolio.profile.displayName}'s Twin</p>
                    <p className={`text-xs ${theme.muted}`}>AI-Powered Assistant</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setChatOpen(false)}
                  data-testid="button-close-chat"
                >
                  <span className="text-lg leading-none">&times;</span>
                </Button>
              </div>

              {renderChatMessages(scrollRef, false)}

              {messages.length === 0 && (
                <div className="px-4 pb-2">
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedQs.slice(0, 3).map((q, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(q)}
                        className={`text-xs px-2 py-1 rounded-full border ${theme.accentBorder} ${theme.accent} hover:opacity-80 transition-opacity`}
                        data-testid={`button-floating-suggestion-${i}`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {renderChatInput(inputRef, "floating-")}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Button */}
      {!chatOpen && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button
            size="lg"
            onClick={() => setChatOpen(true)}
            className={`h-14 w-14 rounded-full shadow-lg ${theme.accentBg} text-white no-default-hover-elevate`}
            data-testid="button-chat-fab"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        </motion.div>
      )}

      {/* Footer */}
      <footer data-testid="section-footer" className={`border-t ${theme.sectionBorder} py-8 mt-12`}>
        <div className="mx-auto max-w-5xl px-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Terminal className={`h-4 w-4 ${theme.accent}`} />
            <span className={`text-sm ${theme.muted}`}>Powered by BIOS.ai</span>
          </div>
          <a href="/" className={`text-sm ${theme.accent} hover:underline`}>
            Create your own
          </a>
        </div>
      </footer>
    </div>
  );
}
