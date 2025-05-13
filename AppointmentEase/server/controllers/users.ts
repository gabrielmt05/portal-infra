import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';

// Schema para atualização de usuário (sem senha obrigatória)
const updateUserSchema = insertUserSchema.partial().extend({
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").optional(),
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

// Controlador de usuários
export const userController = {
  // Listar todos os usuários
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await storage.getAllUsers();
      
      // Remover senhas dos usuários
      const usersWithoutPassword = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      return res.status(200).json({
        success: true,
        users: usersWithoutPassword
      });
    } catch (error) {
      console.error("Get all users error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  },
  
  // Obter usuário pelo ID
  async getUserById(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: "ID de usuário inválido" 
        });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "Usuário não encontrado" 
        });
      }
      
      // Remover senha do usuário
      const { password, ...userWithoutPassword } = user;
      
      return res.status(200).json({
        success: true,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error(`Get user by id error:`, error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  },
  
  // Criar novo usuário
  async createUser(req: Request, res: Response) {
    try {
      // Validação adicional para senha de confirmação
      const createUserSchema = insertUserSchema.extend({
        confirm_password: z.string()
      }).refine(data => data.password === data.confirm_password, {
        message: "As senhas não conferem",
        path: ["confirm_password"]
      });
      
      // Validar dados de entrada
      const result = createUserSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          success: false, 
          errors: result.error.errors.map(e => e.message)
        });
      }
      
      // Remover campo de confirmação de senha
      const { confirm_password, ...userData } = result.data;
      
      // Verificar se o nome de usuário já existe
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: "Nome de usuário já existe" 
        });
      }
      
      // Criar usuário
      const newUser = await storage.createUser(userData);
      
      // Remover senha do usuário retornado
      const { password, ...userWithoutPassword } = newUser;
      
      return res.status(201).json({
        success: true,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Create user error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  },
  
  // Atualizar usuário existente
  async updateUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: "ID de usuário inválido" 
        });
      }
      
      // Validar dados de entrada
      const result = updateUserSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          success: false, 
          errors: result.error.errors.map(e => e.message)
        });
      }
      
      // Verificar se o usuário existe
      const existingUser = await storage.getUser(userId);
      
      if (!existingUser) {
        return res.status(404).json({ 
          success: false, 
          message: "Usuário não encontrado" 
        });
      }
      
      // Remover campo de confirmação de senha e extrair dados
      const { confirm_password, ...updateData } = result.data;
      
      // Verificar se o nome de usuário está sendo alterado e se já existe
      if (updateData.username && updateData.username !== existingUser.username) {
        const usernameExists = await storage.getUserByUsername(updateData.username);
        
        if (usernameExists) {
          return res.status(400).json({ 
            success: false, 
            message: "Nome de usuário já existe" 
          });
        }
      }
      
      // Atualizar usuário
      const updated = await storage.updateUser(userId, updateData);
      
      if (!updated) {
        return res.status(500).json({ 
          success: false, 
          message: "Falha ao atualizar usuário" 
        });
      }
      
      // Buscar usuário atualizado
      const updatedUser = await storage.getUser(userId);
      
      if (!updatedUser) {
        return res.status(500).json({ 
          success: false, 
          message: "Erro ao recuperar usuário atualizado" 
        });
      }
      
      // Remover senha do usuário retornado
      const { password, ...userWithoutPassword } = updatedUser;
      
      return res.status(200).json({
        success: true,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error(`Update user error:`, error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  },
  
  // Excluir usuário
  async deleteUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: "ID de usuário inválido" 
        });
      }
      
      // Verificar se o usuário existe
      const existingUser = await storage.getUser(userId);
      
      if (!existingUser) {
        return res.status(404).json({ 
          success: false, 
          message: "Usuário não encontrado" 
        });
      }
      
      // Não permitir que o usuário exclua a si mesmo
      if (req.session && req.session.userId === userId) {
        return res.status(400).json({ 
          success: false, 
          message: "Você não pode excluir sua própria conta" 
        });
      }
      
      // Excluir usuário
      const deleted = await storage.deleteUser(userId);
      
      if (!deleted) {
        return res.status(500).json({ 
          success: false, 
          message: "Falha ao excluir usuário" 
        });
      }
      
      return res.status(200).json({
        success: true,
        message: "Usuário excluído com sucesso"
      });
    } catch (error) {
      console.error(`Delete user error:`, error);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  }
};