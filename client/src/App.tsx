import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
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
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import VerifyEmailPage from "@/pages/verify-email";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import BlogPage from "@/pages/blog";
import BlogPostPage from "@/pages/blog-post";
import TwinInterviewPage from "@/pages/twin-interview";
import OnboardingChatPage from "@/pages/onboarding-chat";
import JobSearchPage from "@/pages/job-search";
import PreviewDraftPage from "@/pages/preview-draft";
import TryPage from "@/pages/try";
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

function ReferralCapture() {
  const [location] = useLocation();
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem("proxy_ref", ref);
  }, [location]);
  return null;
}

function Router() {
  return (
    <>
      <ReferralCapture />
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/try" component={TryPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/blog/:slug" component={BlogPostPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/login">{() => <GuestRoute component={LoginPage} />}</Route>
      <Route path="/register">{() => <GuestRoute component={RegisterPage} />}</Route>
      <Route path="/dashboard">{() => <ProtectedRoute component={DashboardPage} />}</Route>
      <Route path="/questionnaire">{() => <ProtectedRoute component={QuestionnairePage} />}</Route>
      <Route path="/preview">{() => <ProtectedRoute component={PreviewPage} />}</Route>
      <Route path="/admin">{() => <ProtectedRoute component={AdminPage} />}</Route>
      <Route path="/interview">{() => <ProtectedRoute component={TwinInterviewPage} />}</Route>
      <Route path="/onboarding-chat">{() => <ProtectedRoute component={OnboardingChatPage} />}</Route>
      <Route path="/job-search">{() => <ProtectedRoute component={JobSearchPage} />}</Route>
      <Route path="/preview-draft">{() => <ProtectedRoute component={PreviewDraftPage} />}</Route>
      <Route path="/payment/success" component={PaymentSuccessPage} />
      <Route path="/payment/cancelled" component={PaymentCancelledPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/pricing" component={LandingPage} />
      <Route path="/portfolio/:username" component={PortfolioPage} />
      <Route component={NotFound} />
    </Switch>
    </>
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
