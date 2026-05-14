interface ProxyLogoProps {
  className?: string;
}

export default function ProxyLogo({ className = "" }: ProxyLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Document icon with slash */}
      <svg width="48" height="58" viewBox="0 0 48 58" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Document background */}
        <rect x="2" y="2" width="44" height="54" fill="white" stroke="#1A1A1A" strokeWidth="2.5"/>
        {/* Resume label */}
        <text x="7" y="14" fontFamily="'Space Grotesk', sans-serif" fontSize="7" fontWeight="600" fill="#22C55E">Resume</text>
        {/* Lines representing text */}
        <line x1="7" y1="21" x2="41" y2="21" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="7" y1="28" x2="41" y2="28" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="7" y1="35" x2="41" y2="35" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="7" y1="42" x2="35" y2="42" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/>
        <line x1="7" y1="49" x2="30" y2="49" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/>
        {/* Green diagonal slash */}
        <line x1="4" y1="54" x2="44" y2="4" stroke="#22C55E" strokeWidth="5" strokeLinecap="round"/>
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
