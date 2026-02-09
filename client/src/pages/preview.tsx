import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Globe, Eye, Loader2, CheckCircle } from "lucide-react";
import type { TwinProfile } from "@shared/schema";

export default function PreviewPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

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

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant={profile.status === "published" ? "default" : "secondary"}>
              {profile.status === "published" ? "Published" : "Ready to Publish"}
            </Badge>
            {profile.status === "ready" && (
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
            {profile.status === "published" && (
              <a href={`/portfolio/${user?.username}`} target="_blank" rel="noreferrer">
                <Button data-testid="button-view-live">
                  <Globe className="mr-2 h-4 w-4" /> View Live
                </Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-2">Preview Your Digital Twin</h1>
            <p className="text-muted-foreground text-sm">
              This is how your portfolio will look to visitors.
            </p>
          </div>

          {profile.status === "ready" && (
            <Card className="border-primary/20 bg-primary/5 mb-8">
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Your Digital Twin is Ready</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click "Publish Now" to make your portfolio live at a unique URL.
                </p>
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
              </CardContent>
            </Card>
          )}

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
              src={`/portfolio/${user?.username}`}
              className="w-full h-[700px] bg-background"
              title="Portfolio Preview"
              data-testid="preview-iframe"
            />
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
