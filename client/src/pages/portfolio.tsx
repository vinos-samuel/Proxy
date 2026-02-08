import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bot, Send, User, Briefcase, Mail, Phone, Linkedin,
  ExternalLink, Loader2, MessageSquare, Sparkles, Globe
} from "lucide-react";

interface PortfolioData {
  profile: {
    displayName: string;
    roleTitle: string;
    positioning: string;
    persona: string;
    tone: string;
    photoUrl: string | null;
    resumeUrl: string | null;
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
  };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function PortfolioPage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
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

  const sendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;
    const userMsg = inputValue.trim();
    setInputValue("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsStreaming(true);

    try {
      const res = await fetch(`/api/chat/${username}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-400 mx-auto" />
          <p className="text-muted-foreground">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Portfolio Not Found</h2>
            <p className="text-muted-foreground text-sm">
              This portfolio doesn't exist or hasn't been published yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = portfolio.profile.displayName
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "DT";

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/15 via-violet-600/10 to-purple-600/5" />
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center gap-8"
          >
            <Avatar className="h-32 w-32 border-2 border-indigo-500/30">
              {portfolio.profile.photoUrl ? (
                <AvatarImage src={portfolio.profile.photoUrl} alt={portfolio.profile.displayName} />
              ) : null}
              <AvatarFallback className="text-3xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-2" data-testid="text-display-name">
                {portfolio.profile.displayName}
              </h1>
              <p className="text-xl text-indigo-300 mb-3" data-testid="text-role-title">
                {portfolio.profile.roleTitle}
              </p>
              <p className="text-muted-foreground max-w-lg" data-testid="text-positioning">
                {portfolio.profile.positioning}
              </p>

              <div className="flex items-center gap-3 mt-4 justify-center md:justify-start flex-wrap">
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
                {portfolio.profile.resumeUrl && (
                  <a href={portfolio.profile.resumeUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" data-testid="button-resume">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Resume
                    </Button>
                  </a>
                )}
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => { setChatOpen(true); }}
                  data-testid="button-open-chat"
                >
                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Chat with my Twin
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Career Highlights */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-indigo-400" />
          Career Highlights
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {portfolio.factBanks.map((fb, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl h-full" data-testid={`card-company-${i}`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    <h3 className="font-semibold">{fb.companyName}</h3>
                    <Badge variant="secondary" className="text-xs">{fb.roleName}</Badge>
                  </div>
                  {fb.duration && (
                    <p className="text-xs text-muted-foreground mb-3">{fb.duration}</p>
                  )}
                  <ul className="space-y-1.5">
                    {fb.facts.slice(0, 5).map((fact, fi) => (
                      <li key={fi} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-indigo-400 mt-1 shrink-0">&#8226;</span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Signature Stories */}
      {portfolio.knowledgeEntries.filter(e => e.type === "experience").length > 0 && (
        <section className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            Signature Stories
          </h2>
          <div className="space-y-4">
            {portfolio.knowledgeEntries
              .filter(e => e.type === "experience")
              .map((entry, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="border-white/10 bg-white/5 backdrop-blur-xl" data-testid={`card-story-${i}`}>
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-4">{entry.title}</h3>
                      <div className="grid md:grid-cols-3 gap-6">
                        {entry.challenge && (
                          <div>
                            <h4 className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-2">Challenge</h4>
                            <p className="text-sm text-muted-foreground">{entry.challenge}</p>
                          </div>
                        )}
                        {entry.approach && (
                          <div>
                            <h4 className="text-xs font-medium text-violet-400 uppercase tracking-wider mb-2">Approach</h4>
                            <p className="text-sm text-muted-foreground">{entry.approach}</p>
                          </div>
                        )}
                        {entry.result && (
                          <div>
                            <h4 className="text-xs font-medium text-green-400 uppercase tracking-wider mb-2">Result</h4>
                            <p className="text-sm text-muted-foreground">{entry.result}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </div>
        </section>
      )}

      {/* Chat Panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[400px] max-w-[calc(100vw-3rem)] z-50"
          >
            <Card className="border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between gap-2 bg-indigo-500/5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{portfolio.profile.displayName}'s Twin</p>
                    <p className="text-xs text-muted-foreground">AI-Powered Assistant</p>
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

              {/* Messages */}
              <div ref={scrollRef} className="h-[350px] overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <Bot className="h-10 w-10 text-indigo-400/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Ask me anything about {portfolio.profile.displayName}'s career
                    </p>
                    <div className="mt-4 space-y-2">
                      {["Tell me about yourself", "What's your biggest achievement?", "How do you handle failure?"].map((q, i) => (
                        <button
                          key={i}
                          onClick={() => { setInputValue(q); }}
                          className="block mx-auto text-xs text-indigo-400 hover:underline"
                          data-testid={`button-suggestion-${i}`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="h-7 w-7 shrink-0 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mt-0.5">
                        <Bot className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-indigo-500 text-white"
                          : "bg-white/5 border border-white/10"
                      }`}
                      data-testid={`chat-message-${i}`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === "user" && (
                      <div className="h-7 w-7 shrink-0 rounded-md bg-white/10 flex items-center justify-center mt-0.5">
                        <User className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                ))}

                {isStreaming && messages[messages.length - 1]?.content === "" && (
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 shrink-0 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-white/5">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                  className="flex items-center gap-2"
                >
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder="Ask a question..."
                    disabled={isStreaming}
                    data-testid="input-chat-message"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!inputValue.trim() || isStreaming}
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
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
            className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 no-default-hover-elevate"
            data-testid="button-chat-fab"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        </motion.div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-12">
        <div className="mx-auto max-w-5xl px-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-indigo-400" />
            <span className="text-sm text-muted-foreground">Powered by Digital Twin Studio</span>
          </div>
          <a href="/" className="text-sm text-indigo-400 hover:underline">
            Create your own
          </a>
        </div>
      </footer>
    </div>
  );
}
