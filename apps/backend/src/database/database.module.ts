import { Module, Global, OnModuleInit, Inject } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import * as schema from './schema';
import * as path from 'path';
import * as fs from 'fs';

export const DRIZZLE = 'DRIZZLE';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      useFactory: async () => {
        // Ensure data directory exists
        const dataDir = path.resolve(process.cwd(), '.matrixsplit-data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }

        const client = new PGlite(dataDir);
        await client.waitReady;

        const db = drizzle(client, { schema });

        // Initialize schema tables if they do not exist
        await client.exec(`
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
  exports: [DRIZZLE],
})
export class DatabaseModule {}
