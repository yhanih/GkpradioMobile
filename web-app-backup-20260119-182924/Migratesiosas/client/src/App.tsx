import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { AudioProvider } from "@/contexts/AudioContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/lib/errorBoundary";
import { Suspense, useEffect, lazy } from "react";
import { InlineLoader } from "@/components/FallbackUI";

// Lazily load route components to reduce initial bundle size
const Index = lazy(() => import("./pages/Index"));
const Community = lazy(() => import("./pages/Community"));
const DiscussionNew = lazy(() => import("./pages/DiscussionNew"));
const Videos = lazy(() => import("./pages/Videos"));
const Live = lazy(() => import("./pages/Live"));
const Team = lazy(() => import("./pages/Team"));
const Broadcast = lazy(() => import("./pages/Broadcast"));
const SponsorProfile = lazy(() => import("./pages/SponsorProfile"));
const SponsorAdvertise = lazy(() => import("./pages/SponsorAdvertise"));
const Profile = lazy(() => import("./pages/Profile"));
const About = lazy(() => import("./pages/About"));
const Podcasts = lazy(() => import("./pages/Podcasts"));
const Connect = lazy(() => import("./pages/Connect"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Promotions = lazy(() => import("./pages/Promotions"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const DonationPage = lazy(() => import("./pages/DonationPage"));
const DonateSuccess = lazy(() => import("./pages/DonateSuccess"));
const Merch = lazy(() => import("./pages/Merch"));

// Component to handle scroll reset on route changes
const ScrollToTop = () => {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <AuthProvider>
            <AudioProvider>
              <Toaster />
              <Sonner />
              <ScrollToTop />
              <Suspense fallback={<InlineLoader text="Loading page..." />}> 
                <Route path="/" component={Index} />
                <Route path="/merch" component={Merch} />
                <Route path="/community" component={Community} />
                <Route path="/discussions/new" component={DiscussionNew} />
                <Route path="/videos" component={Videos} />
                <Route path="/live" component={Live} />
                <Route path="/team" component={Team} />
                <Route path="/broadcast" component={Broadcast} />
                <Route path="/sponsor/advertise" component={SponsorAdvertise} />
                <Route path="/sponsor/:id" component={SponsorProfile} />
                <Route path="/profile" component={Profile} />
                <Route path="/about" component={About} />
                <Route path="/podcasts" component={Podcasts} />
                <Route path="/connect" component={Connect} />
                <Route path="/privacy" component={Privacy} />
                <Route path="/terms" component={Terms} />
                <Route path="/promotions" component={Promotions} />
                <Route path="/notifications" component={Notifications} />
                <Route path="/notifications/settings" component={NotificationSettings} />
                <Route path="/donate" component={DonationPage} />
                <Route path="/donate/success" component={DonateSuccess} />
              </Suspense>
          
            </AudioProvider>
          </AuthProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;