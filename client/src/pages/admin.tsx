import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Terminal, LogOut, Users, Globe, DollarSign, ArrowLeft,
  RefreshCw, Loader2, ExternalLink, Trash2, Gift, CheckCircle, XCircle,
  FileText, Plus, Eye, EyeOff, Pencil, X, Mail, Send
} from "lucide-react";
import type { Customer, TwinProfile, BlogPost } from "@shared/schema";

interface AdminData {
  customers: (Customer & { profile?: TwinProfile | null; questionCount: number })[];
  stats: {
    totalCustomers: number;
    publishedProfiles: number;
    totalRevenue: number;
    paidCustomers: number;
  };
}

type FilterTab = "all" | "none" | "draft" | "ready" | "published" | "paid";
type AdminTab = "customers" | "blog" | "outreach";

function ConfirmButton({
  onConfirm,
  isPending,
  children,
  confirmLabel = "Confirm?",
  icon,
  variant = "outline",
}: {
  onConfirm: () => void;
  isPending: boolean;
  children: React.ReactNode;
  confirmLabel?: string;
  icon?: React.ReactNode;
  variant?: "outline" | "destructive";
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={variant === "destructive" ? "destructive" : "default"}
          onClick={() => { onConfirm(); setConfirming(false); }}
          disabled={isPending}
          className="h-7 text-xs px-2"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : confirmLabel}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} className="h-7 text-xs px-2">
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setConfirming(true)}
      disabled={isPending}
      className="h-7 text-xs px-2"
    >
      {icon}
      {children}
    </Button>
  );
}

// ─── Blog Editor Form ─────────────────────────────────────────────────────────

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  metaDescription: string;
  heroImageUrl: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function BlogEditor({
  initialData,
  onSave,
  onCancel,
  isSaving,
}: {
  initialData?: Partial<BlogFormData>;
  onSave: (data: BlogFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<BlogFormData>({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    excerpt: initialData?.excerpt || "",
    content: initialData?.content || "",
    category: initialData?.category || "general",
    metaDescription: initialData?.metaDescription || "",
    heroImageUrl: initialData?.heroImageUrl || "",
  });
  const [showPreview, setShowPreview] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData?.slug);

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugManuallyEdited ? prev.slug : slugify(title),
    }));
  };

  const handleSlugChange = (slug: string) => {
    setSlugManuallyEdited(true);
    setForm((prev) => ({ ...prev, slug }));
  };

  const renderPreview = (markdown: string): string => {
    const blocks = markdown.split("\n\n");
    const html: string[] = [];
    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith("## ")) {
        const text = trimmed.slice(3).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        html.push(`<h2 style="font-size:1.5rem;font-weight:bold;margin:1.5rem 0 0.5rem;">${text}</h2>`);
        continue;
      }
      const lines = trimmed.split("\n");
      if (lines.every((l) => l.trim().startsWith("- "))) {
        const items = lines.map((l) => `<li>${l.trim().slice(2)}</li>`).join("");
        html.push(`<ul style="list-style:disc;padding-left:1.5rem;">${items}</ul>`);
        continue;
      }
      let p = trimmed.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      p = p.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#22C55E;">$1</a>');
      html.push(`<p style="margin-bottom:1rem;line-height:1.7;">${p}</p>`);
    }
    return html.join("");
  };

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {initialData?.title ? "Edit Post" : "New Blog Post"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Title</label>
            <Input
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Your blog post title"
              className="text-lg font-semibold"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Slug</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/blog/</span>
              <Input
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="auto-generated-from-title"
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Category (multi-select) */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Categories</label>
            <div className="flex flex-wrap gap-3">
              {[
                { value: "general", label: "General" },
                { value: "candidates", label: "Candidates" },
                { value: "recruiters", label: "Recruiters" },
                { value: "market-intelligence", label: "Market Intelligence" },
                { value: "future-of-employment", label: "Future of Employment" },
              ].map((cat) => {
                const selected = form.category.split(",").filter(Boolean).includes(cat.value);
                return (
                  <label key={cat.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => {
                        const current = form.category.split(",").filter(Boolean);
                        const updated = e.target.checked
                          ? [...current, cat.value]
                          : current.filter((c) => c !== cat.value);
                        setForm((prev) => ({ ...prev, category: updated.join(",") || "general" }));
                      }}
                      className="accent-[#22C55E]"
                    />
                    {cat.label}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Excerpt</label>
            <Textarea
              value={form.excerpt}
              onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Short summary for blog listing cards (1-2 sentences)"
              rows={2}
            />
          </div>

          {/* Meta Description */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">
              SEO Meta Description
              <span className="ml-2 text-xs text-muted-foreground/60">({form.metaDescription.length}/160)</span>
            </label>
            <Textarea
              value={form.metaDescription}
              onChange={(e) => setForm((prev) => ({ ...prev, metaDescription: e.target.value }))}
              placeholder="Appears in Google search results (max 160 chars)"
              rows={2}
              maxLength={160}
            />
          </div>

          {/* Hero Image URL */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Hero Image URL</label>
            <Input
              value={form.heroImageUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, heroImageUrl: e.target.value }))}
              placeholder="https://... (paste image URL)"
            />
            {form.heroImageUrl && (
              <div className="mt-2 border rounded-md overflow-hidden max-h-40">
                <img src={form.heroImageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-muted-foreground">Content (Markdown)</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="h-7 text-xs"
              >
                {showPreview ? <><Pencil className="h-3 w-3 mr-1" /> Edit</> : <><Eye className="h-3 w-3 mr-1" /> Preview</>}
              </Button>
            </div>
            {showPreview ? (
              <div
                className="border rounded-md p-4 min-h-[300px] prose prose-sm max-w-none bg-white text-black"
                dangerouslySetInnerHTML={{ __html: renderPreview(form.content) }}
              />
            ) : (
              <Textarea
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Write your blog post in markdown...

## Section Heading

Paragraph text with **bold** and [links](https://example.com).

- Bullet point one
- Bullet point two"
                rows={16}
                className="font-mono text-sm"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              onClick={() => onSave(form)}
              disabled={isSaving || !form.title.trim() || !form.content.trim()}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {initialData?.title ? "Save Changes" : "Create Post"}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Blog Management Tab ──────────────────────────────────────────────────────

function BlogTab() {
  const { toast } = useToast();
  const [editorMode, setEditorMode] = useState<"list" | "create" | "edit">("list");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/admin/blog"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: BlogFormData) => {
      await apiRequest("POST", "/api/admin/blog", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      setEditorMode("list");
      toast({ title: "Post created" });
    },
    onError: (err: any) => {
      toast({ title: "Create failed", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BlogFormData }) => {
      await apiRequest("PATCH", `/api/admin/blog/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      setEditorMode("list");
      setEditingPost(null);
      toast({ title: "Post updated" });
    },
    onError: (err: any) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/admin/blog/${id}/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      toast({ title: "Post published" });
    },
    onError: (err: any) => {
      toast({ title: "Publish failed", description: err.message, variant: "destructive" });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/admin/blog/${id}/unpublish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      toast({ title: "Post unpublished" });
    },
    onError: (err: any) => {
      toast({ title: "Unpublish failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/blog/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      toast({ title: "Post deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  // Show editor
  if (editorMode === "create") {
    return (
      <BlogEditor
        onSave={(data) => createMutation.mutate(data)}
        onCancel={() => setEditorMode("list")}
        isSaving={createMutation.isPending}
      />
    );
  }

  if (editorMode === "edit" && editingPost) {
    return (
      <BlogEditor
        initialData={{
          title: editingPost.title,
          slug: editingPost.slug,
          excerpt: editingPost.excerpt || "",
          content: editingPost.content,
          category: editingPost.category || "general",
          metaDescription: editingPost.metaDescription || "",
          heroImageUrl: editingPost.heroImageUrl || "",
        }}
        onSave={(data) => updateMutation.mutate({ id: editingPost.id, data })}
        onCancel={() => { setEditorMode("list"); setEditingPost(null); }}
        isSaving={updateMutation.isPending}
      />
    );
  }

  // Blog list view
  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-xl font-semibold">Blog Posts</h2>
          <Button onClick={() => setEditorMode("create")} size="sm">
            <Plus className="h-4 w-4 mr-1" /> New Post
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !posts || posts.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <FileText className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>No blog posts yet. Create your first one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Title</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Category</TableHead>
                  <TableHead className="whitespace-nowrap">Published</TableHead>
                  <TableHead className="whitespace-nowrap">Views</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium max-w-[250px]">
                      <div className="truncate">{post.title}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate">/blog/{post.slug}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={post.status === "published" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground capitalize">{post.category || "general"}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {post.viewCount || 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        {/* View (if published) */}
                        {post.status === "published" && (
                          <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                              <ExternalLink className="h-3 w-3 mr-1" /> View
                            </Button>
                          </a>
                        )}

                        {/* Edit */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => { setEditingPost(post); setEditorMode("edit"); }}
                        >
                          <Pencil className="h-3 w-3 mr-1" /> Edit
                        </Button>

                        {/* Publish / Unpublish */}
                        {post.status === "draft" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => publishMutation.mutate(post.id)}
                            disabled={publishMutation.isPending}
                          >
                            {publishMutation.isPending
                              ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              : <Eye className="h-3 w-3 mr-1" />}
                            Publish
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => unpublishMutation.mutate(post.id)}
                            disabled={unpublishMutation.isPending}
                          >
                            {unpublishMutation.isPending
                              ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              : <EyeOff className="h-3 w-3 mr-1" />}
                            Unpublish
                          </Button>
                        )}

                        {/* Delete */}
                        <ConfirmButton
                          onConfirm={() => deleteMutation.mutate(post.id)}
                          isPending={deleteMutation.isPending}
                          confirmLabel="Delete!"
                          variant="destructive"
                          icon={<Trash2 className="h-3 w-3 mr-1" />}
                        >
                          Delete
                        </ConfirmButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Outreach Tab ─────────────────────────────────────────────────────────────

function OutreachTab({ customers }: { customers: (Customer & { profile?: TwinProfile | null })[] }) {
  const { toast } = useToast();
  const [audience, setAudience] = useState<"all" | "free" | "paid" | "none" | "draft" | "ready" | "published_free" | "published_paid">("free");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [confirming, setConfirming] = useState(false);

  const recipientCount = customers.filter((c) => {
    if (!c.emailVerified) return false;
    if (c.isAdmin) return false;
    const ps = c.profile?.status;
    const isPaid = c.subscriptionStatus === "paid";
    if (audience === "all")            return true;
    if (audience === "free")           return !isPaid;
    if (audience === "paid")           return isPaid;
    if (audience === "none")           return !ps || ps === "none";
    if (audience === "draft")          return ps === "draft";
    if (audience === "ready")          return ps === "ready";
    if (audience === "published_free") return ps === "published" && !isPaid;
    if (audience === "published_paid") return ps === "published" && isPaid;
    return false;
  }).length;

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/broadcast", { audience, subject, body });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: `Sent to ${data.sent} recipient${data.sent !== 1 ? "s" : ""}`, description: data.errors?.length ? `${data.errors.length} failed` : undefined });
      setConfirming(false);
    },
    onError: (err: any) => {
      toast({ title: "Broadcast failed", description: err.message, variant: "destructive" });
      setConfirming(false);
    },
  });

  // Count verified recipients per segment
  const countFor = (seg: typeof audience) => customers.filter((c) => {
    if (!c.emailVerified) return false;
    if (c.isAdmin) return false;
    const ps = c.profile?.status;
    const isPaid = c.subscriptionStatus === "paid";
    if (seg === "all")            return true;
    if (seg === "free")           return !isPaid;
    if (seg === "paid")           return isPaid;
    if (seg === "none")           return !ps || ps === "none";
    if (seg === "draft")          return ps === "draft";
    if (seg === "ready")          return ps === "ready";
    if (seg === "published_free") return ps === "published" && !isPaid;
    if (seg === "published_paid") return ps === "published" && isPaid;
    return false;
  }).length;

  const audienceOptions: { value: typeof audience; label: string; description: string }[] = [
    { value: "none",           label: "Never started",     description: "Signed up but never touched questionnaire" },
    { value: "draft",          label: "Draft",             description: "Started questionnaire, didn't finish" },
    { value: "ready",          label: "Ready (unpublished)", description: "Profile built, haven't gone live" },
    { value: "published_free", label: "Published (free)",  description: "Live on free tier — upgrade targets" },
    { value: "published_paid", label: "Published (paid)",  description: "Paying customers who are live" },
    { value: "free",           label: "All free",          description: "Everyone who hasn't paid" },
    { value: "paid",           label: "All paid",          description: "All paying customers" },
    { value: "all",            label: "Everyone",          description: "All verified users" },
  ];

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Broadcast Email</h2>
        </div>

        <div className="space-y-6 max-w-2xl">
          {/* Audience */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Audience</label>
            <div className="grid grid-cols-4 gap-2">
              {audienceOptions.map((opt) => {
                const n = countFor(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => setAudience(opt.value)}
                    className={`border rounded-lg p-3 text-left transition-colors ${
                      audience === opt.value
                        ? "border-primary bg-primary/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="font-medium text-sm">{opt.label}</div>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${n > 0 ? "bg-primary/20 text-primary" : "bg-white/10 text-muted-foreground"}`}>{n}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{opt.description}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>{recipientCount}</strong> recipient{recipientCount !== 1 ? "s" : ""} will receive this email.
              {" "}<span className="opacity-60">Numbers above show verified accounts only — unverified signups are excluded.</span>
            </p>
          </div>

          {/* Subject */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Your Proxy profile just got more valuable"
              className="bg-white/5 border-white/10"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Body <span className="text-xs opacity-50 ml-1">(plain text — double line break = new paragraph)</span>
            </label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={"A few things changed on Proxy since you signed up...\n\nThe price dropped. Pro is now $49.\n\nWe also launched something new: Deepen Your Twin."}
              rows={12}
              className="bg-white/5 border-white/10 font-mono text-sm"
            />
          </div>

          {/* Send */}
          <div className="flex items-center gap-3">
            {!confirming ? (
              <Button
                onClick={() => setConfirming(true)}
                disabled={!subject.trim() || !body.trim() || recipientCount === 0}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Send to {recipientCount} user{recipientCount !== 1 ? "s" : ""}
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => broadcastMutation.mutate()}
                  disabled={broadcastMutation.isPending}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  {broadcastMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Confirm — send now
                </Button>
                <Button variant="ghost" onClick={() => setConfirming(false)} disabled={broadcastMutation.isPending}>
                  Cancel
                </Button>
              </>
            )}
          </div>

          {confirming && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                This will send <strong>{recipientCount} real emails</strong> immediately. Double-check your subject and body above.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Email Modal ──────────────────────────────────────────────────────────────

function EmailModal({
  customer,
  onClose,
}: {
  customer: Customer & { profile?: TwinProfile | null };
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/send-email/${customer.id}`, { subject, body });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to send");
      }
    },
    onSuccess: () => {
      toast({ title: "Email sent", description: `Sent to ${customer.email}` });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background border border-white/10 rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <p className="font-semibold">Email {customer.name}</p>
            <p className="text-xs text-muted-foreground">{customer.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
            <Input
              placeholder="Subject line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Body</label>
            <Textarea
              placeholder="Write your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/10">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending || !subject.trim() || !body.trim()}
          >
            {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [activeTab, setActiveTab] = useState<AdminTab>("customers");
  const [emailTarget, setEmailTarget] = useState<(Customer & { profile?: TwinProfile | null }) | null>(null);

  const { data, isLoading } = useQuery<AdminData>({
    queryKey: ["/api/admin/overview"],
  });

  const reprocessMutation = useMutation({
    mutationFn: async (customerId: string) => {
      await apiRequest("POST", `/api/admin/reprocess/${customerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/overview"] });
      toast({ title: "Reprocessing started", description: "AI is regenerating the portfolio." });
    },
    onError: (err: any) => {
      toast({ title: "Reprocess failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (customerId: string) => {
      await apiRequest("DELETE", `/api/admin/customer/${customerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/overview"] });
      toast({ title: "User deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const grantAccessMutation = useMutation({
    mutationFn: async (customerId: string) => {
      await apiRequest("POST", `/api/admin/grant-access/${customerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/overview"] });
      toast({ title: "Access granted", description: "User marked as paid and profile published." });
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  const nudgeMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const res = await apiRequest("POST", `/api/admin/nudge-test/${customerId}`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Nudge emails sent", description: `Sent to ${data.sentTo}` });
    },
    onError: (err: any) => {
      toast({ title: "Nudge failed", description: err.message, variant: "destructive" });
    },
  });

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground text-sm mb-4">You need admin privileges to view this page.</p>
            <Link href="/dashboard">
              <Button data-testid="button-back-dashboard">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allCustomers = data?.customers ?? [];

  const filteredCustomers = allCustomers.filter((c) => {
    const ps = c.profile?.status;
    const isPaid = c.subscriptionStatus === "paid";
    if (filter === "none")      return !ps || ps === "none";
    if (filter === "draft")     return ps === "draft";
    if (filter === "ready")     return ps === "ready";
    if (filter === "published") return ps === "published";
    if (filter === "paid")      return isPaid;
    return true; // "all"
  });

  const customerTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all",       label: "All",       count: allCustomers.length },
    { key: "none",      label: "Never started", count: allCustomers.filter(c => !c.profile?.status || c.profile?.status === "none").length },
    { key: "draft",     label: "Draft",     count: allCustomers.filter(c => c.profile?.status === "draft").length },
    { key: "ready",     label: "Ready",     count: allCustomers.filter(c => c.profile?.status === "ready").length },
    { key: "published", label: "Published", count: allCustomers.filter(c => c.profile?.status === "published").length },
    { key: "paid",      label: "Paid",      count: allCustomers.filter(c => c.subscriptionStatus === "paid").length },
  ];

  // Funnel metrics
  const funnel = {
    signedUp:   allCustomers.length,
    verified:   allCustomers.filter(c => c.emailVerified).length,
    hasProfile: allCustomers.filter(c => c.profile?.status && c.profile.status !== "none").length,
    published:  allCustomers.filter(c => c.profile?.status === "published").length,
    paid:       allCustomers.filter(c => c.subscriptionStatus === "paid").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <Terminal className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Admin Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" data-testid="button-back-to-dashboard">
                <ArrowLeft className="mr-1 h-4 w-4" /> Dashboard
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => logout()} data-testid="button-admin-logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Admin Overview</h1>
            {/* Main tab toggle: Customers | Blog */}
            <div className="flex items-center gap-1 bg-white/5 border rounded-lg p-1">
              <button
                onClick={() => setActiveTab("customers")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === "customers"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="h-4 w-4" /> Customers
              </button>
              <button
                onClick={() => setActiveTab("blog")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === "blog"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-4 w-4" /> Blog
              </button>
              <button
                onClick={() => setActiveTab("outreach")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === "outreach"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Mail className="h-4 w-4" /> Outreach
              </button>
            </div>
          </div>

          {activeTab === "customers" && (
            <>
              {/* Stats */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {isLoading ? (
                  [1, 2, 3].map(i => (
                    <Card key={i} className="border-white/10 bg-white/5">
                      <CardContent className="p-6">
                        <Skeleton className="h-4 w-20 mb-3" />
                        <Skeleton className="h-8 w-16" />
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <>
                    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                          <Users className="h-4 w-4" /> Total Customers
                        </div>
                        <p className="text-3xl font-bold" data-testid="text-total-customers">{data?.stats.totalCustomers || 0}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                          <Globe className="h-4 w-4" /> Published Profiles
                        </div>
                        <p className="text-3xl font-bold" data-testid="text-published-profiles">{data?.stats.publishedProfiles || 0}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                          <DollarSign className="h-4 w-4" /> Stripe Revenue
                        </div>
                        <p className="text-3xl font-bold" data-testid="text-total-revenue">${data?.stats.totalRevenue || 0}</p>
                        {(data?.stats.paidCustomers ?? 0) > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {data!.stats.paidCustomers} paid user{data!.stats.paidCustomers !== 1 ? "s" : ""}
                            {data!.stats.totalRevenue === 0 ? " — grant access (no Stripe)" : ""}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Funnel Metrics */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Conversion Funnel</p>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {[
                      { label: "Signed up",   value: funnel.signedUp },
                      { label: "Verified",    value: funnel.verified },
                      { label: "Has profile", value: funnel.hasProfile },
                      { label: "Published",   value: funnel.published },
                      { label: "Paid",        value: funnel.paid },
                    ].map((item, i, arr) => (
                      <div key={item.label} className="flex flex-col items-center gap-1">
                        <div className="text-2xl font-bold">{item.value}</div>
                        <div className="text-xs text-muted-foreground">{item.label}</div>
                        {i > 0 && (
                          <div className="text-xs text-muted-foreground/60">
                            {arr[i - 1].value > 0 ? Math.round((item.value / arr[i - 1].value) * 100) : 0}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Customers Table */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold">Customers</h2>
                      <a href="/api/admin/export-csv" download>
                        <Button variant="outline" size="sm" className="h-7 text-xs px-3 gap-1">
                          <FileText className="h-3 w-3" /> Export CSV
                        </Button>
                      </a>
                    </div>
                    {/* Filter tabs */}
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                      {customerTabs.map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setFilter(tab.key)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            filter === tab.key
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {tab.label} <span className="ml-1 opacity-60">{tab.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Name</TableHead>
                            <TableHead className="whitespace-nowrap">Email</TableHead>
                            <TableHead className="whitespace-nowrap">Username</TableHead>
                            <TableHead className="whitespace-nowrap">Joined</TableHead>
                            <TableHead className="whitespace-nowrap">Last Active</TableHead>
                            <TableHead className="whitespace-nowrap">✓</TableHead>
                            <TableHead className="whitespace-nowrap">Status</TableHead>
                            <TableHead className="whitespace-nowrap">Profile</TableHead>
                            <TableHead className="whitespace-nowrap">Visitors</TableHead>
                            <TableHead className="whitespace-nowrap">Questions</TableHead>
                            <TableHead className="whitespace-nowrap">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCustomers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                No customers in this filter
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredCustomers.map((customer) => (
                              <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                                <TableCell className="font-medium whitespace-nowrap">{customer.name}</TableCell>
                                <TableCell className="text-muted-foreground text-sm max-w-[180px] truncate">{customer.email}</TableCell>
                                <TableCell className="font-mono text-sm">{customer.username}</TableCell>
                                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                                  {customer.createdAt
                                    ? new Date(customer.createdAt).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })
                                    : "---"}
                                </TableCell>
                                <TableCell className="text-xs whitespace-nowrap">
                                  {(() => {
                                    if (!(customer as any).lastActiveAt) return <span className="text-muted-foreground/40">Never</span>;
                                    const days = Math.floor((Date.now() - new Date((customer as any).lastActiveAt).getTime()) / 86400000);
                                    const color = days === 0 ? "text-green-400" : days <= 3 ? "text-yellow-400" : "text-muted-foreground/60";
                                    return <span className={color}>{days === 0 ? "Today" : `${days}d ago`}</span>;
                                  })()}
                                </TableCell>
                                <TableCell>
                                  {customer.emailVerified
                                    ? <CheckCircle className="h-4 w-4 text-green-500" />
                                    : <XCircle className="h-4 w-4 text-muted-foreground" />}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={customer.subscriptionStatus === "paid" ? "default" : "secondary"} className="text-xs">
                                    {customer.subscriptionStatus}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="text-xs">
                                    {customer.profile?.status || "none"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-center">
                                  {customer.profile?.status === "published"
                                    ? <span className={(customer.profile as any)?.viewCount > 0 ? "text-green-400 font-medium" : "text-muted-foreground/40"}>{(customer.profile as any)?.viewCount ?? 0}</span>
                                    : <span className="text-muted-foreground/20">—</span>}
                                </TableCell>
                                <TableCell className="text-xs text-center">
                                  {customer.profile
                                    ? <span className={(customer as any).questionCount > 0 ? "text-blue-400 font-medium" : "text-muted-foreground/40"}>{(customer as any).questionCount ?? 0}</span>
                                    : <span className="text-muted-foreground/20">—</span>}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {/* Email */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs px-2"
                                      onClick={() => setEmailTarget(customer)}
                                    >
                                      <Mail className="h-3 w-3 mr-1" /> Email
                                    </Button>

                                    {/* View profile */}
                                    {customer.profile?.status === "published" && (
                                      <a
                                        href={`https://myproxy.work/portfolio/${customer.username}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                                          <ExternalLink className="h-3 w-3 mr-1" /> View
                                        </Button>
                                      </a>
                                    )}

                                    {/* Reprocess */}
                                    {!!customer.profile?.questionnaireData && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => reprocessMutation.mutate(customer.id)}
                                        disabled={reprocessMutation.isPending || customer.profile?.status === "processing"}
                                        className="h-7 text-xs px-2"
                                        data-testid={`button-reprocess-${customer.id}`}
                                      >
                                        {(reprocessMutation.isPending || customer.profile?.status === "processing")
                                          ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                          : <RefreshCw className="h-3 w-3 mr-1" />}
                                        Reprocess
                                      </Button>
                                    )}

                                    {/* Send nudge emails */}
                                    {customer.subscriptionStatus !== "paid" && customer.profile?.status === "published" && (
                                      <ConfirmButton
                                        onConfirm={() => nudgeMutation.mutate(customer.id)}
                                        isPending={nudgeMutation.isPending}
                                        confirmLabel="Send!"
                                        icon={<Mail className="h-3 w-3 mr-1" />}
                                      >
                                        Nudge
                                      </ConfirmButton>
                                    )}

                                    {/* Grant free access */}
                                    {customer.subscriptionStatus !== "paid" && (
                                      <ConfirmButton
                                        onConfirm={() => grantAccessMutation.mutate(customer.id)}
                                        isPending={grantAccessMutation.isPending}
                                        confirmLabel="Grant!"
                                        icon={<Gift className="h-3 w-3 mr-1" />}
                                      >
                                        Grant Access
                                      </ConfirmButton>
                                    )}

                                    {/* Delete */}
                                    {customer.id !== user.id && (
                                      <ConfirmButton
                                        onConfirm={() => deleteMutation.mutate(customer.id)}
                                        isPending={deleteMutation.isPending}
                                        confirmLabel="Delete!"
                                        variant="destructive"
                                        icon={<Trash2 className="h-3 w-3 mr-1" />}
                                      >
                                        Delete
                                      </ConfirmButton>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "blog" && <BlogTab />}
          {activeTab === "outreach" && <OutreachTab customers={allCustomers} />}
        </motion.div>
      </div>

      {/* Email modal */}
      {emailTarget && (
        <EmailModal
          customer={emailTarget}
          onClose={() => setEmailTarget(null)}
        />
      )}
    </div>
  );
}
