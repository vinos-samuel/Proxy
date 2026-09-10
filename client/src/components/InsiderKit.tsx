import { useState } from "react";
import { buildInsiderNote, buildLinkedInPost } from "@/lib/shareCopy";

interface InsiderKitProps {
  profileUrl: string;
  displayName?: string;
  roleTitle?: string;
}

/** Light post-publish moment: how to send the live link. Not a pitch deck. */
export default function InsiderKit({ profileUrl, displayName, roleTitle }: InsiderKitProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const insiderNote = buildInsiderNote(profileUrl);
  const linkedInPost = buildLinkedInPost(profileUrl);
  const emailSignature = `${displayName || "Me"}${roleTitle ? ` | ${roleTitle}` : ""}\nAsk me about my work: ${profileUrl}`;

  const copyItem = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(key);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  return (
    <div className="text-left max-w-lg mx-auto space-y-4" data-testid="insider-kit">
      <p className="mono text-xs text-black/50 uppercase tracking-widest text-center">// how to send it</p>

      <div className="bg-[#E8E8E3] border-[3px] border-black p-4">
        <p className="mono text-xs font-bold uppercase tracking-wider mb-2">1. Copy your live link</p>
        <p className="mono text-xs text-black/60 mb-3 break-all">{profileUrl}</p>
        <button
          onClick={() => copyItem("url", profileUrl)}
          className="bg-black text-white px-4 py-2 font-bold border-[3px] border-black mono text-xs uppercase tracking-wider"
          data-testid="button-copy-url"
        >
          {copiedItem === "url" ? "Copied!" : "Copy link"}
        </button>
      </div>

      <div className="bg-[#E8E8E3] border-[3px] border-black p-4">
        <p className="mono text-xs font-bold uppercase tracking-wider mb-2">2. Send it to someone inside</p>
        <p className="mono text-xs text-black/60 mb-3">
          Someone who already works there — or who offered to help. A short note, the link, done. They can ask the page themselves instead of reading a CV.
        </p>
        <p className="mono text-xs text-black/50 mb-3 whitespace-pre-line max-h-24 overflow-hidden">{insiderNote}</p>
        <button
          onClick={() => copyItem("note", insiderNote)}
          className="bg-black text-white px-4 py-2 font-bold border-[3px] border-black mono text-xs uppercase tracking-wider"
          data-testid="button-copy-insider-note"
        >
          {copiedItem === "note" ? "Copied!" : "Copy a note to paste"}
        </button>
      </div>

      <div className="bg-[#E8E8E3] border-[3px] border-black p-4">
        <p className="mono text-xs font-bold uppercase tracking-wider mb-2">3. Put the link where you already are</p>
        <p className="mono text-xs text-black/60 mb-3 whitespace-pre-line">{emailSignature}</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => copyItem("signature", emailSignature)}
            className="bg-black text-white px-4 py-2 font-bold border-[3px] border-black mono text-xs uppercase tracking-wider"
            data-testid="button-copy-signature"
          >
            {copiedItem === "signature" ? "Copied!" : "Copy email signature"}
          </button>
          <button
            onClick={() => copyItem("post", linkedInPost)}
            className="bg-white text-black px-4 py-2 font-bold border-[3px] border-black mono text-xs uppercase tracking-wider"
            data-testid="button-copy-linkedin-post"
          >
            {copiedItem === "post" ? "Copied!" : "Copy LinkedIn post"}
          </button>
        </div>
      </div>
    </div>
  );
}
