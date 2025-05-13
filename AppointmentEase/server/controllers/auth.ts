import { Request, Response } from 'express';
import { Session } from 'express-session';
import { storage } from '../storage';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Schema para login
const loginSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória")
});

// Controlador de autenticação
export const authController = {
  // Autenticar usuário
  async login(req: Request, res: Response) {
    try {
      // Validar dados de entrada
      const result = loginSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          success: false, 
          errors: result.error.errors.map(e => e.message)
        });
      }
      
      const { username, password } = result.data;
      
      // Buscar usuário pelo nome de usuário
      const user = await storage.getUserByUsername(username);
      
      // Verificar se o usuário existe
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "Nome de usuário ou senha inválidos" 
        });
      }
      
      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          message: "Nome de usuário ou senha inválidos" 
        });
      }
      
      // Atualizar último login
      await storage.updateLastLogin(user.id);
      
      // Criar sessão de usuário
      if (req.session) {
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.isAdmin = user.is_admin;
      }
      
      // Retornar dados do usuário (exceto senha)
      const { password: _, ...userWithoutPassword } = user;
      
      return res.status(200).json({
        success: true,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  },
  
  // Verificar sessão atual
  async getSession(req: Request, res: Response) {
    try {
      // Verificar se há uma sessão ativa
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Não autenticado" 
        });
      }
      
      // Buscar usuário pelo ID
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        // Limpar sessão inválida
        req.session.destroy((err) => {
          if (err) console.error("Erro ao destruir sessão:", err);
        });
        
        return res.status(401).json({ 
          success: false, 
          message: "Sessão inválida" 
        });
      }
      
      // Retornar dados do usuário (exceto senha)
      const { password: _, ...userWithoutPassword } = user;
      
      return res.status(200).json({
        success: true,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Get session error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  },
  
  // Encerrar sessão (logout)
  async logout(req: Request, res: Response) {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Erro ao encerrar sessão:", err);
          return res.status(500).json({ 
            success: false, 
            message: "Erro ao encerrar sessão" 
          });
        }
        
        res.clearCookie('connect.sid');
        return res.status(200).json({ 
          success: true, 
          message: "Sessão encerrada com sucesso" 
        });
      });
    } else {
      return res.status(200).json({ 
        success: true, 
        message: "Nenhuma sessão para encerrar" 
      });
    }
  }
};