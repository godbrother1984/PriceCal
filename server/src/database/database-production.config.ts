// path: server/src/database/database-production.config.ts
// version: 1.0 (Production PostgreSQL Configuration)
// last-modified: 22 กันยายน 2568 10:50

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Customer } from '../entities/customer.entity';
import { Product } from '../entities/product.entity';
import { PriceRequest } from '../entities/price-request.entity';
import { CustomerGroup } from '../entities/customer-group.entity';
import { RawMaterial } from '../entities/raw-material.entity';
import { SystemConfig } from '../entities/system-config.entity';

export const databaseProductionConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'pricecal',

  entities: [
    User,
    Customer,
    Product,
    PriceRequest,
    CustomerGroup,
    RawMaterial,
    SystemConfig,
  ],

  synchronize: false, // NEVER true in production!
  logging: process.env.NODE_ENV === 'development',

  // Connection pool settings
  extra: {
    max: 20,
    min: 5,
    acquire: 60000,
    idle: 10000
  },

  // SSL settings for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,

  autoLoadEntities: true,
};