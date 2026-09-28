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
    <div className="kit" data-testid="insider-kit">
      <p className="site-eyebrow">How to send it</p>
      <div className="kit-item">
        <div><b>Copy your link</b><p className="kit-mono">{profileUrl}</p></div>
        <button type="button" className="site-btn site-btn--sm" onClick={() => copyItem("url", profileUrl)} data-testid="button-copy-url">{copiedItem === "url" ? "Copied" : "Copy link"}</button>
      </div>
      <div className="kit-item">
        <div><b>Send it to someone inside</b><p>Someone who already works there, or who offered to help. A short note and the link is enough.</p></div>
        <button type="button" className="site-btn site-btn--quiet site-btn--sm" onClick={() => copyItem("note", insiderNote)} data-testid="button-copy-insider-note">{copiedItem === "note" ? "Copied" : "Copy a note"}</button>
      </div>
      <div className="kit-item">
        <div><b>Put it where people already see you</b><p>Your email signature and LinkedIn.</p></div>
        <div className="kit-buttons">
          <button type="button" className="site-btn site-btn--quiet site-btn--sm" onClick={() => copyItem("signature", emailSignature)} data-testid="button-copy-signature">{copiedItem === "signature" ? "Copied" : "Email signature"}</button>
          <button type="button" className="site-btn site-btn--quiet site-btn--sm" onClick={() => copyItem("post", linkedInPost)} data-testid="button-copy-linkedin-post">{copiedItem === "post" ? "Copied" : "LinkedIn post"}</button>
        </div>
      </div>
    </div>
  );
}
