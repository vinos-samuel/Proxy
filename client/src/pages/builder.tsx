import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowDown, ArrowLeft, ArrowUp, Check, ChevronRight, Eye, Loader2, Menu, MessageCircle, Mic, Plus, RotateCcw, Send, Sparkles, Trash2, Upload, X } from "lucide-react";
import type { ImprovementQuestion, ProfileDocument, ProfileStyle } from "@shared/profile-document";
import { normalizeProfileDocument } from "@shared/profile-document";
import ProfileDocumentView from "@/components/profile-document-view";
import PaymentGate from "@/components/PaymentGate";
import ProxyLogo from "@/components/ProxyLogo";
import { getCsrfToken } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { visualProfileFixture } from "@/lib/profile-document-fixtures";
import { mergeProfileDocuments, setDocumentPath, type DocumentConflict } from "@/lib/profile-document-merge";
import { useUpload } from "@/hooks/use-upload";
import { useSpeechInput } from "@/hooks/use-speech-input";
import { renderAnswer } from "@/lib/renderAnswer";

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
type ConversationTopic = "all" | "work" | "experience" | "about";
type EditTarget = { section: "outline" | "introduction" | "projects" | "project" | "experience" | "role" | "employer" | "skills" | "more" | "details" | "impactStats" | "howIWork"; id?: string };
type ConflictReview = {
  latest: BuilderState;
  merged: ProfileDocument;
  conflicts: DocumentConflict[];
  choices: Record<string, "local" | "remote">;
};

async function requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (init.method && ["POST", "PATCH", "PUT", "DELETE"].includes(init.method)) {
    const token = getCsrfToken();
    if (token) headers.set("x-csrf-token", token);
  }
  const response = await fetch(url, { ...init, headers, credentials: "include" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new RequestError(data.message || "Something went wrong", response.status, data.code);
  return data;
}

class RequestError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
  }
}

function capture(event: string, properties: Record<string, unknown> = {}) {
  if (typeof window.gtag === "function") window.gtag("event", event, properties);
  const posthog = (window as any).posthog;
  if (posthog?.capture) posthog.capture(event, properties);
}

function summarizeConflictValue(value: unknown): string {
  if (Array.isArray(value)) return value.length ? `${value.length} item${value.length === 1 ? "" : "s"}` : "Empty";
  if (value === null || value === undefined || value === "") return "Empty";
  if (typeof value === "object") return "Changed section";
  const text = String(value);
  return text.length > 180 ? `${text.slice(0, 177)}…` : text;
}

export default function BuilderPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [state, setState] = useState<BuilderState>({});
  const [question, setQuestion] = useState<QuestionState | null>(null);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const { isListening: isListeningAnswer, speechSupported: answerSpeechSupported, toggleListening: toggleAnswerListening } = useSpeechInput(setAnswer);
  const [conversationTopic, setConversationTopic] = useState<ConversationTopic>("all");
  const [choosingTopic, setChoosingTopic] = useState(false);
  const [panel, setPanel] = useState<Panel>("improve");
  const [busy, setBusy] = useState<string | null>("loading");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [conflictReview, setConflictReview] = useState<ConflictReview | null>(null);
  const [mobilePanel, setMobilePanel] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [approved, setApproved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget>({ section: "outline" });
  const [manualStart, setManualStart] = useState(false);
  const [manual, setManual] = useState({ name: "", title: "", work: "" });
  const [testChat, setTestChat] = useState(false);
  const [testQuestion, setTestQuestion] = useState("");
  const [testMessages, setTestMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const stateRef = useRef(state);
  const acknowledgedDocumentRef = useRef<ProfileDocument>();
  const localEditVersionRef = useRef(0);
  const saveQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const saveSequenceRef = useRef(0);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fixtureMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("fixture") === "1";

  const document = state.document ? normalizeProfileDocument(state.document) : state.document;
  const revision = state.revision;

  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    if (fixtureMode) {
      const requestedStyle = new URLSearchParams(window.location.search).get("style");
      const style: ProfileStyle = requestedStyle === "executive" || requestedStyle === "editorial" || requestedStyle === "modern" || requestedStyle === "expressive" ? requestedStyle : "executive";
      const fixtureDocument = visualProfileFixture(style);
      acknowledgedDocumentRef.current = fixtureDocument;
      stateRef.current = { document: fixtureDocument, revision: 1, source: "guest", hasPublished: false };
      setState(stateRef.current);
      setQuestion({
        source: "rules",
        question: {
          id: "project:project-1:challenge",
          section: "project",
          targetId: "project-1",
          field: "challenge",
          label: "Building one operating model · Northstar Services",
          question: "Before you introduced the shared model, what was difficult for the country teams?",
          priority: 95,
        },
      });
      setBusy(null);
      return;
    }
    requestJson<BuilderState>("/api/builder")
      .then((next) => {
        acknowledgedDocumentRef.current = next.document;
        stateRef.current = next;
        setState(next);
        if (next.document) capture("builder_opened", { source: next.source });
      })
      .catch((cause) => setError(cause.message))
      .finally(() => setBusy(null));
  }, [fixtureMode]);

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
    if (fixtureMode || !document || document.pendingProposal || panel !== "improve") return;
    setQuestionLoading(true);
    requestJson<QuestionState>(`/api/builder/question?topic=${conversationTopic}`)
      .then(setQuestion)
      .catch((cause) => setError(cause.message))
      .finally(() => setQuestionLoading(false));
  }, [fixtureMode, conversationTopic, document?.answeredQuestionIds.length, document?.skippedQuestionIds.length, document?.pendingProposal, panel]);

  const updateState = (next: { document: ProfileDocument; revision: number }) => {
    acknowledgedDocumentRef.current = next.document;
    stateRef.current = { ...stateRef.current, ...next };
    setState((current) => ({ ...current, ...next }));
    setApproved(false);
    setDirty(false);
    setConflict(false);
    setConflictReview(null);
  };

  const acceptAcknowledgedResult = (next: { document: ProfileDocument; revision: number }, editVersion: number) => {
    const previousAcknowledged = acknowledgedDocumentRef.current;
    const currentLocal = stateRef.current.document;
    acknowledgedDocumentRef.current = next.document;
    if (previousAcknowledged && currentLocal && editVersion !== localEditVersionRef.current) {
      const merged = mergeProfileDocuments(previousAcknowledged, currentLocal, next.document);
      const preserved = merged.conflicts.reduce(
        (value, item) => setDocumentPath(value, item.path, item.local),
        merged.document,
      );
      stateRef.current = { ...stateRef.current, document: preserved, revision: next.revision };
      setState((current) => ({ ...current, document: preserved, revision: next.revision }));
      setApproved(false);
      setDirty(true);
      return;
    }
    updateState(next);
  };

  const editLocal = (updater: (current: ProfileDocument) => ProfileDocument) => {
    const current = stateRef.current.document;
    if (!current) return;
    const next = updater(current);
    localEditVersionRef.current += 1;
    stateRef.current = { ...stateRef.current, document: next };
    setState((value) => ({ ...value, document: next }));
    setApproved(false);
    setDirty(true);
  };

  const mutate = async <T extends { document?: ProfileDocument; revision?: number }>(
    label: string,
    url: string,
    body: Record<string, unknown>,
  ) => {
    setBusy(label);
    setError("");
    const operation = saveQueueRef.current.then(async () => {
      const operationEditVersion = localEditVersionRef.current;
      const currentRevision = stateRef.current.revision;
      const payload = Object.prototype.hasOwnProperty.call(body, "revision") && currentRevision
        ? { ...body, revision: currentRevision }
        : body;
      const result = await requestJson<T>(url, { method: "POST", body: JSON.stringify(payload) });
      if (result.document && result.revision) acceptAcknowledgedResult({ document: result.document, revision: result.revision }, operationEditVersion);
      return result;
    }).catch((cause: any) => {
      if (cause instanceof RequestError && cause.status === 409) void prepareConflictReview();
      setError(cause.message);
      return null;
    }).finally(() => setBusy(null));
    saveQueueRef.current = operation;
    return operation;
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
      acknowledgedDocumentRef.current = next.document;
      stateRef.current = next;
      setState(next);
      capture("builder_upload_completed", { source: next.source });
      capture("builder_first_page", { seconds: Math.round((performance.now() - startedAt) / 100) / 10, source: next.source });
    } catch (cause: any) {
      setError(cause.message);
    } finally {
      setBusy(null);
    }
  };

  const saveDocument = (next: ProfileDocument, event?: string) => {
    if (!stateRef.current.revision) return Promise.resolve(null);
    const sequence = ++saveSequenceRef.current;
    const operationEditVersion = localEditVersionRef.current;
    stateRef.current = { ...stateRef.current, document: next };
    setState((current) => ({ ...current, document: next }));
    setDirty(true);
    setBusy("save");
    setError("");
    const operation = saveQueueRef.current.then(async () => {
      const currentRevision = stateRef.current.revision;
      if (!currentRevision) return null;
      if (fixtureMode) {
        const saved = { document: next, revision: currentRevision + 1 };
        acceptAcknowledgedResult(saved, operationEditVersion);
        if (event) capture(event);
        return saved;
      }
      const saved = await requestJson<{ document: ProfileDocument; revision: number }>("/api/builder", { method: "PATCH", body: JSON.stringify({ revision: currentRevision, document: next }) });
      acceptAcknowledgedResult(saved, operationEditVersion);
      if (event) capture(event);
      return saved;
    }).catch((cause: any) => {
      if (cause instanceof RequestError && cause.status === 409) void prepareConflictReview();
      setError(cause.message);
      setDirty(true);
      capture("builder_save_failed", { conflict: cause instanceof RequestError && cause.status === 409 });
      return null;
    }).finally(() => { if (sequence === saveSequenceRef.current) setBusy(null); });
    saveQueueRef.current = operation;
    return operation;
  };

  const { uploadFile: uploadPhoto, isUploading: isUploadingPhoto } = useUpload({
    onSuccess: (response) => { const current = stateRef.current.document; if (current) void saveDocument({ ...current, identity: { ...current.identity, photoUrl: response.objectPath, showPhoto: true } }, "builder_photo_uploaded"); },
  });
  const { uploadFile: uploadVideo, isUploading: isUploadingVideo } = useUpload({
    onSuccess: (response) => { const current = stateRef.current.document; if (current) void saveDocument({ ...current, identity: { ...current.identity, videoUrl: response.objectPath, showVideo: true } }, "builder_video_uploaded"); },
  });

  const chooseStyle = (style: ProfileStyle) => {
    const current = stateRef.current.document;
    if (!current || style === current.style) return;
    const undo: ProfileDocument["undoStack"][number] = {
      section: "style", targetId: null, field: "style", before: current.style, after: style,
    };
    saveDocument({
      ...current,
      style,
      undoStack: [...current.undoStack, undo].slice(-5),
    }, "builder_style_changed");
  };

  const startWithoutCv = async () => {
    setBusy("manual"); setError("");
    try {
      const next = await requestJson<BuilderState>("/api/builder/start-manual", { method: "POST", body: JSON.stringify(manual) });
      acknowledgedDocumentRef.current = next.document; stateRef.current = next;
      setState(next); setManualStart(false); capture("builder_started_with_questions", { source: next.source });
    } catch (cause: any) { setError(cause.message); }
    finally { setBusy(null); }
  };

  const addProject = () => {
    const current = stateRef.current.document;
    if (!current || current.projects.length >= 8) return;
    const id = `project-${Date.now().toString(36)}`;
    const project: ProfileDocument["projects"][number] = { id, title: "New selected work", summary: "", sourceIds: [] };
    const next = {
      ...current,
      projects: [...current.projects, project],
      undoStack: [...current.undoStack, { section: "project" as const, targetId: id, field: "project:add", before: null, after: project }].slice(-5),
    };
    setEditTarget({ section: "project", id });
    void saveDocument(next, "builder_work_added");
  };

  const addProjectFromSource = (sourceId: string) => {
    const current = stateRef.current.document;
    if (!current || current.projects.length >= 8) return;
    const source = current.sources.find((item) => item.id === sourceId);
    if (!source) return;
    const id = `project-${Date.now().toString(36)}`;
    const firstClause = source.excerpt.split(/[.;:\n]/)[0]?.trim() || source.excerpt;
    const project: ProfileDocument["projects"][number] = {
      id,
      title: firstClause.split(/\s+/).slice(0, 12).join(" ").slice(0, 180) || "Work from my CV",
      summary: source.excerpt.slice(0, 500),
      sourceIds: [source.id],
    };
    const next = {
      ...current,
      projects: [...current.projects, project],
      undoStack: [...current.undoStack, { section: "project" as const, targetId: id, field: "project:add", before: null, after: project }].slice(-5),
    };
    setEditTarget({ section: "project", id });
    void saveDocument(next, "builder_work_added_from_cv");
  };

  const updateProject = (id: string, patch: Partial<ProfileDocument["projects"][number]>) => {
    editLocal((current) => ({ ...current, projects: current.projects.map((item) => item.id === id ? { ...item, ...patch } : item) }));
  };

  const moveProject = (id: string, offset: number) => {
    const current = stateRef.current.document;
    if (!current) return;
    const index = current.projects.findIndex((item) => item.id === id);
    const target = index + offset;
    if (index < 0 || target < 0 || target >= current.projects.length) return;
    const projects = [...current.projects];
    [projects[index], projects[target]] = [projects[target], projects[index]];
    void saveDocument({
      ...current,
      projects,
      undoStack: [...current.undoStack, { section: "project" as const, targetId: id, field: "project:order", before: current.projects.map((item) => item.id), after: projects.map((item) => item.id) }].slice(-5),
    }, "builder_work_reordered");
  };

  const removeProject = (id: string) => {
    const current = stateRef.current.document;
    if (!current) return;
    const projects = current.projects.filter((item) => item.id !== id);
    const removedIndex = current.projects.findIndex((item) => item.id === id);
    const removedProject = current.projects[removedIndex];
    if (!removedProject) return;
    const next = {
      ...current,
      projects,
      pendingProposal: current.pendingProposal?.targetId === id ? null : current.pendingProposal,
      undoStack: [...current.undoStack, { section: "project" as const, targetId: id, field: "project:remove", before: { project: removedProject, index: removedIndex }, after: null }].slice(-5),
    };
    setEditTarget({ section: "projects" });
    void saveDocument(next, "builder_work_removed");
  };

  const sendTestQuestion = async () => {
    if (!testQuestion.trim()) return;
    const message = testQuestion.trim();
    setTestMessages((items) => [...items, { role: "user", content: message }]);
    setTestQuestion(""); setBusy("test-chat");
    try {
      await saveQueueRef.current;
      const result = await requestJson<{ content: string }>("/api/builder/test-chat", { method: "POST", body: JSON.stringify({ message }) });
      setTestMessages((items) => [...items, { role: "assistant", content: result.content }]);
    } catch (cause: any) {
      // The dialog has no other visible surface for errors — without this
      // the request fails silently and looks like the bot never responded.
      setTestMessages((items) => [...items, { role: "assistant", content: cause.message || "Something went wrong answering that." }]);
    }
    finally { setBusy(null); }
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
    if (!stateRef.current.revision || !user) {
      sessionStorage.setItem("proxy_builder_return", "1");
      setLocation("/register");
      return;
    }
    setBusy("approve");
    setError("");
    try {
      await saveQueueRef.current;
      await requestJson("/api/builder/approve", { method: "POST", body: JSON.stringify({ revision: stateRef.current.revision }) });
      setApproved(true);
      capture("builder_approved", { revision: stateRef.current.revision });
    } catch (cause: any) {
      setError(cause.message);
    } finally {
      setBusy(null);
    }
  };

  const publish = async () => {
    if (!stateRef.current.revision) return;
    setBusy("publish");
    setError("");
    try {
      await saveQueueRef.current;
      const result = await requestJson<{ username: string }>("/api/builder/publish", { method: "POST", body: JSON.stringify({ revision: stateRef.current.revision }) });
      capture("builder_published");
      setLocation(`/portfolio/${result.username}`);
    } catch (cause: any) {
      if (cause.message.includes("publishing plan")) setShowPlans(true);
      else setError(cause.message);
    } finally {
      setBusy(null);
    }
  };

  const saveCurrent = () => stateRef.current.document ? saveDocument(stateRef.current.document) : Promise.resolve(null);

  const prepareConflictReview = async () => {
    const localDocument = stateRef.current.document;
    const baseDocument = acknowledgedDocumentRef.current;
    if (!localDocument || !baseDocument || fixtureMode) return;
    setConflict(true);
    setConflictReview(null);
    try {
      const latest = await requestJson<BuilderState>("/api/builder");
      if (!latest.document || !latest.revision) throw new Error("The latest draft could not be loaded");
      const merged = mergeProfileDocuments(baseDocument, localDocument, latest.document);
      setConflictReview({ latest, merged: merged.document, conflicts: merged.conflicts, choices: {} });
      setError("This draft changed somewhere else. Review the differences before saving.");
    } catch (cause: any) {
      setError(cause.message);
    }
  };

  const reloadAfterConflict = async () => {
    setBusy("recovery");
    try {
      await saveQueueRef.current;
      const latest = conflictReview?.latest || await requestJson<BuilderState>("/api/builder");
      acknowledgedDocumentRef.current = latest.document;
      stateRef.current = latest;
      setState(latest);
      setDirty(false);
      setApproved(false);
      setConflict(false);
      setConflictReview(null);
      setError("");
      capture("builder_save_recovered", { choice: "latest" });
    } catch (cause: any) {
      setError(cause.message);
    } finally {
      setBusy(null);
    }
  };

  const saveReviewedConflict = async () => {
    if (!conflictReview?.latest.revision || fixtureMode) return;
    const unresolved = conflictReview.conflicts.filter((item) => !conflictReview.choices[item.path]);
    if (unresolved.length) return;
    const reviewed = conflictReview.conflicts.reduce((value, item) => {
      const choice = conflictReview.choices[item.path];
      return setDocumentPath(value, item.path, choice === "local" ? item.local : item.remote);
    }, conflictReview.merged);
    setBusy("recovery");
    try {
      await saveQueueRef.current;
      const saved = await requestJson<{ document: ProfileDocument; revision: number }>("/api/builder", {
        method: "PATCH",
        body: JSON.stringify({ revision: conflictReview.latest.revision, document: reviewed }),
      });
      updateState(saved);
      setError("");
      capture("builder_save_recovered", { choice: conflictReview.conflicts.length ? "reviewed" : "merged" });
    } catch (cause: any) {
      if (cause instanceof RequestError && cause.status === 409) void prepareConflictReview();
      setError(cause.message);
    } finally {
      setBusy(null);
    }
  };

  if (busy === "loading") return <div className="builder-loading"><Loader2 className="animate-spin" /><p>Preparing your workspace…</p></div>;

  if (!document) {
    return (
      <main className="builder-empty">
        <header><Link href="/"><ProxyLogo /></Link>{user && <Link href="/dashboard">Dashboard</Link>}</header>
        <section>
          <p className="builder-kicker">Prepare convincing evidence for your next opportunity.</p>
          <h1>Turn your CV into a page worth sharing.</h1>
          <p>Upload a PDF for the fastest start. You will see a finished first version, then you can deepen it through conversation or guided editing.</p>
          <label className="builder-upload">
            {busy === "upload" ? <Loader2 className="animate-spin" /> : <Upload />}
            <span>{busy === "upload" ? "Building your page…" : "Upload your CV"}</span>
            <small>PDF, up to 5 MB</small>
            <input type="file" accept="application/pdf" disabled={Boolean(busy)} onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} />
          </label>
          <button className="builder-text-button builder-manual-toggle" type="button" onClick={() => setManualStart((value) => !value)}>No CV? Start with a few questions <ChevronRight /></button>
          {manualStart && <div className="builder-manual-start">
            <label><span>Your name</span><input value={manual.name} onChange={(event) => setManual({ ...manual, name: event.target.value })} /></label>
            <label><span>Your current role or professional focus</span><input value={manual.title} onChange={(event) => setManual({ ...manual, title: event.target.value })} /></label>
            <label><span>Describe one piece of work you are proud of</span><textarea value={manual.work} onChange={(event) => setManual({ ...manual, work: event.target.value })} placeholder="What did you do, and why did it matter? Plain language is fine." /></label>
            <button className="builder-primary" disabled={Boolean(busy) || manual.name.trim().length < 2 || manual.title.trim().length < 2 || manual.work.trim().length < 10} onClick={startWithoutCv}>{busy === "manual" ? <Loader2 className="animate-spin" /> : <Sparkles />} Build my starting page</button>
          </div>}
          {state.legacyAvailable && user && <button className="builder-text-button" onClick={async () => {
            const result = await mutate<{ document: ProfileDocument; revision: number }>("import", "/api/builder/adopt-existing", {});
            if (result) capture("builder_legacy_imported");
          }}>Use my existing Proxy profile <ChevronRight /></button>}
          {error && <p className="builder-error" role="alert">{error}</p>}
          <p className="builder-trust">Your CV and answers stay private while you build. Guest drafts are kept for 4 hours. Create a free account to keep and publish your page. No card required.</p>
        </section>
      </main>
    );
  }

  const proposal = document.pendingProposal;
  if (previewMode) return <main className="builder-preview-mode"><header><button type="button" onClick={() => setPreviewMode(false)}><ArrowLeft /> Back to editing</button><span>Visitor preview · not published</span></header><ProfileDocumentView document={document} proposal={proposal} onAsk={document.publicBotEnabled ? () => setTestChat(true) : undefined} /></main>;
  return (
    <main className="builder-shell">
      <header className="builder-topbar">
        <Link href={user ? "/dashboard" : "/"} className="builder-back"><ArrowLeft /> <span>Proxy</span></Link>
        <div><span className={`builder-save-state ${error ? "is-error" : ""}`}>{busy === "save" ? "Saving…" : error && dirty ? "Save failed" : dirty ? "Unsaved changes" : "All changes saved"}</span><button className="builder-topbar-action" disabled={dirty || Boolean(busy)} onClick={() => setPreviewMode(true)}><Eye /> Preview</button><button className="builder-topbar-publish" disabled={dirty || Boolean(busy) || Boolean(proposal)} onClick={approved ? publish : approve}>{!user ? "Create free account" : approved ? (state.hasPublished ? "Publish changes" : "Publish free") : "Review & approve"}</button><button className="builder-menu" onClick={() => setMobilePanel(true)} aria-label="Open editing panel"><Menu /></button></div>
      </header>
      <div className="builder-workspace">
        <section className="builder-canvas" aria-label="Page preview">
          <div className="builder-browser"><span /><span /><span /><small>{window.location.host}/portfolio/{user?.username || "your-name"}</small></div>
          <ProfileDocumentView document={document} proposal={proposal} onAsk={document.publicBotEnabled ? () => setTestChat(true) : undefined} onEdit={(section, id) => {
            setPanel("edit");
            if (section === "project" && !id) setEditTarget({ section: "projects" });
            else if (section === "impactStats" || section === "howIWork") setEditTarget({ section });
            else setEditTarget({ section: section === "introduction" ? "introduction" : section === "project" ? "project" : section === "experience" ? (document.employerContributions.some((item) => item.id === id) ? "employer" : "role") : section === "details" ? "details" : "skills", id });
            setMobilePanel(true);
          }} />
        </section>

        <aside className={`builder-panel ${mobilePanel ? "builder-panel--open" : ""}`}>
          <div className="builder-panel-head"><div><p>Your page</p><span>{dirty ? "Changes waiting to save" : "Private draft"}</span></div><button onClick={() => setMobilePanel(false)} aria-label="Close editing panel"><X /></button></div>
          <nav>{(["improve", "edit", "style", "settings"] as Panel[]).map((item) => <button key={item} className={panel === item ? "active" : ""} onClick={() => setPanel(item)}>{item}</button>)}</nav>
          <div className="builder-panel-body">
            {error && <div className="builder-error" role="alert"><p>{error}</p>{conflict ? <div className="builder-conflict-review">{conflictReview ? <>{conflictReview.conflicts.length > 0 ? <><p>Choose which version to keep for each conflicting field. Other changes were combined automatically.</p>{conflictReview.conflicts.map((item) => <fieldset key={item.path}><legend>{item.path.replaceAll(".", " · ")}</legend><button className={conflictReview.choices[item.path] === "local" ? "selected" : ""} onClick={() => setConflictReview((current) => current ? { ...current, choices: { ...current.choices, [item.path]: "local" } } : current)}><b>Keep my change</b><span>{summarizeConflictValue(item.local)}</span></button><button className={conflictReview.choices[item.path] === "remote" ? "selected" : ""} onClick={() => setConflictReview((current) => current ? { ...current, choices: { ...current.choices, [item.path]: "remote" } } : current)}><b>Keep other version</b><span>{summarizeConflictValue(item.remote)}</span></button></fieldset>)}</> : <p>Your changes do not overlap. They can be combined safely.</p>}<div className="builder-conflict-actions"><button onClick={reloadAfterConflict}>Use latest version</button><button disabled={conflictReview.conflicts.some((item) => !conflictReview.choices[item.path])} onClick={saveReviewedConflict}>Save reviewed version</button></div></> : <p>Loading both versions…</p>}</div> : dirty && <button onClick={() => saveDocument(document)}>Retry save</button>}</div>}
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
              <p className="builder-panel-kicker"><Sparkles /> Make your bot know more about your work</p>
              <p className="builder-panel-subtitle">Type or tap the mic and talk — every answer sharpens your page and what "Ask about my work" can say.</p>
              <div className="builder-conversation-controls"><button type="button" onClick={() => setChoosingTopic((value) => !value)}>Choose another topic <ChevronRight /></button><button type="button" onClick={() => setPanel("edit")}>Finish for now</button></div>
              {choosingTopic && <div className="builder-topic-picker">{([
                ["all", "Best next question"], ["work", "Selected work"], ["experience", "Career experience"], ["about", "Working style and direction"],
              ] as Array<[ConversationTopic, string]>).map(([value, label]) => <button className={conversationTopic === value ? "active" : ""} key={value} onClick={() => { setConversationTopic(value); setChoosingTopic(false); setQuestion(null); }}>{label}</button>)}</div>}
              {document.sources.some((source) => source.kind === "user") && <div className="builder-conversation-history">{document.sources.filter((source) => source.kind === "user").slice(-3).map((source) => <div key={source.id}><b>Proxy asked</b><p>{source.label}</p><b>You said</b><p>{source.excerpt}</p></div>)}</div>}
              {proposal ? <div className="builder-proposal">
                <p>{proposal.question}</p><textarea className="builder-proposal-edit" value={proposal.proposed} onChange={(event) => {
                  const proposed = event.target.value;
                  editLocal((current) => ({ ...current, pendingProposal: current.pendingProposal ? { ...current.pendingProposal, proposed } : null }));
                }} onBlur={() => mutate("save", "/api/builder/proposal", { revision, proposed: document.pendingProposal?.proposed })} />
                <div><button disabled={Boolean(busy) || dirty} onClick={async () => {
                  const result = await mutate<{ document: ProfileDocument; revision: number }>("keep", "/api/builder/keep", { revision });
                  if (result) capture("builder_improvement_kept", { section: proposal.section });
                }}><Check /> Keep change</button><button disabled={Boolean(busy)} onClick={async () => { const result = await mutate("skip", "/api/builder/skip", { revision, questionId: proposal.questionId }); if (result) capture("builder_improvement_skipped", { section: proposal.section }); }}>Skip</button></div>
              </div> : questionLoading ? <div className="builder-question-loading"><Loader2 className="animate-spin" /><p>Finding a useful next question…</p></div> : question?.question ? <div className="builder-question">
                <span>{question.question.label}</span>
                {question.question.sourceExcerpt && <p className="builder-source-context"><b>{question.question.sourceKind === "resume" ? "From your CV" : "You added"}</b>{question.question.sourceExcerpt}</p>}
                <h2>{question.question.question}</h2>
                <div className="builder-answer-input">
                  <textarea value={answer} maxLength={2500} onChange={(event) => setAnswer(event.target.value)} placeholder="A few honest sentences are enough." />
                  {answerSpeechSupported && <button type="button" className={`builder-mic ${isListeningAnswer ? "is-listening" : ""}`} onClick={toggleAnswerListening} aria-label={isListeningAnswer ? "Stop talking" : "Talk instead of typing"} title={isListeningAnswer ? "Stop" : "Talk instead of typing"}><Mic /></button>}
                </div>
                <button className="builder-primary" disabled={Boolean(busy) || answer.trim().length < 2} onClick={improve}>{busy === "improve" ? <Loader2 className="animate-spin" /> : <Sparkles />} Show the improvement</button>
                <div className="builder-question-secondary"><button className="builder-text-button" disabled={Boolean(busy)} onClick={async () => { const result = await mutate("skip", "/api/builder/skip", { revision, questionId: question.question!.id }); if (result) capture("builder_improvement_skipped", { section: question.question!.section }); }}>Skip this question</button><button className="builder-text-button" disabled={Boolean(busy)} onClick={async () => { const result = await mutate("skip", "/api/builder/skip", { revision, questionId: question.question!.id }); if (result) capture("builder_improvement_unsure", { section: question.question!.section }); }}>I’m not sure</button></div>
              </div> : <div className="builder-complete"><Check /><h2>No more suggestions for this section right now.</h2><p>You can add another example, choose a section to edit, or preview your page.</p><button className="builder-primary" onClick={() => { setPanel("edit"); setEditTarget({ section: "projects" }); }}>Add or edit selected work</button><button className="builder-text-button" onClick={() => setPreviewMode(true)}>Preview your page</button></div>}
            </>}

            {panel === "edit" && <div className="builder-editor">
              {editTarget.section !== "outline" && <button className="builder-back-sections" type="button" onClick={() => setEditTarget({ section: "outline" })}><ArrowLeft /> Back to sections</button>}
              {editTarget.section === "outline" && <>
                <div className="builder-editor-heading"><p className="builder-panel-kicker">Guided details</p><h2>Edit what visitors will see</h2><p>Choose a section. Your CV has already filled what it could.</p></div>
                <div className="builder-section-list">
                  <button onClick={() => setEditTarget({ section: "introduction" })}><span><b>Introduction</b><small>Name, role, headline and summary</small></span><ChevronRight /></button>
                  <button onClick={() => setEditTarget({ section: "projects" })}><span><b>Selected work</b><small>{document.projects.length} examples · add, reorder or remove</small></span><ChevronRight /></button>
                  <button onClick={() => setEditTarget({ section: "impactStats" })}><span><b>Impact numbers</b><small>{document.impactStats.length} entries · shown once you add at least 2</small></span><ChevronRight /></button>
                  <button onClick={() => setEditTarget({ section: "experience" })}><span><b>Experience</b><small>{document.experience.length} roles with full detail</small></span><ChevronRight /></button>
                  <button onClick={() => setEditTarget({ section: "howIWork" })}><span><b>My approach</b><small>{document.howIWork ? "Written · edit or regenerate" : "Not written yet · shown on your page"}</small></span><ChevronRight /></button>
                  <button onClick={() => setEditTarget({ section: "skills" })}><span><b>Strengths</b><small>{document.skills.length} capabilities</small></span><ChevronRight /></button>
                  <button onClick={() => setEditTarget({ section: "details" })}><span><b>Background</b><small>Education, certifications and recognition</small></span><ChevronRight /></button>
                  <button onClick={() => setEditTarget({ section: "more" })}><span><b>Private authoring notes</b><small>Working style, direction and voice</small></span><ChevronRight /></button>
                </div>
              </>}
              {editTarget.section === "introduction" && <fieldset>
                <legend>Introduction</legend>
                {(["name", "title", "location", "headline", "summary"] as const).map((field) => <label key={field}>
                  <span>{field === "name" ? "Name" : field === "title" ? "Role" : field === "location" ? "Location (optional)" : field === "headline" ? "Short headline" : "Professional summary"}</span>
                  {field === "headline" || field === "summary"
                    ? <textarea value={document.identity[field] || ""} maxLength={field === "headline" ? 240 : 1800} onChange={(event) => { const value = event.target.value; editLocal((current) => ({ ...current, identity: { ...current.identity, [field]: value } })); }} onBlur={saveCurrent} />
                    : <input value={document.identity[field] || ""} onChange={(event) => { const value = event.target.value; editLocal((current) => ({ ...current, identity: { ...current.identity, [field]: value } })); }} onBlur={saveCurrent} />}
                </label>)}
                <p className="builder-private-note">Photo and video live under Settings, next to Email and LinkedIn.</p>
              </fieldset>}
              {editTarget.section === "impactStats" && <>
                <div className="builder-editor-heading"><h2>Impact numbers</h2><p>Short label plus a value — a number, or something like "PMP Certified." Only shows on your page once you have at least 2.</p></div>
                <div className="builder-item-list">{document.impactStats.map((stat) => <div key={stat.id}>
                  <input value={stat.label} placeholder="Label, e.g. Client retention" onChange={(event) => { const label = event.target.value; editLocal((current) => ({ ...current, impactStats: current.impactStats.map((item) => item.id === stat.id ? { ...item, label } : item) })); }} onBlur={saveCurrent} />
                  <input value={stat.value} placeholder="Value, e.g. 94%" onChange={(event) => { const value = event.target.value; editLocal((current) => ({ ...current, impactStats: current.impactStats.map((item) => item.id === stat.id ? { ...item, value } : item) })); }} onBlur={saveCurrent} />
                  <button className="danger" type="button" aria-label="Remove" onClick={() => saveDocument({ ...document, impactStats: document.impactStats.filter((item) => item.id !== stat.id) })}><Trash2 /></button>
                </div>)}</div>
                <button className="builder-add" disabled={document.impactStats.length >= 6} onClick={() => saveDocument({ ...document, impactStats: [...document.impactStats, { id: `stat-${Date.now()}`, label: "", value: "" }] })}><Plus /> Add a number</button>
              </>}
              {editTarget.section === "howIWork" && (() => {
                const eligibleProjects = document.projects.filter((project) => [project.challenge, project.contribution, project.outcome].some((value) => Boolean(value && value.trim().length >= 10))).length;
                return <fieldset>
                  <legend>My approach</legend>
                  <p className="builder-private-note">Shown on your public page as "My approach." Written from your own answered project questions in Improve — never an invented framework. Needs at least 2 answered projects; you have {eligibleProjects}. (Different from "How you work" under Private authoring notes — that one is private and shapes your own drafting, not shown to visitors.)</p>
                  <textarea value={document.howIWork || ""} maxLength={900} placeholder="Generate a first draft, or write your own." onChange={(event) => { const value = event.target.value; editLocal((current) => ({ ...current, howIWork: value })); }} onBlur={saveCurrent} />
                  <button className="builder-add" disabled={Boolean(busy) || eligibleProjects < 2} onClick={async () => { const result = await mutate<{ document: ProfileDocument; revision: number }>("how-i-work", "/api/builder/synthesize-how-i-work", { revision }); if (result) capture("builder_how_i_work_generated"); }}>{busy === "how-i-work" ? <Loader2 className="animate-spin" /> : <Sparkles />} {document.howIWork ? "Regenerate" : "Generate a draft"}</button>
                </fieldset>;
              })()}
              {editTarget.section === "projects" && <>
                <div className="builder-editor-heading"><h2>Selected work</h2><p>Keep the page compact. Open one example to edit its full story.</p></div>
                <div className="builder-item-list">{document.projects.map((project, index) => <div key={project.id}><button onClick={() => setEditTarget({ section: "project", id: project.id })}><span><b>{project.title}</b><small>{project.company || "No company added"}</small></span><ChevronRight /></button><div><button disabled={index === 0} onClick={() => moveProject(project.id, -1)} aria-label={`Move ${project.title} up`}><ArrowUp /></button><button disabled={index === document.projects.length - 1} onClick={() => moveProject(project.id, 1)} aria-label={`Move ${project.title} down`}><ArrowDown /></button></div></div>)}</div>
                <div className="builder-add-work"><button className="builder-add" disabled={document.projects.length >= 8} onClick={addProject}><Plus /> Add my own example</button>{(() => {
                  const used = new Set(document.projects.flatMap((project) => project.sourceIds));
                  const suggestions = document.sources.filter((source) => source.kind === "resume" && source.label === "CV achievement" && !used.has(source.id)).slice(0, 4);
                  if (!suggestions.length) return null;
                  return <div><p>Or use something from your CV</p>{suggestions.map((source) => <button key={source.id} type="button" onClick={() => addProjectFromSource(source.id)}><span>{source.excerpt}</span><Plus /></button>)}</div>;
                })()}</div>
              </>}
              {editTarget.section === "project" && (() => { const project = document.projects.find((item) => item.id === editTarget.id); if (!project) return null; return <fieldset><legend>{project.title}</legend>{(["title", "company", "summary", "challenge", "contribution", "outcome"] as const).map((field) => <label key={field}><span>{field === "title" ? "Title" : field === "company" ? "Company or client (optional)" : field === "summary" ? "Short card summary" : field === "challenge" ? "What was happening?" : field === "contribution" ? "What did you do?" : "What changed?"}</span>{field === "title" || field === "company" ? <input value={project[field] || ""} onChange={(event) => updateProject(project.id, { [field]: event.target.value })} onBlur={saveCurrent} /> : <textarea value={project[field] || ""} onChange={(event) => updateProject(project.id, { [field]: event.target.value })} onBlur={saveCurrent} />}</label>)}<div className="builder-item-actions"><button onClick={() => moveProject(project.id, -1)}><ArrowUp /> Move up</button><button onClick={() => moveProject(project.id, 1)}><ArrowDown /> Move down</button><button className="danger" onClick={() => removeProject(project.id)}><Trash2 /> Remove</button></div></fieldset>; })()}
              {editTarget.section === "experience" && <><div className="builder-editor-heading"><h2>Experience</h2><p>Every role, bullet, and employer-level contribution remains available on every design.</p></div><div className="builder-section-list">{document.employerContributions.map((employer) => <button key={employer.id} onClick={() => setEditTarget({ section: "employer", id: employer.id })}><span><b>{employer.company} · selected contributions</b><small>{employer.contributions.length} items not assigned to one role</small></span><ChevronRight /></button>)}{document.experience.map((role) => <button key={role.id} onClick={() => setEditTarget({ section: "role", id: role.id })}><span><b>{role.title}</b><small>{role.company} · {role.period}</small></span><ChevronRight /></button>)}</div></>}
              {editTarget.section === "employer" && (() => {
                const employer = document.employerContributions.find((item) => item.id === editTarget.id);
                if (!employer) return null;
                return <fieldset><legend>{employer.company} · selected contributions</legend><label><span>Contributions that belong to the employer, but not clearly to one title · one per line</span><textarea value={employer.contributions.join("\n")} onChange={(event) => { const contributions = event.target.value.split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 20); editLocal((current) => ({ ...current, employerContributions: current.employerContributions.map((item) => item.id === employer.id ? { ...item, contributions } : item) })); }} onBlur={saveCurrent} /></label></fieldset>;
              })()}
              {editTarget.section === "role" && (() => {
                const role = document.experience.find((item) => item.id === editTarget.id);
                if (!role) return null;
                return <fieldset><legend>{role.title}</legend>
                  <label><span>Role summary</span><textarea value={role.summary || ""} onChange={(event) => { const summary = event.target.value; editLocal((current) => ({ ...current, experience: current.experience.map((item) => item.id === role.id ? { ...item, summary } : item) })); }} onBlur={saveCurrent} /></label>
                  <label><span>Contributions and achievements · one per line</span><textarea value={role.highlights.join("\n")} onChange={(event) => { const highlights = event.target.value.split("\n").slice(0, 16); editLocal((current) => ({ ...current, experience: current.experience.map((item) => item.id === role.id ? { ...item, highlights } : item) })); }} onBlur={saveCurrent} /></label>
                </fieldset>;
              })()}
              {editTarget.section === "skills" && <fieldset><legend>Areas of strength</legend><label><span>One capability per line</span><textarea value={document.skills.join("\n")} onChange={(event) => { const skills = event.target.value.split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 40); editLocal((current) => ({ ...current, skills })); }} onBlur={saveCurrent} /></label></fieldset>}
              {editTarget.section === "details" && <fieldset><legend>Background</legend>{([
                ["education", "Education"], ["certifications", "Certifications"], ["awards", "Recognition and awards"], ["interests", "Interests (optional)"],
              ] as const).map(([field, label]) => <label key={field}><span>{label} · one item per line</span><textarea value={document.details[field].join("\n")} onChange={(event) => { const items = event.target.value.split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 12); editLocal((current) => ({ ...current, details: { ...current.details, [field]: items } })); }} onBlur={saveCurrent} /></label>)}<div className="builder-detail-visibility"><p>Show on public page</p>{([
                ["showEducation", "Education"], ["showCertifications", "Certifications"], ["showAwards", "Recognition"], ["showInterests", "Interests"],
              ] as const).map(([field, label]) => <label key={field}><input type="checkbox" checked={document.details[field]} onChange={(event) => { const current = stateRef.current.document; if (current) void saveDocument({ ...current, details: { ...current.details, [field]: event.target.checked } }); }} /><span>{label}</span></label>)}</div></fieldset>}
              {editTarget.section === "more" && <fieldset><legend>Private authoring notes</legend>
                <p className="builder-private-note">Never shown on your public page. Two of these feed "Ask about my work" directly — marked below — the rest are just for your own reference right now.</p>
                <label><span>How you work <i>(not used yet — your own reference only)</i></span><textarea value={document.privateContext.workingStyle || ""} onChange={(event) => { const value = event.target.value; editLocal((current) => ({ ...current, privateContext: { ...current.privateContext, workingStyle: value } })); }} onBlur={saveCurrent} /></label>
                <label><span>What you want to do next <i>(not used yet — your own reference only)</i></span><textarea value={document.privateContext.careerDirection || ""} onChange={(event) => { const value = event.target.value; editLocal((current) => ({ ...current, privateContext: { ...current.privateContext, careerDirection: value } })); }} onBlur={saveCurrent} /></label>
                <label><span>How you want to sound <i>(used: sets the bot's tone when it answers)</i></span><textarea value={document.privateContext.voiceNotes || ""} onChange={(event) => { const value = event.target.value; editLocal((current) => ({ ...current, privateContext: { ...current.privateContext, voiceNotes: value } })); }} onBlur={saveCurrent} /></label>
                <label><span>Questions visitors may ask <i>(used: the bot draws on these exact answers)</i> · one “Question | Answer” per line</span><textarea value={document.privateContext.questions.map((item) => `${item.question} | ${item.answer}`).join("\n")} onChange={(event) => { const questions = event.target.value.split("\n").map((line) => { const [question, ...answer] = line.split("|"); return { question: question.trim(), answer: answer.join("|").trim() }; }).filter((item) => item.question && item.answer).slice(0, 12); editLocal((current) => ({ ...current, privateContext: { ...current.privateContext, questions } })); }} onBlur={saveCurrent} /></label>
                <label><span>Concerns you may want to address <i>(used: same as above)</i> · one “Concern | Response” per line</span><textarea value={document.privateContext.concerns.map((item) => `${item.concern} | ${item.response}`).join("\n")} onChange={(event) => { const concerns = event.target.value.split("\n").map((line) => { const [concern, ...response] = line.split("|"); return { concern: concern.trim(), response: response.join("|").trim() }; }).filter((item) => item.concern && item.response).slice(0, 12); editLocal((current) => ({ ...current, privateContext: { ...current.privateContext, concerns } })); }} onBlur={saveCurrent} /></label>
              </fieldset>}
            </div>}

            {panel === "style" && <div className="builder-styles"><div className="builder-editor-heading"><h2>Choose a design</h2><p>Your words and full career stay the same.</p></div>{(["executive", "editorial", "modern", "expressive"] as ProfileStyle[]).map((style) => <button key={style} className={document.style === style ? "active" : ""} onClick={() => chooseStyle(style)}><span className={`builder-style-preview builder-style-preview--${style}`}><i>{document.identity.name}</i><em>{document.identity.headline}</em><u>{document.projects[0]?.title || document.identity.title}</u></span><b>{style}</b><small>{style === "executive" ? "Confident and proven" : style === "editorial" ? "Quiet and considered" : style === "modern" ? "Clear and structured" : "Warm and distinctive"}</small></button>)}</div>}

            {panel === "settings" && <div className="builder-settings">
              <section><h2>AI explorer</h2><p>Let visitors ask questions about the information on your published page. AI answers may be incomplete.</p><button className="builder-test-bot" onClick={() => setTestChat(true)}><MessageCircle /> Test with this private preview</button><label><input type="checkbox" checked={document.publicBotEnabled} onChange={(event) => { const current = stateRef.current.document; if (current) void saveDocument({ ...current, publicBotEnabled: event.target.checked }, "builder_bot_setting_changed"); }} /><span><b>Show “Ask about my work” after publishing</b><small>Uses approved public content only. Private answers and CV text stay excluded.</small></span></label></section>
              <section><h2>Photo &amp; video</h2>
                {!user ? <p className="builder-private-note">Create a free account to add a photo or video.</p> : <>
                  <div className="builder-media-setting">
                    <div><span><b>Photo</b></span>{document.identity.photoUrl ? <small>Uploaded</small> : <small>Not added</small>}</div>
                    <div className="builder-media-actions">
                      <input ref={photoInputRef} type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadPhoto(file); event.target.value = ""; }} />
                      <button type="button" disabled={isUploadingPhoto} onClick={() => photoInputRef.current?.click()}>{isUploadingPhoto ? <Loader2 className="animate-spin" /> : <Upload />} {document.identity.photoUrl ? "Replace" : "Upload"}</button>
                      {document.identity.photoUrl && <button type="button" className="danger" onClick={() => saveDocument({ ...document, identity: { ...document.identity, photoUrl: null } })}><Trash2 /> Remove</button>}
                    </div>
                    <label><input type="checkbox" checked={document.identity.showPhoto} disabled={!document.identity.photoUrl} onChange={(event) => saveDocument({ ...document, identity: { ...document.identity, showPhoto: event.target.checked } })} /><span><b>Show photo</b></span></label>
                  </div>
                  <div className="builder-media-setting">
                    <div><span><b>Video</b></span>{document.identity.videoUrl ? <small>Uploaded</small> : <small>Not added</small>}</div>
                    <div className="builder-media-actions">
                      <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadVideo(file); event.target.value = ""; }} />
                      <button type="button" disabled={isUploadingVideo} onClick={() => videoInputRef.current?.click()}>{isUploadingVideo ? <Loader2 className="animate-spin" /> : <Upload />} {document.identity.videoUrl ? "Replace" : "Upload"}</button>
                      {document.identity.videoUrl && <button type="button" className="danger" onClick={() => saveDocument({ ...document, identity: { ...document.identity, videoUrl: null } })}><Trash2 /> Remove</button>}
                    </div>
                    <label><input type="checkbox" checked={document.identity.showVideo} disabled={!document.identity.videoUrl} onChange={(event) => saveDocument({ ...document, identity: { ...document.identity, showVideo: event.target.checked } })} /><span><b>Show video</b></span></label>
                  </div>
                </>}
              </section>
              <section><h2>Contact details</h2>{([
                ["email", "Email", "showEmail", "name@example.com"],
                ["linkedin", "LinkedIn", "showLinkedin", "https://linkedin.com/in/your-name"],
                ["website", "Website", "showWebsite", "https://your-site.com"],
              ] as const).map(([field, label, toggle, placeholder]) => <div className="builder-contact-setting" key={field}><label><span>{label}</span><input type={field === "email" ? "email" : "url"} value={document.contact[field] || ""} placeholder={placeholder} onChange={(event) => { const value = event.target.value || null; editLocal((current) => ({ ...current, contact: { ...current.contact, [field]: value } })); }} onBlur={saveCurrent} /></label><label><input type="checkbox" checked={document.contact[toggle]} disabled={!document.contact[field]} onChange={(event) => saveDocument({ ...stateRef.current.document!, contact: { ...stateRef.current.document!.contact, [toggle]: event.target.checked } })} /><span><b>Show {label}</b></span></label></div>)}</section>
              <section><h2>Publishing</h2><p>{state.hasPublished ? "Your edits stay private until you review and publish this version." : "Preview and edit for free. A verified free account is required to own and publish the link. No card required."}</p><p className="builder-trust">Your link stays live for good once published. The free plan gives you 7 days to edit it after that — the page itself doesn't expire.</p></section>
              {state.hasPublished && <button className="builder-rollback" disabled={Boolean(busy)} onClick={async () => {
                const result = await mutate<{ document: ProfileDocument; revision: number }>("rollback", "/api/builder/rollback", { revision });
                if (result) capture("builder_previous_version_restored");
              }}>Restore previous published version</button>}
            </div>}
          </div>
          <footer>
            {document.undoStack.length > 0 && <button className="builder-undo" disabled={Boolean(busy)} onClick={() => mutate("undo", "/api/builder/undo", { revision })}><RotateCcw /> Undo last change</button>}
            {!approved ? <button className="builder-primary" disabled={Boolean(busy) || Boolean(proposal) || dirty} onClick={approve}>{busy === "approve" ? <Loader2 className="animate-spin" /> : <Check />} {user ? "Review & approve" : "Create free account to publish"}</button> : <button className="builder-primary" disabled={Boolean(busy)} onClick={publish}>{busy === "publish" ? <Loader2 className="animate-spin" /> : null} {state.hasPublished ? "Publish changes" : "Publish free · no card"}</button>}
            {!user && <Link className="builder-sign-in" href="/login?next=/builder">Already have an account? Sign in</Link>}
          </footer>
        </aside>
      </div>
      {testChat && <div className="builder-test-chat" role="dialog" aria-modal="true" aria-label="Test Ask about my work"><div><button className="builder-test-chat-close" onClick={() => setTestChat(false)} aria-label="Close test"><X /></button><p className="builder-panel-kicker">Private test · uses this preview</p><h2>Ask about {document.identity.name.split(" ")[0]}'s work</h2><small>Answers use only information a visitor would be allowed to see. Hidden contacts, private answers and source excerpts are excluded. {user ? "Account tests allow 20" : "Guest tests allow 5"} questions per hour.</small><div className="builder-test-starters">{[
        `What kind of work is ${document.identity.name.split(" ")[0]} strongest at?`,
        document.projects[0] ? `What did ${document.identity.name.split(" ")[0]} contribute to ${document.projects[0].title}?` : "What experience stands out?",
        "What would be useful to discuss in a first conversation?",
      ].map((starter) => <button key={starter} type="button" onClick={() => setTestQuestion(starter)}>{starter}</button>)}</div><div className="builder-test-messages">{testMessages.length === 0 && <p>Choose a starter or ask your own question.</p>}{testMessages.map((message, index) => <div key={index} className={message.role}>{message.role === "assistant" ? renderAnswer(message.content) : message.content}</div>)}</div><form onSubmit={(event) => { event.preventDefault(); void sendTestQuestion(); }}><input value={testQuestion} onChange={(event) => setTestQuestion(event.target.value)} maxLength={500} placeholder="Ask a visitor question" /><button disabled={busy === "test-chat" || !testQuestion.trim()} aria-label="Send question"><Send /></button></form></div></div>}
      {showPlans && <div className="builder-plan-modal"><div><button className="builder-modal-close" onClick={() => setShowPlans(false)} aria-label="Close plans"><X /></button><PaymentGate profileId="current" username={user?.username} hideFree /></div></div>}
    </main>
  );
}
