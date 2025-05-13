import { Request, Response, NextFunction } from 'express';

// Middleware para verificar se o usuário está autenticado
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Não autenticado. Faça login para continuar.'
    });
  }
  
  next();
}

// Middleware para verificar se o usuário é administrador
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Não autenticado. Faça login para continuar.'
    });
  }
  
  if (!req.session.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. É necessário privilégios de administrador.'
    });
  }
  
  next();
}

// Definir tipos para a sessão do Express
declare module 'express-session' {
  interface SessionData {
    userId: number;
    username: string;
    isAdmin: boolean;
  }
}