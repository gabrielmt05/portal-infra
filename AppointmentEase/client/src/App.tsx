import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import NewServerPage from "@/pages/servers/new";

// Componente para redirecionar se já estiver autenticado
const RedirectIfAuthenticated = ({ component: Component }: { component: React.ComponentType }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Se estiver carregando, renderizamos um placeholder
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  }
  
  // Se estiver autenticado, redirecionar para o dashboard
  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }
  
  // Caso contrário, renderiza o componente
  return <Component />;
};

function Router() {
  return (
    <Switch>
      {/* Rota principal redireciona para o dashboard */}
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      
      {/* Página de login */}
      <Route path="/login">
        <RedirectIfAuthenticated component={LoginPage} />
      </Route>
      
      {/* Dashboard (requer autenticação) */}
      <Route path="/dashboard" component={DashboardPage} />
      
      {/* Página de novo servidor */}
      <Route path="/servers/new" component={NewServerPage} />
      
      {/* Fallback para 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
