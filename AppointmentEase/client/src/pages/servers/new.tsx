import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { insertServerSchema } from '@shared/schema';
import { Layout } from '@/components/layout';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';

// Estender o esquema do servidor para incluir validação adicional
const serverFormSchema = insertServerSchema.extend({
  confirm_password: z.string(),
  created_by: z.number().optional() // Será preenchido automaticamente
}).refine(data => data.password === data.confirm_password, {
  message: "As senhas não conferem",
  path: ["confirm_password"]
});

// Tipo do formulário
type ServerFormValues = z.infer<typeof serverFormSchema>;

// Interface para resposta da API
interface ServerResponse {
  success: boolean;
  server?: {
    id: number;
    name: string;
    [key: string]: any;
  };
  message?: string;
  errors?: string[];
}

export default function NewServerPage() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, setLocation]);

  // Configurar o formulário
  const form = useForm<ServerFormValues>({
    resolver: zodResolver(serverFormSchema),
    defaultValues: {
      name: '',
      hostname: '',
      description: '',
      port: 9090,
      username: '',
      password: '',
      confirm_password: '',
      use_ssl: false
    },
  });

  // Mutation para criar servidor
  const createServerMutation = useMutation({
    mutationFn: async (data: Omit<ServerFormValues, 'confirm_password'>) => {
      return await apiRequest<ServerResponse>('/api/servers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Servidor criado',
          description: `O servidor ${data.server?.name} foi criado com sucesso.`,
        });
        
        // Invalidar cache e redirecionar
        queryClient.invalidateQueries({ queryKey: ['/api/servers'] });
        queryClient.invalidateQueries({ queryKey: ['/api/servers/recent'] });
        setLocation('/dashboard');
      } else {
        setError(data.message || 'Erro ao criar servidor. Verifique os dados e tente novamente.');
        
        if (data.errors && data.errors.length > 0) {
          data.errors.forEach(errMsg => {
            const fieldName = errMsg.toLowerCase().includes('nome') ? 'name' : 
                              errMsg.toLowerCase().includes('hostname') ? 'hostname' : 
                              errMsg.toLowerCase().includes('usuário') ? 'username' : 
                              errMsg.toLowerCase().includes('senha') ? 'password' : '';
            
            if (fieldName) {
              form.setError(fieldName as any, { 
                type: 'manual', 
                message: errMsg 
              });
            }
          });
        }
      }
    },
    onError: () => {
      setError('Ocorreu um erro ao tentar criar o servidor. Tente novamente.');
    },
  });

  // Função para lidar com o envio do formulário
  const onSubmit = async (values: ServerFormValues) => {
    setError(null);
    try {
      // Remover campo de confirmação de senha e adicionar ID do usuário
      const { confirm_password, ...serverData } = values;
      serverData.created_by = user?.id || 0;
      
      await createServerMutation.mutateAsync(serverData);
    } catch (err) {
      setError('Ocorreu um erro ao processar o formulário. Tente novamente.');
      console.error('Server creation error:', err);
    }
  };

  // Se não estiver autenticado, não renderizar nada (será redirecionado)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout title="Adicionar Servidor - Cockpit Portal">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="flex items-center gap-1" 
            onClick={() => setLocation('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Dashboard
          </Button>
        </div>

        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Adicionar Novo Servidor</CardTitle>
            <CardDescription>
              Adicione um novo servidor Cockpit ao portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome do servidor */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do servidor *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Servidor de Produção" {...field} />
                        </FormControl>
                        <FormDescription>
                          Um nome amigável para identificar o servidor
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Hostname */}
                  <FormField
                    control={form.control}
                    name="hostname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hostname/IP *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: servidor.exemplo.com ou 192.168.1.10" {...field} />
                        </FormControl>
                        <FormDescription>
                          Hostname ou endereço IP do servidor
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Porta */}
                  <FormField
                    control={form.control}
                    name="port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Porta</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="9090" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value === '' ? 9090 : parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Porta do Cockpit (padrão: 9090)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Usar SSL */}
                  <FormField
                    control={form.control}
                    name="use_ssl"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-6">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Usar SSL/HTTPS</FormLabel>
                          <FormDescription>
                            Marque se o servidor usa conexão segura
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Descrição */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="col-span-1 md:col-span-2">
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Descrição opcional do servidor" 
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Uma breve descrição do servidor (opcional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Usuário */}
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome de usuário *</FormLabel>
                        <FormControl>
                          <Input placeholder="Usuário do Cockpit" {...field} />
                        </FormControl>
                        <FormDescription>
                          Usuário para acesso ao Cockpit
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Senha */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Senha do Cockpit" {...field} />
                        </FormControl>
                        <FormDescription>
                          Senha para acesso ao Cockpit
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Confirmação de senha */}
                  <FormField
                    control={form.control}
                    name="confirm_password"
                    render={({ field }) => (
                      <FormItem className="col-span-1 md:col-span-2">
                        <FormLabel>Confirmar senha *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirme a senha" {...field} />
                        </FormControl>
                        <FormDescription>
                          Digite novamente a senha para confirmar
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setLocation('/dashboard')}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createServerMutation.isPending}>
                    {createServerMutation.isPending ? 'Salvando...' : 'Salvar Servidor'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center text-sm text-gray-500">
            Os campos marcados com * são obrigatórios
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}