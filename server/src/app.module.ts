// path: server/src/app.module.ts
// version: 2.2 (Correct MasterData Controller Usage)
// last-modified: 31 สิงหาคม 2568

import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { MasterDataController } from './master-data/master-data.controller';
import { MockDataService } from './mock-data/mock-data.service'; // ใช้ MockDataService เก่าที่ทำงานได้ดี
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
    MasterDataController,  // ใช้ MasterDataController ที่มี validation
    SetupController,
    PricingController,
  ],
  providers: [
    AppService,
    AuthService,
    MockDataService,       // ยังใช้ MockDataService เก่าที่มี methods ครบ
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