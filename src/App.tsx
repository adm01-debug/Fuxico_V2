import React, { lazy, Suspense, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationBadgeManager } from "@/components/NotificationBadgeManager";
import { Skeleton } from "@/components/ui/skeleton";
import Auth from "./pages/Auth";

// Lazy load other pages
const Index = lazy(() => import("./pages/Index"));
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

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen p-4" role="status" aria-label="Carregando página">
    <div className="w-full max-w-4xl space-y-4">
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-8 w-1/2" />
    </div>
  </div>
);

const App = () => {
  // Force ErrorBoundary reset on HMR by changing key
  const [errorKey, setErrorKey] = useState(0);

  useEffect(() => {
    if (import.meta.hot) {
      import.meta.hot.on('vite:beforeUpdate', () => {
        setErrorKey(prev => prev + 1);
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary key={errorKey}>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <NotificationBadgeManager />
              <BrowserRouter>
                <main id="main-content">
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/security" element={<Security />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/verify-email" element={<VerifyEmail />} />
                      <Route path="/mfa-verify" element={<MFAVerify />} />
                      <Route path="/permissions" element={<Permissions />} />
                      <Route path="/roles" element={<Roles />} />
                      <Route path="/two-factor-auth" element={<TwoFactorAuth />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </main>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
