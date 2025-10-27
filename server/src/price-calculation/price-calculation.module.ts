// path: server/src/price-calculation/price-calculation.module.ts
// version: 5.0 (Hybrid Formula System Integration)
// last-modified: 22 ตุลาคม 2568 17:45

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
import { RawMaterialFabCost } from '../entities/raw-material-fab-cost.entity';
import { SellingFactor } from '../entities/selling-factor.entity';
import { ExchangeRateMasterData } from '../entities/exchange-rate-master-data.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { PricingFormula } from '../entities/pricing-formula.entity';
import { PricingRule } from '../entities/pricing-rule.entity';
import { FormulaEngineModule } from '../formula-engine/formula-engine.module';
import { RuleEngineModule } from '../rule-engine/rule-engine.module';

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
      RawMaterialFabCost,     // ✅ FAB Cost for Raw Materials
      SellingFactor,
      ExchangeRateMasterData,
      ActivityLog,
      PricingFormula,         // ✅ Base formulas (Hybrid System)
      PricingRule,            // ✅ Custom rules (Hybrid System)
    ]),
  ],
  controllers: [PriceCalculationController],
  providers: [PriceCalculationService, ActivityLogService],
  exports: [PriceCalculationService], // Export สำหรับใช้ใน modules อื่น
})
export class PriceCalculationModule {}
