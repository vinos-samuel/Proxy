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
  Pencil, Save, X, ChevronDown, ChevronUp
} from "lucide-react";
import type { TwinProfile } from "@shared/schema";

interface EditFields {
  displayName: string;
  roleTitle: string;
  positioning: string;
  persona: string;
  achievements: string;
}

export default function PreviewPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState<EditFields>({
    displayName: "",
    roleTitle: "",
    positioning: "",
    persona: "",
    achievements: "",
  });
  const [expandedField, setExpandedField] = useState<string | null>(null);
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
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (fields: Partial<EditFields>) => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(fields),
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
    setEditFields({
      displayName: profile.displayName || "",
      roleTitle: profile.roleTitle || "",
      positioning: profile.positioning || "",
      persona: profile.persona || "",
      achievements: qData?.step5?.achievements || "",
    });
    setEditMode(true);
  };

  const saveEdits = () => {
    const updates: Partial<EditFields> = {};
    if (editFields.displayName !== (profile?.displayName || "")) updates.displayName = editFields.displayName;
    if (editFields.roleTitle !== (profile?.roleTitle || "")) updates.roleTitle = editFields.roleTitle;
    if (editFields.positioning !== (profile?.positioning || "")) updates.positioning = editFields.positioning;
    if (editFields.persona !== (profile?.persona || "")) updates.persona = editFields.persona;
    const qData = profile?.questionnaireData as any;
    if (editFields.achievements !== (qData?.step5?.achievements || "")) updates.achievements = editFields.achievements;

    if (Object.keys(updates).length === 0) {
      setEditMode(false);
      return;
    }
    saveMutation.mutate(updates);
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

  const editableFields = [
    { key: "displayName", label: "Display Name", type: "input" as const, help: "Your name as shown on the portfolio" },
    { key: "roleTitle", label: "Professional Title", type: "input" as const, help: "Your role/title headline" },
    { key: "positioning", label: "Positioning Statement", type: "textarea" as const, help: "Your unique value proposition" },
    { key: "persona", label: "AI Persona", type: "textarea" as const, help: "How your digital twin presents itself" },
    { key: "achievements", label: "Key Achievements", type: "textarea" as const, help: "One achievement per line" },
  ];

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
            {profile.status === "ready" && !editMode && (
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
                  Review the preview below. Click "Edit Content" to tweak any AI-generated text, or "Publish Now" to go live.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={startEditing}
                    data-testid="button-edit-cta"
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Edit Content
                  </Button>
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
                </div>
              </CardContent>
            </Card>
          )}

          <div className={`flex gap-6 ${editMode ? "flex-col lg:flex-row" : ""}`}>
            {editMode && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:w-[360px] shrink-0"
              >
                <Card>
                  <CardContent className="p-4">
                    <h2 className="font-semibold mb-1 text-sm">Edit Content</h2>
                    <p className="text-xs text-muted-foreground mb-4">
                      Tweak AI-generated content. Changes update the preview.
                    </p>
                    <div className="space-y-2">
                      {editableFields.map((field) => {
                        const isExpanded = expandedField === field.key;
                        return (
                          <div key={field.key} className="border rounded-md">
                            <button
                              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium"
                              onClick={() => setExpandedField(isExpanded ? null : field.key)}
                              data-testid={`button-expand-${field.key}`}
                            >
                              <span>{field.label}</span>
                              {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                            </button>
                            {isExpanded && (
                              <div className="px-3 pb-3">
                                <p className="text-xs text-muted-foreground mb-2">{field.help}</p>
                                {field.type === "input" ? (
                                  <Input
                                    value={editFields[field.key as keyof EditFields]}
                                    onChange={(e) => setEditFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                                    data-testid={`input-edit-${field.key}`}
                                  />
                                ) : (
                                  <Textarea
                                    value={editFields[field.key as keyof EditFields]}
                                    onChange={(e) => setEditFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                                    rows={field.key === "achievements" ? 6 : 3}
                                    className="text-sm"
                                    data-testid={`input-edit-${field.key}`}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
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
                      {typeof window !== "undefined" ? window.location.origin : ""}/portfolio/{user?.username}
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
