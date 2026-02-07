// backend/src/config/database.config.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// 1. Append sslmode to the URL string to satisfy the 'pg' warning
let databaseUrl = process.env.DATABASE_URL;
if (databaseUrl && !databaseUrl.includes('sslmode=')) {
  const separator = databaseUrl.includes('?') ? '&' : '?';
  databaseUrl += `${separator}sslmode=verify-full`;
}

export const AppDataSource = new DataSource(
  databaseUrl
    ? {
      type: 'postgres',
      url: databaseUrl,
      // 2. Keep this strictly as a boolean or TlsOptions
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      entities: [path.join(__dirname, '../entities/**/*.entity{.ts,.js}')],
      migrations: [path.join(__dirname, '../migrations/*{.ts,.js}')],
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: process.env.DB_LOGGING === 'true',
    }
    : {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password123',
      database: process.env.DB_DATABASE || 'specialists_db',
      // In the object-config mode, the driver handles defaults better
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      entities: [path.join(__dirname, '../entities/**/*.entity{.ts,.js}')],
      migrations: [path.join(__dirname, '../migrations/*{.ts,.js}')],
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: process.env.DB_LOGGING === 'true',
    }
);