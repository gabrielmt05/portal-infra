import { 
  users, servers, access_logs,
  type User, type InsertUser,
  type Server, type InsertServer,
  type AccessLog, type InsertAccessLog
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Storage interface with all CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<Omit<InsertUser, 'password'>> & { password?: string }): Promise<boolean>;
  deleteUser(id: number): Promise<boolean>;
  updateLastLogin(id: number): Promise<boolean>;
  
  // Server methods
  getServer(id: number): Promise<Server | undefined>;
  getAllServers(): Promise<Server[]>;
  createServer(server: InsertServer): Promise<Server>;
  updateServer(id: number, server: Partial<InsertServer>): Promise<boolean>;
  deleteServer(id: number): Promise<boolean>;
  updateLastAccessed(id: number): Promise<boolean>;
  getRecentServers(userId: number, limit?: number): Promise<Server[]>;
  
  // Access log methods
  logAccess(log: InsertAccessLog): Promise<AccessLog>;
}

/**
 * Database storage implementation
 */
export class DBStorage implements IStorage {
  private encryptionKey: string;

  constructor() {
    // Use APP_KEY for encryption or generate a random one
    this.encryptionKey = process.env.APP_KEY || crypto.randomBytes(32).toString('base64');
    
    // Create default admin user
    this.createDefaultAdmin();
  }

  private async createDefaultAdmin() {
    // Check if admin user already exists
    const existingAdmin = await this.getUserByUsername('admin');
    if (existingAdmin) return;
    
    // Create admin user with default credentials
    await this.createUser({
      username: 'admin',
      password: 'admin123', // This will be hashed in the createUser method
      full_name: 'System Administrator',
      email: 'admin@example.com',
      is_admin: true
    });
  }

  // USER METHODS
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.username);
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const result = await db.insert(users).values({
      ...userData,
      password: hashedPassword,
      created_at: new Date(),
      updated_at: new Date(),
      last_login: null
    }).returning();
    
    return result[0];
  }

  async updateUser(id: number, userData: Partial<Omit<InsertUser, 'password'>> & { password?: string }): Promise<boolean> {
    const updateData: any = { ...userData, updated_at: new Date() };
    
    if (userData.password) {
      updateData.password = await bcrypt.hash(userData.password, 10);
    }
    
    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
      
    return result.length > 0;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async updateLastLogin(id: number): Promise<boolean> {
    const result = await db.update(users)
      .set({ last_login: new Date() })
      .where(eq(users.id, id))
      .returning();
      
    return result.length > 0;
  }

  // SERVER METHODS
  async getServer(id: number): Promise<Server | undefined> {
    const result = await db.select().from(servers).where(eq(servers.id, id));
    return result[0];
  }

  async getAllServers(): Promise<Server[]> {
    return await db.select().from(servers).orderBy(servers.name);
  }

  async createServer(serverData: InsertServer): Promise<Server> {
    // Encrypt sensitive data like passwords
    const encryptedPassword = this.encryptPassword(serverData.password);
    
    const result = await db.insert(servers).values({
      ...serverData,
      password: encryptedPassword,
      created_at: new Date(),
      updated_at: new Date(),
      last_accessed: null
    }).returning();
    
    return result[0];
  }

  async updateServer(id: number, serverData: Partial<InsertServer>): Promise<boolean> {
    const updateData: any = { ...serverData, updated_at: new Date() };
    
    if (serverData.password) {
      updateData.password = this.encryptPassword(serverData.password);
    }
    
    const result = await db.update(servers)
      .set(updateData)
      .where(eq(servers.id, id))
      .returning();
      
    return result.length > 0;
  }

  async deleteServer(id: number): Promise<boolean> {
    const result = await db.delete(servers).where(eq(servers.id, id)).returning();
    return result.length > 0;
  }

  async updateLastAccessed(id: number): Promise<boolean> {
    const result = await db.update(servers)
      .set({ last_accessed: new Date() })
      .where(eq(servers.id, id))
      .returning();
      
    return result.length > 0;
  }

  async getRecentServers(userId: number, limit: number = 5): Promise<Server[]> {
    // Get recent servers based on access logs
    const recentServerIds = await db.select({ serverId: access_logs.server_id })
      .from(access_logs)
      .where(eq(access_logs.user_id, userId))
      .orderBy(desc(access_logs.accessed_at))
      .limit(limit);
    
    if (recentServerIds.length === 0) return [];
    
    // Get the server details
    const serverIds = recentServerIds.map(item => item.serverId);
    return await db.select().from(servers).where(sql`${servers.id} IN ${serverIds}`);
  }

  async logAccess(logData: InsertAccessLog): Promise<AccessLog> {
    const result = await db.insert(access_logs).values({
      ...logData,
      accessed_at: new Date()
    }).returning();
    
    return result[0];
  }

  private encryptPassword(password: string): string {
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'base64'),
      Buffer.alloc(16, 0)
    );
    
    let encrypted = cipher.update(password, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    return encrypted;
  }

  decryptPassword(encryptedPassword: string): string {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'base64'),
      Buffer.alloc(16, 0)
    );
    
    let decrypted = decipher.update(encryptedPassword, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}

/**
 * In-memory storage implementation
 */
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private servers: Map<number, Server>;
  private accessLogs: Map<number, AccessLog>;
  private encryptionKey: string;
  
  private userCurrentId: number;
  private serverCurrentId: number;
  private logCurrentId: number;

  constructor() {
    this.users = new Map();
    this.servers = new Map();
    this.accessLogs = new Map();
    
    this.userCurrentId = 1;
    this.serverCurrentId = 1;
    this.logCurrentId = 1;
    
    // Use APP_KEY for encryption or generate a random one
    this.encryptionKey = process.env.APP_KEY || crypto.randomBytes(32).toString('base64');
    
    // Create default admin user
    this.createDefaultAdmin();
  }

  private async createDefaultAdmin() {
    // Check if admin user already exists
    const existingAdmin = await this.getUserByUsername('admin');
    if (existingAdmin) return;
    
    // Create admin user with default credentials
    await this.createUser({
      username: 'admin',
      password: 'admin123', // This will be hashed in the createUser method
      full_name: 'System Administrator',
      email: 'admin@example.com',
      is_admin: true
    });
  }

  // USER METHODS
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => 
      a.username.localeCompare(b.username)
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user: User = { 
      id: this.userCurrentId++,
      ...userData,
      password: hashedPassword,
      created_at: new Date(),
      updated_at: new Date(),
      last_login: null
    };
    
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<Omit<InsertUser, 'password'>> & { password?: string }): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    const updatedUser = { ...user, ...userData, updated_at: new Date() };
    
    // Hash new password if provided
    if (userData.password) {
      updatedUser.password = await bcrypt.hash(userData.password, 10);
    }
    
    this.users.set(id, updatedUser);
    return true;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async updateLastLogin(id: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    user.last_login = new Date();
    this.users.set(id, user);
    return true;
  }

  // SERVER METHODS
  async getServer(id: number): Promise<Server | undefined> {
    return this.servers.get(id);
  }

  async getAllServers(): Promise<Server[]> {
    return Array.from(this.servers.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }

  async createServer(serverData: InsertServer): Promise<Server> {
    // Encrypt sensitive data
    const encryptedPassword = this.encryptPassword(serverData.password);
    
    const server: Server = { 
      id: this.serverCurrentId++,
      ...serverData,
      password: encryptedPassword,
      created_at: new Date(),
      updated_at: new Date(),
      last_accessed: null
    };
    
    this.servers.set(server.id, server);
    return server;
  }

  async updateServer(id: number, serverData: Partial<InsertServer>): Promise<boolean> {
    const server = this.servers.get(id);
    if (!server) return false;
    
    const updatedServer = { ...server, ...serverData, updated_at: new Date() };
    
    // Encrypt new password if provided
    if (serverData.password) {
      updatedServer.password = this.encryptPassword(serverData.password);
    }
    
    this.servers.set(id, updatedServer);
    return true;
  }

  async deleteServer(id: number): Promise<boolean> {
    return this.servers.delete(id);
  }

  async updateLastAccessed(id: number): Promise<boolean> {
    const server = this.servers.get(id);
    if (!server) return false;
    
    server.last_accessed = new Date();
    this.servers.set(id, server);
    return true;
  }

  async getRecentServers(userId: number, limit: number = 5): Promise<Server[]> {
    // Get logs for this user, sorted by timestamp desc
    const userLogs = Array.from(this.accessLogs.values())
      .filter(log => log.user_id === userId)
      .sort((a, b) => {
        const aTime = a.accessed_at?.getTime() || 0;
        const bTime = b.accessed_at?.getTime() || 0;
        return bTime - aTime; // descending order
      });
    
    // Get unique server IDs from most recent logs
    const recentServerIds = Array.from(
      new Set(userLogs.map(log => log.server_id))
    ).slice(0, limit);
    
    // Get server objects
    return recentServerIds
      .map(id => this.servers.get(id))
      .filter((server): server is Server => server !== undefined);
  }

  async logAccess(logData: InsertAccessLog): Promise<AccessLog> {
    const log: AccessLog = { 
      id: this.logCurrentId++,
      ...logData,
      accessed_at: new Date()
    };
    
    this.accessLogs.set(log.id, log);
    
    // Also update the last_accessed timestamp of the server
    await this.updateLastAccessed(log.server_id);
    
    return log;
  }

  private encryptPassword(password: string): string {
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'base64'),
      Buffer.alloc(16, 0)
    );
    
    let encrypted = cipher.update(password, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    return encrypted;
  }

  decryptPassword(encryptedPassword: string): string {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'base64'),
      Buffer.alloc(16, 0)
    );
    
    let decrypted = decipher.update(encryptedPassword, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}

// Para facilitar testes e implantação, sempre usamos MemStorage por padrão
// Para ativar o DBStorage, defina a variável de ambiente USE_DATABASE=true
const useDatabase = process.env.USE_DATABASE === 'true';
export const storage = useDatabase ? new DBStorage() : new MemStorage();

// Mensagem de log para facilitar a depuração
console.log(`Using ${useDatabase ? 'database' : 'memory'} storage`);