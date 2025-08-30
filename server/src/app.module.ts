import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { MasterDataController } from './master-data/master-data.controller';
import { MasterDataService } from './master-data/master-data.service';
import { SetupController } from './setup/setup.controller';
import { PricingController } from './pricing/pricing.controller';
import { PricingService } from './pricing/pricing.service';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

@Module({
  imports: [],
  controllers: [
    AppController,
    AuthController,
    MasterDataController,
    SetupController,
    PricingController,
  ],
  providers: [
    AppService,
    AuthService,
    MasterDataService,
    PricingService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}