// path: server/src/price-calculation/price-calculation.module.ts
// version: 4.0 (Add Missing Entities for Price Calculation)
// last-modified: 9 ตุลาคม 2568 16:30

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceCalculationService } from './price-calculation.service';
import { PriceCalculationController } from './price-calculation.controller';
import { Product } from '../entities/product.entity';
import { RawMaterial } from '../entities/raw-material.entity';
import { BOM } from '../entities/bom.entity';
import { StandardPrice } from '../entities/standard-price.entity';
import { LmeMasterData } from '../entities/lme-master-data.entity';
import { FabCost } from '../entities/fab-cost.entity';
import { SellingFactor } from '../entities/selling-factor.entity';
import { ExchangeRateMasterData } from '../entities/exchange-rate-master-data.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      RawMaterial,
      BOM,
      StandardPrice,          // ✅ Add missing entity
      LmeMasterData,          // ✅ Add missing entity
      FabCost,                // ✅ Add missing entity
      SellingFactor,          // ✅ Add missing entity
      ExchangeRateMasterData, // ✅ Add missing entity
      ActivityLog,
    ]),
  ],
  controllers: [PriceCalculationController],
  providers: [PriceCalculationService, ActivityLogService],
  exports: [PriceCalculationService], // Export สำหรับใช้ใน modules อื่น
})
export class PriceCalculationModule {}
