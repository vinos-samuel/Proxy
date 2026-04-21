import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import {
  Building2, Users, Briefcase, Plus, X, ExternalLink,
  AlertCircle, ArrowLeft, Bot, Send, Loader2,
} from "lucide-react";
import type { JobCompany, JobContact, JobApplication } from "@shared/schema";

type JobContactWithCompany     = JobContact     & { companyName: string | null };
type JobApplicationWithCompany = JobApplication & { companyName: string | null };

type AgentActionType = "outreach" | "interview-prep" | "cover-letter";
type AgentEntityType = "company" | "contact" | "application";

interface AgentState {
  open:        boolean;
  actionType:  AgentActionType;
  entityType:  AgentEntityType;
  entityLabel: string;
  entityData:  Record<string, any>;
  sessionId:   string | null;
  messages:    Array<{ role: "user" | "assistant"; content: string }>;
  isLoading:   boolean;
}

const ACTION_LABELS: Record<AgentActionType, string> = {
  "outreach":       "OUTREACH DRAFT",
  "interview-prep": "INTERVIEW PREP",
  "cover-letter":   "COVER LETTER",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  saved:        { label: "SAVED",        color: "text-blue-800",   bg: "bg-blue-100" },
  applied:      { label: "APPLIED",      color: "text-yellow-800", bg: "bg-yellow-100" },
  interviewing: { label: "INTERVIEWING", color: "text-purple-800", bg: "bg-purple-100" },
  offer:        { label: "OFFER",        color: "text-green-800",  bg: "bg-[#86EFAC]" },
  rejected:     { label: "REJECTED",     color: "text-red-800",    bg: "bg-red-100" },
};

function formatDate(d: string | Date | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

function isPastDue(d: string | Date | null | undefined) {
  if (!d) return false;
  return new Date(d) < new Date();
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputClass   = "w-full border-[2px] border-black bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:border-[#22C55E]";
const btnPrimary   = "bg-[#22C55E] text-black px-4 py-2 font-bold mono text-sm border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#16A34A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none";
const btnSecondary = "bg-white text-black px-4 py-2 font-bold mono text-sm border-[2px] border-black hover:bg-gray-100";
const btnDanger    = "bg-red-500 text-white px-3 py-1.5 font-bold mono text-xs border-[2px] border-black hover:bg-red-600";
const btnAgent     = "bg-black text-[#22C55E] px-2 py-1 font-bold mono text-xs border-[2px] border-black hover:bg-zinc-800 flex items-center gap-1";

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-[#E8E8E3] border-[4px] border-black w-full max-w-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] my-8">
        <div className="flex items-center justify-between border-b-[3px] border-black p-4">
          <h3 className="font-bold text-lg mono uppercase tracking-wide">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 bg-red-500 border-[2px] border-black flex items-center justify-center hover:bg-red-600">
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="mono text-xs font-bold uppercase tracking-wider text-black/60">{label}</label>
      {children}
    </div>
  );
}

// ─── Agent Panel ──────────────────────────────────────────────────────────────
function AgentPanel({
  state,
  onSendMessage,
  onClose,
}: {
  state: AgentState;
  onSendMessage: (msg: string) => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages, state.isLoading]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || state.isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  }

  if (!state.open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#E8E8E3] border-l-[3px] border-black flex flex-col shadow-[-8px_0_0_0_rgba(0,0,0,1)]">

        {/* Header */}
        <div className="bg-black text-white p-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="h-4 w-4 text-[#22C55E] flex-shrink-0" />
              <span className="mono text-xs font-bold text-[#22C55E] uppercase tracking-widest">
                {ACTION_LABELS[state.actionType]}
              </span>
            </div>
            <div className="font-bold text-sm truncate">{state.entityLabel}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-red-500 border-[2px] border-white flex items-center justify-center hover:bg-red-600 flex-shrink-0">
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {state.messages.length === 0 && state.isLoading && (
            <div className="flex items-center gap-2 text-black/50 mono text-sm py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Agent is thinking...</span>
            </div>
          )}

          {state.messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] p-3 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-black text-white border-[2px] border-black"
                  : "bg-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {state.isLoading && state.messages.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-white border-[2px] border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Loader2 className="h-4 w-4 animate-spin text-black/50" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t-[3px] border-black p-4 bg-[#D1D1CC]">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              className="flex-1 border-[2px] border-black bg-white px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask the agent to refine, adjust tone, try again..."
              disabled={state.isLoading}
            />
            <button
              type="submit"
              disabled={state.isLoading || !input.trim()}
              className="bg-[#22C55E] border-[2px] border-black px-3 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#16A34A] disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="mono text-xs text-black/40 mt-2 text-center">
            Copy agent output directly into LinkedIn, email, or your notes
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Companies Tab ─────────────────────────────────────────────────────────────
function CompaniesTab({ onOpenAgent }: { onOpenAgent: (a: AgentActionType, t: AgentEntityType, l: string, d: Record<string, any>) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<JobCompany | null>(null);
  const [form, setForm] = useState({ name: "", website: "", industry: "", notes: "" });

  const { data: companies = [], isLoading } = useQuery<JobCompany[]>({
    queryKey: ["/api/crm/companies"],
    queryFn: async () => {
      const res = await fetch("/api/crm/companies", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/crm/companies", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] }); setShowForm(false); setForm({ name: "", website: "", industry: "", notes: "" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof form }) => apiRequest("PATCH", `/api/crm/companies/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/crm/companies/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] }),
  });

  function openEdit(c: JobCompany) {
    setEditing(c);
    setForm({ name: c.name, website: c.website || "", industry: c.industry || "", notes: c.notes || "" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="mono text-xs text-black/50 uppercase tracking-widest">{companies.length} companies tracked</div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", website: "", industry: "", notes: "" }); }} className={btnPrimary}>
          <Plus className="h-4 w-4 inline mr-1" /> ADD COMPANY
        </button>
      </div>

      {isLoading && <div className="mono text-sm text-black/50 text-center py-12">Loading...</div>}

      {!isLoading && companies.length === 0 && (
        <div className="border-[3px] border-dashed border-black/30 p-12 text-center">
          <Building2 className="h-10 w-10 mx-auto mb-3 text-black/30" />
          <div className="font-bold text-black/50 mb-1">No companies yet</div>
          <div className="mono text-xs text-black/40">Add companies you're targeting in your job search</div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {companies.map(c => (
          <div key={c.id} className="border-[3px] border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0 flex-1">
                <div className="font-bold text-lg truncate">{c.name}</div>
                {c.industry && <div className="mono text-xs text-black/50 uppercase">{c.industry}</div>}
              </div>
              <div className="flex gap-2 ml-3 flex-shrink-0">
                <button
                  onClick={() => onOpenAgent("outreach", "company", c.name, { name: c.name, industry: c.industry, notes: c.notes, website: c.website })}
                  className={btnAgent}
                >
                  <Bot className="h-3 w-3" /> AGENT
                </button>
                <button onClick={() => openEdit(c)} className={btnSecondary} style={{ padding: "4px 10px" }}>EDIT</button>
                <button onClick={() => deleteMutation.mutate(c.id)} className={btnDanger}>DEL</button>
              </div>
            </div>
            {c.website && (
              <a href={c.website.startsWith("http") ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 mono text-xs text-black/50 hover:text-black mb-2">
                <ExternalLink className="h-3 w-3" /> {c.website}
              </a>
            )}
            {c.notes && <div className="text-sm text-black/70 mt-2 border-t border-black/10 pt-2">{c.notes}</div>}
          </div>
        ))}
      </div>

      {(showForm || editing) && (
        <Modal title={editing ? "EDIT COMPANY" : "ADD COMPANY"} onClose={() => { setShowForm(false); setEditing(null); }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Company Name *">
              <input className={inputClass} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Google, Meta, Grab" />
            </FormField>
            <FormField label="Website">
              <input className={inputClass} value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="e.g. google.com" />
            </FormField>
            <FormField label="Industry">
              <input className={inputClass} value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} placeholder="e.g. Tech, Finance, Healthcare" />
            </FormField>
            <FormField label="Notes">
              <textarea className={inputClass} rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Why this company? Any contacts, context..." />
            </FormField>
            <div className="flex gap-3 pt-2">
              <button type="submit" className={btnPrimary} disabled={isPending}>{isPending ? "SAVING..." : editing ? "SAVE CHANGES" : "ADD COMPANY"}</button>
              <button type="button" className={btnSecondary} onClick={() => { setShowForm(false); setEditing(null); }}>CANCEL</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Contacts Tab ──────────────────────────────────────────────────────────────
function ContactsTab({ onOpenAgent }: { onOpenAgent: (a: AgentActionType, t: AgentEntityType, l: string, d: Record<string, any>) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<JobContactWithCompany | null>(null);
  const emptyForm = { name: "", title: "", companyId: "", email: "", linkedinUrl: "", lastOutreachDate: "", responseReceived: false, responseNotes: "", followUpDate: "", notes: "" };
  const [form, setForm] = useState(emptyForm);

  const { data: contacts = [], isLoading } = useQuery<JobContactWithCompany[]>({
    queryKey: ["/api/crm/contacts"],
    queryFn: async () => {
      const res = await fetch("/api/crm/contacts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: companies = [] } = useQuery<JobCompany[]>({
    queryKey: ["/api/crm/companies"],
    queryFn: async () => {
      const res = await fetch("/api/crm/companies", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/crm/contacts", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/crm/contacts"] }); setShowForm(false); setForm(emptyForm); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof form }) => apiRequest("PATCH", `/api/crm/contacts/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/crm/contacts"] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/crm/contacts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/crm/contacts"] }),
  });

  function openEdit(c: JobContactWithCompany) {
    setEditing(c);
    setForm({
      name: c.name, title: c.title || "", companyId: c.companyId || "", email: c.email || "",
      linkedinUrl: c.linkedinUrl || "",
      lastOutreachDate: c.lastOutreachDate ? new Date(c.lastOutreachDate).toISOString().split("T")[0] : "",
      responseReceived: c.responseReceived || false, responseNotes: c.responseNotes || "",
      followUpDate: c.followUpDate ? new Date(c.followUpDate).toISOString().split("T")[0] : "",
      notes: c.notes || "",
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="mono text-xs text-black/50 uppercase tracking-widest">{contacts.length} contacts tracked</div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }} className={btnPrimary}>
          <Plus className="h-4 w-4 inline mr-1" /> ADD CONTACT
        </button>
      </div>

      {isLoading && <div className="mono text-sm text-black/50 text-center py-12">Loading...</div>}

      {!isLoading && contacts.length === 0 && (
        <div className="border-[3px] border-dashed border-black/30 p-12 text-center">
          <Users className="h-10 w-10 mx-auto mb-3 text-black/30" />
          <div className="font-bold text-black/50 mb-1">No contacts yet</div>
          <div className="mono text-xs text-black/40">Track recruiters, hiring managers, and network connections</div>
        </div>
      )}

      <div className="space-y-3">
        {contacts.map(c => (
          <div key={c.id} className="border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold">{c.name}</span>
                  {c.title && <span className="mono text-xs text-black/50">{c.title}</span>}
                  {c.companyName && <span className="mono text-xs bg-black text-white px-2 py-0.5">{c.companyName}</span>}
                </div>
                <div className="flex flex-wrap gap-4 mt-2 mono text-xs text-black/50">
                  {c.lastOutreachDate && <span>REACHED OUT: {formatDate(c.lastOutreachDate)}</span>}
                  {c.lastOutreachDate && (
                    <span className={c.responseReceived ? "text-green-700 font-bold" : "text-orange-600 font-bold"}>
                      {c.responseReceived ? "✓ RESPONDED" : "NO RESPONSE"}
                    </span>
                  )}
                  {c.followUpDate && (
                    <span className={isPastDue(c.followUpDate) ? "text-red-600 font-bold" : ""}>
                      FOLLOW UP: {formatDate(c.followUpDate)}
                    </span>
                  )}
                </div>
                {c.notes && <div className="text-sm text-black/60 mt-1">{c.notes}</div>}
              </div>
              <div className="flex gap-2 ml-4 flex-shrink-0 flex-wrap justify-end">
                <button
                  onClick={() => onOpenAgent("outreach", "contact", `${c.name}${c.companyName ? ` @ ${c.companyName}` : ""}`, { name: c.name, title: c.title, companyName: c.companyName, notes: c.notes })}
                  className={btnAgent}
                >
                  <Bot className="h-3 w-3" /> AGENT
                </button>
                {c.linkedinUrl && (
                  <a href={c.linkedinUrl.startsWith("http") ? c.linkedinUrl : `https://${c.linkedinUrl}`} target="_blank" rel="noreferrer" className={btnSecondary} style={{ padding: "4px 10px" }}>LI</a>
                )}
                <button onClick={() => openEdit(c)} className={btnSecondary} style={{ padding: "4px 10px" }}>EDIT</button>
                <button onClick={() => deleteMutation.mutate(c.id)} className={btnDanger}>DEL</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(showForm || editing) && (
        <Modal title={editing ? "EDIT CONTACT" : "ADD CONTACT"} onClose={() => { setShowForm(false); setEditing(null); }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Name *">
              <input className={inputClass} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Sarah Chen" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Title">
                <input className={inputClass} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Recruiter" />
              </FormField>
              <FormField label="Company">
                <select className={inputClass} value={form.companyId} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}>
                  <option value="">Select company</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Email">
                <input className={inputClass} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="name@company.com" />
              </FormField>
              <FormField label="LinkedIn URL">
                <input className={inputClass} value={form.linkedinUrl} onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))} placeholder="linkedin.com/in/..." />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Last Outreach Date">
                <input className={inputClass} type="date" value={form.lastOutreachDate} onChange={e => setForm(f => ({ ...f, lastOutreachDate: e.target.value }))} />
              </FormField>
              <FormField label="Follow-up Date">
                <input className={inputClass} type="date" value={form.followUpDate} onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))} />
              </FormField>
            </div>
            <FormField label="Response Received?">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.responseReceived} onChange={e => setForm(f => ({ ...f, responseReceived: e.target.checked }))} className="w-4 h-4" />
                <span className="mono text-sm">Yes, they responded</span>
              </label>
            </FormField>
            {form.responseReceived && (
              <FormField label="Response Notes">
                <textarea className={inputClass} rows={2} value={form.responseNotes} onChange={e => setForm(f => ({ ...f, responseNotes: e.target.value }))} placeholder="What did they say?" />
              </FormField>
            )}
            <FormField label="Notes">
              <textarea className={inputClass} rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Context, impressions, next steps..." />
            </FormField>
            <div className="flex gap-3 pt-2">
              <button type="submit" className={btnPrimary} disabled={isPending}>{isPending ? "SAVING..." : editing ? "SAVE CHANGES" : "ADD CONTACT"}</button>
              <button type="button" className={btnSecondary} onClick={() => { setShowForm(false); setEditing(null); }}>CANCEL</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Applications Tab ──────────────────────────────────────────────────────────
function ApplicationsTab({ onOpenAgent }: { onOpenAgent: (a: AgentActionType, t: AgentEntityType, l: string, d: Record<string, any>) => void }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<JobApplicationWithCompany | null>(null);
  const emptyForm = { jobTitle: "", companyId: "", jobUrl: "", status: "saved", salaryMin: "", salaryMax: "", salaryCurrency: "USD", notes: "", appliedAt: "", followUpDate: "" };
  const [form, setForm] = useState(emptyForm);

  const { data: applications = [], isLoading } = useQuery<JobApplicationWithCompany[]>({
    queryKey: ["/api/crm/applications"],
    queryFn: async () => {
      const res = await fetch("/api/crm/applications", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: companies = [] } = useQuery<JobCompany[]>({
    queryKey: ["/api/crm/companies"],
    queryFn: async () => {
      const res = await fetch("/api/crm/companies", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/crm/applications", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/crm/applications"] }); setShowForm(false); setForm(emptyForm); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof form> }) => apiRequest("PATCH", `/api/crm/applications/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/crm/applications"] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/crm/applications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/crm/applications"] }),
  });

  function openEdit(a: JobApplicationWithCompany) {
    setEditing(a);
    setForm({
      jobTitle: a.jobTitle, companyId: a.companyId || "", jobUrl: a.jobUrl || "", status: a.status,
      salaryMin: a.salaryMin?.toString() || "", salaryMax: a.salaryMax?.toString() || "",
      salaryCurrency: a.salaryCurrency || "USD", notes: a.notes || "",
      appliedAt: a.appliedAt ? new Date(a.appliedAt).toISOString().split("T")[0] : "",
      followUpDate: a.followUpDate ? new Date(a.followUpDate).toISOString().split("T")[0] : "",
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const filtered = statusFilter === "all" ? applications : applications.filter(a => a.status === statusFilter);
  const statusCounts = applications.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div>
      {/* Status summary bar */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className={`border-[2px] border-black p-3 text-center ${cfg.bg}`}>
            <div className="font-bold text-xl">{statusCounts[key] || 0}</div>
            <div className={`mono text-xs font-bold ${cfg.color}`}>{cfg.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-1 flex-wrap">
          {["all", ...Object.keys(STATUS_CONFIG)].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`mono text-xs px-3 py-1.5 border-[2px] border-black font-bold uppercase ${statusFilter === s ? "bg-black text-white" : "bg-white hover:bg-gray-100"}`}>
              {s === "all" ? "ALL" : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }} className={btnPrimary}>
          <Plus className="h-4 w-4 inline mr-1" /> ADD APPLICATION
        </button>
      </div>

      {isLoading && <div className="mono text-sm text-black/50 text-center py-12">Loading...</div>}

      {!isLoading && filtered.length === 0 && (
        <div className="border-[3px] border-dashed border-black/30 p-12 text-center">
          <Briefcase className="h-10 w-10 mx-auto mb-3 text-black/30" />
          <div className="font-bold text-black/50 mb-1">{statusFilter === "all" ? "No applications yet" : `No ${STATUS_CONFIG[statusFilter]?.label} applications`}</div>
          <div className="mono text-xs text-black/40">Track every opportunity — saved leads, active applications, interviews</div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(a => {
          const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.saved;
          const entityLabel = `${a.jobTitle}${a.companyName ? ` @ ${a.companyName}` : ""}`;
          const entityData  = { jobTitle: a.jobTitle, companyName: a.companyName, notes: a.notes, status: a.status, jobUrl: a.jobUrl };
          return (
            <div key={a.id} className="border-[3px] border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <span className="font-bold text-lg">{a.jobTitle}</span>
                      {a.companyName && <span className="mono text-xs bg-black text-white px-2 py-0.5">{a.companyName}</span>}
                      <span className={`mono text-xs font-bold px-2 py-0.5 border border-black ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 mono text-xs text-black/50">
                      {(a.salaryMin || a.salaryMax) && (
                        <span>{a.salaryCurrency} {a.salaryMin ? a.salaryMin.toLocaleString() : "?"} – {a.salaryMax ? a.salaryMax.toLocaleString() : "?"}</span>
                      )}
                      {a.appliedAt && <span>APPLIED: {formatDate(a.appliedAt)}</span>}
                      {a.followUpDate && (
                        <span className={isPastDue(a.followUpDate) ? "text-red-600 font-bold" : ""}>
                          FOLLOW UP: {formatDate(a.followUpDate)}
                        </span>
                      )}
                      {a.jobUrl && (
                        <a href={a.jobUrl.startsWith("http") ? a.jobUrl : `https://${a.jobUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-black">
                          <ExternalLink className="h-3 w-3" /> JOB LINK
                        </a>
                      )}
                    </div>
                    {a.notes && <div className="text-sm text-black/60 mt-2">{a.notes}</div>}
                  </div>
                  <div className="flex gap-2 ml-2 flex-shrink-0 flex-wrap justify-end">
                    {/* Agent action buttons */}
                    <button
                      onClick={() => onOpenAgent("interview-prep", "application", entityLabel, entityData)}
                      className={btnAgent}
                      title="Interview prep using your Twin profile"
                    >
                      <Bot className="h-3 w-3" /> INTERVIEW
                    </button>
                    <button
                      onClick={() => onOpenAgent("cover-letter", "application", entityLabel, entityData)}
                      className={btnAgent}
                      title="Generate a tailored cover letter"
                    >
                      <Bot className="h-3 w-3" /> COVER LTR
                    </button>
                    <button onClick={() => openEdit(a)} className={btnSecondary} style={{ padding: "4px 10px" }}>EDIT</button>
                    <button onClick={() => deleteMutation.mutate(a.id)} className={btnDanger}>DEL</button>
                  </div>
                </div>

                {/* Quick status update */}
                <div className="flex gap-1 mt-3 pt-3 border-t border-black/10 flex-wrap">
                  <span className="mono text-xs text-black/40 self-center mr-1">MOVE TO →</span>
                  {Object.entries(STATUS_CONFIG).filter(([k]) => k !== a.status).map(([key, cfg]) => (
                    <button key={key} onClick={() => updateMutation.mutate({ id: a.id, data: { status: key } })}
                      className={`mono text-xs px-2 py-1 border border-black ${cfg.bg} ${cfg.color} hover:opacity-80`}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(showForm || editing) && (
        <Modal title={editing ? "EDIT APPLICATION" : "ADD APPLICATION"} onClose={() => { setShowForm(false); setEditing(null); }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Job Title *">
              <input className={inputClass} value={form.jobTitle} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))} required placeholder="e.g. Head of HR Operations" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Company">
                <select className={inputClass} value={form.companyId} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}>
                  <option value="">Select company</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FormField>
              <FormField label="Status">
                <select className={inputClass} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
                </select>
              </FormField>
            </div>
            <FormField label="Job URL">
              <input className={inputClass} value={form.jobUrl} onChange={e => setForm(f => ({ ...f, jobUrl: e.target.value }))} placeholder="https://..." />
            </FormField>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Salary Min">
                <input className={inputClass} type="number" value={form.salaryMin} onChange={e => setForm(f => ({ ...f, salaryMin: e.target.value }))} placeholder="80000" />
              </FormField>
              <FormField label="Salary Max">
                <input className={inputClass} type="number" value={form.salaryMax} onChange={e => setForm(f => ({ ...f, salaryMax: e.target.value }))} placeholder="120000" />
              </FormField>
              <FormField label="Currency">
                <select className={inputClass} value={form.salaryCurrency} onChange={e => setForm(f => ({ ...f, salaryCurrency: e.target.value }))}>
                  {["USD", "SGD", "AUD", "GBP", "EUR", "HKD", "MYR"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Applied Date">
                <input className={inputClass} type="date" value={form.appliedAt} onChange={e => setForm(f => ({ ...f, appliedAt: e.target.value }))} />
              </FormField>
              <FormField label="Follow-up Date">
                <input className={inputClass} type="date" value={form.followUpDate} onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))} />
              </FormField>
            </div>
            <FormField label="Notes">
              <textarea className={inputClass} rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Recruiter name, interview stage, what you know about the role..." />
            </FormField>
            <div className="flex gap-3 pt-2">
              <button type="submit" className={btnPrimary} disabled={isPending}>{isPending ? "SAVING..." : editing ? "SAVE CHANGES" : "ADD APPLICATION"}</button>
              <button type="button" className={btnSecondary} onClick={() => { setShowForm(false); setEditing(null); }}>CANCEL</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function JobSearchPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"applications" | "companies" | "contacts">("applications");

  const [agentState, setAgentState] = useState<AgentState>({
    open: false, actionType: "outreach", entityType: "company",
    entityLabel: "", entityData: {}, sessionId: null, messages: [], isLoading: false,
  });

  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const isPro = profile?.tier === "pro" || profile?.paymentStatus === "paid";

  async function openAgent(
    actionType: AgentActionType,
    entityType: AgentEntityType,
    entityLabel: string,
    entityData: Record<string, any>
  ) {
    setAgentState({ open: true, actionType, entityType, entityLabel, entityData, sessionId: null, messages: [], isLoading: true });
    try {
      const res  = await apiRequest("POST", "/api/job-agent/start", { actionType, entityType, entityData });
      const body = await res.json();
      setAgentState(s => ({
        ...s,
        sessionId: body.sessionId,
        messages: [{ role: "assistant", content: body.message }],
        isLoading: false,
      }));
    } catch (err) {
      // Extract the real server error message for diagnosis
      let display = "Something went wrong starting the agent.";
      if (err instanceof Error) {
        const match = err.message.match(/"message":"([^"]+)"/);
        display = match ? match[1] : err.message;
      }
      setAgentState(s => ({ ...s, isLoading: false, messages: [{ role: "assistant", content: `Error: ${display}` }] }));
    }
  }

  async function sendAgentMessage(message: string) {
    if (!agentState.sessionId) return;
    setAgentState(s => ({ ...s, messages: [...s.messages, { role: "user", content: message }], isLoading: true }));
    try {
      const res  = await apiRequest("POST", "/api/job-agent/message", { sessionId: agentState.sessionId, message });
      const body = await res.json();
      setAgentState(s => ({ ...s, messages: [...s.messages, { role: "assistant", content: body.message }], isLoading: false }));
    } catch (err) {
      setAgentState(s => ({ ...s, isLoading: false }));
    }
  }

  const tabs = [
    { key: "applications", label: "Applications", icon: Briefcase },
    { key: "companies",    label: "Companies",    icon: Building2 },
    { key: "contacts",     label: "Contacts",     icon: Users },
  ] as const;

  return (
    <div className="min-h-screen bg-[#E8E8E3] text-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Nav */}
      <nav className="border-b-[3px] border-black bg-[#D1D1CC] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <span className="flex items-center gap-2 mono text-sm font-bold text-black/60 hover:text-black cursor-pointer">
                <ArrowLeft className="h-4 w-4" /> DASHBOARD
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#22C55E] border-[2px] border-black flex items-center justify-center font-bold text-black">J</div>
              <span className="font-bold text-xl tracking-tight">JOB SEARCH</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 mono text-xs font-bold text-[#22C55E] bg-black px-3 py-1.5 border-[2px] border-black">
              <Bot className="h-3 w-3" /> AGENT ACTIVE
            </div>
            <div className="mono text-xs text-black/50 uppercase tracking-widest">{user?.name}</div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Pro gate */}
        {!isPro && (
          <div className="border-[4px] border-black bg-[#FDE68A] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center max-w-xl mx-auto mt-12">
            <AlertCircle className="h-10 w-10 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">PRO FEATURE</h2>
            <p className="text-black/70 mb-6">The Job Search CRM is available to Pro members. Upgrade to track companies, contacts, and applications — all connected to your Twin.</p>
            <button onClick={() => navigate("/dashboard")} className={btnPrimary + " text-base px-8 py-3"}>
              UPGRADE TO PRO → $49
            </button>
          </div>
        )}

        {isPro && (
          <>
            {/* Tab navigation */}
            <div className="flex gap-0 mb-8 border-[3px] border-black w-fit">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-6 py-3 font-bold mono text-sm uppercase border-r-[3px] border-black last:border-r-0 ${
                      activeTab === tab.key ? "bg-black text-white" : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === "applications" && <ApplicationsTab onOpenAgent={openAgent} />}
            {activeTab === "companies"    && <CompaniesTab    onOpenAgent={openAgent} />}
            {activeTab === "contacts"     && <ContactsTab     onOpenAgent={openAgent} />}
          </>
        )}
      </div>

      {/* Agent Panel */}
      <AgentPanel
        state={agentState}
        onSendMessage={sendAgentMessage}
        onClose={() => setAgentState(s => ({ ...s, open: false }))}
      />
    </div>
  );
}
