interface ProxyLogoProps {
  className?: string;
}

export default function ProxyLogo({ className = "" }: ProxyLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Document icon with slash */}
      <svg width="52" height="64" viewBox="0 0 52 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Document background */}
        <rect x="2" y="2" width="48" height="60" fill="white" stroke="#1A1A1A" strokeWidth="2.5"/>
        {/* Resume label — faded gray, it's the thing being replaced */}
        <text x="26" y="15" textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontSize="8" fontWeight="700" fill="#999">RESUME</text>
        {/* Thin divider under title */}
        <line x1="8" y1="19" x2="44" y2="19" stroke="#ccc" strokeWidth="1"/>
        {/* Content lines */}
        <line x1="8" y1="27" x2="44" y2="27" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="8" y1="34" x2="44" y2="34" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="8" y1="41" x2="44" y2="41" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="8" y1="48" x2="36" y2="48" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="8" y1="55" x2="28" y2="55" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/>
        {/* Green slash — extends beyond document corners for clean look */}
        <line x1="-2" y1="66" x2="54" y2="-2" stroke="#22C55E" strokeWidth="5.5" strokeLinecap="round"/>
      </svg>

      {/* PROXY wordmark + tagline */}
      <div className="flex flex-col leading-none">
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "28px", fontWeight: "800", color: "#1A1A1A", letterSpacing: "-0.5px", lineHeight: 1 }}>
          PROXY
        </span>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "10px", color: "#555", letterSpacing: "0.02em", marginTop: "3px" }}>
          Your resume is not working. Proxy is.
        </span>
      </div>
    </div>
  );
}
