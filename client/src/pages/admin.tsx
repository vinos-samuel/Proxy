import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { Terminal, LogOut, Users, Globe, DollarSign, Activity, ArrowLeft } from "lucide-react";
import type { Customer, TwinProfile } from "@shared/schema";

interface AdminData {
  customers: (Customer & { profile?: TwinProfile | null })[];
  stats: {
    totalCustomers: number;
    publishedProfiles: number;
    totalRevenue: number;
  };
}

export default function AdminPage() {
  const { user, logout } = useAuth();

  const { data, isLoading } = useQuery<AdminData>({
    queryKey: ["/api/admin/overview"],
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                  <Terminal className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold">Admin Panel</span>
              </div>
            </Link>
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
                      <Users className="h-4 w-4" />
                      Total Customers
                    </div>
                    <p className="text-3xl font-bold" data-testid="text-total-customers">{data?.stats.totalCustomers || 0}</p>
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <Globe className="h-4 w-4" />
                      Published Profiles
                    </div>
                    <p className="text-3xl font-bold" data-testid="text-published-profiles">{data?.stats.publishedProfiles || 0}</p>
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <DollarSign className="h-4 w-4" />
                      Total Revenue
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
              <h2 className="text-xl font-semibold mb-4">Customers</h2>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Profile</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.customers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No customers yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        data?.customers.map((customer) => (
                          <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{customer.email}</TableCell>
                            <TableCell className="font-mono text-sm">{customer.username}</TableCell>
                            <TableCell>
                              <Badge variant={customer.subscriptionStatus === "paid" ? "default" : "secondary"} className="text-xs">
                                {customer.subscriptionStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                {customer.profile?.status || "none"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(customer.createdAt).toLocaleDateString()}
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
