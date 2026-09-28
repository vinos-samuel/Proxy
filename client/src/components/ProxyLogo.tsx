interface ProxyLogoProps {
  className?: string;
  /** Font size of the wordmark in px. The mark scales with it. */
  size?: number;
  tone?: "ink" | "paper";
  /** Gently animate the three dots, as if the page is typing an answer. */
  live?: boolean;
}

/**
 * The "o" that talks: a ring with three typing dots. It is the brand's one
 * signature element: the page that answers. Deliberately no speech-bubble
 * tail, so it isn't mistaken for other bubble-"o" marks.
 */
export function TalkingO({ className = "", dotColor }: { className?: string; dotColor?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <circle cx="20" cy="20" r="15.2" fill="none" stroke="currentColor" strokeWidth="5.2" />
      <circle className="proxy-dot" cx="13.4" cy="20.4" r="2.5" fill={dotColor || "var(--brand-sage)"} />
      <circle className="proxy-dot" cx="20" cy="20.4" r="2.5" fill={dotColor || "var(--brand-sage)"} />
      <circle className="proxy-dot" cx="26.6" cy="20.4" r="2.5" fill={dotColor || "var(--brand-sage)"} />
    </svg>
  );
}

export default function ProxyLogo({ className = "", size = 26, tone = "ink", live = false }: ProxyLogoProps) {
  return (
    <span
      className={`proxy-wordmark ${tone === "paper" ? "proxy-wordmark--paper" : ""} ${live ? "proxy-wordmark--live" : ""} ${className}`}
      style={{ fontSize: `${size}px` }}
      role="img"
      aria-label="Proxy"
    >
      <span aria-hidden="true">pr</span>
      <TalkingO dotColor={tone === "paper" ? "#8FC2A9" : undefined} />
      <span aria-hidden="true">xy</span>
    </span>
  );
}
