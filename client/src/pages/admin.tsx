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
  FileText, Plus, Eye, EyeOff, Pencil, X
} from "lucide-react";
import type { Customer, TwinProfile, BlogPost } from "@shared/schema";

interface AdminData {
  customers: (Customer & { profile?: TwinProfile | null })[];
  stats: {
    totalCustomers: number;
    publishedProfiles: number;
    totalRevenue: number;
  };
}

type FilterTab = "all" | "free" | "paid" | "published";
type AdminTab = "customers" | "blog";

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

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="general">General</option>
              <option value="candidates">Candidates</option>
              <option value="recruiters">Recruiters</option>
            </select>
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

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [activeTab, setActiveTab] = useState<AdminTab>("customers");

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
    if (filter === "free") return c.subscriptionStatus !== "paid";
    if (filter === "paid") return c.subscriptionStatus === "paid" && c.profile?.status !== "published";
    if (filter === "published") return c.profile?.status === "published";
    return true;
  });

  const customerTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: allCustomers.length },
    { key: "free", label: "Free", count: allCustomers.filter(c => c.subscriptionStatus !== "paid").length },
    { key: "paid", label: "Paid", count: allCustomers.filter(c => c.subscriptionStatus === "paid" && c.profile?.status !== "published").length },
    { key: "published", label: "Published", count: allCustomers.filter(c => c.profile?.status === "published").length },
  ];

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
                          <DollarSign className="h-4 w-4" /> Total Revenue
                        </div>
                        <p className="text-3xl font-bold" data-testid="text-total-revenue">${data?.stats.totalRevenue || 0}</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Customers Table */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <h2 className="text-xl font-semibold">Customers</h2>
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
                            <TableHead className="whitespace-nowrap">Email</TableHead>
                            <TableHead className="whitespace-nowrap">Status</TableHead>
                            <TableHead className="whitespace-nowrap">Profile</TableHead>
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
                                <TableCell>
                                  <div className="flex items-center gap-1 flex-wrap">
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
        </motion.div>
      </div>
    </div>
  );
}
