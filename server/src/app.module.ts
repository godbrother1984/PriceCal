import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SetupController } from './setup/setup.controller';
import { PricingController } from './pricing/pricing.controller';
import { PricingService } from './pricing/pricing.service';
import { DataController } from './data/data.controller';
import { DataService } from './data/data.service';
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

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([
      User,
      Customer,
      Product,
      RawMaterial,
      CustomerGroup,
      SystemConfig,
      PriceRequest,
      BOM
    ]),
    AuthModule,
  ],
  controllers: [
    AppController,
    DataController,
    SetupController,
    PricingController,
  ],
  providers: [
    AppService,
    DataService,
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