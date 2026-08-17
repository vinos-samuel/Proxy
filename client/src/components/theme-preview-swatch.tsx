// Miniature, token-accurate preview of each portfolio theme, used in the
// theme picker (questionnaire step 10) so users don't choose blind.
// Colors and fonts here are copied from the real theme branches in
// client/src/pages/portfolio.tsx — keep in sync if those change.

type ThemeKey = "executive" | "corporate" | "tech" | "creative";

const TOKENS: Record<ThemeKey, {
  bg: string;
  text: string;
  accent: string;
  border: string;
  font: string;
  monoFont: string;
}> = {
  executive: {
    bg: "#F2F1EC",
    text: "#1B211E",
    accent: "#2F5D4C",
    border: "#DBD9CD",
    font: '"Iowan Old Style", Palatino, Georgia, serif',
    monoFont: '"SF Mono", "IBM Plex Mono", monospace',
  },
  corporate: {
    bg: "#0D1117",
    text: "#E9E7DE",
    accent: "#AD8A4E",
    border: "#262B33",
    font: "Charter, Cambria, Georgia, serif",
    monoFont: 'ui-monospace, "SF Mono", monospace',
  },
  tech: {
    bg: "#0A0E12",
    text: "#D7DEE2",
    accent: "#46C2B3",
    border: "#1B222A",
    font: 'ui-monospace, "SF Mono", "JetBrains Mono", monospace',
    monoFont: 'ui-monospace, "SF Mono", "JetBrains Mono", monospace',
  },
  creative: {
    bg: "#17140F",
    text: "#EDE7DC",
    accent: "#96AD86",
    border: "#322C22",
    font: 'ui-serif, "New York", Georgia, serif',
    monoFont: "-apple-system, sans-serif",
  },
};

export function ThemePreviewSwatch({ theme }: { theme: string }) {
  const t = TOKENS[theme as ThemeKey] || TOKENS.executive;

  return (
    <div
      className="w-full h-[104px] overflow-hidden shrink-0"
      style={{ background: t.bg, color: t.text, fontFamily: t.font, border: `1px solid ${t.border}` }}
      data-testid={`preview-theme-${theme}`}
    >
      {/* top strip mimicking each theme's header/nav bar */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5"
        style={{ borderBottom: `1px solid ${t.border}` }}
      >
        {theme === "tech" ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.border }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.border }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.border }} />
          </>
        ) : (
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.accent }} />
        )}
        <span className="text-[8px] uppercase tracking-wider" style={{ fontFamily: t.monoFont, color: t.accent, opacity: 0.85 }}>
          {theme === "tech" ? "$ whoami" : theme === "creative" ? "Profile" : "Proxy"}
        </span>
      </div>

      {/* mini hero */}
      <div className="px-3 pt-2.5 pb-2">
        <div
          className="text-[15px] leading-tight font-medium mb-1"
          style={{ fontWeight: theme === "tech" ? 700 : 500 }}
        >
          Jordan Lee
        </div>
        <div
          className="text-[8.5px] uppercase tracking-wide mb-2"
          style={{ fontFamily: t.monoFont, color: t.accent }}
        >
          VP, Product Strategy
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[8px] px-2 py-1"
            style={{
              background: t.accent,
              color: t.bg,
              borderRadius: theme === "tech" ? 3 : 0,
              fontFamily: t.monoFont,
            }}
          >
            Ask a question
          </span>
          <span className="text-[16px] font-semibold" style={{ color: t.text, opacity: 0.9 }}>
            18
          </span>
          <span className="text-[7px] uppercase tracking-wide" style={{ fontFamily: t.monoFont, opacity: 0.6 }}>
            yrs exp
          </span>
        </div>
      </div>
    </div>
  );
}
