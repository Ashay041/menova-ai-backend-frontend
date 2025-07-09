import { useState, useEffect } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from './components/ui/toaster';
import { LoadingSpinner } from './components/ui';
import DatabaseErrorBoundary from './components/DatabaseErrorBoundary';

// Pages
import AuthPage from './pages/auth-page';
import Assessment from './pages/Assessment';
import HomePage from './pages/Home';
import ChatPage from './pages/Chat';
import TrackPage from './pages/Track';
import LogSymptomPage from './pages/LogSymptom';
import WellnessPlansPage from './pages/WellnessPlans';
import CommunityPage from './pages/Community';
import DbTestPage from './pages/DbTest';
import NotFound from './pages/not-found';

function Router() {
  const [location, setLocation] = useLocation();

  // Global auth guard: redirect to /auth if not logged in
  useEffect(() => {
    const isAuthPage = location === '/auth';
    const token = localStorage.getItem('authToken');
    if (!isAuthPage && !token) {
      setLocation('/auth');
    }
    // Optionally, redirect root to /auth for extra safety
    if (location === '/') {
      setLocation('/auth');
    }
  }, [location, setLocation]);

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      {/* All other routes are protected by the above effect */}
      <Route path="/assessment" component={Assessment} />
      <Route path="/home" component={HomePage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/track" component={TrackPage} />
      <Route path="/log-symptom" component={LogSymptomPage} />
      <Route path="/wellness-plans">
        <WellnessPlansPage />
      </Route>
      <Route path="/wellness-plans/:planId">
        <WellnessPlansPage />
      </Route>
      <Route path="/community" component={CommunityPage} />
      <Route path="/db-test" component={DbTestPage} />
      <Route path="/" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <DatabaseErrorBoundary>
        <Router />
        <Toaster />
      </DatabaseErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;