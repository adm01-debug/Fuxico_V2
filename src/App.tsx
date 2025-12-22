import { ThemeProvider } from "@/lib/theme";
import { SkipLinks } from "@/lib/accessibility";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { useDesktopNotifications } from "@/hooks/use-desktop-notifications";
import { getQueryClient, setupCacheSync } from "@/lib/query-cache";
import { initPWA } from "@/lib/pwa-utils";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Optimized QueryClient with caching
const queryClient = getQueryClient();

// Component to initialize realtime and desktop notifications
function NotificationsProvider({ children }: { children: React.ReactNode }) {
  useRealtimeNotifications();
  useDesktopNotifications();
  return <>{children}</>;
}

// Component to setup PWA and cache sync
function AppInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize PWA
    initPWA();
    
    // Setup cache synchronization
    const cleanup = setupCacheSync(queryClient);
    
    return cleanup;
  }, []);
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SkipLinks />
    <AuthProvider>
      <AppInitializer>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <NotificationsProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </NotificationsProvider>
          </BrowserRouter>
        </TooltipProvider>
      </AppInitializer>
    </AuthProvider>
  </ThemeProvider>
    </QueryClientProvider>
);

export default App;
