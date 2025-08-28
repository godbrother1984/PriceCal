import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { MockDataController } from './mock-data/mock-data.controller';
import { MockDataService } from './mock-data/mock-data.service';
import { SetupController } from './setup/setup.controller';
import { PricingController } from './pricing/pricing.controller'; // <-- Add this
import { PricingService } from './pricing/pricing.service'; // <-- Add this

@Module({
  imports: [],
  controllers: [
    AppController,
    AuthController,
    MockDataController,
    SetupController,
    PricingController, // <-- Add this
  ],
  providers: [
    AppService,
    AuthService,
    MockDataService,
    PricingService, // <-- Add this
  ],
})
export class AppModule {}