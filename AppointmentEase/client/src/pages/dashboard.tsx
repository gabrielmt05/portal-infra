import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Server } from '@shared/schema';
import { Layout } from '@/components/layout';

// Tipos necessários para tipagem correta das respostas da API
type ServerWithStatus = Omit<Server, 'password'> & { status?: string };

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Server as ServerIcon, Clock, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Interfaces para respostas da API
interface ServerListResponse {
  success: boolean;
  servers: ServerWithStatus[];
}

interface ServerAccessResponse {
  success: boolean;
  accessUrl: string;
}

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // Buscar servidores recentes
  const { data: recentServers, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['/api/servers/recent'],
    queryFn: async () => {
      const response = await apiRequest<ServerListResponse>('/api/servers/recent');
      return response.servers;
    },
    enabled: isAuthenticated,
  });

  // Buscar todos os servidores
  const { data: allServers, isLoading: isLoadingAll } = useQuery({
    queryKey: ['/api/servers'],
    queryFn: async () => {
      const response = await apiRequest<ServerListResponse>('/api/servers');
      return response.servers;
    },
    enabled: isAuthenticated,
  });

  // Função para acessar um servidor
  const accessServer = async (serverId: number) => {
    try {
      const response = await apiRequest<ServerAccessResponse>(
        `/api/servers/${serverId}/access`
      );
      
      if (response.success && response.accessUrl) {
        // Abrir o Cockpit em uma nova aba
        window.open(response.accessUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error accessing server:', error);
    }
  };

  // Se estiver carregando autenticação, mostrar esqueleto
  if (authLoading) {
    return <LoadingSkeleton />;
  }

  // Se não estiver autenticado, não renderizar nada (será redirecionado)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seção de servidores recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Servidores Recentes
              </CardTitle>
              <CardDescription>Servidores que você acessou recentemente</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRecent ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-3 w-[150px]" />
                      </div>
                      <Skeleton className="h-9 w-[100px]" />
                    </div>
                  ))}
                </div>
              ) : recentServers && recentServers.length > 0 ? (
                <div className="space-y-4">
                  {recentServers.map((server: ServerWithStatus) => (
                    <div key={server.id} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h3 className="font-medium">{server.name}</h3>
                        <p className="text-sm text-gray-500">{server.hostname}:{server.port}</p>
                        <p className="text-xs text-gray-400">Último acesso: {server.last_accessed ? new Date(server.last_accessed).toLocaleString() : 'Nunca'}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => accessServer(server.id)}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Acessar
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6">
                  Nenhum servidor acessado recentemente.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Seção de todos os servidores */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ServerIcon className="h-5 w-5" />
                  Todos os Servidores
                </CardTitle>
                <CardDescription>Lista completa de servidores disponíveis</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLocation('/servers/new')}>
                <Plus className="h-4 w-4 mr-1" />
                Novo
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingAll ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-3 w-[150px]" />
                      </div>
                      <Skeleton className="h-9 w-[100px]" />
                    </div>
                  ))}
                </div>
              ) : allServers && allServers.length > 0 ? (
                <div className="space-y-3">
                  {allServers.map((server: ServerWithStatus) => (
                    <div key={server.id} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h3 className="font-medium flex items-center gap-2">
                          {server.name}
                          {server.status && (
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${
                                server.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              title={`Status: ${server.status}`}
                            />
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">{server.hostname}:{server.port}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/servers/${server.id}`)}
                        >
                          Detalhes
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => accessServer(server.id)}
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Acessar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">Nenhum servidor cadastrado.</p>
                  <Button onClick={() => setLocation('/servers/new')}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Servidor
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

// Componente de loading
function LoadingSkeleton() {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-4 w-[300px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <Skeleton className="h-9 w-[100px]" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-4 w-[300px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <Skeleton className="h-9 w-[100px]" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}