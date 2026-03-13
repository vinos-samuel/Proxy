import { Link } from "wouter";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#E8E8E3] flex flex-col" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="max-w-4xl mx-auto px-6 py-12 flex-1">
        <Link href="/">
          <div className="inline-flex items-center gap-2 cursor-pointer mb-8">
            <div className="h-10 w-10 bg-[#22C55E] border-[3px] border-black flex items-center justify-center font-bold text-black text-xl">
              P
            </div>
            <span className="text-2xl font-bold tracking-tight text-black">PROXY</span>
          </div>
        </Link>

        <h1 className="text-4xl font-bold mb-8 text-black">Privacy Policy</h1>

        <div className="bg-white border-[3px] border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
          <p className="text-black/70 leading-relaxed">[CONTENT]</p>
        </div>
      </div>

      <footer className="bg-white border-t-[3px] border-black py-6 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="mono text-xs text-black/60 uppercase tracking-wider">© 2026 Proxy</span>
          <div className="flex gap-4 text-xs mono uppercase tracking-wider">
            <Link href="/privacy" className="text-black hover:underline">Privacy</Link>
            <Link href="/terms" className="text-black hover:underline">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
