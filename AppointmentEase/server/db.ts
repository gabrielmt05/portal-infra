import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Check if we're in production or development
const databaseUrl = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

// Em desenvolvimento, podemos usar uma URL fictícia se não estiver definida
const connectionString = databaseUrl || 'postgresql://postgres:postgres@localhost:5432/cockpit_portal';

// Create a new postgres client
const client = postgres(connectionString, { max: 1 });

// Create a drizzle instance
export const db = drizzle(client, { schema });

// Function to ping the database
export async function pingDatabase() {
  try {
    await client`SELECT 1`;
    console.log("Database connection successful");
    return true;
  } catch (error) {
    console.log("Database connection error - using memory storage instead");
    return false;
  }
}

// Initialize the database (run migrations)
export async function initializeDatabase() {
  try {
    // Check the connection first
    const isConnected = await pingDatabase();
    
    // Se não estiver usando o banco de dados, não é necessário fazer mais verificações
    if (!isConnected) {
      console.log("Using in-memory storage. Database connection not required.");
      return true;
    }
    
    // Check if the users table exists
    const tableExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `;
    
    // If tables don't exist, we'll push the schema
    if (!tableExists[0].exists) {
      console.log("Tables don't exist, initializing database schema...");
      // In a production app, we would use Drizzle's migration tools here
      // For now, we'll just log a message
      console.log("Database schema needs to be pushed using 'npm run db:push'");
    }
    
    return true;
  } catch (error) {
    console.log("Database initialization error - using memory storage instead");
    return true; // Continuamos mesmo com erro no banco
  }
}