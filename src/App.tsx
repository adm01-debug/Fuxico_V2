import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "@/lib/theme";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { NotificationBadgeManager } from "@/components/NotificationBadgeManager";
import { AccessibilityManager } from "@/components/AccessibilityManager";
import { PrivateRoute } from "@/components/PrivateRoute";
import { DashboardSkeleton as PageLoader } from "@/components/ui/skeletons";
import { initSentry } from "@/lib/sentry";
import { initTracing } from "@/lib/otel";
import { RouteTransitions } from "@/components/navigation/RouteTransitions";
import { initWebVitals } from "@/lib/web-vitals";
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Keep non-critical pages lazy-loaded
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const Security = lazy(() => import("./pages/Security"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const MFAVerify = lazy(() => import("./pages/MFAVerify"));
const Permissions = lazy(() => import("./pages/Permissions"));
const Roles = lazy(() => import("./pages/Roles"));
const TwoFactorAuth = lazy(() => import("./pages/TwoFactorAuth"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Privacy = lazy(() => import("./pages/Privacy"));
const TrackingAnalytics = lazy(() => import("./pages/TrackingAnalytics"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const AdminObservability = lazy(() => import("./pages/AdminObservability"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min - avoid refetching fresh data
      gcTime: 10 * 60 * 1000, // 10 min garbage collection
      refetchOnWindowFocus: false, // prevent refetch on tab switch
      refetchOnReconnect: 'always',
      retry: 1, // single retry on failure
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    },
    mutations: {
      retry: 0,
    },
  },
});

// PageLoader is now DashboardSkeleton imported from skeletons.tsx

const App = () => {
  useEffect(() => {
    initSentry();
    initTracing();
    initWebVitals();
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <ThemeProvider>
            <AccessibilityProvider>
              <AuthProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <NotificationBadgeManager />
                  <AccessibilityManager />
                  <BrowserRouter>
                    <main id="main-content">
                      <Suspense fallback={<PageLoader />}>
                        <RouteTransitions>
                          <Routes>
                            {/* Public routes */}
                            <Route path="/" element={<Index />} />
                            <Route path="/auth" element={<Auth />} />
                            <Route path="/pricing" element={<Pricing />} />
                            <Route path="/privacy" element={<Privacy />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/verify-email" element={<VerifyEmail />} />
                            <Route path="/mfa-verify" element={<MFAVerify />} />
                            {/* Protected routes - require authentication */}
                            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                            <Route path="/security" element={<PrivateRoute><Security /></PrivateRoute>} />
                            <Route path="/permissions" element={<PrivateRoute><Permissions /></PrivateRoute>} />
                            <Route path="/roles" element={<PrivateRoute><Roles /></PrivateRoute>} />
                            <Route path="/two-factor-auth" element={<PrivateRoute><TwoFactorAuth /></PrivateRoute>} />
                            <Route path="/tracking" element={<PrivateRoute><TrackingAnalytics /></PrivateRoute>} />
                            <Route path="/audit" element={<PrivateRoute><AuditLogs /></PrivateRoute>} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </RouteTransitions>
                      </Suspense>
                    </main>
                  </BrowserRouter>
                </TooltipProvider>
              </AuthProvider>
            </AccessibilityProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;