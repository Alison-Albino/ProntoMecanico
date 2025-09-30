import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { WebSocketProvider } from "@/lib/websocket";
import { MobileNav } from "@/components/mobile-nav";
import LoginPage from "@/pages/login";
import HomePage from "@/pages/home";
import HistoryPage from "@/pages/history";
import ProfilePage from "@/pages/profile";
import WalletPage from "@/pages/wallet";
import NotFound from "@/pages/not-found";

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

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <WebSocketProvider>
      <Switch>
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
        
        <Route component={NotFound} />
      </Switch>
    </WebSocketProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
