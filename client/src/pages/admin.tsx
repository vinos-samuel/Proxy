import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Terminal, LogOut, Users, Globe, DollarSign, ArrowLeft,
  RefreshCw, Loader2, ExternalLink, Trash2, Gift, CheckCircle, XCircle
} from "lucide-react";
import type { Customer, TwinProfile } from "@shared/schema";

interface AdminData {
  customers: (Customer & { profile?: TwinProfile | null })[];
  stats: {
    totalCustomers: number;
    publishedProfiles: number;
    totalRevenue: number;
  };
}

type FilterTab = "all" | "free" | "paid" | "published";

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

export default function AdminPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterTab>("all");

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

  const tabs: { key: FilterTab; label: string; count: number }[] = [
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
          <h1 className="text-3xl font-bold mb-8">Admin Overview</h1>

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
                  {tabs.map(tab => (
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
                                : "—"}
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
                                    href={`https://myproxy.work/${customer.username}`}
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
        </motion.div>
      </div>
    </div>
  );
}
