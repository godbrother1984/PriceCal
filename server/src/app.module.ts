import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { MockDataController } from './mock-data/mock-data.controller';
import { MockDataService } from './mock-data/mock-data.service';
import { SetupController } from './setup/setup.controller';

@Module({
  imports: [],
  controllers: [
    AppController,
    AuthController,
    MockDataController,
    SetupController
  ],
  providers: [
    AppService,
    AuthService,
    MockDataService
  ],
})
export class AppModule {}