import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertServerSchema } from '@shared/schema';
import { z } from 'zod';
import http from 'http';
import https from 'https';

// Middleware de autenticação para verificar se o servidor está online
function checkServerStatus(hostname: string, port: number, useSSL: boolean = false): Promise<boolean> {
  return new Promise((resolve) => {
    const options = {
      hostname,
      port,
      path: '/',
      method: 'HEAD',
      timeout: 3000, // timeout após 3 segundos
      rejectUnauthorized: false // não rejeitar certificados auto-assinados
    };

    const protocol = useSSL ? https : http;
    
    const req = protocol.request(options, (res) => {
      resolve(res.statusCode !== undefined && res.statusCode < 500);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Schema para atualização de servidor (campos opcionais)
const updateServerSchema = insertServerSchema.partial().extend({
  password: z.string().optional(),
  confirm_password: z.string().optional()
}).refine(data => {
  if (data.password && data.confirm_password) {
    return data.password === data.confirm_password;
  }
  return true;
}, {
  message: "As senhas não conferem",
  path: ["confirm_password"]
});

// Controlador de servidores
export const serverController = {
  // Listar todos os servidores
  async getAllServers(req: Request, res: Response) {
    try {
      const servers = await storage.getAllServers();
      
      // Verificar status de cada servidor (opcional, pode ser custoso)
      const checkStatus = req.query.checkStatus === 'true';
      const serversWithoutPasswords = [];
      
      for (const server of servers) {
        let status = 'unknown';
        
        if (checkStatus) {
          const isOnline = await checkServerStatus(
            server.hostname,
            server.port || 9090,
            server.use_ssl || false
          );
          status = isOnline ? 'online' : 'offline';
        }
        
        // Remover a senha do objeto do servidor
        const { password, ...serverWithoutPassword } = server;
        
        serversWithoutPasswords.push({
          ...serverWithoutPassword,
          status
        });
      }
      
      return res.status(200).json({
        success: true,
        servers: serversWithoutPasswords
      });
    } catch (error) {
      console.error("Get all servers error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  },
  
  // Obter servidor pelo ID
  async getServerById(req: Request, res: Response) {
    try {
      const serverId = parseInt(req.params.id);
      
      if (isNaN(serverId)) {
        return res.status(400).json({ 
          success: false, 
          message: "ID de servidor inválido" 
        });
      }
      
      const server = await storage.getServer(serverId);
      
      if (!server) {
        return res.status(404).json({ 
          success: false, 
          message: "Servidor não encontrado" 
        });
      }
      
      // Verificar status do servidor
      const checkStatus = req.query.checkStatus === 'true';
      let status = 'unknown';
      
      if (checkStatus) {
        const isOnline = await checkServerStatus(
          server.hostname,
          server.port || 9090,
          server.use_ssl || false
        );
        status = isOnline ? 'online' : 'offline';
      }
      
      // Remover a senha do objeto do servidor
      const { password, ...serverWithoutPassword } = server;
      
      return res.status(200).json({
        success: true,
        server: {
          ...serverWithoutPassword,
          status
        }
      });
    } catch (error) {
      console.error(`Get server by id error:`, error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  },
  
  // Criar novo servidor
  async createServer(req: Request, res: Response) {
    try {
      // Verificar se há um usuário autenticado
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Não autenticado" 
        });
      }
      
      // Validação adicional para senha de confirmação
      const createServerSchema = insertServerSchema.extend({
        confirm_password: z.string()
      }).refine(data => data.password === data.confirm_password, {
        message: "As senhas não conferem",
        path: ["confirm_password"]
      });
      
      // Validar dados de entrada
      const result = createServerSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          success: false, 
          errors: result.error.errors.map(e => e.message)
        });
      }
      
      // Remover campo de confirmação de senha e adicionar ID do criador
      const { confirm_password, ...serverData } = result.data;
      serverData.created_by = req.session.userId;
      
      // Criar servidor
      const newServer = await storage.createServer(serverData);
      
      // Remover senha do servidor retornado
      const { password, ...serverWithoutPassword } = newServer;
      
      return res.status(201).json({
        success: true,
        server: serverWithoutPassword
      });
    } catch (error) {
      console.error("Create server error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  },
  
  // Atualizar servidor existente
  async updateServer(req: Request, res: Response) {
    try {
      // Verificar se há um usuário autenticado
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Não autenticado" 
        });
      }
      
      const serverId = parseInt(req.params.id);
      
      if (isNaN(serverId)) {
        return res.status(400).json({ 
          success: false, 
          message: "ID de servidor inválido" 
        });
      }
      
      // Validar dados de entrada
      const result = updateServerSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          success: false, 
          errors: result.error.errors.map(e => e.message)
        });
      }
      
      // Verificar se o servidor existe
      const existingServer = await storage.getServer(serverId);
      
      if (!existingServer) {
        return res.status(404).json({ 
          success: false, 
          message: "Servidor não encontrado" 
        });
      }
      
      // Remover campo de confirmação de senha
      const { confirm_password, ...updateData } = result.data;
      
      // Adicionar ID do atualizador e timestamp
      const updatedFields = {
        ...updateData,
        updated_by: req.session.userId,
        updated_at: new Date()
      };
      
      // Atualizar servidor
      const updated = await storage.updateServer(serverId, updatedFields);
      
      if (!updated) {
        return res.status(500).json({ 
          success: false, 
          message: "Falha ao atualizar servidor" 
        });
      }
      
      // Buscar servidor atualizado
      const updatedServer = await storage.getServer(serverId);
      
      if (!updatedServer) {
        return res.status(500).json({ 
          success: false, 
          message: "Erro ao recuperar servidor atualizado" 
        });
      }
      
      // Remover senha do servidor retornado
      const { password, ...serverWithoutPassword } = updatedServer;
      
      return res.status(200).json({
        success: true,
        server: serverWithoutPassword
      });
    } catch (error) {
      console.error(`Update server error:`, error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  },
  
  // Excluir servidor
  async deleteServer(req: Request, res: Response) {
    try {
      // Verificar se há um usuário autenticado
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Não autenticado" 
        });
      }
      
      const serverId = parseInt(req.params.id);
      
      if (isNaN(serverId)) {
        return res.status(400).json({ 
          success: false, 
          message: "ID de servidor inválido" 
        });
      }
      
      // Verificar se o servidor existe
      const existingServer = await storage.getServer(serverId);
      
      if (!existingServer) {
        return res.status(404).json({ 
          success: false, 
          message: "Servidor não encontrado" 
        });
      }
      
      // Excluir servidor
      const deleted = await storage.deleteServer(serverId);
      
      if (!deleted) {
        return res.status(500).json({ 
          success: false, 
          message: "Falha ao excluir servidor" 
        });
      }
      
      return res.status(200).json({
        success: true,
        message: "Servidor excluído com sucesso"
      });
    } catch (error) {
      console.error(`Delete server error:`, error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  },
  
  // Obter link de acesso ao Cockpit
  async getAccessUrl(req: Request, res: Response) {
    try {
      // Verificar se há um usuário autenticado
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Não autenticado" 
        });
      }
      
      const serverId = parseInt(req.params.id);
      
      if (isNaN(serverId)) {
        return res.status(400).json({ 
          success: false, 
          message: "ID de servidor inválido" 
        });
      }
      
      // Buscar servidor pelo ID
      const server = await storage.getServer(serverId);
      
      if (!server) {
        return res.status(404).json({ 
          success: false, 
          message: "Servidor não encontrado" 
        });
      }
      
      // Verificar se o servidor está online
      const isOnline = await checkServerStatus(
        server.hostname,
        server.port || 9090,
        server.use_ssl || false
      );
      
      if (!isOnline) {
        return res.status(503).json({ 
          success: false, 
          message: "Servidor está offline ou inacessível" 
        });
      }
      
      // Atualizar timestamp de último acesso
      await storage.updateLastAccessed(serverId);
      
      // Registrar acesso no log
      await storage.logAccess({
        server_id: serverId,
        user_id: req.session.userId,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        success: true
      });
      
      // Criar URL de acesso
      const protocol = server.use_ssl ? 'https' : 'http';
      const port = server.port || 9090;
      
      // Obter senha descriptografada (apenas para criação do link)
      const password = (storage as any).decryptPassword(server.password);
      
      // Construir URL com autenticação básica
      // Este é um método simplificado, em produção você pode querer
      // usar um proxy seguro ou um token de acesso temporário
      const accessUrl = `${protocol}://${server.username}:${encodeURIComponent(password)}@${server.hostname}:${port}`;
      
      return res.status(200).json({
        success: true,
        accessUrl
      });
    } catch (error) {
      console.error(`Get access URL error:`, error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  },
  
  // Obter servidores acessados recentemente
  async getRecentServers(req: Request, res: Response) {
    try {
      // Verificar se há um usuário autenticado
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Não autenticado" 
        });
      }
      
      // Definir limite (padrão: 5)
      const limit = parseInt(req.query.limit as string) || 5;
      
      // Buscar servidores recentes
      const recentServers = await storage.getRecentServers(req.session.userId, limit);
      
      // Remover senhas dos servidores
      const serversWithoutPasswords = recentServers.map(server => {
        const { password, ...serverWithoutPassword } = server;
        return serverWithoutPassword;
      });
      
      return res.status(200).json({
        success: true,
        servers: serversWithoutPasswords
      });
    } catch (error) {
      console.error("Get recent servers error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  }
};