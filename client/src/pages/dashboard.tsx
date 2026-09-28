import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Loader2, Lock, LogOut, X } from "lucide-react";
import ProxyLogo from "@/components/ProxyLogo";
import { SiteFooter } from "@/components/SiteChrome";
import PaymentGate from "@/components/PaymentGate";
import { useAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { profileCreationPath } from "@/lib/profile-builder-rollout";
import { buildLinkedInPost } from "@/lib/shareCopy";
import type { TwinProfile } from "@shared/schema";
type DashboardProfile = TwinProfile & { hasProfileDocument?: boolean };

const DELETE_REASONS = [
  "I found a job",
  "The profile doesn't sound like me",
  "I don't see the value",
  "Too much information to fill",
  "Duplicate account",
  "Just exploring — not ready to use it",
];

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 2000);
    } catch {
      window.prompt("Copy this:", text);
    }
  };
  return { copied, copy };
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { copied, copy } = useCopy();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await apiRequest("DELETE", "/api/account", { reason: deleteReason || "Not provided" });
      navigate("/");
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete account. Please try again.");
      setDeleteLoading(false);
    }
  };

  const { data: referral } = useQuery<{ count: number; referralUrl: string }>({
    queryKey: ["/api/referral/count"],
  });

  const { data: analytics } = useQuery<{ viewCount: number; totalQuestions: number; recentQuestions: { question: string; askedAt: string }[] }>({
    queryKey: ["/api/analytics/my"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/my", { credentials: "include" });
      if (!res.ok) return { viewCount: 0, totalQuestions: 0, recentQuestions: [] };
      return res.json();
    },
    enabled: !!user,
  });

  const { data: profile, isLoading } = useQuery<DashboardProfile | null>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    // The app default is staleTime: Infinity. This page decides where
    // Preview/Publish/Add Evidence send you based on hasProfileDocument —
    // a cached answer from before that flipped true would silently route
    // back into the old pages, so this one has to check fresh on every load.
    staleTime: 0,
  });

  useEffect(() => {
    if (profile?.status === "processing" || profile?.status === "reprocessing") {
      const interval = setInterval(async () => {
        try {
          const res = await fetch("/api/profile/status", { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            if (data.status !== "processing") {
              queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
              clearInterval(interval);
            }
          }
        } catch {}
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [profile?.status]);

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#publish") return;
    document.getElementById("publish")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [profile?.status]);

  // A profile built through the CV-upload page builder has a profile_documents
  // row and doesn't understand the legacy questionnaire's /preview, /interview
  // or PaymentGate flow — send those accounts back into the builder instead.
  const editPath = profile?.hasProfileDocument ? profileCreationPath : "/preview";
  const isLegacy = Boolean(profile && !profile.hasProfileDocument);
  const isFree = profile?.tier === "free";
  const isPublished = profile?.status === "published";
  const freeWindowExpired = isFree && profile?.freePublishedAt
    ? (Date.now() - new Date(profile.freePublishedAt).getTime()) / (1000 * 60 * 60) > 24 * 7
    : false;
  const viewCount = analytics?.viewCount ?? 0;
  const questionCount = analytics?.totalQuestions ?? 0;
  const pageUrl = `${window.location.origin}/portfolio/${user?.username}`;
  const pageUrlLabel = `myproxy.work/portfolio/${user?.username}`;
  // Legacy "ready" profiles still publish through PaymentGate (free or Pro).
  const legacyReadyToPublish = profile?.status === "ready" && profile.paymentStatus !== "paid" && isLegacy;
  const signature = `${profile?.displayName || user?.name || user?.username}${profile?.roleTitle ? ` | ${profile.roleTitle}` : ""}\nAsk about my work: ${pageUrl}`;

  return (
    <div className="site">
      <header className="site-nav">
        <div className="site-nav-inner">
          <Link href="/" aria-label="Proxy home"><ProxyLogo size={26} /></Link>
          <nav className="site-nav-links" aria-label="Account">
            <Link className="site-nav-optional" href="/job-search">Job search</Link>
            <span className="site-nav-optional site-faint">{user?.name}</span>
            <button type="button" onClick={() => logout()} className="dash-signout" data-testid="button-logout"><LogOut /> Sign out</button>
          </nav>
        </div>
      </header>

      <main className="dash">
        {isLoading ? (
          <div className="dash-loading"><Loader2 className="animate-spin" /> Loading your page…</div>
        ) : !profile ? (
          <section className="dash-hero">
            <p className="site-eyebrow">Welcome, {user?.name?.split(" ")[0]}</p>
            <h1 className="site-display dash-h1">Let's build your page.</h1>
            <p className="site-muted">Upload your CV and you'll see a finished page before you answer any questions.</p>
            <div className="dash-actions">
              <Link className="site-btn" href={profileCreationPath} data-testid="button-start-questionnaire">Upload your CV</Link>
            </div>
          </section>
        ) : isPublished ? (
          <section className="dash-hero">
            <p className="dash-live"><i />Your page is live</p>
            <h1 className="site-display dash-url">
              <a href={`/portfolio/${user?.username}`} target="_blank" rel="noreferrer" data-testid="text-portfolio-url">{pageUrlLabel}</a>
            </h1>
            <div className="dash-actions">
              <button type="button" className="site-btn" onClick={() => copy("link", pageUrl)}>{copied === "link" ? <Check /> : <Copy />} {copied === "link" ? "Copied" : "Copy link"}</button>
              <button type="button" className="site-btn site-btn--quiet" onClick={() => copy("post", buildLinkedInPost(pageUrl))}>{copied === "post" ? "Copied" : "Copy a LinkedIn post"}</button>
              <button type="button" className="site-btn site-btn--quiet" onClick={() => copy("sig", signature)}>{copied === "sig" ? "Copied" : "Copy email signature"}</button>
              <a className="site-btn site-btn--quiet" href={`/portfolio/${user?.username}`} target="_blank" rel="noreferrer" data-testid="button-view-live">Open page <ExternalLink /></a>
            </div>
          </section>
        ) : profile.status === "processing" || profile.status === "reprocessing" ? (
          <section className="dash-hero" id="building">
            <p className="site-eyebrow">Private</p>
            <h1 className="site-display dash-h1">Building your page…</h1>
            <p className="site-muted"><Loader2 className="dash-inline-spin animate-spin" /> This page updates on its own. Nothing is public until you publish.</p>
          </section>
        ) : profile.status === "ready" ? (
          <section className="dash-hero" id="publish" data-testid="card-not-live-yet">
            <p className="site-eyebrow">Private</p>
            <h1 className="site-display dash-h1">Your page is ready. It's not public yet.</h1>
            <p className="site-muted">Publish it to get your link: <b>{pageUrlLabel}</b></p>
            <div className="dash-actions">
              {legacyReadyToPublish
                ? <a className="site-btn" href="#plans">Publish</a>
                : <Link className="site-btn" href={editPath} data-testid="button-publish-go-live">Review and publish</Link>}
              <Link className="site-btn site-btn--quiet" href={editPath} data-testid="button-preview">Preview</Link>
            </div>
          </section>
        ) : (
          <section className="dash-hero">
            <p className="site-eyebrow">Private draft</p>
            <h1 className="site-display dash-h1">Your page is a draft.</h1>
            <p className="site-muted">Pick up where you left off. Nothing is public until you publish.</p>
            <div className="dash-actions">
              <Link className="site-btn" href={profileCreationPath} data-testid="button-continue-questionnaire">Continue</Link>
            </div>
          </section>
        )}

        {profile && isPublished && (
          <section className="dash-section" aria-label="Activity">
            <div className="dash-stats">
              <div><b>{viewCount}</b><span>page views</span></div>
              <div><b>{questionCount}</b><span>questions asked</span></div>
              {isFree ? (
                <button type="button" className="dash-stat-lock" onClick={() => setShowUpgrade(true)}>
                  <Lock />
                  <span><b>See what they asked</b>Pro · $49 once, unlimited edits too</span>
                </button>
              ) : (
                <div><b>Pro</b><span>unlimited edits</span></div>
              )}
            </div>
            {viewCount === 0 && questionCount === 0 && <p className="site-faint dash-note">No visitors yet. Your link works best in your email signature and on LinkedIn.</p>}
            {freeWindowExpired && <p className="dash-note dash-note--warn">Your 7-day free edit window has ended. Your page stays live. <button type="button" className="site-link" onClick={() => setShowUpgrade(true)}>Upgrade to keep editing</button></p>}
            {!isFree && analytics && analytics.recentQuestions.length > 0 && (
              <div className="dash-questions">
                <h2 className="dash-h2">Recent visitor questions</h2>
                <ul>
                  {analytics.recentQuestions.map((q, i) => (
                    <li key={i}><p>{q.question}</p><small>{new Date(q.askedAt).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</small></li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {legacyReadyToPublish && (
          <section className="dash-section" id="plans">
            <PaymentGate profileId={profile!.id} username={user?.username} />
          </section>
        )}

        {profile && profile.status !== "processing" && profile.status !== "reprocessing" && (
          <section className="dash-section">
            <h2 className="dash-h2">{isPublished ? "Make it stronger" : "Keep working on it"}</h2>
            <div className="dash-next">
              <div className="site-card">
                <div>
                  <b>{isLegacy ? "Page builder" : "Open the builder"}</b>
                  <p>{isLegacy
                    ? "Move to the new page design. Your live page stays exactly as it is until you review and publish from there."
                    : "Answer one question to strengthen a section, add an example of your work, or switch designs."}</p>
                </div>
                <Link className="site-btn site-btn--quiet site-btn--sm" href={profileCreationPath} data-testid="button-goto-questionnaire">Open builder</Link>
              </div>
              {isLegacy && (profile.status === "ready" || isPublished) && (
                <div className="site-card">
                  <div>
                    <b>Add more evidence</b>
                    <p>Add a story, decision or result to your current page by speaking naturally.</p>
                  </div>
                  <Link className="site-btn site-btn--quiet site-btn--sm" href="/interview">Start interview</Link>
                </div>
              )}
            </div>
          </section>
        )}

        {isPublished && referral && (
          <section className="dash-section dash-referral">
            <div>
              <h2 className="dash-h2">Know someone job hunting?</h2>
              <p className="site-muted">Share your referral link. Sign-ups from it are credited to you.{referral.count > 0 && <> <b>{referral.count} so far.</b></>}</p>
            </div>
            <button type="button" className="site-btn site-btn--quiet site-btn--sm" onClick={() => copy("ref", referral.referralUrl)}>{copied === "ref" ? "Copied" : "Copy referral link"}</button>
          </section>
        )}

        <details className="dash-account">
          <summary>Account settings</summary>
          <div>
            <p className="site-muted">Permanently delete your account and all associated data. This cannot be undone.</p>
            {!showDeleteConfirm ? (
              <button type="button" className="dash-danger" onClick={() => setShowDeleteConfirm(true)}>Delete my account</button>
            ) : (
              <div className="dash-delete">
                <p><b>Are you sure?</b> This permanently deletes your page, career data and chat history.</p>
                <p className="site-muted">Before you go, what's the main reason? (optional)</p>
                <div className="dash-reasons">
                  {DELETE_REASONS.map((reason) => (
                    <label key={reason}>
                      <input type="radio" name="deleteReason" value={reason} checked={deleteReason === reason} onChange={() => setDeleteReason(reason)} />
                      {reason}
                    </label>
                  ))}
                </div>
                {deleteError && <p className="dash-error">{deleteError}</p>}
                <div className="dash-actions">
                  <button type="button" className="dash-danger dash-danger--solid" onClick={handleDeleteAccount} disabled={deleteLoading}>{deleteLoading ? "Deleting…" : "Yes, delete everything"}</button>
                  <button type="button" className="site-btn site-btn--quiet site-btn--sm" onClick={() => { setShowDeleteConfirm(false); setDeleteReason(""); }} disabled={deleteLoading}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </details>
      </main>

      {showUpgrade && profile && (
        <div className="dash-modal" role="dialog" aria-modal="true" aria-label="Upgrade to Pro" onClick={(event) => { if (event.target === event.currentTarget) setShowUpgrade(false); }}>
          <div>
            <button type="button" className="dash-modal-close" onClick={() => setShowUpgrade(false)} aria-label="Close"><X /></button>
            <div id="upgrade-section"><PaymentGate profileId={profile.id} username={user?.username} hideFree /></div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
