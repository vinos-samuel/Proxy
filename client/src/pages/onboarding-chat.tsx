import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Mic, MicOff, Send, Loader2, CheckCircle2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function OnboardingChatPage() {
  const [, navigate] = useLocation();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [readyToComplete, setReadyToComplete] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [done, setDone] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SR);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Start onboarding on mount — draft was saved to DB by parse-resume, server retrieves it
  useEffect(() => {
    async function startSession() {
      try {
        setIsStarting(true);
        // Get current draft from DB to pass to onboarding agent
        const profileRes = await fetch("/api/profile", { credentials: "include" });
        let draft = {};
        if (profileRes.ok) {
          const profile = await profileRes.json();
          draft = profile?.questionnaireData || {};
        }

        const res = await apiRequest("POST", "/api/onboarding/start", { draft });
        const data = await res.json();
        setMessages([{ role: "assistant", content: data.message }]);
      } catch (err: any) {
        setMessages([{
          role: "assistant",
          content: `Couldn't start the conversation. Error: ${err?.message || String(err)}\n\nPlease go back and try the form path instead.`,
        }]);
      } finally {
        setIsStarting(false);
      }
    }
    startSession();
  }, []);

  const handleSubmit = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading || isCompleting) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/onboarding/message", { message: text });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      if (data.readyToComplete) setReadyToComplete(true);
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Something went wrong. Please try again.",
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const res = await apiRequest("POST", "/api/onboarding/complete");
      await res.json();
      setDone(true);
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "There was a problem saving your profile. Please try again.",
      }]);
      setIsCompleting(false);
    }
  };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    setIsListening(true);
    setInput("");

    recognition.onresult = (event: any) => {
      let fullTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript + " ";
      }
      setInput(fullTranscript.trim());
    };

    recognition.onerror = () => { setIsListening(false); recognitionRef.current = null; };
    recognition.onend = () => { setIsListening(false); recognitionRef.current = null; };
    recognition.start();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Done screen — profile saved, go review in questionnaire
  if (done) {
    return (
      <div
        className="min-h-screen bg-[#E8E8E3] flex flex-col items-center justify-center px-6"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        <div className="max-w-lg w-full bg-white border-[3px] border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <div className="w-16 h-16 bg-[#22C55E] border-[3px] border-black flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CheckCircle2 className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Profile Updated</h1>
          <p className="mono text-sm text-black/60 mb-6 leading-relaxed">
            Everything you shared has been mapped to your profile. Review the sections below — fill in anything that's still empty, then hit Submit to build your Twin.
          </p>
          <button
            onClick={() => navigate("/questionnaire")}
            className="w-full bg-[#22C55E] text-black px-6 py-3 font-bold border-[3px] border-black mono text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#16A34A] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Review & Submit →
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full mt-3 bg-white text-black px-6 py-3 font-bold border-[3px] border-black mono text-sm uppercase tracking-wider hover:bg-black/5 transition-colors"
          >
            Back to Dashboard
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
          <button
            onClick={() => navigate("/questionnaire")}
            className="flex items-center gap-2 mono text-sm text-black/60 hover:text-black uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to forms
          </button>
          <div className="text-center">
            <div className="font-bold text-sm leading-tight">BUILDING YOUR TWIN</div>
            <div className="mono text-xs text-black/50 uppercase tracking-wider">Conversation mode</div>
          </div>
          <div className="w-28" />
        </div>
      </nav>

      {/* Intro banner */}
      <div className="max-w-3xl mx-auto px-6 pt-6 w-full">
        <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
          <p className="mono text-xs text-black/60 leading-relaxed">
            Just talk naturally. No need to position yourself or use professional language — the more real you are, the better your Twin will represent you.
            {speechSupported && " Tap the mic to speak, tap again to stop."}
          </p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 max-w-3xl mx-auto px-6 w-full flex flex-col">
        <div className="flex-1 space-y-4 pb-4">
          {isStarting ? (
            <div className="flex items-center gap-3 bg-white border-[3px] border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] w-fit max-w-[80%]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="mono text-sm text-black/60">Reading your CV…</span>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] border-[3px] border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                  msg.role === "user" ? "bg-[#22C55E] text-black" : "bg-white text-black"
                }`}>
                  {msg.role === "assistant" && (
                    <div className="mono text-xs text-black/40 uppercase tracking-wider mb-2">Proxy</div>
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

        {/* Update profile CTA */}
        {readyToComplete && !isLoading && (
          <div className="mb-4 bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="mono text-xs text-black/60 mb-3 uppercase tracking-wider">
              Conversation complete — ready to update your profile
            </p>
            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className="w-full bg-[#22C55E] text-black px-6 py-3 font-bold border-[3px] border-black mono text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#16A34A] disabled:opacity-50 flex items-center justify-center gap-2 transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              {isCompleting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving your profile…</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Update My Profile →</>
              )}
            </button>
          </div>
        )}

        {/* Input */}
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
                    title={isListening ? "Tap to stop" : "Tap to speak"}
                    className={`w-10 h-10 border-[3px] border-black flex items-center justify-center transition-all ${
                      isListening ? "bg-red-500 text-white animate-pulse scale-110" : "bg-black text-white hover:bg-gray-800"
                    } disabled:opacity-40`}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                )}
                <button
                  onClick={() => handleSubmit()}
                  disabled={!input.trim() || isLoading || isStarting}
                  className="w-10 h-10 bg-black text-white border-[3px] border-black flex items-center justify-center hover:bg-gray-800 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mono text-xs text-black/30 mt-2 text-center">
              {speechSupported ? "Tap mic · Press Enter to send" : "Press Enter to send · Shift+Enter for new line"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
