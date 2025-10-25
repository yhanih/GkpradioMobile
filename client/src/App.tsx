import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { AudioProvider } from "@/contexts/AudioContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/lib/errorBoundary";
import { Suspense, useEffect } from "react";
import { InlineLoader } from "@/components/FallbackUI";

// Direct imports instead of lazy loading for debugging
import Index from "./pages/Index";
import Community from "./pages/Community";
import DiscussionNew from "./pages/DiscussionNew";
import Videos from "./pages/Videos";
import Live from "./pages/Live";
import Team from "./pages/Team";
import Broadcast from "./pages/Broadcast";
import SponsorProfile from "./pages/SponsorProfile";
import SponsorAdvertise from "./pages/SponsorAdvertise";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Podcasts from "./pages/Podcasts";
import Connect from "./pages/Connect";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Promotions from "./pages/Promotions";
import Notifications from "./pages/Notifications";
import NotificationSettings from "./pages/NotificationSettings";
import DonationPage from "./pages/DonationPage";
import DonateSuccess from "./pages/DonateSuccess";
import Merch from "./pages/Merch";

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
          
            </AudioProvider>
          </AuthProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;