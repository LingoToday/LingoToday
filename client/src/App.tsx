import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { initializeNotifications } from "@/lib/notifications";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Lesson from "@/pages/lesson";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Initialize notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log("🚀 App loaded - initializing notifications for authenticated user");
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initializeNotifications();
      }, 1000);
    }
  }, [isAuthenticated, isLoading]);

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/lesson/:language/:week/:day" component={Lesson} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
