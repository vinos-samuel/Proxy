// Renders AI chat answer text with **bold** markdown converted to actual
// <strong> tags, paragraph breaks preserved. Shared by every surface that
// displays a live chat answer (portfolio.tsx, landing hero widget, /try
// draft chat) so bold rendering can't drift between them again.
export function renderAnswer(content: string) {
  return (
    <div className="space-y-3">
      {content.split(/\n\n+/).map((paragraph, pi) => {
        const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={pi}>
            {parts.map((part, partI) =>
              part.startsWith("**") && part.endsWith("**")
                ? <strong key={partI}>{part.slice(2, -2)}</strong>
                : <span key={partI}>{part}</span>
            )}
          </p>
        );
      })}
    </div>
  );
}
