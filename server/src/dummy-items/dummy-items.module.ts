// path: server/src/dummy-items/dummy-items.module.ts
// version: 1.1 (Dummy Items Module - Disable Cron)
// last-modified: 14 ตุลาคม 2568 19:48

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DummyItemsService } from './dummy-items.service';
import { DummyItemsController } from './dummy-items.controller';
import { Product } from '../entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    // Note: ScheduleModule disabled due to Node.js v18 crypto compatibility issue
    // Use manual trigger via POST /api/dummy-items/check-availability instead
  ],
  controllers: [DummyItemsController],
  providers: [DummyItemsService],
  exports: [DummyItemsService],
})
export class DummyItemsModule {}
