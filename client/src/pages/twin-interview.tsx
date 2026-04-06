import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Mic, MicOff, Send, ArrowLeft, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import type { TwinProfile } from "@shared/schema";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function TwinInterviewPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [readyToComplete, setReadyToComplete] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionResult, setCompletionResult] = useState<{
    warStoriesAdded: number;
    achievementsAdded: number;
    factsAdded: number;
  } | null>(null);

  // Voice input
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: profile } = useQuery<TwinProfile | null>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  // Check voice support on mount
  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SR);
  }, []);

  // Start interview on mount
  useEffect(() => {
    async function startSession() {
      try {
        setIsStarting(true);
        const res = await apiRequest("POST", "/api/interview/start");
        const data = await res.json();
        setMessages([{ role: "assistant", content: data.message }]);
      } catch (err: any) {
        // Show actual error so we can diagnose
        const errMsg = err?.message || String(err);
        setMessages([
          {
            role: "assistant",
            content: `Could not start the interview. Error: ${errMsg}\n\nPlease go back to the dashboard and try again.`,
          },
        ]);
      } finally {
        setIsStarting(false);
      }
    }
    startSession();
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading || isCompleting) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/interview/message", { message: text });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      if (data.readyToComplete) {
        setReadyToComplete(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const res = await apiRequest("POST", "/api/interview/complete");
      const data = await res.json();
      setCompletionResult({
        warStoriesAdded: data.warStoriesAdded,
        achievementsAdded: data.achievementsAdded,
        factsAdded: data.factsAdded,
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "There was an error updating your profile. Please try again.",
        },
      ]);
      setIsCompleting(false);
    }
  };

  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;

    // If already listening, stop
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;        // keep going until user stops
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    setIsListening(true);
    setInput("");

    recognition.onresult = (event: any) => {
      // Accumulate all results while listening
      let fullTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript + " ";
      }
      setInput(fullTranscript.trim());
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      // When stopped (by button or browser), don't auto-submit — let user review transcript
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Completion screen
  if (completionResult) {
    const totalAdded =
      completionResult.warStoriesAdded +
      completionResult.achievementsAdded +
      completionResult.factsAdded;

    return (
      <div
        className="min-h-screen bg-[#E8E8E3] flex flex-col items-center justify-center px-6"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        <div className="max-w-lg w-full bg-white border-[3px] border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <div className="w-16 h-16 bg-[#22C55E] border-[3px] border-black flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CheckCircle2 className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Twin Updated</h1>
          <p className="mono text-sm text-black/60 mb-6">
            Your profile has been deepened with real career data.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="border-[3px] border-black bg-[#E8E8E3] p-3">
              <div className="text-3xl font-bold">{completionResult.warStoriesAdded}</div>
              <div className="mono text-xs text-black/50 uppercase mt-1">New Stories</div>
            </div>
            <div className="border-[3px] border-black bg-[#E8E8E3] p-3">
              <div className="text-3xl font-bold">{completionResult.achievementsAdded}</div>
              <div className="mono text-xs text-black/50 uppercase mt-1">Achievements</div>
            </div>
            <div className="border-[3px] border-black bg-[#E8E8E3] p-3">
              <div className="text-3xl font-bold">{completionResult.factsAdded}</div>
              <div className="mono text-xs text-black/50 uppercase mt-1">Facts Added</div>
            </div>
          </div>

          {totalAdded === 0 ? (
            <p className="mono text-sm text-black/50 mb-6">
              No new structured data was extracted — but your session has been noted. Try providing more specific answers next time.
            </p>
          ) : (
            <p className="mono text-sm text-black/60 mb-6">
              Your Twin's responses will be noticeably more specific and credible now.
            </p>
          )}

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-[#22C55E] text-black px-6 py-3 font-bold border-[3px] border-black mono text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#16A34A] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Back to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#E8E8E3] flex flex-col"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Nav */}
      <nav className="border-b-[3px] border-black bg-[#D1D1CC] sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="flex items-center gap-2 mono text-sm text-black/60 hover:text-black uppercase tracking-wider">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#22C55E] border-[3px] border-black flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-black" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">DEEPEN YOUR TWIN</div>
              <div className="mono text-xs text-black/50 uppercase tracking-wider">Profile Interview</div>
            </div>
          </div>
          <div className="w-24" /> {/* spacer */}
        </div>
      </nav>

      {/* Intro banner */}
      <div className="max-w-3xl mx-auto px-6 pt-6 w-full">
        <div className="bg-[#22C55E] border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
          <p className="mono text-xs text-black leading-relaxed">
            <strong>No need to type.</strong>{speechSupported ? " Tap the mic, speak like you're explaining something to a colleague, tap again to stop. " : " "}Don't worry about grammar or sentence structure — just talk naturally. The interviewer will ask follow-up questions to pull out the specifics. Your Twin updates when you're done.
          </p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 max-w-3xl mx-auto px-6 w-full flex flex-col">
        <div className="flex-1 space-y-4 pb-4">
          {isStarting ? (
            <div className="flex items-center gap-3 bg-white border-[3px] border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] w-fit max-w-[80%]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="mono text-sm text-black/60">Analysing your profile…</span>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] border-[3px] border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                    msg.role === "user"
                      ? "bg-[#22C55E] text-black"
                      : "bg-white text-black"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="mono text-xs text-black/40 uppercase tracking-wider mb-2">
                      Interviewer
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border-[3px] border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="mono text-xs text-black/50">Thinking…</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Update Twin CTA */}
        {readyToComplete && !isLoading && (
          <div className="mb-4 bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="mono text-xs text-black/60 mb-3 uppercase tracking-wider">
              Interview complete — ready to update your Twin
            </p>
            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className="w-full bg-[#22C55E] text-black px-6 py-3 font-bold border-[3px] border-black mono text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#16A34A] disabled:opacity-50 transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating Your Twin…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Update My Twin Now
                </>
              )}
            </button>
          </div>
        )}

        {/* Input bar */}
        {!readyToComplete && (
          <div className="pb-6">
            <div className="flex gap-2 items-end bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening — tap mic to stop…" : "Tap mic to speak, or type here…"}
                rows={2}
                disabled={isLoading || isStarting}
                className="flex-1 resize-none bg-transparent border-none outline-none mono text-sm text-black placeholder:text-black/40 disabled:opacity-50"
              />
              <div className="flex gap-2 flex-shrink-0">
                {speechSupported && (
                  <button
                    onClick={startListening}
                    disabled={isLoading || isStarting}
                    title={isListening ? "Tap to stop listening" : "Tap to speak"}
                    className={`w-10 h-10 border-[3px] border-black flex items-center justify-center transition-all ${
                      isListening
                        ? "bg-red-500 text-white animate-pulse scale-110"
                        : "bg-black text-white hover:bg-gray-800"
                    } disabled:opacity-40`}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => handleSubmit()}
                  disabled={!input.trim() || isLoading || isStarting}
                  className="w-10 h-10 bg-black text-white border-[3px] border-black flex items-center justify-center hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mono text-xs text-black/30 mt-2 text-center">
              {speechSupported
                ? "Tap mic to start/stop speaking · Press Enter to send"
                : "Press Enter to send · Shift+Enter for new line"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
