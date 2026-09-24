import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Check, ChevronRight, Loader2, Menu, RotateCcw, Sparkles, Upload, X } from "lucide-react";
import type { ImprovementQuestion, ProfileDocument, ProfileStyle } from "@shared/profile-document";
import ProfileDocumentView from "@/components/profile-document-view";
import PaymentGate from "@/components/PaymentGate";
import ProxyLogo from "@/components/ProxyLogo";
import { getCsrfToken } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { visualProfileFixture } from "@/lib/profile-document-fixtures";

type BuilderState = {
  document?: ProfileDocument;
  revision?: number;
  hasPublished?: boolean;
  publishedRevision?: number | null;
  source?: "guest" | "account";
  needsUpload?: boolean;
  legacyAvailable?: boolean;
  guestAvailable?: boolean;
};

type QuestionState = {
  question: ImprovementQuestion | null;
  reason?: string;
  source?: "jev" | "rules" | "none";
};

type Panel = "improve" | "edit" | "style" | "settings";

async function requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (init.method && ["POST", "PATCH", "PUT", "DELETE"].includes(init.method)) {
    const token = getCsrfToken();
    if (token) headers.set("x-csrf-token", token);
  }
  const response = await fetch(url, { ...init, headers, credentials: "include" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

function capture(event: string, properties: Record<string, unknown> = {}) {
  if (typeof window.gtag === "function") window.gtag("event", event, properties);
  const posthog = (window as any).posthog;
  if (posthog?.capture) posthog.capture(event, properties);
}

export default function BuilderPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [state, setState] = useState<BuilderState>({});
  const [question, setQuestion] = useState<QuestionState | null>(null);
  const [answer, setAnswer] = useState("");
  const [panel, setPanel] = useState<Panel>("improve");
  const [busy, setBusy] = useState<string | null>("loading");
  const [error, setError] = useState("");
  const [mobilePanel, setMobilePanel] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [approved, setApproved] = useState(false);
  const [dirty, setDirty] = useState(false);

  const document = state.document;
  const revision = state.revision;

  useEffect(() => {
    const fixture = import.meta.env.DEV ? new URLSearchParams(window.location.search).get("fixture") : null;
    if (fixture) {
      const requestedStyle = new URLSearchParams(window.location.search).get("style");
      const style: ProfileStyle = requestedStyle === "modern" || requestedStyle === "expressive" ? requestedStyle : "editorial";
      setState({ document: visualProfileFixture(style), revision: 1, source: "guest", hasPublished: false });
      setBusy(null);
      return;
    }
    requestJson<BuilderState>("/api/builder")
      .then((next) => {
        setState(next);
        if (next.document) capture("builder_opened", { source: next.source });
      })
      .catch((cause) => setError(cause.message))
      .finally(() => setBusy(null));
  }, []);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!document || document.pendingProposal || panel !== "improve") return;
    requestJson<QuestionState>("/api/builder/question")
      .then(setQuestion)
      .catch((cause) => setError(cause.message));
  }, [document?.answeredQuestionIds.length, document?.skippedQuestionIds.length, document?.pendingProposal, panel]);

  const updateState = (next: { document: ProfileDocument; revision: number }) => {
    setState((current) => ({ ...current, ...next }));
    setApproved(false);
    setDirty(false);
  };

  const mutate = async <T extends { document?: ProfileDocument; revision?: number }>(
    label: string,
    url: string,
    body: Record<string, unknown>,
  ) => {
    setBusy(label);
    setError("");
    try {
      const result = await requestJson<T>(url, { method: "POST", body: JSON.stringify(body) });
      if (result.document && result.revision) updateState({ document: result.document, revision: result.revision });
      return result;
    } catch (cause: any) {
      setError(cause.message);
      return null;
    } finally {
      setBusy(null);
    }
  };

  const upload = async (file: File) => {
    const data = new FormData();
    data.append("resume", file);
    setBusy("upload");
    setError("");
    capture("builder_upload_started", { sizeBand: file.size < 1_000_000 ? "under_1mb" : file.size < 3_000_000 ? "1_to_3mb" : "3_to_5mb" });
    const startedAt = performance.now();
    try {
      const next = await requestJson<BuilderState>("/api/builder/upload", { method: "POST", body: data });
      setState(next);
      capture("builder_upload_completed", { source: next.source });
      capture("builder_first_page", { seconds: Math.round((performance.now() - startedAt) / 100) / 10, source: next.source });
    } catch (cause: any) {
      setError(cause.message);
    } finally {
      setBusy(null);
    }
  };

  const saveDocument = async (next: ProfileDocument, event?: string) => {
    if (!revision) return;
    setBusy("save");
    setError("");
    try {
      const saved = await requestJson<{ document: ProfileDocument; revision: number }>("/api/builder", {
        method: "PATCH",
        body: JSON.stringify({ revision, document: next }),
      });
      updateState(saved);
      if (event) capture(event);
    } catch (cause: any) {
      setError(cause.message);
    } finally {
      setBusy(null);
    }
  };

  const chooseStyle = (style: ProfileStyle) => {
    if (!document || style === document.style) return;
    const undo: ProfileDocument["undoStack"][number] = {
      section: "style", targetId: null, field: "style", before: document.style, after: style,
    };
    saveDocument({
      ...document,
      style,
      undoStack: [...document.undoStack, undo].slice(-5),
    }, "builder_style_changed");
  };

  const improve = async () => {
    if (!question?.question || !answer.trim() || !revision) return;
    const result = await mutate<{ document: ProfileDocument; revision: number }>("improve", "/api/builder/improve", {
      revision, questionId: question.question.id, answer: answer.trim(),
    });
    if (result) {
      setAnswer("");
      capture("builder_improvement_generated", { section: question.question.section, handledBy: question.source });
    }
  };

  const approve = async () => {
    if (!revision || !user) {
      sessionStorage.setItem("proxy_builder_return", "1");
      setLocation("/register");
      return;
    }
    setBusy("approve");
    setError("");
    try {
      await requestJson("/api/builder/approve", { method: "POST", body: JSON.stringify({ revision }) });
      setApproved(true);
      capture("builder_approved", { revision });
    } catch (cause: any) {
      setError(cause.message);
    } finally {
      setBusy(null);
    }
  };

  const publish = async () => {
    if (!revision) return;
    setBusy("publish");
    setError("");
    try {
      const result = await requestJson<{ username: string }>("/api/builder/publish", { method: "POST", body: JSON.stringify({ revision }) });
      capture("builder_published");
      setLocation(`/portfolio/${result.username}`);
    } catch (cause: any) {
      if (cause.message.includes("publishing plan")) setShowPlans(true);
      else setError(cause.message);
    } finally {
      setBusy(null);
    }
  };

  const editor = useMemo(() => document ? [
    { label: "Name", value: document.identity.name, field: "name", multiline: false },
    { label: "Role", value: document.identity.title, field: "title", multiline: false },
    { label: "Headline", value: document.identity.headline, field: "headline", multiline: true },
    { label: "Summary", value: document.identity.summary, field: "summary", multiline: true },
  ] : [], [document]);

  if (busy === "loading") return <div className="builder-loading"><Loader2 className="animate-spin" /><p>Preparing your workspace…</p></div>;

  if (!document) {
    return (
      <main className="builder-empty">
        <header><Link href="/"><ProxyLogo /></Link>{user && <Link href="/dashboard">Dashboard</Link>}</header>
        <section>
          <p className="builder-kicker">Prepare convincing evidence for your next opportunity.</p>
          <h1>Turn your CV into a page worth sharing.</h1>
          <p>Upload a PDF. Proxy builds a finished first version, then asks only the questions that can make it stronger.</p>
          <label className="builder-upload">
            {busy === "upload" ? <Loader2 className="animate-spin" /> : <Upload />}
            <span>{busy === "upload" ? "Building your page…" : "Upload your CV"}</span>
            <small>PDF, up to 5 MB</small>
            <input type="file" accept="application/pdf" disabled={Boolean(busy)} onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} />
          </label>
          {state.legacyAvailable && user && <button className="builder-text-button" onClick={async () => {
            const result = await mutate<{ document: ProfileDocument; revision: number }>("import", "/api/builder/adopt-existing", {});
            if (result) capture("builder_legacy_imported");
          }}>Use my existing Proxy profile <ChevronRight /></button>}
          {error && <p className="builder-error" role="alert">{error}</p>}
          <p className="builder-trust">Your CV stays private. Guest drafts are kept for 4 hours. Create an account to keep yours longer.</p>
        </section>
      </main>
    );
  }

  const proposal = document.pendingProposal;
  return (
    <main className="builder-shell">
      <header className="builder-topbar">
        <Link href={user ? "/dashboard" : "/"} className="builder-back"><ArrowLeft /> <span>Proxy</span></Link>
        <div><span className="builder-save-state">{busy === "save" ? "Saving…" : dirty ? "Unsaved changes" : "Draft saved"}</span>{user && <button className="builder-topbar-action" disabled={dirty || Boolean(busy)} onClick={() => window.open(`/portfolio/${user.username}?draft=true`, "_blank", "noopener,noreferrer")}>Preview</button>}<button className="builder-topbar-publish" onClick={() => { setPanel("settings"); setMobilePanel(true); }}>Publish</button><button className="builder-menu" onClick={() => setMobilePanel(true)} aria-label="Open editing panel"><Menu /></button></div>
      </header>
      <div className="builder-workspace">
        <section className="builder-canvas" aria-label="Page preview">
          <div className="builder-browser"><span /><span /><span /><small>myproxy.work/portfolio/{user?.username || "your-name"}</small></div>
          <ProfileDocumentView document={document} proposal={proposal} />
        </section>

        <aside className={`builder-panel ${mobilePanel ? "builder-panel--open" : ""}`}>
          <div className="builder-panel-head"><div><p>Your page</p><span>Revision {revision}</span></div><button onClick={() => setMobilePanel(false)} aria-label="Close editing panel"><X /></button></div>
          <nav>{(["improve", "edit", "style", "settings"] as Panel[]).map((item) => <button key={item} className={panel === item ? "active" : ""} onClick={() => setPanel(item)}>{item}</button>)}</nav>
          <div className="builder-panel-body">
            {error && <div className="builder-error" role="alert"><p>{error}</p>{dirty && <button onClick={() => saveDocument(document)}>Retry save</button>}</div>}
            {!user && state.source === "guest" && <p className="builder-guest-note">Guest draft · kept for 4 hours. Create an account before it expires.</p>}
            {user && state.source === "guest" && <div className="builder-adopt"><b>Save this guest page to your account</b><p>Your public page will not change until you approve and publish.</p><button onClick={async () => {
              const result = await mutate<{ document: ProfileDocument; revision: number }>("adopt", "/api/builder/adopt-guest", { confirmReplace: false });
              if (result) setState((current) => ({ ...current, source: "account" }));
            }}>Save to my account</button></div>}
            {user && state.guestAvailable && state.source === "account" && <div className="builder-adopt"><b>You also have a guest draft</b><p>Your account page is open. Replacing its private draft requires an explicit choice and does not change the live page.</p><button onClick={async () => {
              const result = await mutate<{ document: ProfileDocument; revision: number }>("adopt", "/api/builder/adopt-guest", { confirmReplace: true });
              if (result) setState((current) => ({ ...current, guestAvailable: false }));
            }}>Use the guest draft instead</button></div>}
            {panel === "improve" && <>
              <p className="builder-panel-kicker"><Sparkles /> Make one part stronger</p>
              {proposal ? <div className="builder-proposal">
                <p>{proposal.question}</p><textarea className="builder-proposal-edit" value={proposal.proposed} onChange={(event) => {
                  setDirty(true);
                  setState((current) => current.document ? ({ ...current, document: { ...current.document, pendingProposal: current.document.pendingProposal ? { ...current.document.pendingProposal, proposed: event.target.value } : null } }) : current);
                }} onBlur={() => mutate("save", "/api/builder/proposal", { revision, proposed: document.pendingProposal?.proposed })} />
                <div><button disabled={Boolean(busy) || dirty} onClick={async () => {
                  const result = await mutate<{ document: ProfileDocument; revision: number }>("keep", "/api/builder/keep", { revision });
                  if (result) capture("builder_improvement_kept", { section: proposal.section });
                }}><Check /> Keep change</button><button disabled={Boolean(busy)} onClick={async () => { const result = await mutate("skip", "/api/builder/skip", { revision, questionId: proposal.questionId }); if (result) capture("builder_improvement_skipped", { section: proposal.section }); }}>Skip</button></div>
              </div> : question?.question ? <div className="builder-question">
                <span>{question.question.label}</span><h2>{question.question.question}</h2>
                <textarea value={answer} maxLength={2500} onChange={(event) => setAnswer(event.target.value)} placeholder="A few honest sentences are enough." />
                <button className="builder-primary" disabled={Boolean(busy) || answer.trim().length < 2} onClick={improve}>{busy === "improve" ? <Loader2 className="animate-spin" /> : <Sparkles />} Show the improvement</button>
                <button className="builder-text-button" disabled={Boolean(busy)} onClick={async () => { const result = await mutate("skip", "/api/builder/skip", { revision, questionId: question.question!.id }); if (result) capture("builder_improvement_skipped", { section: question.question!.section }); }}>Skip this question</button>
              </div> : <div className="builder-complete"><Check /><h2>Your strongest sections are covered.</h2><p>You can publish now or edit any wording yourself.</p></div>}
            </>}

            {panel === "edit" && <div className="builder-editor">
              {editor.map((item) => <label key={item.field}><span>{item.label}</span>{item.multiline ? <textarea value={item.value} onChange={(event) => { setDirty(true); setState((current) => ({ ...current, document: { ...document, identity: { ...document.identity, [item.field]: event.target.value } } })); }} onBlur={() => saveDocument(document)} /> : <input value={item.value} onChange={(event) => { setDirty(true); setState((current) => ({ ...current, document: { ...document, identity: { ...document.identity, [item.field]: event.target.value } } })); }} onBlur={() => saveDocument(document)} />}</label>)}
              {document.projects.map((project, projectIndex) => <fieldset key={project.id}><legend>{project.title}</legend>{(["challenge", "contribution", "outcome"] as const).map((field) => <label key={field}><span>{field === "challenge" ? "The situation" : field === "contribution" ? "Your contribution" : "What changed"}</span><textarea value={project[field] || ""} onChange={(event) => {
                setDirty(true);
                const projects = document.projects.map((item, index) => index === projectIndex ? { ...item, [field]: event.target.value } : item);
                setState((current) => ({ ...current, document: { ...document, projects } }));
              }} onBlur={() => saveDocument(document)} /></label>)}</fieldset>)}
              {document.experience.map((role, roleIndex) => <fieldset key={role.id}><legend>{role.title} at {role.company}</legend><label><span>Role summary</span><textarea value={role.summary || ""} onChange={(event) => {
                setDirty(true);
                const experience = document.experience.map((item, index) => index === roleIndex ? { ...item, summary: event.target.value } : item);
                setState((current) => ({ ...current, document: { ...document, experience } }));
              }} onBlur={() => saveDocument(document)} /></label></fieldset>)}
            </div>}

            {panel === "style" && <div className="builder-styles">{(["editorial", "modern", "expressive"] as ProfileStyle[]).map((style) => <button key={style} className={document.style === style ? "active" : ""} onClick={() => chooseStyle(style)}><span className={`builder-style-swatch builder-style-swatch--${style}`} /><b>{style}</b><small>{style === "editorial" ? "Quiet and considered" : style === "modern" ? "Clear and structured" : "Warm and distinctive"}</small></button>)}</div>}

            {panel === "settings" && <div className="builder-settings">
              <h2>What visitors can use</h2>
              <label><input type="checkbox" checked={document.publicBotEnabled} onChange={(event) => saveDocument({ ...document, publicBotEnabled: event.target.checked }, "builder_bot_setting_changed")} /><span><b>Ask about my work</b><small>Optional AI answers from approved page content only.</small></span></label>
              <label><input type="checkbox" checked={document.contact.showEmail} onChange={(event) => saveDocument({ ...document, contact: { ...document.contact, showEmail: event.target.checked } })} /><span><b>Show email button</b><small>{document.contact.email || "No email available"}</small></span></label>
              <label><input type="checkbox" checked={document.contact.showLinkedin} disabled={!document.contact.linkedin} onChange={(event) => saveDocument({ ...document, contact: { ...document.contact, showLinkedin: event.target.checked } })} /><span><b>Show LinkedIn</b><small>{document.contact.linkedin || "Add a LinkedIn URL later"}</small></span></label>
              {state.hasPublished && <button className="builder-rollback" disabled={Boolean(busy)} onClick={async () => {
                const result = await mutate<{ document: ProfileDocument; revision: number }>("rollback", "/api/builder/rollback", { revision });
                if (result) capture("builder_previous_version_restored");
              }}>Restore previous published version</button>}
            </div>}
          </div>
          <footer>
            {document.undoStack.length > 0 && <button className="builder-undo" disabled={Boolean(busy)} onClick={() => mutate("undo", "/api/builder/undo", { revision })}><RotateCcw /> Undo last change</button>}
            {!approved ? <button className="builder-primary" disabled={Boolean(busy) || Boolean(proposal)} onClick={approve}>{busy === "approve" ? <Loader2 className="animate-spin" /> : <Check />} {user ? "Approve this version" : "Create account to publish"}</button> : <button className="builder-primary" disabled={Boolean(busy)} onClick={publish}>{busy === "publish" ? <Loader2 className="animate-spin" /> : null} Publish and share</button>}
            {!user && <Link className="builder-sign-in" href="/login?next=/builder">Already have an account? Sign in</Link>}
          </footer>
        </aside>
      </div>
      {showPlans && <div className="builder-plan-modal"><div><button className="builder-modal-close" onClick={() => setShowPlans(false)} aria-label="Close plans"><X /></button><PaymentGate profileId="current" username={user?.username} /></div></div>}
    </main>
  );
}
