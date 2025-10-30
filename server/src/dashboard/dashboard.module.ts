// path: server/src/dashboard/dashboard.module.ts
// version: 1.0 (Dashboard Module)
// last-modified: 29 ตุลาคม 2568 17:30

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

// Import entities
import { PriceRequest } from '../entities/price-request.entity';
import { StandardPrice } from '../entities/standard-price.entity';
import { FabCost } from '../entities/fab-cost.entity';
import { SellingFactor } from '../entities/selling-factor.entity';
import { LmeMasterData } from '../entities/lme-master-data.entity';
import { ExchangeRateMasterData } from '../entities/exchange-rate-master-data.entity';
import { Product } from '../entities/product.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PriceRequest,
      StandardPrice,
      FabCost,
      SellingFactor,
      LmeMasterData,
      ExchangeRateMasterData,
      Product,
      ActivityLog,
      User,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
