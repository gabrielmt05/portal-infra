import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showNavigation?: boolean;
}

export function Layout({ children, title = 'Cockpit Portal', showNavigation = true }: LayoutProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-primary text-white px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">{title}</h1>
          
          {showNavigation && (
            isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Carregando...</span>
              </div>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span>Olá, {user?.username}</span>
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  Sair
                </Button>
              </div>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setLocation('/login')}>
                Login
              </Button>
            )
          )}
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-gray-100 py-4 text-center text-gray-500 text-sm">
        <div className="container mx-auto">
          Cockpit Portal &copy; {new Date().getFullYear()} - Acesso centralizado a servidores Cockpit
        </div>
      </footer>
    </div>
  );
}