import { SiteFooter, SiteNav } from "@/components/SiteChrome";
import ProxyLogo from "@/components/ProxyLogo";

export default function TermsPage() {
  return (
    <div className="site">
      <SiteNav />
      <div className="max-w-4xl mx-auto px-6 py-12 flex-1">

        <h1 className="site-display content-h1 mb-2">Terms of Service</h1>
        <p className="text-black/50 text-sm mb-8">Last updated: March 2026</p>

        <div className="site-card p-6 md:p-8 space-y-8">

          <section>
            <h2 className="text-xl font-bold text-black mb-3">1. Service</h2>
            <p className="text-black/70 leading-relaxed">
              Proxy (myproxy.work) provides professional evidence pages built from information users provide, with an optional AI explorer.
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
            <p className="text-black/70 leading-relaxed mb-3">Plans available:</p>
            <ul className="text-black/70 leading-relaxed space-y-2 list-disc list-inside">
              <li><strong>Free:</strong> $0 — Published page + optional AI explorer, 7 days of edits after publishing</li>
              <li><strong>Pro:</strong> $49 USD — Ongoing edits, page views and recent visitor questions</li>
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
              <a href="mailto:vinos@myproxy.work" className="underline">vinos@myproxy.work</a>{" "}
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
              <a href="mailto:vinos@myproxy.work" className="underline">vinos@myproxy.work</a>
            </p>
          </section>

        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
