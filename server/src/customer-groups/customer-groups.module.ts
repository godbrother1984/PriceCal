// path: server/src/customer-groups/customer-groups.module.ts
// version: 1.0 (Initial Customer Group Module)
// last-modified: 29 ตุลาคม 2568 17:30

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerGroupsController } from './customer-groups.controller';
import { CustomerGroupsService } from './customer-groups.service';
import { CustomerGroup } from '../entities/customer-group.entity';
import { CustomerMapping } from '../entities/customer-mapping.entity';
import { CustomerGroupFABCostOverride } from '../entities/customer-group-fab-cost-override.entity';
import { CustomerGroupSellingFactorOverride } from '../entities/customer-group-selling-factor-override.entity';
import { CustomerGroupLMEPriceOverride } from '../entities/customer-group-lme-price-override.entity';
import { CustomerGroupExchangeRateOverride } from '../entities/customer-group-exchange-rate-override.entity';
import { CustomerGroupStandardPriceOverride } from '../entities/customer-group-standard-price-override.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerGroup,
      CustomerMapping,
      CustomerGroupFABCostOverride,
      CustomerGroupSellingFactorOverride,
      CustomerGroupLMEPriceOverride,
      CustomerGroupExchangeRateOverride,
      CustomerGroupStandardPriceOverride,
    ]),
  ],
  controllers: [CustomerGroupsController],
  providers: [CustomerGroupsService],
  exports: [CustomerGroupsService],
})
export class CustomerGroupsModule {}
