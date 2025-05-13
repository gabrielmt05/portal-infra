import type { Express } from "express";
import { createServer, type Server } from "http";
import { authController } from "./controllers/auth";
import { userController } from "./controllers/users";
import { serverController } from "./controllers/servers";
import { requireAuth, requireAdmin } from "./middleware/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Rotas de autenticação
  app.post('/api/auth/login', authController.login);
  app.get('/api/auth/session', authController.getSession);
  app.post('/api/auth/logout', authController.logout);
  
  // Rotas de usuários (protegidas por autenticação de administrador)
  app.get('/api/users', requireAdmin, userController.getAllUsers);
  app.get('/api/users/:id', requireAdmin, userController.getUserById);
  app.post('/api/users', requireAdmin, userController.createUser);
  app.put('/api/users/:id', requireAdmin, userController.updateUser);
  app.delete('/api/users/:id', requireAdmin, userController.deleteUser);
  
  // Rotas de servidores (protegidas por autenticação)
  app.get('/api/servers', requireAuth, serverController.getAllServers);
  app.get('/api/servers/recent', requireAuth, serverController.getRecentServers);
  app.get('/api/servers/:id', requireAuth, serverController.getServerById);
  app.post('/api/servers', requireAuth, serverController.createServer);
  app.put('/api/servers/:id', requireAuth, serverController.updateServer);
  app.delete('/api/servers/:id', requireAuth, serverController.deleteServer);
  app.get('/api/servers/:id/access', requireAuth, serverController.getAccessUrl);

  // Rota para status da API
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'online',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
