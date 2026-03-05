import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import AboutPage from "@/pages/about";
import FAQPage from "@/pages/faq";
import { LoginPage, RegisterPage } from "@/pages/auth";
import DashboardPage from "@/pages/dashboard";
import QuestionnairePage from "@/pages/questionnaire";
import PreviewPage from "@/pages/preview";
import PortfolioPage from "@/pages/portfolio";
import AdminPage from "@/pages/admin";
import PaymentSuccessPage from "@/pages/payment-success";
import PaymentCancelledPage from "@/pages/payment-cancelled";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function GuestRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/login">{() => <GuestRoute component={LoginPage} />}</Route>
      <Route path="/register">{() => <GuestRoute component={RegisterPage} />}</Route>
      <Route path="/dashboard">{() => <ProtectedRoute component={DashboardPage} />}</Route>
      <Route path="/questionnaire">{() => <ProtectedRoute component={QuestionnairePage} />}</Route>
      <Route path="/preview">{() => <ProtectedRoute component={PreviewPage} />}</Route>
      <Route path="/admin">{() => <ProtectedRoute component={AdminPage} />}</Route>
      <Route path="/payment/success" component={PaymentSuccessPage} />
      <Route path="/payment/cancelled" component={PaymentCancelledPage} />
      <Route path="/pricing" component={LandingPage} />
      <Route path="/portfolio/:username" component={PortfolioPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
