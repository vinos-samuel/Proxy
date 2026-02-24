import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft, Globe, Eye, Loader2, CheckCircle,
  Pencil, Save, X, ChevronDown, ChevronUp, Lock, Plus, Trash2
} from "lucide-react";
import { useLocation as useWouterLocation } from "wouter";
import type { TwinProfile } from "@shared/schema";

interface EditState {
  displayName: string;
  roleTitle: string;
  positioning: string;
  heroSubtitle: string;
  persona: string;
  achievements: string;
  impactMetrics: Array<{ value: string; label: string; icon: string }>;
  howIWork: { name: string; steps: Array<{ label: string; description: string }> } | null;
  whyAiCv: string[];
  suggestedQuestions: string[];
}

export default function PreviewPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useWouterLocation();
  const [editMode, setEditMode] = useState(false);
  const [editState, setEditState] = useState<EditState>({
    displayName: "",
    roleTitle: "",
    positioning: "",
    heroSubtitle: "",
    persona: "",
    achievements: "",
    impactMetrics: [],
    howIWork: null,
    whyAiCv: [],
    suggestedQuestions: [],
  });
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  const { data: profile, isLoading } = useQuery<TwinProfile | null>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) return null;
      return res.json();
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/profile/publish");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Published!", description: "Your Digital Twin is now live." });
    },
    onError: (err: any) => {
      if (err.message?.includes("payment required") || err.message?.includes("Payment required")) {
        toast({ title: "Payment Required", description: "Please complete payment on the dashboard first.", variant: "destructive" });
        navigate("/dashboard");
        return;
      }
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to save changes");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setIframeKey(prev => prev + 1);
      setEditMode(false);
      toast({ title: "Changes saved", description: "Your portfolio has been updated." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const startEditing = () => {
    if (!profile) return;
    const qData = profile.questionnaireData as any;
    const pData = (profile as any);
    setEditState({
      displayName: profile.displayName || "",
      roleTitle: profile.roleTitle || "",
      positioning: profile.positioning || "",
      heroSubtitle: pData.heroSubtitle || "",
      persona: profile.persona || "",
      achievements: qData?.step5?.achievements || "",
      impactMetrics: Array.isArray(pData.stats) ? pData.stats : [],
      howIWork: pData.howIWork || null,
      whyAiCv: Array.isArray(pData.whyAiCv) ? pData.whyAiCv : [],
      suggestedQuestions: Array.isArray(pData.portfolioSuggestedQuestions) ? pData.portfolioSuggestedQuestions : [],
    });
    setEditMode(true);
  };

  const saveEdits = () => {
    if (!profile) return;
    const pData = (profile as any);
    const qData = profile.questionnaireData as any;
    const updates: Record<string, any> = {};

    if (editState.displayName !== (profile.displayName || "")) updates.displayName = editState.displayName;
    if (editState.roleTitle !== (profile.roleTitle || "")) updates.roleTitle = editState.roleTitle;
    if (editState.positioning !== (profile.positioning || "")) updates.positioning = editState.positioning;
    if (editState.heroSubtitle !== (pData.heroSubtitle || "")) updates.heroSubtitle = editState.heroSubtitle;
    if (editState.persona !== (profile.persona || "")) updates.persona = editState.persona;
    if (editState.achievements !== (qData?.step5?.achievements || "")) updates.achievements = editState.achievements;

    if (JSON.stringify(editState.impactMetrics) !== JSON.stringify(pData.stats || [])) {
      updates.stats = editState.impactMetrics;
    }
    if (JSON.stringify(editState.howIWork) !== JSON.stringify(pData.howIWork || null)) {
      updates.howIWork = editState.howIWork;
    }
    if (JSON.stringify(editState.whyAiCv) !== JSON.stringify(pData.whyAiCv || [])) {
      updates.whyAiCv = editState.whyAiCv;
    }
    if (JSON.stringify(editState.suggestedQuestions) !== JSON.stringify(pData.portfolioSuggestedQuestions || [])) {
      updates.portfolioSuggestedQuestions = editState.suggestedQuestions;
    }

    if (Object.keys(updates).length === 0) {
      setEditMode(false);
      return;
    }
    saveMutation.mutate(updates);
  };

  const toggleSection = (key: string) => {
    setExpandedSection(prev => prev === key ? null : key);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile || (profile.status !== "ready" && profile.status !== "published")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Not Ready Yet</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Your profile needs to be processed by AI before you can preview it.
            </p>
            <Link href="/questionnaire">
              <Button data-testid="button-goto-questionnaire">Complete Questionnaire</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderSection = (key: string, title: string, content: React.ReactNode) => {
    const isExpanded = expandedSection === key;
    return (
      <div key={key} className="border rounded-md">
        <button
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection(key)}
          data-testid={`button-expand-${key}`}
        >
          <span>{title}</span>
          {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
        </button>
        {isExpanded && <div className="px-3 pb-3 space-y-3">{content}</div>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant={profile.status === "published" ? "default" : "secondary"}>
              {profile.status === "published" ? "Published" : "Ready to Publish"}
            </Badge>
            {!editMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={startEditing}
                data-testid="button-edit-profile"
              >
                <Pencil className="mr-2 h-4 w-4" /> Edit Content
              </Button>
            )}
            {editMode && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditMode(false)}
                  data-testid="button-cancel-edit"
                >
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={saveEdits}
                  disabled={saveMutation.isPending}
                  data-testid="button-save-edits"
                >
                  {saveMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" /> Save Changes</>
                  )}
                </Button>
              </>
            )}
            {profile.status === "ready" && !editMode && profile.paymentStatus !== 'paid' && (
              <Button
                onClick={() => {
                  toast({ title: "Payment Required", description: "Please select a plan on the dashboard to publish." });
                  navigate("/dashboard");
                }}
                data-testid="button-publish"
              >
                <Lock className="mr-2 h-4 w-4" /> Publish Now
              </Button>
            )}
            {profile.status === "ready" && !editMode && profile.paymentStatus === 'paid' && (
              <Button
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                data-testid="button-publish"
              >
                {publishMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</>
                ) : (
                  <><Globe className="mr-2 h-4 w-4" /> Publish Now</>
                )}
              </Button>
            )}
            {profile.status === "published" && !editMode && (
              <a href={`/portfolio/${user?.username}`} target="_blank" rel="noreferrer">
                <Button data-testid="button-view-live">
                  <Globe className="mr-2 h-4 w-4" /> View Live
                </Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {!editMode && (
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold mb-2">Preview Your Digital Twin</h1>
              <p className="text-muted-foreground text-sm">
                Review your portfolio and make tweaks before publishing.
              </p>
            </div>
          )}

          {profile.status === "ready" && !editMode && (
            <Card className="border-primary/20 bg-primary/5 mb-8">
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Your Digital Twin is Ready</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {profile.paymentStatus === 'paid' 
                    ? 'Review the preview below. Click "Edit Content" to tweak any AI-generated text, or "Publish Now" to go live.'
                    : 'Review the preview below. Click "Edit Content" to tweak text, or go to Dashboard to select a plan and publish.'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={startEditing}
                    data-testid="button-edit-cta"
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Edit Content
                  </Button>
                  {profile.paymentStatus === 'paid' ? (
                    <Button
                      onClick={() => publishMutation.mutate()}
                      disabled={publishMutation.isPending}
                      className="px-8"
                      data-testid="button-publish-cta"
                    >
                      {publishMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</>
                      ) : (
                        <><Globe className="mr-2 h-4 w-4" /> Publish Now</>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => navigate("/dashboard")}
                      className="px-8"
                      data-testid="button-goto-payment"
                    >
                      <Lock className="mr-2 h-4 w-4" /> Select Plan to Publish
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className={`flex gap-6 ${editMode ? "flex-col lg:flex-row" : ""}`}>
            {editMode && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:w-[400px] shrink-0"
              >
                <Card>
                  <CardContent className="p-4">
                    <h2 className="font-semibold mb-1 text-sm">Edit Content</h2>
                    <p className="text-xs text-muted-foreground mb-4">
                      Edit any section of your portfolio. Changes update the preview on save.
                    </p>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">

                      {renderSection("hero", "Hero Section", (
                        <>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Display Name</label>
                            <Input
                              value={editState.displayName}
                              onChange={(e) => setEditState(prev => ({ ...prev, displayName: e.target.value }))}
                              data-testid="input-edit-displayName"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Professional Title</label>
                            <Input
                              value={editState.roleTitle}
                              onChange={(e) => setEditState(prev => ({ ...prev, roleTitle: e.target.value }))}
                              data-testid="input-edit-roleTitle"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Subtitle / Expertise Tags</label>
                            <Input
                              value={editState.heroSubtitle}
                              onChange={(e) => setEditState(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                              data-testid="input-edit-heroSubtitle"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Positioning Statement</label>
                            <Textarea
                              value={editState.positioning}
                              onChange={(e) => setEditState(prev => ({ ...prev, positioning: e.target.value }))}
                              rows={3}
                              className="text-sm"
                              data-testid="input-edit-positioning"
                            />
                          </div>
                        </>
                      ))}

                      {renderSection("metrics", "Impact Metrics", (
                        <>
                          <p className="text-xs text-muted-foreground">Edit the key numbers shown on your portfolio.</p>
                          {editState.impactMetrics.map((metric, i) => (
                            <div key={i} className="border rounded p-2 space-y-2 relative">
                              {editState.impactMetrics.length > 1 && (
                                <button
                                  className="absolute top-1 right-1 text-muted-foreground hover:text-destructive"
                                  onClick={() => setEditState(prev => ({
                                    ...prev,
                                    impactMetrics: prev.impactMetrics.filter((_, j) => j !== i),
                                  }))}
                                  data-testid={`button-remove-metric-${i}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                              <Input
                                value={metric.value}
                                onChange={(e) => {
                                  const updated = [...editState.impactMetrics];
                                  updated[i] = { ...updated[i], value: e.target.value };
                                  setEditState(prev => ({ ...prev, impactMetrics: updated }));
                                }}
                                placeholder="e.g. 98%"
                                className="text-sm"
                                data-testid={`input-metric-value-${i}`}
                              />
                              <Input
                                value={metric.label}
                                onChange={(e) => {
                                  const updated = [...editState.impactMetrics];
                                  updated[i] = { ...updated[i], label: e.target.value };
                                  setEditState(prev => ({ ...prev, impactMetrics: updated }));
                                }}
                                placeholder="e.g. COMPLETION RATE"
                                className="text-sm"
                                data-testid={`input-metric-label-${i}`}
                              />
                            </div>
                          ))}
                          {editState.impactMetrics.length < 8 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => setEditState(prev => ({
                                ...prev,
                                impactMetrics: [...prev.impactMetrics, { value: "", label: "", icon: "target" }],
                              }))}
                              data-testid="button-add-metric"
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add Metric
                            </Button>
                          )}
                        </>
                      ))}

                      {renderSection("methodology", "How I Work", (
                        <>
                          <p className="text-xs text-muted-foreground">Edit your methodology/framework steps.</p>
                          {editState.howIWork ? (
                            <>
                              <div>
                                <label className="text-xs text-muted-foreground block mb-1">Framework Name</label>
                                <Input
                                  value={editState.howIWork.name}
                                  onChange={(e) => setEditState(prev => ({
                                    ...prev,
                                    howIWork: prev.howIWork ? { ...prev.howIWork, name: e.target.value } : null,
                                  }))}
                                  placeholder="e.g. Diagnose → Design → Deploy"
                                  className="text-sm"
                                  data-testid="input-edit-howIWorkName"
                                />
                              </div>
                              {editState.howIWork.steps.map((step, i) => (
                                <div key={i} className="border rounded p-2 space-y-2 relative">
                                  {editState.howIWork!.steps.length > 2 && (
                                    <button
                                      className="absolute top-1 right-1 text-muted-foreground hover:text-destructive"
                                      onClick={() => setEditState(prev => ({
                                        ...prev,
                                        howIWork: prev.howIWork ? {
                                          ...prev.howIWork,
                                          steps: prev.howIWork.steps.filter((_, j) => j !== i),
                                        } : null,
                                      }))}
                                      data-testid={`button-remove-step-${i}`}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                  <Input
                                    value={step.label}
                                    onChange={(e) => {
                                      const steps = [...editState.howIWork!.steps];
                                      steps[i] = { ...steps[i], label: e.target.value };
                                      setEditState(prev => ({ ...prev, howIWork: { ...prev.howIWork!, steps } }));
                                    }}
                                    placeholder="Step name"
                                    className="text-sm"
                                    data-testid={`input-step-label-${i}`}
                                  />
                                  <Textarea
                                    value={step.description}
                                    onChange={(e) => {
                                      const steps = [...editState.howIWork!.steps];
                                      steps[i] = { ...steps[i], description: e.target.value };
                                      setEditState(prev => ({ ...prev, howIWork: { ...prev.howIWork!, steps } }));
                                    }}
                                    placeholder="What happens in this phase"
                                    rows={2}
                                    className="text-sm"
                                    data-testid={`input-step-desc-${i}`}
                                  />
                                </div>
                              ))}
                              {editState.howIWork.steps.length < 6 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => setEditState(prev => ({
                                    ...prev,
                                    howIWork: prev.howIWork ? {
                                      ...prev.howIWork,
                                      steps: [...prev.howIWork.steps, { label: "", description: "" }],
                                    } : null,
                                  }))}
                                  data-testid="button-add-step"
                                >
                                  <Plus className="h-3 w-3 mr-1" /> Add Step
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-destructive hover:text-destructive"
                                onClick={() => setEditState(prev => ({ ...prev, howIWork: null }))}
                                data-testid="button-remove-methodology"
                              >
                                <Trash2 className="h-3 w-3 mr-1" /> Remove Section
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => setEditState(prev => ({
                                ...prev,
                                howIWork: { name: "", steps: [{ label: "", description: "" }, { label: "", description: "" }] },
                              }))}
                              data-testid="button-add-methodology"
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add Methodology
                            </Button>
                          )}
                        </>
                      ))}

                      {renderSection("persona", "AI Persona & Chatbot", (
                        <>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">AI Persona Description</label>
                            <Textarea
                              value={editState.persona}
                              onChange={(e) => setEditState(prev => ({ ...prev, persona: e.target.value }))}
                              rows={3}
                              className="text-sm"
                              data-testid="input-edit-persona"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Suggested Questions (one per line)</label>
                            <Textarea
                              value={editState.suggestedQuestions.join("\n")}
                              onChange={(e) => setEditState(prev => ({
                                ...prev,
                                suggestedQuestions: e.target.value.split("\n").filter(q => q.trim()),
                              }))}
                              rows={4}
                              className="text-sm"
                              data-testid="input-edit-suggestedQuestions"
                            />
                          </div>
                        </>
                      ))}

                      {renderSection("achievements", "Key Achievements", (
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">One achievement per line</label>
                          <Textarea
                            value={editState.achievements}
                            onChange={(e) => setEditState(prev => ({ ...prev, achievements: e.target.value }))}
                            rows={6}
                            className="text-sm"
                            data-testid="input-edit-achievements"
                          />
                        </div>
                      ))}

                      {renderSection("whyAiCv", "Why an AI CV?", (
                        <>
                          <p className="text-xs text-muted-foreground">Edit the paragraphs explaining why this AI portfolio exists.</p>
                          {editState.whyAiCv.map((para, i) => (
                            <div key={i} className="relative">
                              <Textarea
                                value={para}
                                onChange={(e) => {
                                  const updated = [...editState.whyAiCv];
                                  updated[i] = e.target.value;
                                  setEditState(prev => ({ ...prev, whyAiCv: updated }));
                                }}
                                rows={3}
                                className="text-sm pr-8"
                                data-testid={`input-whyaicv-${i}`}
                              />
                              {editState.whyAiCv.length > 1 && (
                                <button
                                  className="absolute top-1 right-1 text-muted-foreground hover:text-destructive"
                                  onClick={() => setEditState(prev => ({
                                    ...prev,
                                    whyAiCv: prev.whyAiCv.filter((_, j) => j !== i),
                                  }))}
                                  data-testid={`button-remove-whyaicv-${i}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setEditState(prev => ({
                              ...prev,
                              whyAiCv: [...prev.whyAiCv, ""],
                            }))}
                            data-testid="button-add-whyaicv"
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Paragraph
                          </Button>
                        </>
                      ))}

                      <div className="border rounded-md p-3 bg-muted/30">
                        <p className="text-xs text-muted-foreground">
                          To edit Career Timeline, Skills Matrix, or Where I'm Most Useful, update your questionnaire and reprocess your profile.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Button
                        className="flex-1"
                        onClick={saveEdits}
                        disabled={saveMutation.isPending}
                        data-testid="button-save-edits-panel"
                      >
                        {saveMutation.isPending ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                        ) : (
                          <><Save className="mr-2 h-4 w-4" /> Save Changes</>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setEditMode(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <div className="flex-1 min-w-0">
              <Card className="overflow-hidden">
                <div className="border-b px-4 py-2 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-muted rounded-md px-3 py-1 text-xs text-muted-foreground font-mono text-center">
                      {profile?.paymentStatus === 'paid' 
                        ? `${user?.username}.myproxy.work`
                        : "Preview Mode — Publish to get your live URL"}
                    </div>
                  </div>
                </div>
                <iframe
                  key={iframeKey}
                  src={`/portfolio/${user?.username}`}
                  className="w-full h-[700px] bg-background"
                  title="Portfolio Preview"
                  data-testid="preview-iframe"
                />
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
