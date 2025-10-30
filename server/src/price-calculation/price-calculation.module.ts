// path: server/src/price-calculation/price-calculation.module.ts
// version: 6.0 (Add Customer Group Override Support - Phase 2)
// last-modified: 29 ตุลาคม 2568 17:35

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceCalculationService } from './price-calculation.service';
import { PriceCalculationController } from './price-calculation.controller';
import { Product } from '../entities/product.entity';
import { CustomerMapping } from '../entities/customer-mapping.entity';
import { CustomerGroup } from '../entities/customer-group.entity';
import { RawMaterial } from '../entities/raw-material.entity';
import { BOM } from '../entities/bom.entity';
import { StandardPrice } from '../entities/standard-price.entity';
import { LmeMasterData } from '../entities/lme-master-data.entity';
import { FabCost } from '../entities/fab-cost.entity';
import { SellingFactor } from '../entities/selling-factor.entity';
import { ExchangeRateMasterData } from '../entities/exchange-rate-master-data.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { PricingFormula } from '../entities/pricing-formula.entity';
import { PricingRule } from '../entities/pricing-rule.entity';
import { FormulaEngineModule } from '../formula-engine/formula-engine.module';
import { RuleEngineModule } from '../rule-engine/rule-engine.module';
import { Currency } from '../entities/currency.entity';
// ✅ Phase 2: Customer Group Override Entities
import { CustomerGroupFABCostOverride } from '../entities/customer-group-fab-cost-override.entity';
import { CustomerGroupSellingFactorOverride } from '../entities/customer-group-selling-factor-override.entity';
import { CustomerGroupLMEPriceOverride } from '../entities/customer-group-lme-price-override.entity';
import { CustomerGroupExchangeRateOverride } from '../entities/customer-group-exchange-rate-override.entity';
import { CustomerGroupStandardPriceOverride } from '../entities/customer-group-standard-price-override.entity';

@Module({
  imports: [
    FormulaEngineModule, // ✅ Formula evaluation and merging
    RuleEngineModule,    // ✅ Rule matching and evaluation
    TypeOrmModule.forFeature([
      Product,
      CustomerMapping,        // ✅ ใช้ CustomerMapping แทน Customer
      CustomerGroup,          // ✅ สำหรับหา Default Customer Group
      RawMaterial,
      BOM,
      StandardPrice,
      LmeMasterData,
      FabCost,
      SellingFactor,
      ExchangeRateMasterData,
      ActivityLog,
      PricingFormula,         // ✅ Base formulas (Hybrid System)
      PricingRule,            // ✅ Custom rules (Hybrid System)
      Currency,
      // ✅ Phase 2: Customer Group Override Entities
      CustomerGroupFABCostOverride,
      CustomerGroupSellingFactorOverride,
      CustomerGroupLMEPriceOverride,
      CustomerGroupExchangeRateOverride,
      CustomerGroupStandardPriceOverride,
    ]),
  ],
  controllers: [PriceCalculationController],
  providers: [PriceCalculationService, ActivityLogService],
  exports: [PriceCalculationService], // Export สำหรับใช้ใน modules อื่น
})
export class PriceCalculationModule {}
