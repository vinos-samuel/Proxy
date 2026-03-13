import { Link } from "wouter";

export default function TermsPage() {
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

        <h1 className="text-4xl font-bold mb-2 text-black">Terms of Service</h1>
        <p className="text-black/50 text-sm mb-8">Last updated: March 2026</p>

        <div className="bg-white border-[3px] border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-8">

          <section>
            <h2 className="text-xl font-bold text-black mb-3">1. Service</h2>
            <p className="text-black/70 leading-relaxed">
              Proxy (myproxy.work) provides AI-powered Digital Twin career profiles.
              By using this service you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">2. Account</h2>
            <p className="text-black/70 leading-relaxed">
              You are responsible for keeping your login credentials secure.
              You must be 18 or older to use this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">3. Your content</h2>
            <p className="text-black/70 leading-relaxed">
              You own all content you upload. By uploading, you grant us a limited licence
              to process it to deliver the service. We do not sell your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">4. Payments</h2>
            <p className="text-black/70 leading-relaxed mb-3">Plans are one-time payments:</p>
            <ul className="text-black/70 leading-relaxed space-y-2 list-disc list-inside">
              <li><strong>Launch:</strong> $99 USD</li>
              <li><strong>Evolve:</strong> $199 USD</li>
              <li><strong>Concierge:</strong> $499 USD</li>
            </ul>
            <p className="text-black/70 leading-relaxed mt-3">
              Payments are processed securely by Stripe.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">5. Refunds</h2>
            <p className="text-black/70 leading-relaxed">
              We handle refund requests on a case-by-case basis.
              If you have an issue, email{" "}
              <a href="mailto:myproxy_work@proton.me" className="underline">myproxy_work@proton.me</a>{" "}
              and we will work with you to find a fair resolution.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">6. Acceptable use</h2>
            <p className="text-black/70 leading-relaxed mb-2">You must not:</p>
            <ul className="text-black/70 leading-relaxed space-y-2 list-disc list-inside">
              <li>Upload false or misleading career information</li>
              <li>Use the service to impersonate another person</li>
              <li>Attempt to hack, scrape, or abuse the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">7. AI-generated content</h2>
            <p className="text-black/70 leading-relaxed">
              Your profile is generated with the assistance of AI. You are responsible
              for reviewing and verifying all content before publishing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">8. Service availability</h2>
            <p className="text-black/70 leading-relaxed">
              We aim for high availability but do not guarantee uninterrupted service.
              We are not liable for losses caused by downtime.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">9. Limitation of liability</h2>
            <p className="text-black/70 leading-relaxed">
              To the maximum extent permitted by Singapore law, our liability is limited
              to the amount you paid us in the 3 months preceding any claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">10. Termination</h2>
            <p className="text-black/70 leading-relaxed">
              We reserve the right to suspend accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">11. Governing law</h2>
            <p className="text-black/70 leading-relaxed">
              These terms are governed by the laws of Singapore. Disputes will be
              resolved in Singapore courts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">12. Contact</h2>
            <p className="text-black/70 leading-relaxed">
              <a href="mailto:myproxy_work@proton.me" className="underline">myproxy_work@proton.me</a>
            </p>
          </section>

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
