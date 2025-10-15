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
import { ActivityLogController } from './activity-log/activity-log.controller';
import { ActivityLogService } from './activity-log/activity-log.service';
import { SeederService } from './database/seeder.service';
import { databaseConfig } from './database/database.config';

// Entities
import { User } from './entities/user.entity';
import { Customer } from './entities/customer.entity';
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
import { StandardPriceHistory } from './entities/standard-price-history.entity';
import { FabCostHistory } from './entities/fab-cost-history.entity';
import { SellingFactorHistory } from './entities/selling-factor-history.entity';
import { SyncConfig } from './entities/sync-config.entity';
import { SyncConfigModule } from './sync-config/sync-config.module';
import { BomModule } from './bom/bom.module';
import { DummyItemsModule } from './dummy-items/dummy-items.module';

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
      Product,
      RawMaterial,
      CustomerGroup,
      SystemConfig,
      PriceRequest,
      BOM,
      FabCost,
      FabCostHistory,
      StandardPrice,
      StandardPriceHistory,
      SellingFactor,
      SellingFactorHistory,
      LmePrice,
      LmeMasterData,
      ExchangeRate,
      ExchangeRateMasterData,
      ActivityLog,
      ApiSetting,
      Currency,
      CustomerMapping,
      SyncConfig, // Add SyncConfig entity
    ]),
    AuthModule,
    ImportModule,
    ApiSettingsModule,
    PriceCalculationModule,
    SyncConfigModule, // Add SyncConfig Module
    BomModule, // Add BOM Module for Hybrid BOQ Management
    DummyItemsModule, // Add Dummy Items Module for Auto-generation
    ...(ENABLE_MONGODB ? [MongodbModule] : []), // Only import if enabled
  ],
  controllers: [
    AppController,
    DataController,
    ActivityLogController,
    SetupController,
    PricingController,
  ],
  providers: [
    AppService,
    DataService,
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