/** Owner-only chrome when the page is not published. Makes “still draft” impossible to miss. */
export default function DraftNotLiveBanner({ isDraftPreview, dark }: { isDraftPreview: boolean; dark?: boolean }) {
  const href = isDraftPreview ? "/dashboard" : "/preview";
  const cta = isDraftPreview ? "Finish setup →" : "Publish to go live →";

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
        <div
          className={`absolute left-1/2 top-[42%] -translate-x-1/2 -rotate-[22deg] text-[12vw] font-bold uppercase tracking-[0.2em] whitespace-nowrap select-none ${dark ? "text-white/[0.07]" : "text-black/[0.055]"}`}
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Not live
        </div>
      </div>
      <div
        className="sticky top-0 z-50 bg-[#FDE68A] border-b-[3px] border-black px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        data-testid="banner-not-live"
      >
        <p className="text-sm font-medium text-black">
          <span className="font-bold">Not live yet.</span>{" "}
          {isDraftPreview
            ? "This is a private draft — nobody else can see it."
            : "Only you can see this page. Publish to get a public URL."}
        </p>
        <a
          href={href}
          className="bg-[#22C55E] text-black px-4 py-2 font-bold text-sm border-[2px] border-black mono uppercase tracking-wider shrink-0"
          data-testid="button-banner-publish"
        >
          {cta}
        </a>
      </div>
    </>
  );
}
