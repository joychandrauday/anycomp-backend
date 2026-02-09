// backend/src/config/database.config.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Specialist } from '../entities/Specialist.entity';
import { Secretary } from '../entities/Secretary.entity';
import { Company } from '../entities/Company.entity';
import { Media } from '../entities/Media.entity';
import { PlatformFee } from '../entities/PlatformFee.entity';
import { ServiceMaster } from '../entities/ServiceMaster.entity';
import { ServiceOffering } from '../entities/ServiceOffering.entity';
import { User } from '../entities/User.entity';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

export const AppDataSource = new DataSource(
  databaseUrl
    ? {
      type: 'postgres',
      url: databaseUrl,

      ssl: false,

      entities: [Specialist, Secretary, Company, Media, PlatformFee, ServiceMaster, ServiceOffering, User],
      migrations: [
        path.join(__dirname, '../migrations/*{.ts,.js}'),
      ],
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
      ssl: false,
      entities: [Specialist, Secretary, Company, Media, PlatformFee, ServiceMaster, ServiceOffering, User],
      migrations: [
        path.join(__dirname, '../migrations/*{.ts,.js}'),
      ],
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: process.env.DB_LOGGING === 'true',
    }
);
