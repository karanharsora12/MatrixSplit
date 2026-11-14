import { Module, Global, Inject, OnApplicationShutdown } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, Client } from 'pg';
import * as schema from './schema';

export const DRIZZLE = 'DRIZZLE';
export const PG_POOL = 'PG_POOL';

function getDbConfig() {
  const host = process.env.DB_HOST || process.env.PGHOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10);
  const user = process.env.DB_USER || process.env.PGUSER || 'postgres';
  const password = process.env.DB_PASSWORD || process.env.PGPASSWORD || 'Karan@123';
  const database = process.env.DB_NAME || process.env.PGDATABASE || 'matrixsplit';
  const connectionString = process.env.DATABASE_URL;

  return { host, port, user, password, database, connectionString };
}

async function ensureDatabaseExists() {
  const config = getDbConfig();

  // If using an external cloud connection string, skip local database creation
  if (
    config.connectionString &&
    !config.connectionString.includes('localhost') &&
    !config.connectionString.includes('127.0.0.1')
  ) {
    return;
  }

  // Connect to default 'postgres' database to check/create target database
  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: 'postgres',
  });

  try {
    await client.connect();
    const checkRes = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [config.database],
    );

    if (checkRes.rowCount === 0) {
      console.log(`[Database] Database "${config.database}" not found. Creating it...`);
      const safeDbName = config.database.replace(/"/g, '""');
      await client.query(`CREATE DATABASE "${safeDbName}"`);
      console.log(`[Database] Database "${config.database}" created successfully.`);
    }
  } catch (err: any) {
    console.warn(
      `[Database] Note: Could not auto-check/create database "${config.database}" (will attempt direct connection): ${err.message}`,
    );
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: async () => {
        const config = getDbConfig();
        await ensureDatabaseExists();

        const pool = config.connectionString
          ? new Pool({ connectionString: config.connectionString })
          : new Pool({
              host: config.host,
              port: config.port,
              user: config.user,
              password: config.password,
              database: config.database,
            });

        try {
          await pool.query('SELECT 1');
          console.log(
            `🚀 Connected to PostgreSQL database "${config.database}" at ${config.host}:${config.port}`,
          );
        } catch (err: any) {
          console.error(
            `❌ Failed to connect to PostgreSQL at ${config.host}:${config.port}:`,
            err.message,
          );
          throw err;
        }

        return pool;
      },
    },
    {
      provide: DRIZZLE,
      inject: [PG_POOL],
      useFactory: async (pool: Pool) => {
        const db = drizzle(pool, { schema });

        // Ensure UUID generation function is available
        try {
          await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
        } catch {}

        // Initialize schema tables if they do not exist
        await pool.query(`
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            full_name VARCHAR(150) NOT NULL,
            profile_image TEXT,
            default_currency VARCHAR(10) NOT NULL DEFAULT 'INR',
            preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
            theme_preference VARCHAR(10) NOT NULL DEFAULT 'system',
            is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
            verification_otp VARCHAR(6),
            reset_password_otp VARCHAR(6),
            reset_password_expires_at TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS user_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            refresh_token_hash TEXT NOT NULL,
            user_agent TEXT,
            ip_address VARCHAR(50),
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS friend_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE(sender_id, receiver_id)
          );

          CREATE TABLE IF NOT EXISTS friendships (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE(user1_id, user2_id)
          );

          CREATE TABLE IF NOT EXISTS groups (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(150) NOT NULL,
            description TEXT,
            image_url TEXT,
            category VARCHAR(50) NOT NULL DEFAULT 'friends',
            default_currency VARCHAR(10) NOT NULL DEFAULT 'INR',
            created_by_id UUID NOT NULL REFERENCES users(id),
            invite_code VARCHAR(32) NOT NULL UNIQUE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS group_members (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role VARCHAR(20) NOT NULL DEFAULT 'member',
            joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE(group_id, user_id)
          );

          CREATE TABLE IF NOT EXISTS group_invitations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
            invite_code VARCHAR(64) NOT NULL UNIQUE,
            max_uses INT DEFAULT 100,
            used_count INT NOT NULL DEFAULT 0,
            expires_at TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS expenses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(200) NOT NULL,
            total_amount_minor INT NOT NULL,
            currency VARCHAR(10) NOT NULL DEFAULT 'INR',
            category VARCHAR(50) NOT NULL DEFAULT 'general',
            date TIMESTAMP NOT NULL,
            payer_id UUID NOT NULL REFERENCES users(id),
            group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
            split_type VARCHAR(30) NOT NULL DEFAULT 'equal',
            notes TEXT,
            receipt_url TEXT,
            created_by_id UUID NOT NULL REFERENCES users(id),
            is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS expense_participants (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id),
            allocated_amount_minor INT NOT NULL,
            split_type VARCHAR(30) NOT NULL,
            split_value NUMERIC(10, 2),
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS settlements (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            payer_id UUID NOT NULL REFERENCES users(id),
            receiver_id UUID NOT NULL REFERENCES users(id),
            group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
            amount_minor INT NOT NULL,
            currency VARCHAR(10) NOT NULL DEFAULT 'INR',
            payment_method VARCHAR(30) NOT NULL DEFAULT 'cash',
            notes TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
            confirmed_at TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS activities (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            type VARCHAR(50) NOT NULL,
            actor_id UUID NOT NULL REFERENCES users(id),
            group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
            description TEXT NOT NULL,
            metadata JSONB,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(200) NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            metadata JSONB,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS attachments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
            uploader_id UUID NOT NULL REFERENCES users(id),
            original_name VARCHAR(255) NOT NULL,
            file_url TEXT NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            size_bytes INT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `);

        return db;
      },
    },
  ],
  exports: [DRIZZLE, PG_POOL],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(signal?: string) {
    if (this.pool) {
      console.log(`Closing PostgreSQL pool cleanly (${signal || 'shutdown'})...`);
      try {
        await this.pool.end();
      } catch (err: any) {
        console.error('Error closing PostgreSQL pool:', err);
      }
    }
  }
}
