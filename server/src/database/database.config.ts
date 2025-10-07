// path: server/src/database/database.config.ts
// version: 2.0 (Smart Environment Configuration)
// last-modified: 22 กันยายน 2568 10:50

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Customer } from '../entities/customer.entity';
import { Product } from '../entities/product.entity';
import { PriceRequest } from '../entities/price-request.entity';
import { CustomerGroup } from '../entities/customer-group.entity';
import { RawMaterial } from '../entities/raw-material.entity';
import { SystemConfig } from '../entities/system-config.entity';
import { databaseProductionConfig } from './database-production.config';

const entities = [
  User,
  Customer,
  Product,
  PriceRequest,
  CustomerGroup,
  RawMaterial,
  SystemConfig,
];

// Development: SQLite Configuration
const developmentConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: 'database.sqlite',
  entities,
  synchronize: true, // Auto-create tables in development
  logging: false,
  autoLoadEntities: true,
  // Disable foreign key constraints for development (avoid constraint errors)
  // Note: This makes approvedBy, createdBy, updatedBy just string fields without FK
  extra: {
    // SQLite specific: disable foreign keys
  }
};

// Export configuration based on environment
export const databaseConfig: TypeOrmModuleOptions =
  process.env.NODE_ENV === 'production'
    ? databaseProductionConfig
    : developmentConfig;