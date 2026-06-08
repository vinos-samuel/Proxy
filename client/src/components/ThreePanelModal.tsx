import { X } from "lucide-react";
import LinkedInMockup from "./LinkedInMockup";

interface CvExcerpt {
  name: string;
  title: string;
  summary: string;
  roles: Array<{ title: string; company: string; years: string }>;
}

interface LinkedInDraft {
  headline: string;
  about: string;
}

interface ProxyPreview {
  name: string;
  title: string;
  summary: string;
}

interface ThreePanelModalProps {
  onClose: () => void;
  cvExcerpt: CvExcerpt | null;
  linkedInDraft: LinkedInDraft | null;
  proxyPreview: ProxyPreview;
  onComplete: () => void;
}

export default function ThreePanelModal({
  onClose,
  cvExcerpt,
  linkedInDraft,
  proxyPreview,
  onComplete,
}: ThreePanelModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-white border-[3px] border-black w-full max-w-5xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black bg-[#E8E8E3]">
          <div>
            <div className="mono text-xs text-black/50 uppercase tracking-widest mb-1">// the_comparison</div>
            <h2 className="text-2xl font-bold">Same person. Three very different impressions.</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/10 border-[2px] border-black">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Three panels */}
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x-[3px] divide-black">

          {/* Panel 1: CV */}
          <div className="p-6 bg-[#F5F5F5]">
            <div className="mono text-xs text-black/40 uppercase tracking-widest mb-3">// what_recruiters_see_now</div>
            <div className="text-base font-bold mb-4 text-black/50">The CV</div>
            {cvExcerpt ? (
              <div className="text-black/40 text-sm leading-relaxed font-mono space-y-3">
                <div className="font-bold text-black/60 text-xs uppercase">{cvExcerpt.name} · {cvExcerpt.title}</div>
                <p className="text-xs leading-relaxed">{cvExcerpt.summary}</p>
                {cvExcerpt.roles.slice(0, 2).map((r, i) => (
                  <div key={i} className="text-xs">
                    <span className="font-bold">{r.title}</span> — {r.company} ({r.years})
                  </div>
                ))}
                <div className="text-xs text-black/30 mt-4 italic">[ more experience below the fold... ]</div>
              </div>
            ) : (
              <p className="text-sm text-black/40 mono">CV data not available</p>
            )}
            <div className="mt-6 px-3 py-2 bg-red-50 border border-red-200 text-xs text-red-600 mono">
              6-second scan · static · one-way
            </div>
          </div>

          {/* Panel 2: LinkedIn */}
          <div className="p-6 bg-[#F0F8FF]">
            <div className="mono text-xs text-black/40 uppercase tracking-widest mb-3">// linkedin_profile</div>
            <div className="text-base font-bold mb-4 text-black/50">LinkedIn</div>
            {linkedInDraft ? (
              <LinkedInMockup
                name={cvExcerpt?.name || proxyPreview.name}
                headline={linkedInDraft.headline}
                about={linkedInDraft.about}
                currentTitle={cvExcerpt?.title}
              />
            ) : (
              <p className="text-sm text-black/40 mono">LinkedIn preview not available</p>
            )}
            <div className="mt-4 px-3 py-2 bg-yellow-50 border border-yellow-200 text-xs text-yellow-700 mono">
              passive · same as everyone else · no Q&A
            </div>
          </div>

          {/* Panel 3: Proxy */}
          <div className="p-6 bg-white">
            <div className="mono text-xs text-[#22C55E] uppercase tracking-widest mb-3">// your_proxy</div>
            <div className="text-base font-bold mb-4">Your Proxy</div>
            <div className="border-[2px] border-[#22C55E] p-4 bg-[#F0FDF4] space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#22C55E] border-[2px] border-black flex items-center justify-center font-bold text-black text-sm">
                  {proxyPreview.name[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-sm">{proxyPreview.name}</div>
                  <div className="mono text-xs text-black/60">{proxyPreview.title}</div>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-black/70">{proxyPreview.summary}</p>
              <div className="bg-white border border-black/10 p-2 rounded text-xs text-black/60 mono italic">
                "What kind of roles are you open to?"
                <div className="mt-1 text-black font-medium not-italic">
                  Your AI answers — 24/7, in your voice.
                </div>
              </div>
            </div>
            <div className="mt-4 px-3 py-2 bg-[#F0FDF4] border border-[#22C55E] text-xs text-[#15803D] mono">
              interactive · answers questions · works while you sleep
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-6 py-5 border-t-[3px] border-black bg-[#E8E8E3] text-center">
          <button
            onClick={onComplete}
            className="bg-[#22C55E] text-black px-10 py-4 font-bold hover:bg-[#16A34A] border-[3px] border-black mono uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            Complete your profile to go live →
          </button>
        </div>
      </div>
    </div>
  );
}
