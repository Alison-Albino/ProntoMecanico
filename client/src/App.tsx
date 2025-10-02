import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { WebSocketProvider } from "@/lib/websocket";
import { NotificationsProvider } from "@/lib/use-notifications";
import { MobileNav } from "@/components/mobile-nav";
import OnboardingPage from "@/pages/onboarding";
import LoginPage from "@/pages/login";
import HomePage from "@/pages/home";
import HistoryPage from "@/pages/history";
import ProfilePage from "@/pages/profile";
import WalletPage from "@/pages/wallet";
import ActiveRidePage from "@/pages/active-ride";
import ChatPage from "@/pages/chat";
import PaymentPage from "@/pages/payment";
import WaitingPage from "@/pages/waiting";
import AdminWithdrawalsPage from "@/pages/admin-withdrawals";
import NotFound from "@/pages/not-found";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { SplashScreen } from "@/components/splash-screen";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-auto pb-16">
        <Component />
      </div>
      <MobileNav />
    </div>
  );
}

function ActiveRideRedirect() {
  const { user, token } = useAuth();
  const [location, setLocation] = useLocation();
  
  const { data: activeRequest } = useQuery({
    queryKey: ['/api/service-requests/active'],
    enabled: !!token && !!user,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (activeRequest && typeof activeRequest === 'object' && activeRequest !== null && 'id' in activeRequest && !location.startsWith('/ride/')) {
      setLocation(`/ride/${(activeRequest as any).id}`);
    }
  }, [activeRequest, location, setLocation]);

  return null;
}

function Router() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const onboardingCompleted = localStorage.getItem('onboarding_completed');
    if (!onboardingCompleted && !user && location !== '/onboarding') {
      setLocation('/onboarding');
    }
  }, [user, location, setLocation]);

  useEffect(() => {
    const handleSessionExpired = () => {
      toast({
        title: "Sessão expirada",
        description: "Por favor, faça login novamente para continuar",
        variant: "destructive",
      });
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <WebSocketProvider>
      <ActiveRideRedirect />
      <Switch>
        <Route path="/onboarding" component={OnboardingPage} />
        
        <Route path="/login">
          {user ? <Redirect to="/" /> : <LoginPage />}
        </Route>
        
        <Route path="/">
          <ProtectedRoute component={HomePage} />
        </Route>
        
        <Route path="/history">
          <ProtectedRoute component={HistoryPage} />
        </Route>
        
        <Route path="/wallet">
          <ProtectedRoute component={WalletPage} />
        </Route>
        
        <Route path="/profile">
          <ProtectedRoute component={ProfilePage} />
        </Route>
        
        <Route path="/profile/:id">
          <ProtectedRoute component={ProfilePage} />
        </Route>
        
        <Route path="/payment">
          <ProtectedRoute component={PaymentPage} />
        </Route>
        
        <Route path="/waiting/:id">
          <ProtectedRoute component={WaitingPage} />
        </Route>
        
        <Route path="/ride/:id">
          <ProtectedRoute component={ActiveRidePage} />
        </Route>
        
        <Route path="/ride/:id/chat">
          <ProtectedRoute component={ChatPage} />
        </Route>
        
        <Route path="/admin/withdrawals">
          <ProtectedRoute component={AdminWithdrawalsPage} />
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    </WebSocketProvider>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <NotificationsProvider>
            <TooltipProvider>
              <Router />
              <Toaster />
            </TooltipProvider>
          </NotificationsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
