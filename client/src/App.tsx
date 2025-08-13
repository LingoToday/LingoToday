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
import Onboarding from "@/pages/onboarding";
import SignIn from "@/pages/sign-in";
import Dashboard from "@/pages/dashboard";
import Account from "@/pages/account";
import Lesson from "@/pages/lesson";
import Courses from "@/pages/courses";
import CourseManager from "@/pages/course-manager";
import CourseTest from "@/pages/course-test";
import LessonExample from "@/pages/lesson-example";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import FAQPage from "@/pages/faq";

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
        <>
          <Route path="/" component={Landing} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/sign-in" component={SignIn} />
          <Route path="/courses" component={Courses} />
          <Route path="/courses/:language" component={Courses} />
          <Route path="/course-test" component={CourseTest} />
          <Route path="/lesson/:language/:courseId/:lessonId" component={Lesson} />
          <Route path="/terms" component={Terms} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/faq" component={FAQPage} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/account" component={Account} />
          <Route path="/courses" component={Courses} />
          <Route path="/courses/:language" component={Courses} />
          <Route path="/course-manager" component={CourseManager} />
          <Route path="/lesson-example" component={LessonExample} />
          <Route path="/lesson/:language/:courseId/:lessonId" component={Lesson} />
          <Route path="/terms" component={Terms} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/faq" component={FAQPage} />
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
