import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ImportModule } from './import/import.module';
import { ApiSettingsModule } from './api-settings/api-settings.module';
import { MongodbModule } from './mongodb/mongodb.module';
import { PriceCalculationModule } from './price-calculation/price-calculation.module';
import { SetupController } from './setup/setup.controller';
import { PricingController } from './pricing/pricing.controller';
import { PricingService } from './pricing/pricing.service';
import { DataController } from './data/data.controller';
import { DataService } from './data/data.service';
import { ScrapAllowanceController } from './data/scrap-allowance.controller';
import { ScrapAllowanceService } from './data/scrap-allowance.service';
import { ActivityLogController } from './activity-log/activity-log.controller';
import { ActivityLogService } from './activity-log/activity-log.service';
import { SeederService } from './database/seeder.service';
import { databaseConfig } from './database/database.config';

// Entities
import { User } from './entities/user.entity';
import { Customer } from './entities/customer.entity';
import { Employee } from './entities/employee.entity';
import { Product } from './entities/product.entity';
import { RawMaterial } from './entities/raw-material.entity';
import { CustomerGroup } from './entities/customer-group.entity';
import { SystemConfig } from './entities/system-config.entity';
import { PriceRequest } from './entities/price-request.entity';
import { BOM } from './entities/bom.entity';
import { FabCost } from './entities/fab-cost.entity';
import { StandardPrice } from './entities/standard-price.entity';
import { SellingFactor } from './entities/selling-factor.entity';
import { LmePrice } from './entities/lme-price.entity';
import { LmeMasterData } from './entities/lme-master-data.entity';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { ExchangeRateMasterData } from './entities/exchange-rate-master-data.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { ApiSetting } from './entities/api-setting.entity';
import { Currency } from './entities/currency.entity';
import { CustomerMapping } from './entities/customer-mapping.entity';
// REMOVED: StandardPriceHistory - Standard Price is read-only from MongoDB (no version control)
import { FabCostHistory } from './entities/fab-cost-history.entity';
import { SellingFactorHistory } from './entities/selling-factor-history.entity';
import { LmePriceHistory } from './entities/lme-price-history.entity';
import { ExchangeRateHistory } from './entities/exchange-rate-history.entity';
import { SyncConfig } from './entities/sync-config.entity';
// REMOVED: RawMaterialFabCost - ไม่ใช้แล้ว ใช้ FabCost (Product FAB Cost) แทน
import { PricingFormula } from './entities/pricing-formula.entity';
import { PricingRule } from './entities/pricing-rule.entity';
import { ScrapAllowance } from './entities/scrap-allowance.entity';
// v7.0 Override Entities
import { CustomerGroupStandardPriceOverride } from './entities/customer-group-standard-price-override.entity';
import { CustomerGroupStandardPriceOverrideHistory } from './entities/customer-group-standard-price-override-history.entity';
import { CustomerGroupLMEPriceOverride } from './entities/customer-group-lme-price-override.entity';
import { CustomerGroupLMEPriceOverrideHistory } from './entities/customer-group-lme-price-override-history.entity';
import { CustomerGroupFABCostOverride } from './entities/customer-group-fab-cost-override.entity';
import { CustomerGroupFABCostOverrideHistory } from './entities/customer-group-fab-cost-override-history.entity';
import { CustomerGroupSellingFactorOverride } from './entities/customer-group-selling-factor-override.entity';
import { CustomerGroupSellingFactorOverrideHistory } from './entities/customer-group-selling-factor-override-history.entity';
import { CustomerGroupExchangeRateOverride } from './entities/customer-group-exchange-rate-override.entity';
import { CustomerGroupExchangeRateOverrideHistory } from './entities/customer-group-exchange-rate-override-history.entity';
import { PriceCalculationSnapshot } from './entities/price-calculation-snapshot.entity';
import { LMEPriceReferenceHistory } from './entities/lme-price-reference-history.entity';
import { ExchangeRateReferenceHistory } from './entities/exchange-rate-reference-history.entity';
import { SyncConfigModule } from './sync-config/sync-config.module';
import { BomModule } from './bom/bom.module';
import { DummyItemsModule } from './dummy-items/dummy-items.module';
import { FormulaEngineModule } from './formula-engine/formula-engine.module';
import { RuleEngineModule } from './rule-engine/rule-engine.module';
import { PricingFormulaModule } from './pricing-formula/pricing-formula.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MarketDataModule } from './market-data/market-data.module';
import { CustomerGroupsModule } from './customer-groups/customer-groups.module';

// Check if MongoDB should be enabled
const ENABLE_MONGODB = process.env.ENABLE_MONGODB === 'true';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([
      User,
      Customer,
      Employee,
      Product,
      RawMaterial,
      CustomerGroup,
      SystemConfig,
      PriceRequest,
      BOM,
      FabCost,
      FabCostHistory,
      StandardPrice,
      // StandardPriceHistory, // REMOVED: no version control
      SellingFactor,
      SellingFactorHistory,
      LmePrice,
      LmeMasterData,
      LmePriceHistory,
      ExchangeRate,
      ExchangeRateMasterData,
      ExchangeRateHistory,
      ActivityLog,
      ApiSetting,
      Currency,
      CustomerMapping,
      SyncConfig,
      // RawMaterialFabCost, // REMOVED: ไม่ใช้แล้ว
      PricingFormula,
      PricingRule,
      ScrapAllowance,
      // v7.0 Override Entities
      CustomerGroupStandardPriceOverride,
      CustomerGroupStandardPriceOverrideHistory,
      CustomerGroupLMEPriceOverride,
      CustomerGroupLMEPriceOverrideHistory,
      CustomerGroupFABCostOverride,
      CustomerGroupFABCostOverrideHistory,
      CustomerGroupSellingFactorOverride,
      CustomerGroupSellingFactorOverrideHistory,
      CustomerGroupExchangeRateOverride,
      CustomerGroupExchangeRateOverrideHistory,
      PriceCalculationSnapshot,
      // Market Data Reference History (v7.1)
      LMEPriceReferenceHistory,
      ExchangeRateReferenceHistory,
    ]),
    AuthModule,
    ImportModule,
    ApiSettingsModule,
    FormulaEngineModule, // ✅ Hybrid Formula System
    RuleEngineModule, // ✅ Hybrid Formula System
    PricingFormulaModule, // ✅ Pricing Formula Management
    PriceCalculationModule,
    SyncConfigModule, // Add SyncConfig Module
    BomModule, // Add BOM Module for Hybrid BOQ Management
    DummyItemsModule, // Add Dummy Items Module for Auto-generation
    DashboardModule, // ✅ Dashboard & Task Center (Phase 0)
    MarketDataModule, // ✅ Market Data Reference (Phase 2.4)
    CustomerGroupsModule, // ✅ Customer Group Override System (Phase 2)
    ...(ENABLE_MONGODB ? [MongodbModule] : []), // Only import if enabled
  ],
  controllers: [
    AppController,
    DataController,
    ScrapAllowanceController,
    ActivityLogController,
    SetupController,
    PricingController,
  ],
  providers: [
    AppService,
    DataService,
    ScrapAllowanceService,
    ActivityLogService,
    PricingService,
    SeederService,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly seederService: SeederService) {}

  async onModuleInit() {
    await this.seederService.seed();
  }
}