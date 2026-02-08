import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import {
  Bot, Edit, Eye, Globe, LogOut, LayoutDashboard,
  FileText, Sparkles, ExternalLink, Settings
} from "lucide-react";
import type { TwinProfile } from "@shared/schema";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const { data: profile, isLoading } = useQuery<TwinProfile | null>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  const statusMap: Record<string, { label: string; variant: "secondary" | "default" | "destructive" }> = {
    draft: { label: "Draft", variant: "secondary" },
    processing: { label: "Processing", variant: "default" },
    ready: { label: "Ready to Publish", variant: "default" },
    published: { label: "Published", variant: "default" },
  };

  const profileStatus = profile ? statusMap[profile.status] || statusMap.draft : statusMap.draft;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/dashboard">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="h-8 w-8 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">Digital Twin Studio</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.name}</span>
            <Button variant="ghost" size="icon" onClick={() => logout()} data-testid="button-logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name}. Manage your Digital Twin below.
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="border-white/10 bg-white/5">
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-32 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Profile Status */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl md:col-span-2">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-12 w-12 rounded-md bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center">
                          <Bot className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold">
                            {profile?.displayName || "Your Digital Twin"}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {profile?.roleTitle || "No role set yet"}
                          </p>
                        </div>
                      </div>
                      <Badge variant={profileStatus.variant} data-testid="badge-profile-status">
                        {profileStatus.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {!profile && (
                        <Link href="/questionnaire">
                          <Button data-testid="button-start-questionnaire">
                            <FileText className="mr-2 h-4 w-4" />
                            Start Questionnaire
                          </Button>
                        </Link>
                      )}
                      {profile?.status === "draft" && (
                        <Link href="/questionnaire">
                          <Button data-testid="button-continue-questionnaire">
                            <Edit className="mr-2 h-4 w-4" />
                            Continue Setup
                          </Button>
                        </Link>
                      )}
                      {(profile?.status === "ready" || profile?.status === "published") && (
                        <>
                          <Link href="/preview">
                            <Button variant="outline" data-testid="button-preview">
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </Button>
                          </Link>
                          {profile.status === "published" && (
                            <a
                              href={`/portfolio/${user?.username}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Button data-testid="button-view-live">
                                <Globe className="mr-2 h-4 w-4" />
                                View Live
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </Button>
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl hover-elevate">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-indigo-400" />
                    </div>
                    <h3 className="font-semibold">Questionnaire</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {profile ? "Update your career information and stories." : "Tell us about your career to build your Digital Twin."}
                  </p>
                  <Link href="/questionnaire">
                    <Button variant="outline" size="sm" data-testid="button-goto-questionnaire">
                      {profile ? "Edit Answers" : "Get Started"}
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5 backdrop-blur-xl hover-elevate">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-md bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-violet-400" />
                    </div>
                    <h3 className="font-semibold">AI Processing</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {profile?.status === "ready" || profile?.status === "published"
                      ? "Your content has been processed by AI."
                      : "Submit your questionnaire to start AI processing."}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {profile?.status === "processing" ? "In Progress..." : profile?.status === "ready" || profile?.status === "published" ? "Complete" : "Waiting for input"}
                  </Badge>
                </CardContent>
              </Card>

              {/* Portfolio URL */}
              {profile?.status === "published" && (
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl md:col-span-2">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Globe className="h-5 w-5 text-green-400" />
                      <h3 className="font-semibold">Your Portfolio URL</h3>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <code className="px-3 py-2 rounded-md bg-background/50 border border-white/10 text-sm text-indigo-300 font-mono" data-testid="text-portfolio-url">
                        {window.location.origin}/portfolio/{user?.username}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/portfolio/${user?.username}`);
                        }}
                        data-testid="button-copy-url"
                      >
                        Copy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  );
}
