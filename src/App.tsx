import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RateLimitProvider } from "@/contexts/RateLimitContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DebugBanner } from "@/components/DebugBanner";
import { SessionMonitor } from "@/components/SessionMonitor";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Core from "./pages/Core";
import Landing from "./pages/Landing";
import MVPLanding from "./pages/MVPLanding";
import FAQ from "./pages/FAQ";
import Upgrade from "./pages/Upgrade";
import WeeklyLimitReached from "./pages/WeeklyLimitReached";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">🚛</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DebugBanner />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/core" element={<Core />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route path="/weekly-limit-reached" element={<WeeklyLimitReached />} />
        <Route path="/app" element={
          user ? (
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          ) : (
            <Auth />
          )
        } />
        <Route path="/product" element={<Landing />} />
        <Route path="/" element={<MVPLanding />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RateLimitProvider>
            <SessionMonitor />
            <AppContent />
          </RateLimitProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
