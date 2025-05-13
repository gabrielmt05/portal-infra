import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { User } from '@shared/schema';

// Interface para os dados de login
interface LoginCredentials {
  username: string;
  password: string;
}

// Interface para resposta de autenticação
interface AuthResponse {
  success: boolean;
  user?: Omit<User, 'password'>;
  message?: string;
  errors?: string[];
}

// Interface para o contexto de autenticação
interface AuthContextType {
  user: Omit<User, 'password'> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<boolean>;
  checkSession: () => Promise<boolean>;
}

// Criar o contexto de autenticação
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider do contexto de autenticação
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Verificar sessão
  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        const response = await apiRequest<AuthResponse>('/api/auth/session');
        return response;
      } catch (error) {
        return { success: false } as AuthResponse;
      }
    },
    enabled: false, // Não executar automaticamente
    retry: false,
  });

  // Função para verificar a sessão do usuário
  const checkSession = async (): Promise<boolean> => {
    try {
      const result = await sessionQuery.refetch();
      if (result.data && result.data.success && result.data.user) {
        setUser(result.data.user);
        setIsLoading(false);
        return true;
      }
      setUser(null);
      setIsLoading(false);
      return false;
    } catch (error) {
      setUser(null);
      setIsLoading(false);
      return false;
    }
  };

  // Executar verificação de sessão ao iniciar
  useEffect(() => {
    checkSession();
  }, []);

  // Mutation para login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      return await apiRequest<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },
    onSuccess: (data) => {
      if (data.success && data.user) {
        setUser(data.user);
        queryClient.invalidateQueries({ queryKey: ['session'] });
        toast({
          title: 'Login bem-sucedido',
          description: `Bem-vindo, ${data.user.username}!`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro de login',
          description: data.message || 'Credenciais inválidas',
        });
      }
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Erro de login',
        description: 'Ocorreu um erro ao tentar fazer login. Tente novamente.',
      });
    },
  });

  // Mutation para logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest<AuthResponse>('/api/auth/logout', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      setUser(null);
      queryClient.invalidateQueries({ queryKey: ['session'] });
      toast({
        title: 'Logout bem-sucedido',
        description: 'Você foi desconectado com sucesso.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Erro de logout',
        description: 'Ocorreu um erro ao tentar fazer logout. Tente novamente.',
      });
    },
  });

  // Função de login
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const result = await loginMutation.mutateAsync(credentials);
      return result.success || false;
    } catch (error) {
      return false;
    }
  };

  // Função de logout
  const logout = async (): Promise<boolean> => {
    try {
      const result = await logoutMutation.mutateAsync();
      return result.success || false;
    } catch (error) {
      return false;
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto de autenticação
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};