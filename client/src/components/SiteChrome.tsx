import { Link, useLocation } from "wouter";
import ProxyLogo from "@/components/ProxyLogo";
import { useAuth } from "@/lib/auth";

/** Shared top bar for the marketing site, content pages and sign-in. */
export function SiteNav({ minimal = false }: { minimal?: boolean }) {
  const { user } = useAuth();
  const [location] = useLocation();
  const onHome = location === "/";
  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <Link href="/" aria-label="Proxy home"><ProxyLogo size={26} /></Link>
        {!minimal && (
          <nav className="site-nav-links" aria-label="Main">
            <a className="site-nav-optional" href={onHome ? "#how" : "/#how"}>How it works</a>
            <a className="site-nav-optional" href={onHome ? "#pricing" : "/#pricing"}>Pricing</a>
            <Link className="site-nav-optional" href="/blog">Blog</Link>
            {user
              ? <Link className="site-btn site-btn--quiet site-btn--sm" href="/dashboard" data-testid="link-dashboard">Your page</Link>
              : <Link href="/login" data-testid="link-login">Sign in</Link>}
          </nav>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <ProxyLogo size={20} />
        <nav aria-label="Footer">
          <Link href="/about">About</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/faq">FAQ</Link>
          <a href="/#pricing">Pricing</a>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a href="mailto:vinos@myproxy.work">vinos@myproxy.work</a>
        </nav>
        <span>© 2026 Proxy</span>
      </div>
    </footer>
  );
}
