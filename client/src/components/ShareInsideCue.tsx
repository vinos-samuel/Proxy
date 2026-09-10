import { useState } from "react";

type ShareVariant = "executive" | "corporate" | "tech" | "creative";

const styles: Record<ShareVariant, { wrap: string; label: string; button: string }> = {
  executive: {
    wrap: "border-t border-[#DBD9CD] py-6 px-6",
    label: "dossier-mono text-[12px] text-[#5B6158]",
    button: "dossier-mono text-[11px] uppercase tracking-wide border border-[#1B211E] px-3 py-1.5 hover:bg-[#1B211E] hover:text-[#F2F1EC] transition-colors",
  },
  corporate: {
    wrap: "border-t border-[#262B33] py-6 px-6",
    label: "rpt-mono text-[12px] text-[#8A8F98]",
    button: "rpt-mono text-[11px] uppercase tracking-wide border border-[#AD8A4E] text-[#AD8A4E] px-3 py-1.5 hover:bg-[#AD8A4E] hover:text-[#0D1117] transition-colors",
  },
  tech: {
    wrap: "border-t border-[#1B222A] py-5 px-8",
    label: "text-[12.5px] text-[#6E7885]",
    button: "text-[11.5px] border border-[#1B222A] px-3 py-1.5 rounded-[3px] hover:border-[#46C2B3] hover:text-[#46C2B3] transition-colors",
  },
  creative: {
    wrap: "border-t border-[#322C22] py-6 px-11",
    label: "text-[12.5px] text-[#A69C89]",
    button: "text-[11.5px] border border-[#96AD86] text-[#96AD86] px-3 py-1.5",
  },
};

interface ShareInsideCueProps {
  url: string;
  variant: ShareVariant;
}

/** Soft public affordance: send this page to someone already inside a company. Live pages only. */
export default function ShareInsideCue({ url, variant }: ShareInsideCueProps) {
  const [copied, setCopied] = useState(false);
  const s = styles[variant];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={s.wrap} data-testid="share-inside-cue">
      <div className="max-w-[920px] mx-auto flex items-center justify-between gap-4 flex-wrap">
        <p className={s.label}>
          Sending this to someone inside? Copy the link — they can ask it themselves.
        </p>
        <button
          type="button"
          onClick={copy}
          className={s.button}
          data-testid="button-copy-profile-link"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
