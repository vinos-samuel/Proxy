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

        <h1 className="text-4xl font-bold mb-2 text-black">Privacy Policy</h1>
        <p className="text-black/50 text-sm mb-8">Last updated: March 2026</p>

        <div className="bg-white border-[3px] border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-8">

          <section>
            <h2 className="text-xl font-bold text-black mb-3">1. Who we are</h2>
            <p className="text-black/70 leading-relaxed">
              Proxy ("we", "us") operates myproxy.work. Contact us at:{" "}
              <a href="mailto:myproxy_work@proton.me" className="underline">myproxy_work@proton.me</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">2. What data we collect</h2>
            <ul className="text-black/70 leading-relaxed space-y-2 list-disc list-inside">
              <li><strong>Account data:</strong> name, email address, password (hashed)</li>
              <li><strong>Career data:</strong> resume content, work history, skills, questionnaire responses</li>
              <li><strong>Profile data:</strong> anything you add to your Digital Twin profile</li>
              <li><strong>Payment data:</strong> handled entirely by Stripe — we never see your card details</li>
              <li><strong>Usage data:</strong> pages visited, session info, IP address</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">3. How we use your data</h2>
            <ul className="text-black/70 leading-relaxed space-y-2 list-disc list-inside">
              <li>To create and power your Digital Twin profile</li>
              <li>To process your AI-generated career content via Google Gemini</li>
              <li>To send transactional emails (account, password reset) via Resend</li>
              <li>To process payments via Stripe</li>
              <li>To improve the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">4. Third-party services</h2>
            <p className="text-black/70 leading-relaxed mb-2">Your data passes through:</p>
            <ul className="text-black/70 leading-relaxed space-y-2 list-disc list-inside">
              <li><strong>Google Gemini AI</strong> — to parse and generate career content</li>
              <li><strong>Google Cloud Storage</strong> — to store uploaded files</li>
              <li><strong>Stripe</strong> — to process payments</li>
              <li><strong>Resend</strong> — to send emails</li>
              <li><strong>Replit</strong> — infrastructure/hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">5. Data storage</h2>
            <p className="text-black/70 leading-relaxed">
              Your data is stored on secure servers. Files are stored in Google Cloud Storage.
              We retain your data while your account is active. You may request deletion at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">6. Your rights (Singapore PDPA)</h2>
            <p className="text-black/70 leading-relaxed mb-2">You have the right to:</p>
            <ul className="text-black/70 leading-relaxed space-y-2 list-disc list-inside">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Withdraw consent and request deletion</li>
            </ul>
            <p className="text-black/70 leading-relaxed mt-2">
              Email{" "}
              <a href="mailto:myproxy_work@proton.me" className="underline">myproxy_work@proton.me</a>{" "}
              for any data requests. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">7. Cookies</h2>
            <p className="text-black/70 leading-relaxed">
              We use session cookies for login and a CSRF security cookie.
              No third-party tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">8. Children</h2>
            <p className="text-black/70 leading-relaxed">
              This service is not intended for users under 18.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">9. Changes</h2>
            <p className="text-black/70 leading-relaxed">
              We may update this policy. Continued use after changes means acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">10. Governing law</h2>
            <p className="text-black/70 leading-relaxed">
              This policy is governed by the laws of Singapore.
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
