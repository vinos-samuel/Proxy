import { X } from "lucide-react";
import LinkedInMockup from "./LinkedInMockup";

interface CvExtracted {
  name: string; currentTitle: string; summary: string;
  roles: Array<{ title: string; company: string; years: string; achievements: string }>;
  skills: string[]; achievements: string[];
}
interface LinkedInDraft { headline: string; about: string; }
interface ProxyPreview { name: string; title: string; summary: string; }

interface ThreePanelModalProps {
  onClose: () => void;
  cvExtracted: CvExtracted | null;
  linkedInDraft: LinkedInDraft | null;
  proxyPreview: ProxyPreview;
  onComplete: () => void;
}

export default function ThreePanelModal({ onClose, cvExtracted, linkedInDraft, proxyPreview, onComplete }: ThreePanelModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="bg-white border-[3px] border-black w-full max-w-6xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black bg-[#E8E8E3]">
          <div>
            <div className="mono text-xs text-black/40 uppercase tracking-widest mb-1">// the_comparison</div>
            <h2 className="text-2xl font-bold">Same person. Three very different impressions.</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/10 border-[2px] border-black">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Three panels */}
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x-[3px] divide-black min-h-[500px]">

          {/* Panel 1: CV */}
          <div className="p-5 bg-[#FAFAFA] flex flex-col">
            <div className="mono text-xs text-black/30 uppercase tracking-widest mb-1">// what_they_see_now</div>
            <div className="text-sm font-bold mb-3 text-black/50 uppercase tracking-wide">The CV</div>
            <div className="flex-1 overflow-hidden relative">
              {/* Dense CV document */}
              <div className="font-mono text-[10px] leading-[1.45] text-black/60 space-y-2 select-none">
                {cvExtracted ? (
                  <>
                    <div className="text-black font-bold text-xs border-b border-black/20 pb-1 mb-2">
                      {cvExtracted.name?.toUpperCase()}
                      <span className="font-normal text-[10px] ml-2">· {cvExtracted.currentTitle}</span>
                    </div>
                    {cvExtracted.summary && (
                      <div>
                        <div className="font-bold text-black/80 uppercase text-[9px] tracking-wider mb-0.5">PROFILE SUMMARY</div>
                        <p>{cvExtracted.summary}</p>
                      </div>
                    )}
                    {cvExtracted.roles?.slice(0, 4).map((r, i) => (
                      <div key={i}>
                        <div className="font-bold text-black/80">{r.title} — {r.company}</div>
                        <div className="text-black/40 text-[9px] mb-0.5">{r.years}</div>
                        <p className="leading-relaxed">{r.achievements?.slice(0, 300)}</p>
                      </div>
                    ))}
                    {cvExtracted.achievements?.slice(0, 6).map((a, i) => (
                      <p key={i}>• {a}</p>
                    ))}
                    <div>
                      <div className="font-bold text-black/80 uppercase text-[9px] tracking-wider mb-0.5">SKILLS</div>
                      <p>{cvExtracted.skills?.join(" · ")}</p>
                    </div>
                    <p className="text-black/30 italic">[ additional experience, education, references... ]</p>
                  </>
                ) : (
                  // Generic dense text if no data
                  Array.from({ length: 28 }).map((_, i) => (
                    <div key={i} className={`h-2 bg-black/10 rounded ${i % 7 === 0 ? "w-1/2 bg-black/25" : i % 3 === 0 ? "w-full" : "w-4/5"}`} />
                  ))
                )}
              </div>
              {/* Fade out at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#FAFAFA] to-transparent" />
            </div>
            <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 text-[10px] text-red-600 mono text-center">
              Wall of text · 6-second scan · static · one-way
            </div>
          </div>

          {/* Panel 2: LinkedIn */}
          <div className="p-5 bg-[#F3F6F8] flex flex-col">
            <div className="mono text-xs text-black/30 uppercase tracking-widest mb-1">// linkedin_profile</div>
            <div className="text-sm font-bold mb-3 text-[#0077B5] uppercase tracking-wide">LinkedIn</div>
            <div className="flex-1">
              {linkedInDraft ? (
                <LinkedInMockup
                  name={cvExtracted?.name || proxyPreview.name}
                  headline={linkedInDraft.headline}
                  about={linkedInDraft.about}
                  currentTitle={cvExtracted?.currentTitle}
                  skills={cvExtracted?.skills?.slice(0, 6)}
                />
              ) : (
                <div className="text-center text-black/30 mono text-xs py-8">LinkedIn preview not generated</div>
              )}
            </div>
            <div className="mt-3 px-3 py-2 bg-yellow-50 border border-yellow-200 text-[10px] text-yellow-700 mono text-center">
              Passive · same as thousands · no answers · one-way
            </div>
          </div>

          {/* Panel 3: Proxy */}
          <div className="p-5 bg-white flex flex-col">
            <div className="mono text-xs text-[#22C55E] uppercase tracking-widest mb-1">// your_proxy</div>
            <div className="text-sm font-bold mb-3 text-black uppercase tracking-wide">Your Proxy</div>
            <div className="flex-1 space-y-3">
              {/* Mini hero */}
              <div className="bg-black p-4 flex items-start gap-3">
                <div className="w-10 h-10 bg-[#22C55E] border-[2px] border-white/20 flex items-center justify-center font-bold text-black text-sm shrink-0">
                  {proxyPreview.name[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{proxyPreview.name}</div>
                  <div className="mono text-[10px] text-[#22C55E]">{proxyPreview.title}</div>
                </div>
              </div>
              {proxyPreview.summary && (
                <p className="text-xs text-black/70 leading-relaxed border-l-2 border-[#22C55E] pl-3">
                  {proxyPreview.summary.slice(0, 180).replace(/\[EDIT\]/g, "...")}...
                </p>
              )}
              {/* AI chat preview */}
              <div className="bg-[#F0FDF4] border border-[#22C55E] p-3 space-y-2">
                <div className="mono text-[9px] text-[#22C55E] uppercase tracking-wider mb-1">// live_ai_chat</div>
                <div className="bg-white border border-black/10 rounded px-3 py-1.5 text-[10px] text-black/60 mono">
                  "What's your leadership style?"
                </div>
                <div className="bg-[#22C55E] rounded px-3 py-1.5 text-[10px] text-black font-medium">
                  {proxyPreview.name.split(" ")[0]}'s AI responds instantly — in their voice, 24/7.
                </div>
              </div>
              <div className="mono text-[9px] text-black/40 space-y-1">
                <div>✓ Answers recruiter questions</div>
                <div>✓ Available 24/7</div>
                <div>✓ Shareable link</div>
                <div>✓ Indexed by Google & AI tools</div>
              </div>
            </div>
            <div className="mt-3 px-3 py-2 bg-[#F0FDF4] border border-[#22C55E] text-[10px] text-[#15803D] mono text-center">
              Interactive · answers questions · works while you sleep
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-6 py-5 border-t-[3px] border-black bg-[#E8E8E3] text-center">
          <button
            onClick={onComplete}
            className="bg-[#22C55E] text-black px-12 py-4 font-bold hover:bg-[#16A34A] border-[3px] border-black mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            Complete your profile to go live →
          </button>
        </div>
      </div>
    </div>
  );
}
