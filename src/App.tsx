import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { featureFlags } from "@/lib/feature-flags";
import { initAnalytics } from "@/lib/analytics";
import { initAPM } from "@/lib/apm";
import { initSentry } from "@/lib/sentry";
import { SkipLinks } from "@/lib/accessibility";
import { initI18n } from "@/lib/i18n";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationBadgeManager } from "@/components/NotificationBadgeManager";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Initialize internationalization
initI18n();

const queryClient = new QueryClient();

// Initialize monitoring
React.useEffect(() => {
  initSentry({ dsn: import.meta.env.VITE_SENTRY_DSN, environment: import.meta.env.MODE });
  initAPM({ enabled: import.meta.env.PROD, sampleRate: 0.1, debug: import.meta.env.DEV });
  if (featureFlags.isEnabled("enableAnalytics")) { initAnalytics(); }
}, []);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <SkipLinks />
          <Toaster />
          <Sonner />
          <NotificationBadgeManager />
          <BrowserRouter>
            <main id="main-content">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
