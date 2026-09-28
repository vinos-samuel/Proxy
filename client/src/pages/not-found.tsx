import { Link } from "wouter";
import { SiteNav } from "@/components/SiteChrome";

export default function NotFound() {
  return (
    <div className="site">
      <SiteNav minimal />
      <div className="auth">
        <div className="auth-message">
          <h1 className="site-display auth-h1">Page not found</h1>
          <p className="site-muted">The page may have moved, or the link may be wrong.</p>
          <Link className="site-btn" href="/">Go to the homepage</Link>
        </div>
      </div>
    </div>
  );
}
