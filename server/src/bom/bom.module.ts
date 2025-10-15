// path: server/src/bom/bom.module.ts
// version: 1.0 (Hybrid BOQ Management Module)
// last-modified: 9 ตุลาคม 2568 15:45

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BOM } from '../entities/bom.entity';
import { Product } from '../entities/product.entity';
import { RawMaterial } from '../entities/raw-material.entity';
import { BomService } from './bom.service';
import { BomController } from './bom.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BOM, Product, RawMaterial])],
  controllers: [BomController],
  providers: [BomService],
  exports: [BomService],
})
export class BomModule {}
