// path: server/src/import/import.module.ts
// version: 2.1 (Temporarily disable MongoDB)
// last-modified: 1 ตุลาคม 2568 15:25

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { Customer } from '../entities/customer.entity';
import { Product } from '../entities/product.entity';
import { RawMaterial } from '../entities/raw-material.entity';
import { BOM } from '../entities/bom.entity';
import { SystemConfig } from '../entities/system-config.entity';
import { ApiSetting } from '../entities/api-setting.entity';
// import { MongodbModule } from '../mongodb/mongodb.module'; // Temporarily disabled

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      Product,
      RawMaterial,
      BOM,
      SystemConfig,
      ApiSetting,
    ]),
    // MongodbModule, // Temporarily disabled - enable when MongoDB is running
  ],
  controllers: [ImportController],
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportModule {}
