// path: server/src/sync-config/sync-config.module.ts
// version: 1.0 (Sync Config Module)
// last-modified: 9 ตุลาคม 2568 11:10

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncConfig } from '../entities/sync-config.entity';
import { SyncConfigService } from './sync-config.service';
import { SyncConfigController } from './sync-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SyncConfig])],
  controllers: [SyncConfigController],
  providers: [SyncConfigService],
  exports: [SyncConfigService],
})
export class SyncConfigModule {}
