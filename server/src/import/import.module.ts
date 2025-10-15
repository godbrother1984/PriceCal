// path: server/src/import/import.module.ts
// version: 5.1 (Conditional MongoDB Import)
// last-modified: 14 ตุลาคม 2568 16:00

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { Customer } from '../entities/customer.entity';
import { Product } from '../entities/product.entity';
import { RawMaterial } from '../entities/raw-material.entity';
import { BOM } from '../entities/bom.entity';
import { SystemConfig } from '../entities/system-config.entity';
import { StandardPrice } from '../entities/standard-price.entity';
import { LmeMasterData } from '../entities/lme-master-data.entity';
import { ExchangeRateMasterData } from '../entities/exchange-rate-master-data.entity';
import { FabCost } from '../entities/fab-cost.entity';
import { SellingFactor } from '../entities/selling-factor.entity';
import { SyncConfig } from '../entities/sync-config.entity';
import { MongodbModule } from '../mongodb/mongodb.module';

// Check if MongoDB should be enabled
const ENABLE_MONGODB = process.env.ENABLE_MONGODB === 'true';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      Product,
      RawMaterial,
      BOM,
      SystemConfig,
      StandardPrice,
      LmeMasterData,
      ExchangeRateMasterData,
      FabCost,
      SellingFactor,
      SyncConfig,
    ]),
    ...(ENABLE_MONGODB ? [MongodbModule] : []), // Conditional MongoDB import
  ],
  controllers: [ImportController],
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportModule {}
