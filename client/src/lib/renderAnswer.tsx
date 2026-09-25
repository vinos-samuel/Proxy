// Renders AI chat answer text with **bold** markdown converted to actual
// <strong> tags, paragraph breaks preserved. Shared by every surface that
// displays a live chat answer (portfolio.tsx, landing hero widget, /try
// draft chat) so bold rendering can't drift between them again.
//
// The prompts now tell the model not to use markdown at all, but this stays
// defensive: a single-line-broken list ("- item\n- item") used to collapse
// into one run-on paragraph with literal dashes and asterisks visible —
// each line now gets its own break, and a leading "-"/"*" marker becomes a
// plain bullet character instead of showing through as raw syntax.
export function renderAnswer(content: string) {
  return (
    <div className="space-y-3">
      {content.split(/\n\n+/).map((paragraph, pi) => {
        const lines = paragraph.split(/\n+/);
        return (
          <p key={pi}>
            {lines.map((line, li) => {
              const cleaned = line.replace(/^[-*]\s+/, "• ");
              const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
              return (
                <span key={li}>
                  {li > 0 && <br />}
                  {parts.map((part, partI) =>
                    part.startsWith("**") && part.endsWith("**")
                      ? <strong key={partI}>{part.slice(2, -2)}</strong>
                      : <span key={partI}>{part}</span>
                  )}
                </span>
              );
            })}
          </p>
        );
      })}
    </div>
  );
}
