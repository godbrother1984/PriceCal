// path: server/src/api-settings/api-settings.module.ts
// version: 1.0 (API Settings Module)
// last-modified: 1 ตุลาคม 2568 11:52

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiSettingsController } from './api-settings.controller';
import { ApiSettingsService } from './api-settings.service';
import { ApiSetting } from '../entities/api-setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApiSetting])],
  controllers: [ApiSettingsController],
  providers: [ApiSettingsService],
  exports: [ApiSettingsService],
})
export class ApiSettingsModule {}
