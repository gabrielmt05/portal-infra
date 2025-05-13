import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import { pingDatabase, initializeDatabase } from "./db";
import { storage } from "./storage";
import connectPgSimple from "connect-pg-simple";
import memorystore from "memorystore";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configuração da sessão
const ONE_DAY = 1000 * 60 * 60 * 24;
const SESSION_SECRET = process.env.SESSION_SECRET || 'cockpit-portal-secret';

// Use o armazenamento de sessão com PostgreSQL ou em memória, dependendo do ambiente
let sessionStore;

if (process.env.NODE_ENV === 'production') {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set in production. Falling back to memory store.');
  }
  // Configuração do armazenamento de sessão com PostgreSQL
  const PgSession = connectPgSimple(session);
  sessionStore = new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'sessions', // Nome da tabela para armazenar sessões
    createTableIfMissing: true,
  });
} else {
  // Configuração do armazenamento de sessão em memória (para desenvolvimento)
  const MemoryStore = memorystore(session);
  sessionStore = new MemoryStore({
    checkPeriod: ONE_DAY, // Limpar sessões expiradas a cada dia
  });
}

// Configuração da sessão
app.use(session({
  store: sessionStore,
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use HTTPS em produção
    maxAge: ONE_DAY, // Sessão válida por 1 dia,
    httpOnly: true,
  },
  name: 'cockpit.sid', // Nome do cookie
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Inicializar o banco de dados
  await initializeDatabase();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
